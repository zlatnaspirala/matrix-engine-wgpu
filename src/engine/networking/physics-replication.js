/**
 * Pose replication for paired video cubes in the native WebRTC public-chat demo.
 * The peer whose ID is embedded in local-video-<peerId> owns that body.
 * Its remote-video twin is kinematic and receives authoritative pose updates.
 */
export function activatePhysicsReplication(engine, net, options = {}) {
  const interval = Math.max(25, options.interval || 50);
  const remoteBodies = new Set();
  const lastSequence = new Map();
  const inFlight = new Set();
  let timer = null;
  let started = false;
  let disposed = false;
  let sequence = 0;

  const physics = () => engine?.matrixPhysics;
  const peerId = () => String(net?.id || '');
  const bodyKey = (name, remoteName) => [String(name), String(remoteName)].sort().join('|');

  const findBody = name => {
    for(const [idx, object] of physics()?._bodyIndexMap || []) {
      if(object?.name === name) return {idx, object};
    }
    return null;
  };

  const ownerFor = object => {
    const name = String(object?.name || '');
    const remoteName = String(object?.position?.remoteName || '');
    if(name.startsWith('local-video-')) return name.slice('local-video-'.length);
    if(remoteName.startsWith('local-video-')) return remoteName.slice('local-video-'.length);
    return '';
  };

  const sendTo = (message, target) => {
    if(net?.send) net.send({...message, toRemote: [target]}, [target]);
  };

  const setReplicaMode = (idx, isOwner) => {
    const p = physics();
    if(isOwner) {
      if(remoteBodies.has(idx)) {
        p?.switchToDinamic?.(idx);
        remoteBodies.delete(idx);
      }
    } else if(!remoteBodies.has(idx)) {
      p?.switchToKinematic?.(idx);
      remoteBodies.add(idx);
    }
  };

  const receive = event => {
    const message = event.detail?.data;
    const sender = String(event.detail?.peerId || '');
    if(!started || !message || message.room !== net?.sessionName || !sender) return;
    const p = physics();
    if(!p) return;

    if(message.type === 'beast-physics-pose') {
      if(message.ownerPeerId !== sender || message.ownerPeerId === peerId()) return;
      if(typeof message.remoteName !== 'string' || !message.remoteName ||
         !message.position || !message.quaternion) return;

      const body = findBody(message.remoteName);
      if(!body || ownerFor(body.object) !== message.ownerPeerId) return;
      const seqKey = sender + '|' + message.remoteName;
      const previous = lastSequence.get(seqKey) || 0;
      if(Number(message.seq) <= previous) return;
      lastSequence.set(seqKey, Number(message.seq) || previous + 1);

      setReplicaMode(body.idx, false);
      const pos = message.position, q = message.quaternion;
      p.setKinematicTransform?.(body.idx, pos.x, pos.y, pos.z);
      p.setKinematicRotation?.(body.idx, q.x, q.y, q.z, q.w);
      return;
    }

    if(message.type === 'beast-physics-input') {
      if(message.ownerPeerId !== peerId() || !message.targetName) return;
      const target = findBody(message.targetName);
      if(!target || ownerFor(target.object) !== peerId()) return;
      if(message.action === 'impulse') p.applyImpulse?.(target.idx, message.vector || {});
      else if(message.action === 'torque') p.applyTorque?.(target.idx, message.vector || {});
    }
  };

  const publish = async () => {
    const p = physics();
    const me = peerId();
    if(disposed || !started || !me || !net?.send || !p?._bodyIndexMap) return;

    for(const [idx, object] of p._bodyIndexMap) {
      const remoteName = object?.position?.remoteName;
      if(typeof remoteName !== 'string' || !remoteName) continue;
      const owner = ownerFor(object);
      if(!owner) continue;
      const isOwner = owner === me;
      setReplicaMode(idx, isOwner);
      if(!isOwner || inFlight.has(idx)) continue;

      inFlight.add(idx);
      try {
        const [position, quaternion] = await Promise.all([
          p.getPosition?.(idx),
          p.getQuaternion?.(idx)
        ]);
        if(disposed || !position || !quaternion) continue;
        net.send({
          type: 'beast-physics-pose',
          room: net.sessionName,
          seq: ++sequence,
          ownerPeerId: me,
          sceneName: object.name,
          remoteName,
          bodyKey: bodyKey(object.name, remoteName),
          position,
          quaternion
        });
      } catch(error) {
        console.warn('[physics-replication] pose read failed:', object?.name, error);
      } finally {
        inFlight.delete(idx);
      }
    }
  };

  const forwardInput = (action, idx, vector) => {
    const object = physics()?._bodyIndexMap?.get(idx);
    const remoteName = object?.position?.remoteName;
    const owner = ownerFor(object);
    if(!object || !remoteName || !owner || owner === peerId()) return false;
    sendTo({
      type: 'beast-physics-input',
      room: net.sessionName,
      ownerPeerId: owner,
      targetName: remoteName,
      action,
      vector,
      seq: ++sequence
    }, owner);
    return true;
  };

  const p = physics();
  const originalImpulse = p?.applyImpulse?.bind(p);
  const originalTorque = p?.applyTorque?.bind(p);
  if(p && originalImpulse) {
    p.applyImpulse = (idx, vector) => {
      if(forwardInput('impulse', idx, vector)) return;
      return originalImpulse(idx, vector);
    };
  }
  if(p && originalTorque) {
    p.applyTorque = (idx, vector) => {
      if(forwardInput('torque', idx, vector)) return;
      return originalTorque(idx, vector);
    };
  }

  const start = () => {
    if(disposed || started || !peerId()) return;
    started = true;
    timer = setInterval(publish, interval);
    publish();
  };

  addEventListener('webrtc-message', receive);
  addEventListener('net-ready', start);
  if(peerId()) start();

  return {
    dispose() {
      disposed = true;
      if(timer) clearInterval(timer);
      removeEventListener('webrtc-message', receive);
      removeEventListener('net-ready', start);
      if(p && originalImpulse) p.applyImpulse = originalImpulse;
      if(p && originalTorque) p.applyTorque = originalTorque;
      remoteBodies.clear();
      lastSequence.clear();
      inFlight.clear();
    }
  };
}
