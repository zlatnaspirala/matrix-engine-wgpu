// const LAYER_NON_MOVING = 0;
// const LAYER_MOVING = 1;
// const LAYER_ANCHOR = 2;
// const LAYER_FLIPPER = 3;
// const NUM_OBJ_LAYERS = 4;
const FLOATS_PER_BODY = 8;
// Layers as bits — single source of truth
const LAYER_WORLD = 1;   // 1 << 0
const LAYER_MOVING = 2;   // 1 << 1
const LAYER_ANCHOR = 4;   // 1 << 2
const LAYER_FLIPPER = 8;   // 1 << 3
const LAYER_BALL = 16;  // 1 << 4

const MASK = {
  [LAYER_WORLD]: LAYER_BALL | LAYER_FLIPPER | LAYER_MOVING,
  [LAYER_MOVING]: LAYER_WORLD | LAYER_MOVING | LAYER_BALL,
  [LAYER_ANCHOR]: 0,
  [LAYER_FLIPPER]: LAYER_BALL | LAYER_WORLD,
  [LAYER_BALL]: LAYER_WORLD | LAYER_FLIPPER | LAYER_MOVING,
};

const degToRad = d => d * (Math.PI / 180);

function buildConeVerts(radius, height, segments = 16) {
  const verts = [];
  const half = height / 2;
  for(let i = 0;i < segments;i++) {
    const a = (i / segments) * Math.PI * 2;
    verts.push(Math.cos(a) * radius, -half, Math.sin(a) * radius);
  }
  verts.push(0, half, 0);
  return verts;
}

function getHingeAngle(bodyA, bodyB, axis) {
  const qA = bodyA.quaternion;
  const qB = bodyB.quaternion;

  // relative rotation
  const qRel = qA.inverse().mult(qB);

  // extract angle around axis (approx)
  const axisWorld = axis.clone();
  bodyA.quaternion.vmult(axisWorld, axisWorld);

  const angle = 2 * Math.acos(qRel.w);

  return angle;
}

class MatrixCannon {
  constructor() {
    this.rigidBodies = [];
    this.constraints = [];
    this.CANNON = null;
    this.world = null;
    this.speedUpSimulation = 2;
    this.options = {roundDimension: 100, gravity: 10};
    this._snapshot = null;
    this._useSAB = false;
    this._sab = null;
    this.bodyMap = new Map(); // cannon body -> our index
  }

  _allocBuffer(bodyCount) {
    const FLOATS = bodyCount * FLOATS_PER_BODY;
    const bytes = 4 + FLOATS * 4;
    if(typeof SharedArrayBuffer !== 'undefined') {
      const newSab = new SharedArrayBuffer(bytes);
      const newSnap = new Float32Array(newSab, 4);
      if(this._snapshot) newSnap.set(this._snapshot);
      this._sab = newSab;
      this._snapshot = newSnap;
      this._useSAB = true;
      new Uint32Array(this._sab, 0, 1)[0] = bodyCount;
    } else {
      const newSnap = new Float32Array(FLOATS);
      if(this._snapshot) newSnap.set(this._snapshot);
      this._snapshot = newSnap;
      this._useSAB = false;
    }
  }

  async init(options = {}) {
    Object.assign(this.options, options);
    const module = await import('https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js');
    this.CANNON = module;
    this._initPhysics(options.groundY ?? 0);
    console.log('PHYSICS[CANNON-ES]');
  }

  _initPhysics(GROUND_Y) {
    const CANNON = this.CANNON;

    this.world = new CANNON.World();
    this.world.gravity.set(0, -this.options.gravity, 0);
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.3;

    // Create ground body
    const groundShape = new CANNON.Box(
      new CANNON.Vec3(this.options.roundDimension, 1, this.options.roundDimension)
    );
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape
    });
    groundBody.position.set(0, GROUND_Y, 0);
    groundBody.collisionFilterGroup = LAYER_WORLD;
    groundBody.collisionFilterMask = LAYER_MOVING | LAYER_FLIPPER | LAYER_BALL;
    this.world.addBody(groundBody);

    this.world.addEventListener('beginContact', (e) => {
      console.log(`Collision ...`);
      const b1Idx = this.bodyMap.get(e.body);
      const b2Idx = this.bodyMap.get(e.target);

      if(b1Idx !== undefined && b2Idx !== undefined) {
        const b1 = this.rigidBodies[b1Idx];
        const b2 = this.rigidBodies[b2Idx];
        console.log(`Collision added between Body ${b1Idx} and Body ${b2Idx}`);
        if(!b1.name) b1.name = "NO_NAME";
        if(!b2.name) b2.name = "NO_NAME";
        self.postMessage({
          cmd: "collision",
          body0Name: b1.name,
          body1Name: b2.name,
          manifold: null
        });
      }
    });

    // ets helper
    this.restQuaternion = new CANNON.Quaternion();
    this.restQuaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -15);

    this.restQuaternion2 = new CANNON.Quaternion();
    this.restQuaternion2.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), 15);
  }

  addBody(pOptions) {
    let body = null;
    switch(pOptions.geometry) {
      case 'Sphere': body = this._addSphere(pOptions); break;
      case 'Cube': body = this._addBox(pOptions); break;
      case 'Capsule': body = this._addCapsule(pOptions); break;
      case 'Cylinder': body = this._addCylinder(pOptions); break;
      case 'Cone': body = this._addCone(pOptions); break;
      case 'ConvexHull': body = this._addConvexHull(pOptions); break;
      case 'BvhMesh': body = this._addBvhMesh(pOptions); break;
      default: return -1;
    }

    return body ? this.rigidBodies.length - 1 : -1;
  }

  _registerBody(cannonBody, pOptions) {
    cannonBody.name = pOptions.name;
    const idx = this.rigidBodies.length;
    this.rigidBodies.push(cannonBody);
    this.bodyMap.set(cannonBody, idx);
    this._allocBuffer(this.rigidBodies.length);

    if(this._snapshot) {
      const base = idx * FLOATS_PER_BODY;
      this._snapshot[base + 0] = pOptions.position?.x ?? 0;
      this._snapshot[base + 1] = pOptions.position?.y ?? 0;
      this._snapshot[base + 2] = pOptions.position?.z ?? 0;
    }
    return cannonBody;
  }

  _createBody(pOptions, shape) {
    const CANNON = this.CANNON;
    const pos = pOptions.position || {x: 0, y: 0, z: 0};
    const rot = pOptions.rotation || {x: 0, y: 0, z: 0};

    const rx = degToRad(rot.x || 0);
    const ry = degToRad(rot.y || 0);
    const rz = degToRad(rot.z || 0);

    // Euler (XYZ) → quaternion
    const quat = new CANNON.Quaternion();
    quat.setFromEuler(rx, ry, rz);

    const isKinematic = pOptions.kinematic || pOptions.state === 4;
    const mass = isKinematic ? 0 : (pOptions.mass !== 0 ? (pOptions.mass || 1) : 0);

    const bodyOptions = {
      mass: mass,
      shape: shape,
      linearDamping: pOptions.linearDamping ?? 0.2,
      angularDamping: pOptions.angularDamping ?? 0.2
    };

    if(pOptions.restitution !== undefined) bodyOptions.restitution = pOptions.restitution;
    if(pOptions.friction !== undefined) bodyOptions.friction = pOptions.friction;

    const body = new CANNON.Body(bodyOptions);
    body.position.set(pos.x, pos.y, pos.z);
    body.quaternion.copy(quat);

    if(pOptions.sensor) {
      body.isSensor = true;
    }


    // Collision layer — explicit from caller, no inference
    const group = pOptions.layer ?? LAYER_WORLD;
    const mask = pOptions.mask ?? MASK[group] ?? 0;

    body.collisionFilterGroup = group;
    body.collisionFilterMask = mask;

    console.log('[body]', pOptions.name,
      'group:', body.collisionFilterGroup,
      'mask:', body.collisionFilterMask
    );

    body.isKinematic = isKinematic;
    this.world.addBody(body);

    return this._registerBody(body, pOptions);
  }

  _addSphere(pOptions) {
    const shape = new this.CANNON.Sphere(pOptions.scale[0]);
    return this._createBody(pOptions, shape);
  }

  _addBox(pOptions) {
    const s = pOptions.scale || [1, 1, 1];
    const shape = new this.CANNON.Box(
      new this.CANNON.Vec3(s[0], s[1], s[2])
    );
    return this._createBody(pOptions, shape);
  }

  _addCapsule(pOptions) {
    const CANNON = this.CANNON;
    const halfHeight = (pOptions.height || 1) * 0.5;
    const radius = pOptions.radius || 1;

    // Cannon doesn't have native capsule, use compound body
    const body = new CANNON.Body({
      mass: pOptions.mass || 1
    });

    // Sphere at top
    body.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, halfHeight, 0));
    // Sphere at bottom
    body.addShape(new CANNON.Sphere(radius), new CANNON.Vec3(0, -halfHeight, 0));
    // Cylinder in middle
    body.addShape(new CANNON.Cylinder(radius, radius, halfHeight * 2, 8), new CANNON.Vec3(0, 0, 0));

    const pos = pOptions.position || {x: 0, y: 0, z: 0};
    body.position.set(pos.x, pos.y, pos.z);

    return this._createBody(pOptions, null); // Will need custom handling
  }

  _addCylinder(pOptions) {
    const CANNON = this.CANNON;
    const halfHeight = pOptions.scale ? pOptions.scale[1] : (pOptions.height || 2) * 0.5;
    const radius = pOptions.scale ? pOptions.scale[0] : (pOptions.radius || 1);

    const shape = new CANNON.Cylinder(radius, radius, halfHeight * 2, 8);
    return this._createBody(pOptions, shape);
  }

  _addCone(pOptions) {
    const CANNON = this.CANNON;
    const verts = buildConeVerts(pOptions.radius, pOptions.height);

    // Build cone convex hull from vertices
    const vertices = [];
    for(let i = 0;i < verts.length;i += 3) {
      vertices.push(new CANNON.Vec3(verts[i], verts[i + 1], verts[i + 2]));
    }

    const shape = new CANNON.ConvexPolyhedron({vertices});
    shape.computeNormals();
    return this._createBody(pOptions, shape);
  }

  _addConvexHull(pOptions) {
    const CANNON = this.CANNON;

    const v = pOptions.vertices;
    const idx = pOptions.indices; // ← YOU MUST HAVE THIS
    const [sx, sy, sz] = pOptions.scale ?? [1, 1, 1];

    const vertices = [];
    for(let i = 0;i < v.length;i += 3) {
      vertices.push(
        v[i] * sx,
        v[i + 1] * sy,
        v[i + 2] * sz
      );
    }

    const shape = new CANNON.Trimesh(vertices, idx);

    const body = new CANNON.Body({mass: 0});
    body.addShape(shape);

    const pos = pOptions.position || {x: 0, y: 0, z: 0};
    body.position.set(pos.x, pos.y, pos.z);

    this.world.addBody(body);

    return this._registerBody(body, pOptions);
  }

  _addBvhMesh(pOptions) {
    const CANNON = this.CANNON;
    const v = pOptions.vertices;
    const idx = pOptions.indices;
    const [sx, sy, sz] = pOptions.scale ?? [1, 1, 1];

    const vertices = [];
    for(let i = 0;i < v.length;i += 3) {
      vertices.push(v[i] * sx, v[i + 1] * sy, v[i + 2] * sz);
    }

    const indices = [];
    for(let i = 0;i < idx.length;i += 3) {
      indices.push([idx[i], idx[i + 1], idx[i + 2]]);
    }

    const shape = new CANNON.Trimesh(vertices, indices);
    const body = new CANNON.Body({mass: 0});
    body.addShape(shape);
    const pos = pOptions.position || {x: 0, y: 0, z: 0};
    body.position.set(pos.x, pos.y, pos.z);
    this.world.addBody(body);
    return this._registerBody(body, pOptions);
  }

  applyImpulse(idx, x, y, z) {
    console.log("ApplyIMpulse ", z)
    const b = this.rigidBodies[idx];
    if(b) {
      b.applyImpulse(
        new this.CANNON.Vec3(x, y, z),
        b.position
      );
    }
  }

  applyTorque(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.angularVelocity.x += x;
      b.angularVelocity.y += y;
      b.angularVelocity.z += z;
    }
  }

  shootBody(idx, lx, ly, lz, ax, ay, az) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.velocity.set(lx, ly, lz);
      b.angularVelocity.set(ax, ay, az);
    }
  }

  setLinearVelocity(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.velocity.set(x, y, z);
    }
  }

  setBodyAngularVelocity(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.angularVelocity.set(x, y, z);
    }
  }

  setActivationState(idx, state) {
    const b = this.rigidBodies[idx];
    if(b && state === 1) {
      b.wakeUp();
    }
  }

  activate(idx, force) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.wakeUp();
    }
  }

  setDamping(idx, linear, angular) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.linearDamping = linear;
      b.angularDamping = angular;
    }
  }

  setRestitution(idx, s) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.restitution = s;
    }
  }

  setFriction(idx, s) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.friction = s;
    }
  }

  setGravity(x, y, z) {
    if(this.world) {
      this.world.gravity.set(x, y, z);
    }
  }

  setGravityScale(idx, scale) {
    const b = this.rigidBodies[idx];
    if(b) {
      // Cannon doesn't have built-in gravity scale, apply as force
      b.gravityScale = scale;
    }
  }

  setBodyTransform(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.position.set(x, y, z);
      b.wakeUp();
    }
  }

  setKinematicTransform(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.position.set(x, y, z);
      b.velocity.set(0, 0, 0);
      b.angularVelocity.set(0, 0, 0);
    }
  }

  clearBody(idx) {
    const b = this.rigidBodies[idx];
    if(b) {
      b.velocity.set(0, 0, 0);
      b.angularVelocity.set(0, 0, 0);
    }
  }

  explode(idx, x, y, z, radius, strength) {
    const b = this.rigidBodies[idx];
    if(!b) return;

    const dx = b.position.x - x;
    const dy = b.position.y - y;
    const dz = b.position.z - z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if(dist < radius && dist > 0) {
      const force = (1 - dist / radius) * strength;
      this.applyImpulse(idx, (dx / dist) * force, (dy / dist) * force, (dz / dist) * force);
    }
  }

  addHingeConstraint(idxA, idxB, opts, msgID) {
    const CANNON = this.CANNON;
    const bodyA = this.rigidBodies[idxA]; // anchor
    const bodyB = this.rigidBodies[idxB]; // flipper
    if(!bodyA || !bodyB) return;
    bodyA.velocity.set(0, 0, 0);
    bodyA.angularVelocity.set(0, 0, 0);
    bodyA.angularDamping = 0.9;
    bodyA.linearDamping = 0.2;
    const pivotA = new CANNON.Vec3(...opts.pivotA); // local to bodyA
    const pivotB = new CANNON.Vec3(...opts.pivotB); // local to bodyB

    const constraint = new CANNON.PointToPointConstraint(
      bodyA,
      new CANNON.Vec3(0, 0, 0),
      bodyB,
      new CANNON.Vec3(0, 0, 0),
      {
        collideConnected: false
      }
    );

    // const constraint = new CANNON.HingeConstraint(bodyA, bodyB, {
    //   pivotA: new CANNON.Vec3(0, 0, 0),
    //   pivotB: new CANNON.Vec3(0, 0, 0),
    //   axisA: new CANNON.Vec3(0, 1, 0),
    //   axisB: new CANNON.Vec3(0, 1, 0),
    //   collideConnected: false,
    // });
    this.world.addConstraint(constraint);
    // constraint.enableMotor();
    // constraint.setMotorMaxForce(1000);
    // constraint.setMotorSpeed(5);
    this.world.addConstraint(constraint);
    console.log('HINGLE constraint.setMotorMaxForce ', constraint.setMotorMaxForce)
    this.constraints.push(constraint);
    self.postMessage({cmd: 'constraintAdded', id: msgID, idx: this.constraints.length - 1});
  }

  enableAngularMotor(idx, enable, targetVel, maxTorque) {
    const c = this.constraints[idx];
    if(!c || !c.enableMotor) return;
    if(enable) {
      c.enableMotor();
    } else {
      c.bodyA.quaternion.copy(this.restQuaternion2);
      c.disableMotor();
    }
    c.setMotorSpeed(targetVel);
    console.log('C props:', c);
    if(maxTorque != null) c.setMotorMaxForce(maxTorque);
  }

  getPosition(idx, msgID) {
    const body = this.rigidBodies[idx];
    if(!body) {
      self.postMessage({cmd: 'getPosition', id: msgID, position: null});
      return;
    }
    const pos = body.position;
    console.info('get pos x:', pos.x, 'y:', pos.y, 'z:', pos.z);
    self.postMessage({
      cmd: 'getPosition',
      id: msgID,
      position: {x: pos.x, y: pos.y, z: pos.z}
    });
  }

  step() {
    if(!this.world) return;
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.world.step(1 / 30);
    }
    const snap = this._snapshot;
    if(!snap) return;
    const count = this.rigidBodies.length;
    for(let i = 0;i < count;i++) {
      const base = i * FLOATS_PER_BODY;
      const body = this.rigidBodies[i];
      if(body.sleepState === body.SLEEPING) {
        snap[base + 7] = 0;
        continue;
      }
      snap[base + 0] = body.position.x;
      snap[base + 1] = body.position.y;
      snap[base + 2] = body.position.z;
      snap[base + 3] = body.quaternion.x;
      snap[base + 4] = body.quaternion.y;
      snap[base + 5] = body.quaternion.z;
      snap[base + 6] = body.quaternion.w;
      // --- active flag
      snap[base + 7] = 1;
    }
  }
}

const cannon = new MatrixCannon();

self.onmessage = async ({data}) => {
  const {cmd, id} = data;
  switch(cmd) {
    case 'init': {
      await cannon.init(data.options);
      self.postMessage({cmd: 'ready', id});
      break;
    }
    case 'addBody': {
      const idx = cannon.addBody(data.pOptions);
      self.postMessage({cmd: 'bodyAdded', id, idx, sab: cannon._sab});
      break;
    }
    case 'step': {
      cannon.step();
      if(!cannon._useSAB && cannon._snapshot) {
        const copy = cannon._snapshot.slice();
        self.postMessage({cmd: 'snapshot', snap: copy}, [copy.buffer]);
      }
      break;
    }
    case 'applyImpulse': cannon.applyImpulse(data.idx, data.x, data.y, data.z); break;
    case 'shootBody': cannon.shootBody(data.idx, data.lx, data.ly, data.lz, data.ax, data.ay, data.az); break;
    case 'setActivationState': cannon.setActivationState(data.idx, data.s); break;
    case 'activate': cannon.activate(data.idx, data.s); break;
    case 'setDamping': cannon.setDamping(data.idx, data.l, data.a); break;
    case 'setRestitution': cannon.setRestitution(data.idx, data.s); break;
    case 'setFriction': cannon.setFriction(data.idx, data.s); break;
    case 'applyTorque': cannon.applyTorque(data.idx, data.x, data.y, data.z); break;
    case 'setLinearVelocity': cannon.setLinearVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setBodyAngularVelocity': cannon.setBodyAngularVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setKinematicTransform': cannon.setKinematicTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravity': cannon.setGravity(data.x, data.y, data.z); break;
    case 'addHingeConstraint': cannon.addHingeConstraint(data.idxA, data.idxB, data.options, data.id); break;
    case 'enableAngularMotor': cannon.enableAngularMotor(data.constraintIdx, data.enable, data.targetVelocity, data.maxMotorImpulse); break;
    case 'clearBody': cannon.clearBody(data.idx); break;
    case 'setBodyTransform': cannon.setBodyTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravityScale': cannon.setGravityScale(data.idx, data.scale); break;
    case 'explode': cannon.explode(data.idx, data.x, data.y, data.z, data.radius, data.strength); break;
    case 'getPosition': {
      console.log('Getting position...');
      cannon.getPosition(data.idx, data.id);
      break;
    }
  }
};
