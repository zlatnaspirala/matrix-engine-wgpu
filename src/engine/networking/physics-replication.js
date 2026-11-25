/**
 * Authoritative rigid-body replication for the native WebRTC demo.
 *
 * One peer simulates each logical body. Other peers keep a kinematic replica,
 * while local interactions are forwarded to the authority as physics inputs.
 * Authority is elected deterministically from the connected peer IDs, so all
 * participants make the same choice without a signaling-server lock service.
 */
export function activatePhysicsReplication(engine, net, options = {}) {
  const interval = Math.max(25, options.interval || 50);
  const correctionInterval = Math.max(100, options.correctionInterval || 250);
  const correctionEvery = Math.max(1, Math.round(correctionInterval / interval));
  const knownRemote = new Set();
  const ownerByKey = new Map();
  const lastCorrection = new Map();
  let timer = null;
  let disposed = false;
  let sequence = 0;
  let publishing = false;

  const physics = () => engine?.matrixPhysics;
  const localPeerId = () => String(net?.id || net?.connection?.connectionId || '');
  const bodyKey = (name, remoteName) => [String(name), String(remoteName)].sort().join('|');
  const findBodyIndex = name => {
    const p = physics();
    if(!p?._bodyIndexMap) return -1;
    for(const [idx, object] of p._bodyIndexMap) if(object?.name === name) return idx;
    return -1;
  };
  const findBodyByKey = key => {
    const p = physics();
    for(const [idx, object] of p?._bodyIndexMap || []) {
      const remoteName = object?.position?.remoteName;
      if(remoteName && bodyKey(object.name, remoteName) === key) return {idx, object};
    }
    return null;
  };
  const send = (message, peerId) => {
    if(!net?.send) return;
    if(peerId) net.send({...message, toRemote: [peerId]}, [peerId]);
    else net.send(message);
  };
  const electedOwner = () => {
    const ids = [localPeerId(), ...Array.from(net?.peers?.keys?.() || []).map(String)]
      .filter(Boolean).sort();
    return ids[0] || localPeerId();
  };
  const setReplicaMode = (idx, isOwner) => {
    const p = physics();
    if(isOwner) {
      if(knownRemote.has(idx)) {
        p.switchToDinamic?.(idx);
        knownRemote.delete(idx);
      }
    } else if(!knownRemote.has(idx)) {
      p.switchToKinematic?.(idx);
      knownRemote.add(idx);
    }
  };
  const applyState = (idx, state, hard = false) => {
    const p = physics();
    if(!p || !state) return;
    const pos = state.position, q = state.quaternion;
    const lv = state.linearVelocity, av = state.angularVelocity;
    if(!pos || !q || !lv || !av) return;
    if(hard) {
      // Physics bridge methods update the worker body, not just the render mesh.
      p.setKinematicTransform?.(idx, pos.x, pos.y, pos.z);
      p.setKinematicRotation?.(idx, q.x, q.y, q.z, q.w);
    }
    p.setBodyVelocity?.(idx, lv.x, lv.y, lv.z);
    p.setBodyAngularVelocity?.(idx, av.x, av.y, av.z);
    if(state.sleeping) p.deactivatePhysics?.(idx);
    else p.activate?.(idx, 1);
  };

  const receive = event => {
    const message = event.detail?.data;
    const sender = String(event.detail?.peerId || '');
    if(!message || message.room !== net?.sessionName || !sender) return;
    const p = physics();
    if(!p) return;

    if(message.type === 'beast-physics-state') {
      if(message.ownerPeerId === localPeerId()) return;
      if(typeof message.remoteName !== 'string' || !message.remoteName || !message.state) return;
      const idx = findBodyIndex(message.remoteName);
      if(idx < 0) return;
      ownerByKey.set(message.bodyKey, message.ownerPeerId || sender);
      const isNew = !knownRemote.has(idx);
      setReplicaMode(idx, false);
      applyState(idx, message.state, isNew || message.seq % correctionEvery === 0);
      return;
    }

    if(message.type === 'beast-physics-input') {
      if(message.ownerPeerId !== localPeerId()) return;
      const target = findBodyByKey(message.bodyKey);
      if(!target) return;
      const v = message.vector || {};
      const executeInput = () => {
        if(message.action === 'impulse') p.applyImpulse?.(target.idx, v);
        else if(message.action === 'torque') p.applyTorque?.(target.idx, v);
        else if(message.action === 'velocity') p.setBodyVelocity?.(target.idx, v.x, v.y, v.z);
        else if(message.action === 'shoot') p.shootBody?.(target.idx, v.lx, v.ly, v.lz, v.ax, v.ay, v.az);
      };
      // Sleeping bodies can hand authority to the peer that wakes them.
      p.isSleeping?.(target.idx).then(isSleeping => {
        if(!isSleeping || !sender) { executeInput(); return; }
        p.getBodyState?.(target.idx).then(state => {
          if(!state) { executeInput(); return; }
          p.switchToKinematic?.(target.idx);
          ownerByKey.set(message.bodyKey, sender);
          send({
            type: 'beast-physics-owner', room: net.sessionName,
            bodyKey: message.bodyKey, ownerPeerId: sender, state,
            wakeInput: {action: message.action, vector: v}
          });
        }).catch(executeInput);
      }).catch(executeInput);
      return;
    }

    if(message.type === 'beast-physics-owner') {
      const target = findBodyByKey(message.bodyKey);
      if(!target) return;
      ownerByKey.set(message.bodyKey, message.ownerPeerId);
      const isOwner = message.ownerPeerId === localPeerId();
      setReplicaMode(target.idx, isOwner);
      if(message.state) applyState(target.idx, message.state, true);
      if(isOwner && message.wakeInput) {
        const v = message.wakeInput.vector || {};
        if(message.wakeInput.action === 'impulse') p.applyImpulse?.(target.idx, v);
        else if(message.wakeInput.action === 'torque') p.applyTorque?.(target.idx, v);
        else if(message.wakeInput.action === 'velocity') p.setBodyVelocity?.(target.idx, v.x, v.y, v.z);
        else if(message.wakeInput.action === 'shoot') p.shootBody?.(target.idx, v.lx, v.ly, v.lz, v.ax, v.ay, v.az);
      }
    }
  };

  const forwardInput = (action, idx, vector) => {
    const p = physics();
    const object = p?._bodyIndexMap?.get(idx);
    const remoteName = object?.position?.remoteName;
    if(!object || !remoteName) return false;
    const key = bodyKey(object.name, remoteName);
    const owner = ownerByKey.get(key) || electedOwner();
    if(owner === localPeerId()) return false;
    send({
      type: 'beast-physics-input', room: net.sessionName,
      bodyKey: key, ownerPeerId: owner, action, vector,
      seq: ++sequence
    }, owner);
    return true;
  };

  // Forward forces/impulses applied to remote kinematic replicas. The authority
  // executes the original bridge method, so there is no recursive network echo.
  const p = physics();
  const originalImpulse = p?.applyImpulse?.bind(p);
  const originalTorque = p?.applyTorque?.bind(p);
  const originalVelocity = p?.setBodyVelocity?.bind(p);
  const originalShoot = p?.shootBody?.bind(p);
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
  if(p && originalVelocity) {
    p.setBodyVelocity = (idx, x, y, z) => {
      if(forwardInput('velocity', idx, {x, y, z})) return;
      return originalVelocity(idx, x, y, z);
    };
  }
  if(p && originalShoot) {
    p.shootBody = (idx, lx, ly, lz, ax, ay, az) => {
      if(forwardInput('shoot', idx, {lx, ly, lz, ax, ay, az})) return;
      return originalShoot(idx, lx, ly, lz, ax, ay, az);
    };
  }

  const publish = async () => {
    if(disposed || publishing || !net?.send || !physics()?._bodyIndexMap) return;
    publishing = true;
    try {
      const p = physics();
      const me = localPeerId();
      const owned = [];
      for(const [idx, object] of p._bodyIndexMap) {
        const remoteName = object?.position?.remoteName;
        if(typeof remoteName !== 'string' || !remoteName) continue;
        const key = bodyKey(object.name, remoteName);
        const owner = ownerByKey.get(key) || electedOwner();
        ownerByKey.set(key, owner);
        setReplicaMode(idx, owner === me);
        if(owner !== me) continue;
        owned.push({idx, object, key, remoteName});
      }
      const states = await Promise.all(owned.map(item => p.getBodyState?.(item.idx)));
      for(let i = 0;i < owned.length;i++) {
        const {idx, object, key} = owned[i];
        const state = states[i];
        if(!state) continue;
        const now = Date.now();
        const last = lastCorrection.get(idx) || 0;
        if(state.sleeping && last === -1) continue;
        if(state.sleeping) lastCorrection.set(idx, -1);
        else lastCorrection.set(idx, now);
        send({
          type: 'beast-physics-state', room: net.sessionName,
          seq: ++sequence, ownerPeerId: me,
          sceneName: object.name, remoteName, bodyKey: key, state
        });
      }
    } catch(error) {
      console.warn('[physics-replication] publish failed:', error);
    } finally {
      publishing = false;
    }
  };

  addEventListener('webrtc-message', receive);
  addEventListener('webrtc-peer-ready', () => {
    // Re-evaluate deterministic ownership when a peer joins.
    ownerByKey.clear();
  });
  addEventListener('connectionDestroyed', event => {
    const peerId = String(event.detail?.connectionId || '');
    if(peerId) ownerByKey.clear();
  });
  timer = setInterval(publish, interval);

  return {
    dispose() {
      disposed = true;
      if(timer) clearInterval(timer);
      removeEventListener('webrtc-message', receive);
      if(p && originalImpulse) p.applyImpulse = originalImpulse;
      if(p && originalTorque) p.applyTorque = originalTorque;
      if(p && originalVelocity) p.setBodyVelocity = originalVelocity;
      if(p && originalShoot) p.shootBody = originalShoot;
      knownRemote.clear();
      ownerByKey.clear();
      lastCorrection.clear();
    }
  };
}
