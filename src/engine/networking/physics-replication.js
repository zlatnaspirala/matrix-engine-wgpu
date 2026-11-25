/**
 * Physics body replication for the native WebRTC public-chat demo.
 *
 * Local bodies remain physics-authoritative. Remote counterparts are switched
 * to kinematic and receive transforms through the worker bridge, so the remote
 * solver never competes with the owner for the same body.
 */
export function activatePhysicsReplication(engine, net, options = {}) {
  const interval = options.interval || 50;
  const knownRemote = new Set();
  const lastSent = new Map();
  let timer = null;
  let disposed = false;
  let sequence = 0;

  const physics = () => engine?.matrixPhysics;
  const findBodyIndex = name => {
    const p = physics();
    if(!p?._bodyIndexMap) return -1;
    for(const [idx, object] of p._bodyIndexMap) {
      if(object?.name === name) return idx;
    }
    return -1;
  };

  const receive = event => {
    const message = event.detail?.data;
    if(!message || message.type !== 'beast-physics-transform' || message.room !== net?.sessionName) return;
    const p = physics();
    if(!p || !Number.isInteger(message.seq)) return;
    const targetName = message.remoteName;
    if(typeof targetName !== 'string' || !targetName) return;
    const idx = findBodyIndex(targetName);
    if(idx < 0) return;

    // The replica must be kinematic: only its owner simulates forces/collisions.
    if(!knownRemote.has(idx)) {
      p.switchToKinematic?.(idx);
      knownRemote.add(idx);
    }
    const t = message.transform;
    if(!t || ![t.x, t.y, t.z, t.qx, t.qy, t.qz, t.qw].every(Number.isFinite)) return;
    p.setKinematicTransform(idx, t.x, t.y, t.z);
    p.setKinematicRotation(idx, t.qx, t.qy, t.qz, t.qw);
  };

  const publish = () => {
    if(disposed || !net?.send || !physics()?._snapshot) return;
    const p = physics();
    const snap = p._snapshot;
    const stride = 8;
    for(const [idx, object] of p._bodyIndexMap || []) {
      const pos = object?.position;
      const remoteName = pos?.remoteName;
      // Any physics body with an explicit remoteName is eligible. The demo's
      // local-video-* bodies use this too, but custom bodies need no special name
      // prefix or extra netPhysics flag.
      if(typeof remoteName !== 'string' || !remoteName) continue;
      const b = idx * stride;
      const t = {
        x: snap[b], y: snap[b + 1], z: snap[b + 2],
        qx: snap[b + 3], qy: snap[b + 4], qz: snap[b + 5], qw: snap[b + 6]
      };
      if(![t.x, t.y, t.z, t.qx, t.qy, t.qz, t.qw].every(Number.isFinite)) continue;
      const old = lastSent.get(idx);
      if(old && Math.abs(old.x-t.x)+Math.abs(old.y-t.y)+Math.abs(old.z-t.z)+
        Math.abs(old.qx-t.qx)+Math.abs(old.qy-t.qy)+Math.abs(old.qz-t.qz)+Math.abs(old.qw-t.qw) < 0.001) continue;
      lastSent.set(idx, t);
      net.send({
        type: 'beast-physics-transform',
        room: net.sessionName,
        seq: ++sequence,
        sceneName: object.name,
        remoteName,
        transform: t
      });
    }
  };

  addEventListener('webrtc-message', receive);
  timer = setInterval(publish, interval);
  return {
    dispose() {
      disposed = true;
      if(timer) clearInterval(timer);
      removeEventListener('webrtc-message', receive);
      knownRemote.clear();
      lastSent.clear();
    }
  };
}
