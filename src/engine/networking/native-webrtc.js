/**
 * Native browser WebRTC mesh backend.
 *
 * Signaling is handled by src/tools/dedicated-server/websocket/server.js.
 * Media and data are sent directly between peers through RTCPeerConnection.
 */
export class NativeWebRTC {
  constructor(options = {}) {
    this.options = options;
    this.sessionName = options.sessionName || 'matrix-engine-random';
    this.connection = { connectionId: null, send: data => this.send(data) };
    this.session = {
      signal: payload => {
        const message = JSON.parse(payload.data);
        this.send(message, payload.to);
        return Promise.resolve();
      },
      disconnect: () => this.leaveSession()
    };
    this.peers = new Map();
    this.channels = new Map();
    this.localStream = null;
    this.socket = null;
    this.id = null;
    this.closed = false;
    this.multiPlayer = {
      root: this,
      onFollowPath() {},
      update: event => this._handleGameMessage(event),
      leaveGamePlay() {}
    };
    this.domManipulation = { hideNetPanel() {} };
    this.sendOnlyData = data => this.send(data);
    this.send = (data, targets) => {
      const payload = JSON.stringify(data);
      const wanted = Array.isArray(targets) && targets.length ? new Set(targets) : null;
      this.channels.forEach((channel, peerId) => {
        if ((!wanted || wanted.has(peerId)) && channel.readyState === 'open') channel.send(payload);
      });
    };
    this.fetchInfo = () => this.getPeers();
    this.closeSession = () => this.leaveSession();
    this.ready = this.joinSession();
  }

  async joinSession() {
    const protocol = this.options.protocol || (location.protocol === 'https:' ? 'wss:' : 'ws:');
    const host = this.options.signalingUrl || this.options.url ||
      protocol + '//' + (this.options.domain || location.hostname) + ':' + (this.options.port || 8081);
    this.socket = new WebSocket(host);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebRTC signaling connection timed out')), 10000);
      this.socket.addEventListener('open', () => { clearTimeout(timeout); resolve(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('Could not connect to WebRTC signaling server')); }, { once: true });
    });
    this.socket.addEventListener('message', event => this._onSignal(JSON.parse(event.data)));
    this.socket.addEventListener('close', () => {
      this.peers.forEach((_, id) => this._dropPeer(id));
      dispatchEvent(new CustomEvent('net-disconnected'));
    });
    this._signal({ type: 'join', room: this.sessionName, metadata: this.options.customData || null });
    dispatchEvent(new CustomEvent('setupSessionObject', { detail: this.session }));
    dispatchEvent(new CustomEvent('net-ready'));
    return this;
  }

  _signal(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  async _onSignal(message) {
    if (message.type === 'joined') {
      this.id = message.id;
      this.connection.connectionId = this.id;
      (message.peers || []).forEach(peer => this._createPeer(peer.id, true));
      return;
    }
    if (message.type === 'peer-joined') {
      this._createPeer(message.id, false);
      dispatchEvent(new CustomEvent('onConnectionCreated', { detail: message }));
      return;
    }
    if (message.type === 'peer-left') {
      this._dropPeer(message.id);
      dispatchEvent(new CustomEvent('connectionDestroyed', { detail: { connectionId: message.id } }));
      return;
    }
    const peer = this.peers.get(message.from);
    if (!peer) return;
    try {
      if (message.type === 'offer') {
        await peer.setRemoteDescription(message.description);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        this._signal({ type: 'answer', to: message.from, description: peer.localDescription });
      } else if (message.type === 'answer') {
        await peer.setRemoteDescription(message.description);
      } else if (message.type === 'ice-candidate' && message.candidate) {
        await peer.addIceCandidate(message.candidate);
      }
    } catch (error) {
      console.warn('[NativeWebRTC] signaling error:', error);
    }
  }

  async _createPeer(peerId, initiator) {
    if (this.peers.has(peerId)) return this.peers.get(peerId);
    const config = this.options.rtcConfig || { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(config);
    this.peers.set(peerId, pc);
    if (this.options.media) {
      try {
        if (!this.localStream) this.localStream = await navigator.mediaDevices.getUserMedia(this.options.media === true ? { audio: true, video: true } : this.options.media);
        this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
      } catch (error) {
        console.warn('[NativeWebRTC] media permission/device error:', error);
      }
    }
    if (initiator) {
      const channel = pc.createDataChannel('matrix-engine');
      this._bindChannel(peerId, channel);
    } else {
      pc.ondatachannel = event => this._bindChannel(peerId, event.channel);
    }
    pc.onicecandidate = event => {
      if (event.candidate) this._signal({ type: 'ice-candidate', to: peerId, candidate: event.candidate });
    };
    pc.ontrack = event => {
      dispatchEvent(new CustomEvent('webrtc-track', { detail: { peerId, stream: event.streams[0], track: event.track } }));
      dispatchEvent(new CustomEvent('streamPlaying', { detail: { peerId, stream: event.streams[0], track: event.track } }));
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) this._dropPeer(peerId);
    };
    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this._signal({ type: 'offer', to: peerId, description: pc.localDescription });
    }
    return pc;
  }

  _bindChannel(peerId, channel) {
    this.channels.set(peerId, channel);
    channel.onmessage = event => {
      let data = event.data;
      try { data = JSON.parse(data); } catch (_) {}
      const envelope = { data: typeof data === 'string' ? data : JSON.stringify(data), from: { connectionId: peerId }, type: 'data' };
      if (data && typeof data === 'object' && (data.netPos || data.netRotX !== undefined || data.netRotY !== undefined || data.netRotZ !== undefined || data.animationIndex !== undefined)) {
        this.multiPlayer.update(envelope);
      }
      dispatchEvent(new CustomEvent('only-data-receive', { detail: envelope }));
      dispatchEvent(new CustomEvent('webrtc-message', { detail: { peerId, data } }));
    };
    channel.onopen = () => dispatchEvent(new CustomEvent('webrtc-peer-ready', { detail: { peerId } }));
    channel.onclose = () => this.channels.delete(peerId);
  }

  _handleGameMessage(event) {
    let data = event.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch (_) { return; }
    try {
      const name = data.remoteName || data.sceneName;
      const object = app.getSceneObjectByName(name);
      if (!object) return;
      if (data.netPos) object.position.setPosition(data.netPos.x, data.netPos.y, data.netPos.z);
      else if (data.netRotY !== undefined) object.rotation.y = data.netRotY;
      else if (data.netRotX !== undefined) object.rotation.x = data.netRotX;
      else if (data.netRotZ !== undefined) object.rotation.z = data.netRotZ;
      else if (data.animationIndex !== undefined) object.playAnimationByIndex(data.animationIndex);
    } catch (error) { console.info('[NativeWebRTC] game message:', error); }
  }

  _dropPeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) pc.close();
    this.peers.delete(peerId);
    this.channels.delete(peerId);
  }

  getPeers() { return Array.from(this.peers.keys()); }

  leaveSession() {
    if (this.closed) return;
    this.closed = true;
    this.peers.forEach((_, id) => this._dropPeer(id));
    if (this.localStream) this.localStream.getTracks().forEach(track => track.stop());
    if (this.socket) this.socket.close();
    dispatchEvent(new CustomEvent('net-left', { detail: { room: this.sessionName } }));
  }
}
