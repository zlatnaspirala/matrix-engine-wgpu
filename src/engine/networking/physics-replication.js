/**
 * Lightweight pose replication for paired rigid bodies in the native WebRTC demo.
 *
 * One peer simulates each paired body. Other peers keep a kinematic copy and
 * receive only position + rotation. This deliberately uses the existing
 * PhysicsBridge API and does not modify physics workers or forward inputs.
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

  const electedOwner = () => {
    const ids = [peerId(), ...Array.from(net?.peers?.keys?.() || []).map(String)]
      .filter(Boolean).sort();
    return ids[0] || '';
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
    if(!started || !message || message.type !== 'beast-physics-pose') return;
    if(message.room !== net?.sessionName || !sender || message.ownerPeerId === peerId()) return;
    if(typeof message.remoteName !== 'string' || !message.remoteName) return;
    if(!message.position || !message.quaternion) return;

    const body = findBody(message.remoteName);
    if(!body) return; // The periodic publisher will send again after scene creation.

    const sequenceKey = bodyKey(message.remoteName, message.sceneName || '');
    const previous = lastSequence.get(sequenceKey) || 0;
    if(Number(message.seq) <= previous) return;
    lastSequence.set(sequenceKey, Number(message.seq) || previous + 1);

    setReplicaMode(body.idx, false);
    const {x, y, z} = message.position;
    const q = message.quaternion;
    physics()?.setKinematicTransform?.(body.idx, x, y, z);
    physics()?.setKinematicRotation?.(body.idx, q.x, q.y, q.z, q.w);
  };

  const publish = async () => {
    const p = physics();
    const me = peerId();
    if(disposed || !started || !me || !net?.send || !p?._bodyIndexMap) return;

    const owner = electedOwner();
    for(const [idx, object] of p._bodyIndexMap) {
      const remoteName = object?.position?.remoteName;
      if(typeof remoteName !== 'string' || !remoteName) continue;

      const key = bodyKey(object.name, remoteName);
      const isOwner = owner === me;
      setReplicaMode(idx, !isOwner);
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
          bodyKey: key,
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

  const start = () => {
    if(disposed || started || !peerId()) return;
    started = true;
    timer = setInterval(publish, interval);
    publish();
  };

  addEventListener('webrtc-message', receive);
  addEventListener('net-ready', start);
  addEventListener('webrtc-peer-ready', () => {
    // Ownership is recalculated from the current peer list on the next tick.
  });

  // Support callers that activate replication after net-ready has already fired.
  if(peerId()) start();

  return {
    dispose() {
      disposed = true;
      if(timer) clearInterval(timer);
      removeEventListener('webrtc-message', receive);
      removeEventListener('net-ready', start);
      remoteBodies.clear();
      lastSequence.clear();
      inFlight.clear();
    }
  };
}
