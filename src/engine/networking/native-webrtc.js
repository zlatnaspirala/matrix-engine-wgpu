import {LOG_MATRIX} from "../utils";

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
    this.connection = {connectionId: null, send: data => this.send(data)};
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
    this.pendingIce = new Map();
    this.localStream = null;
    this.localVideoElement = null;
    this.remoteMedia = new Map();
    this.localStreamReadyDispatched = false;
    this.socket = null;
    this.id = null;
    this.closed = false;
    this.multiPlayer = {
      root: this,
      onFollowPath(e) {},
      update(e) {
        e.data = JSON.parse(e.data);
        try {
          if(e.data.netPos) {
            // console.log(app.getSceneObjectByName(e.data.sceneName) + ">>>>><<<<<<<><><><><><<>")
            app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).position.setPosition(e.data.netPos.x, e.data.netPos.y, e.data.netPos.z);
          } else if(e.data.netRotY || e.data.netRotY == 0) {
            app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).rotation.y = e.data.netRotY;
          } else if(e.data.netRotX || e.data.netRotX == 0) {
            app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).rotation.x = e.data.netRotX;
          } else if(e.data.netRotZ || e.data.netRotZ == 0) {
            app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).rotation.z = e.data.netRotZ;
          } else if(e.data.animationIndex || e.data.animationIndex == 0) {
            console.log(`play animation from net , e.data.sceneName:${e.data.sceneName}  vs  e.data.remoteName: ${e.data.remoteName}
                 e.data.animationIndex ${e.data.animationIndex}
              
              `);
            app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).playAnimationByIndex(e.data.animationIndex);
          }
        } catch(err) {
          console.info('mmo-err:', err);
        }
      },
      leaveGamePlay() {}
    };
    this.domManipulation = {
      hideNetPanel: () => {
        const panel = document.getElementById('matrix-net');
        const title = document.getElementById('netHeaderTitle');
        if(!panel || !title) return;
        if(panel.classList.contains('hide-by-vertical')) {
          panel.classList.remove('hide-by-vertical');
          panel.classList.add('show-by-vertical');
          title.innerText = 'HIDE';
        } else {
          panel.classList.remove('show-by-vertical');
          panel.classList.add('hide-by-vertical');
          title.innerText = 'SHOW';
        }
      }
    };
    this.sendOnlyData = data => this.send(data);
    this.send = (data, targets) => {
      const payload = JSON.stringify(data);
      const requestedTargets = targets || (data && Array.isArray(data.toRemote) ? data.toRemote : null);
      const wanted = Array.isArray(requestedTargets) && requestedTargets.length ? new Set(requestedTargets) : null;
      this.channels.forEach((channel, peerId) => {
        if((!wanted || wanted.has(peerId)) && channel.readyState === 'open') channel.send(payload);
      });

      console.log('[WEBRTC SEND]', {
        localId: this.id,
        targets: [...this.channels.keys()],
        data
      });
    };
    this.fetchInfo = () => this.getPeers();
    this.closeSession = () => this.leaveSession();
    this.ready = Promise.resolve(this);
    this.loadNetHTML();
  }

  async joinSession() {
    if(this.socket && this.socket.readyState === WebSocket.OPEN) return this;
    this.closed = false;
    const protocol = this.options.protocol || (location.protocol === 'https:' ? 'wss:' : 'ws:');
    const host = this.options.signalingUrl || this.options.url ||
      protocol + '//' + (this.options.domain || location.hostname) + ':' + (this.options.port || 2020);
    console.log('[NativeWebRTC] connecting to signaling server:', host, 'room:', this.sessionName);
    this.socket = new WebSocket(host);
    this.socket.addEventListener('open', () => {
      console.log(`%c[NativeWebRTC] signaling socket OPEN:` + host, LOG_MATRIX);
    });
    this.socket.addEventListener('error', event => {
      console.error('[NativeWebRTC] signaling socket ERROR:', event);
    });
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebRTC signaling connection timed out')), 10000);
      this.socket.addEventListener('open', () => {clearTimeout(timeout); resolve();}, {once: true});
      this.socket.addEventListener('error', () => {clearTimeout(timeout); reject(new Error('Could not connect to WebRTC signaling server'));}, {once: true});
    });
    this.socket.addEventListener('message', event => this._onSignal(JSON.parse(event.data)));
    this.socket.addEventListener('close', event => {
      console.warn('[NativeWebRTC] signaling socket CLOSED:', {
        code: event.code, reason: event.reason, wasClean: event.wasClean
      });
      this.peers.forEach((_, id) => this._dropPeer(id));
      dispatchEvent(new CustomEvent('net-disconnected'));
    });
    this._signal({type: 'join', room: this.sessionName, metadata: this.options.customData || null});
    dispatchEvent(new CustomEvent('setupSessionObject', {detail: this.session}));
    return this;
  }

  async loadNetHTML() {
    try {
      const response = await fetch('./networking/broadcaster2.html');
      if(!response.ok) throw new Error('Could not load broadcaster2.html: ' + response.status);
      const html = await response.text();
      const panel = document.getElementById('matrix-net');
      if(!panel) {
        console.warn('[NativeWebRTC] #matrix-net container is missing; networking UI was not mounted');
        return;
      }
      panel.style.display = 'block';
      panel.innerHTML = html;

      const sessionInput = document.getElementById('sessionName');
      const joinButton = document.getElementById('join-btn');
      const closeButton = document.getElementById('buttonCloseSession');
      const leaveButton = document.getElementById('buttonLeaveSession');
      const headerButton = document.getElementById('netHeaderTitle');
      if(sessionInput) sessionInput.value = this.sessionName;

      joinButton?.addEventListener('click', async event => {
        event.preventDefault();
        if(sessionInput && sessionInput.value.trim()) this.sessionName = sessionInput.value.trim();
        joinButton.disabled = true;
        joinButton.textContent = 'Connecting...';
        try {
          await this.joinSession();
        } catch(error) {
          console.error('[NativeWebRTC] join failed:', error);
          this._setUIStatus('Connection failed: ' + error.message);
          joinButton.disabled = false;
          joinButton.textContent = 'Join!';
        }
      });

      // Native mesh rooms have no Kurento-style room owner. Close and Leave
      // both close this client's peer connections and leave the room.
      closeButton?.addEventListener('click', () => this.leaveSession());
      leaveButton?.addEventListener('click', () => this.leaveSession());
      headerButton?.addEventListener('click', () => this.domManipulation.hideNetPanel());
      this._setUIStatus('Ready to join');
      console.log('%c[NativeWebRTC] broadcaster2 UI mounted', LOG_MATRIX);
    } catch(error) {
      console.error('[NativeWebRTC] networking UI error:', error);
    }
  }

  _setUIStatus(message) {
    const title = document.getElementById('session-title');
    if(title) title.textContent = message;
  }

  _showJoinedUI() {
    const joinContainer = document.getElementById('pwa-container-2');
    const session = document.getElementById('session');
    if(joinContainer) joinContainer.style.display = 'none';
    if(session) session.style.display = 'block';
    this._setUIStatus('Session: ' + this.sessionName);
  }

  _showJoinUI() {
    const joinContainer = document.getElementById('pwa-container-2');
    const session = document.getElementById('session');
    const videoContainer = document.getElementById('video-container');
    if(joinContainer) joinContainer.style.display = 'block';
    if(session) session.style.display = 'none';
    if(videoContainer) videoContainer.innerHTML = '';
    const joinButton = document.getElementById('join-btn');
    if(joinButton) {
      joinButton.disabled = false;
      joinButton.textContent = 'Join!';
    }
  }

  _showLocalStream(stream) {
    let video = this.localVideoElement || document.getElementById('native-local-video');
    if(!video) {
      video = document.createElement('video');
      video.id = 'native-local-video';
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      Object.assign(video.style, {
        position: 'fixed', bottom: '16px', right: '16px', width: '180px',
        aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px',
        border: '2px solid rgba(255,255,255,0.3)', zIndex: '999'
      });
      document.body.appendChild(video);
    }
    this.localVideoElement = video;
    if(video.srcObject !== stream) video.srcObject = stream;
    video.play().catch(error => console.warn('[NativeWebRTC] local preview autoplay blocked:', error));
    if(!this.localStreamReadyDispatched) {
      this.localStreamReadyDispatched = true;
      const detail = {connection: this.connection, stream, videoElement: video};
      dispatchEvent(new CustomEvent('LOCAL-STREAM-READY', {detail}));
      dispatchEvent(new CustomEvent('streamPlaying', {
        detail: {peerId: this.id, stream, target: {id: 'local-video', videos: [{video}]}}
      }));
    }
    return video;
  }

  async _showRemoteStream(peerId, stream) {
    if(!stream) return null;
    const container = document.getElementById('video-container');
    if(!container) return null;

    // One stable video element per peer stream. Track events and renegotiation
    // reuse this element instead of appending another video tag.
    let media = this.remoteMedia.get(peerId);
    let wrapper = document.getElementById('native-remote-' + peerId);
    let video = media?.video || document.getElementById('remote-video-' + peerId);
    if(!video) {
      wrapper = document.createElement('div');
      wrapper.id = 'native-remote-' + peerId;
      wrapper.dataset.peerId = peerId;
      Object.assign(wrapper.style, {
        display: 'inline-block', width: 'calc(50% - 4px)', overflow: 'hidden',
        background: '#000', aspectRatio: '16/9', margin: '2px'
      });
      video = document.createElement('video');
      video.id = 'remote-video-' + peerId;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = false;
      Object.assign(video.style, {
        width: '100%', height: '100%', objectFit: 'cover', display: 'block'
      });
      wrapper.appendChild(video);
      container.appendChild(wrapper);
    } else if(!wrapper) {
      wrapper = video.parentElement;
    }

    if(video.srcObject !== stream) video.srcObject = stream;
    this.remoteMedia.set(peerId, {video, wrapper, stream});
    try {
      await video.play();
    } catch(error) {
      console.warn('[NativeWebRTC] remote video autoplay blocked:', peerId, error);
    }
    // Keep the legacy Kurento event contract so existing streamPlaying
    // consumers can use target.id and target.videos[0].video unchanged.
    const detail = {
      peerId,
      stream,
      target: {id: video.id, videos: [{video}]}
    };
    dispatchEvent(new CustomEvent('streamPlaying', {detail}));
    dispatchEvent(new CustomEvent('webrtc-track', {detail: {peerId, stream, videoElement: video}}));
    return video;
  }

  _signal(message) {
    if(this.socket && this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  async _onSignal(message) {
    if(message.type === 'joined') {
      console.log('[NativeWebRTC] JOINED room:', message.room, 'local peer id:', message.id, 'existing peers:', (message.peers || []).map(peer => peer.id));
      this.id = message.id;
      this.connection.connectionId = this.id;
      dispatchEvent(new CustomEvent('net-ready', {detail: {id: this.id, room: message.room}}));
      this._showJoinedUI();
      (message.peers || []).forEach(peer => this._createPeer(peer.id, true));
      return;
    }
    if(message.type === 'peer-joined') {
      console.log('[NativeWebRTC] REMOTE PEER JOINED:', message.id);
      this._createPeer(message.id, false);
      dispatchEvent(new CustomEvent('onConnectionCreated', {detail: message}));
      return;
    }
    if(message.type === 'peer-left') {
      console.log('[NativeWebRTC] REMOTE PEER LEFT:', message.id);
      this._dropPeer(message.id);
      return;
    }
    if(message.type === 'error') {
      console.warn('[NativeWebRTC] signaling server:', message.error);
      dispatchEvent(new CustomEvent('net-error', {detail: message}));
      return;
    }
    const peer = this.peers.get(message.from);
    if(!peer) return;
    try {
      if(message.type === 'offer') {
        await peer.setRemoteDescription(message.description);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        this._signal({type: 'answer', to: message.from, description: peer.localDescription});
      } else if(message.type === 'answer') {
        await peer.setRemoteDescription(message.description);
      } else if(message.type === 'ice-candidate' && message.candidate) {
        if(peer.remoteDescription) await peer.addIceCandidate(message.candidate);
        else {
          const pending = this.pendingIce.get(message.from) || [];
          pending.push(message.candidate);
          this.pendingIce.set(message.from, pending);
        }
      }
      if(peer.remoteDescription && this.pendingIce.has(message.from)) {
        const pending = this.pendingIce.get(message.from);
        this.pendingIce.delete(message.from);
        for(const candidate of pending) await peer.addIceCandidate(candidate);
      }
    } catch(error) {
      console.warn('[NativeWebRTC] signaling error:', error);
    }
  }

  async _createPeer(peerId, initiator) {
    if(this.peers.has(peerId)) return this.peers.get(peerId);
    const config = this.options.rtcConfig || {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
    console.log('[NativeWebRTC] creating RTCPeerConnection:', {peerId, initiator, config});
    const pc = new RTCPeerConnection(config);
    this.peers.set(peerId, pc);

    pc.onconnectionstatechange = () => {
      console.log('[NativeWebRTC] peer connection state:', peerId, pc.connectionState);
      if(['failed', 'closed'].includes(pc.connectionState)) this._dropPeer(peerId);
    };
    pc.oniceconnectionstatechange = () => {
      console.log('[NativeWebRTC] ICE connection state:', peerId, pc.iceConnectionState);
    };
    pc.onsignalingstatechange = () => {
      console.log('[NativeWebRTC] signaling state:', peerId, pc.signalingState);
    };
    pc.onicegatheringstatechange = () => {
      console.log('[NativeWebRTC] ICE gathering state:', peerId, pc.iceGatheringState);
    };
    pc.onicecandidateerror = event => {
      console.warn('[NativeWebRTC] ICE candidate error:', peerId, {
        url: event.url, code: event.errorCode, text: event.errorText
      });
    };
    if(this.options.media) {
      try {
        if(!this.localStream) this.localStream = await navigator.mediaDevices.getUserMedia(this.options.media === true ? {audio: true, video: true} : this.options.media);
        this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
        this._showLocalStream(this.localStream);
      } catch(error) {
        console.warn('[NativeWebRTC] media permission/device error:', error);
      }
    }
    if(initiator) {
      const channel = pc.createDataChannel('matrix-engine');
      this._bindChannel(peerId, channel);
    } else {
      pc.ondatachannel = event => this._bindChannel(peerId, event.channel);
    }
    pc.onicecandidate = event => {
      if(event.candidate) this._signal({type: 'ice-candidate', to: peerId, candidate: event.candidate});
    };
    pc.ontrack = event => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      if(event.track.kind === 'video') {
        this._showRemoteStream(peerId, stream).catch(error => {
          console.warn('[NativeWebRTC] could not attach remote stream:', peerId, error);
        });
      }
    };
    if(initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this._signal({type: 'offer', to: peerId, description: pc.localDescription});
    }
    return pc;
  }

  _bindChannel(peerId, channel) {
    this.channels.set(peerId, channel);
    channel.onmessage = event => {

      console.log('[WEBRTC CHANNEL MESSAGE]', {
        localId: this.id,
        remotePeerId: peerId,
        data: event.data
      });

      // if(peerId === this.id) {
      //   console.log('[EHOO]', data);
      //   return;
      // }

      let data = event.data;
      console.log('[WEBRTC RECEIVED]', data);

      console.log('[WEBRTC MESSAGE]', {
        peerId,
        localId: this.peerId,
        data
      });

      try {data = JSON.parse(data);} catch(_) {}
      const envelope = {data: typeof data === 'string' ? data : JSON.stringify(data), from: {connectionId: peerId}, type: 'data'};
      if(data && typeof data === 'object' && (data.netPos || data.netRotX !== undefined || data.netRotY !== undefined || data.netRotZ !== undefined || data.animationIndex !== undefined)) {
        this.multiPlayer.update(envelope);
      }
      dispatchEvent(new CustomEvent('only-data-receive', {detail: envelope}));
      dispatchEvent(new CustomEvent('webrtc-message', {detail: {peerId, data}}));
    };
    channel.onopen = () => {
      console.log('[NativeWebRTC] DATA CHANNEL OPEN:', peerId, 'label:', channel.label);
      dispatchEvent(new CustomEvent('webrtc-peer-ready', {detail: {peerId}}));
    };
    channel.onclose = () => {
      console.warn('[NativeWebRTC] DATA CHANNEL CLOSED:', peerId, 'label:', channel.label);
      this.channels.delete(peerId);
    };
    channel.onerror = event => {
      console.error('[NativeWebRTC] DATA CHANNEL ERROR:', peerId, event);
    };
  }

  _dropPeer(peerId) {
    const pc = this.peers.get(peerId);
    if(pc) {
      console.log('[NativeWebRTC] closing peer connection:', peerId, 'state:', pc.connectionState);
      pc.close();
    }
    this.peers.delete(peerId);
    this.channels.delete(peerId);
    this.pendingIce.delete(peerId);
    const media = this.remoteMedia.get(peerId);
    if(media) {
      media.video.pause();
      media.video.srcObject = null;
      media.video.remove();
      media.wrapper?.remove();
      this.remoteMedia.delete(peerId);
    } else {
      document.getElementById('native-remote-' + peerId)?.remove();
      document.getElementById('remote-video-' + peerId)?.remove();
    }
    dispatchEvent(new CustomEvent('connectionDestroyed', {detail: {connectionId: peerId}}));
  }

  getPeers() {return Array.from(this.peers.keys());}

  leaveSession() {
    if(this.closed) return;
    this.closed = true;
    console.log('[NativeWebRTC] leaving session:', this.sessionName);
    this.peers.forEach((_, id) => this._dropPeer(id));
    if(this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if(this.socket) this.socket.close();
    this.socket = null;
    if(this.localVideoElement) {
      this.localVideoElement.pause();
      this.localVideoElement.srcObject = null;
      this.localVideoElement.remove();
      this.localVideoElement = null;
    } else {
      document.getElementById('native-local-video')?.remove();
    }
    this.localStreamReadyDispatched = false;
    this._showJoinUI();
    dispatchEvent(new CustomEvent('net-left', {detail: {room: this.sessionName}}));
  }
}
