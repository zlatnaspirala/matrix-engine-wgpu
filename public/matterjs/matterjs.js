importScripts('matter.min.js');
const FLOATS_PER_BODY = 8; // [x, y, z, qx, qy, qz, qw, active]

class MatterPhysicsWorker {
  constructor() {
    this.rigidBodies = [];
    this.bodyMap = new Map();
    this.constraints = [];
    this.Engine = null;
    this.World = null;
    this.Events = null;
    this.Bodies = null;
    this.Body = null;
    this.Constraint = null;
    this.Composite = null;
    this._snapshot = null;
    this._sab = null;
    this._useSAB = false;
    this.options = {gravity: 1, roundDimension: 100};
    this._arr = [0, 0, 0];
    this.TUNE = 0.0005;
  }

  async init(options = {}) {
    Object.assign(this.options, options);
    const Matter = self.Matter;
    if(!Matter) {
      self.postMessage({cmd: 'error', msg: 'Matter.js load failed'});
      return;
    }
    this.Engine = Matter.Engine;
    this.World = Matter.World;
    this.Bodies = Matter.Bodies;
    this.Body = Matter.Body;
    this.Constraint = Matter.Constraint;
    this.Composite = Matter.Composite;
    this.Events = Matter.Events;
    this.engine = this.Engine.create();
    this.engine.world.gravity.y = this.options.gravity;

    this.Events.on(this.engine, 'collisionStart', (event) => {
      for(const pair of event.pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        const normal = pair.collision.normal;
        self.postMessage({
          cmd: 'collision',
          body0Name: bodyA.name || 'unnamed',
          body1Name: bodyB.name || 'unnamed',
          normal: [normal.x, normal.y, 0]
        });
      }
    });
    this._allocBuffer(0);
    this._initGround(options.groundY);
    self.postMessage({cmd: 'ready', id: options.id});
  }

  _initGround(groundZ = 0) {
    const matterY = groundZ;
    const ground = this.Bodies.rectangle(
      0, matterY + 100,
      this.options.roundDimension * 21, this.options.roundDimension * 21,
      {isStatic: true, name: 'ground', friction: 0.3, restitution: 0.1}
    );
    this.World.add(this.engine.world, ground);
    this.rigidBodies.push(ground);
    this._allocBuffer(this.rigidBodies.length);
    const idx = this.rigidBodies.length - 1;
    this.bodyMap.set('ground', idx);
    return idx;
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

  addBody(pOptions) {
    const {geometry, position = {}, scale = [1, 1, 1], mass = 1, name = 'body', ...rest} = pOptions;

    let body = null;

    try {
      switch(geometry) {
        case 'Sphere':
          body = this.Bodies.circle(position.x || 0, position.y || 0, scale[0], {...rest, name});
          break;
        case 'Cube':
        case 'Box':
          body = this.Bodies.rectangle(position.x || 0, position.y || 0, scale[0] * 2, scale[1] * 2, {...rest, name});
          break;
        case 'Polygon':
          // Generic polygon from vertices if provided
          if(pOptions.vertices) {
            body = this.Bodies.polygon(position.x || 0, position.y || 0, pOptions.vertices.length / 2, scale[0], {...rest, name});
          } else {
            body = this.Bodies.rectangle(position.x || 0, position.y || 0, scale[0] * 2, scale[1] * 2, {...rest, name});
          }
          break;
        case 'ConvexHull':
        case 'BvhMesh':
          // Matter.Bodies.fromVertices for custom convex shapes
          if(pOptions.vertices) {
            const verts = [];
            for(let i = 0;i < pOptions.vertices.length;i += 3) {
              verts.push({
                x: pOptions.vertices[i] * (scale[0] || 1),
                y: pOptions.vertices[i + 1] * (scale[1] || 1)
              });
            }
            // Matter doesn't have fromVertices in standard, use rectangle fallback
            body = this.Bodies.rectangle(position.x || 0, position.y || 0, scale[0] * 2, scale[1] * 2, {...rest, name});
          }
          break;
        default:
          console.warn(`Geometry ${geometry} not supported, using rectangle`);
          body = this.Bodies.rectangle(position.x || 0, position.y || 0, scale[0] * 2, scale[1] * 2, {...rest, name});
      }
    } catch(e) {
      console.error(`Failed to create body ${geometry}:`, e);
      return -1;
    }

    if(!body) return -1;

    // Set mass
    if(mass > 0) {
      this.Body.setMass(body, mass);
    } else {
      // Static body
      body.isStatic = true;
    }

    // Sensor flag
    if(pOptions.sensor) {
      body.isSensor = true;
    }

    // Set kinematic flag
    body.isKinematic = pOptions.state === 4 || pOptions.kinematic;

    this.World.add(this.engine.world, body);
    this.rigidBodies.push(body);
    this._allocBuffer(this.rigidBodies.length);

    const idx = this.rigidBodies.length - 1;
    this.bodyMap.set(name, idx);

    // Initialize snapshot
    if(this._snapshot) {
      const base = idx * FLOATS_PER_BODY;
      this._snapshot[base + 0] = body.position.x;
      this._snapshot[base + 1] = body.position.y;
      this._snapshot[base + 2] = 0; // Z (2D, so 0)
      // Matter uses angle (radians), not quaternion; convert to quat for compatibility
      const quat = _eulerToQuat(0, 0, body.angle);
      this._snapshot[base + 3] = quat[0];
      this._snapshot[base + 4] = quat[1];
      this._snapshot[base + 5] = quat[2];
      this._snapshot[base + 6] = quat[3];
      this._snapshot[base + 7] = 1; // active
    }

    return idx;
  }

  setKinematicTransform(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.setPosition(body, {x, y});
  }

  applyImpulse(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.applyForce(body, body.position, {x, y: -y});
  }

  applyTorque(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.rotate(body, z); // 2D: use z component as angular impulse
  }

  setLinearVelocity(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.setVelocity(body, {x, y});
  }

  setBodyAngularVelocity(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    body.angularVelocity = z; // 2D: use z
  }

  setGravity(x, y, z) {
    if(this.engine && this.engine.world) {
      this.engine.world.gravity.x = x;
      this.engine.world.gravity.y = y;
    }
  }

  setGravityScale(idx, scale) {
    const body = this.rigidBodies[idx];
    if(body) {
      body.gravityScale = scale;
    }
  }

  setFriction(idx, f) {
    const body = this.rigidBodies[idx];
    if(body) {
      body.friction = f;
      body.frictionStatic = f * 1.5;
    }
  }

  setRestitution(idx, r) {
    const body = this.rigidBodies[idx];
    if(body) {
      body.restitution = r;
    }
  }

  setDamping(idx, linear, angular) {
    const body = this.rigidBodies[idx];
    if(body) {
      body.frictionAir = linear;
      body.angularVelocity *= (1 - angular);
    }
  }

  setBodyTransform(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.setPosition(body, {x, y});
  }

  clearBody(idx) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.setVelocity(body, {x: 0, y: 0});
    body.angularVelocity = 0;
  }

  activate(idx) {
    const body = this.rigidBodies[idx];
    if(body && body.isStatic) {
      body.isStatic = false;
    }
  }

  deactivate(idx) {
    const body = this.rigidBodies[idx];
    if(body) {
      body.isStatic = true;
    }
  }

  removeRigidBody(idx) {
    const body = this.rigidBodies[idx];
    if(body) {
      this.World.remove(this.engine.world, body);
      this.rigidBodies[idx] = null;
    }
  }

  speedUpSimulation(speed) {
    this.timeScale = speed || 1;
  }

  step() {
    if(!this.engine) return;
    this.Engine.update(this.engine, 1000 / 60);

    const snap = this._snapshot;
    if(!snap) return;

    for(let i = 0;i < this.rigidBodies.length;i++) {
      const body = this.rigidBodies[i];
      // console.log('body.position.x', body.position.x)
      console.log('body.position.y', body.position.y) 
      if(!body) continue;
      const base = i * FLOATS_PER_BODY;
      snap[base + 0] = body.position.x * this.TUNE;
      snap[base + 2] = 0;
      snap[base + 1] = -body.position.y * this.TUNE;
      const quat = _eulerToQuat(0, 0, body.angle);
      snap[base + 3] = quat[0];
      snap[base + 4] = quat[1];
      snap[base + 5] = quat[2];
      snap[base + 6] = quat[3];
      snap[base + 7] = body.isStatic ? 0 : 1;
    }
  }

  getPosition(idx) {
    const body = this.rigidBodies[idx];
    if(!body) return null;
    return {x: body.position.x, y: body.position.y, z: 0};
  }

  shootBody(idx, lx, ly, lz, ax, ay, az) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.setVelocity(body, {x: lx, y: ly});
    body.angularVelocity = az;
  }
}

// Convert Euler (X=0, Y=0, Z=angle) → Quaternion
function _eulerToQuat(ex, ey, ez) {
  const cx = Math.cos(ex * 0.5);
  const sx = Math.sin(ex * 0.5);
  const cy = Math.cos(ey * 0.5);
  const sy = Math.sin(ey * 0.5);
  const cz = Math.cos(ez * 0.5);
  const sz = Math.sin(ez * 0.5);

  return [
    sx * cy * cz + cx * sy * sz,
    cx * sy * cz - sx * cy * sz,
    cx * cy * sz + sx * sy * cz,
    cx * cy * cz - sx * sy * sz
  ];
}

const worker = new MatterPhysicsWorker();

self.onmessage = async ({data}) => {
  const {cmd, id} = data;

  switch(cmd) {
    case 'init': {
      await worker.init(data.options);
      self.postMessage({cmd: 'ready', id});
      break;
    }
    case 'addBody':
      console.log('worker add body');
      const idx = worker.addBody(data.pOptions);
      self.postMessage({cmd: 'bodyAdded', id, idx, sab: worker._sab});
      break;
    case 'step':
      worker.step();
      if(!worker._useSAB && worker._snapshot) {
        const copy = worker._snapshot.slice();
        self.postMessage({cmd: 'snapshot', snap: copy}, [copy.buffer]);
      }
      break;
    case 'setKinematicTransform':
      worker.setKinematicTransform(data.idx, data.x, data.y, data.z);
      break;
    case 'applyImpulse':
      worker.applyImpulse(data.idx, data.x, data.y, data.z);
      break;
    case 'applyTorque':
      worker.applyTorque(data.idx, data.x, data.y, data.z);
      break;
    case 'setLinearVelocity':
      worker.setLinearVelocity(data.idx, data.x, data.y, data.z);
      break;
    case 'setBodyAngularVelocity':
      worker.setBodyAngularVelocity(data.idx, data.x, data.y, data.z);
      break;
    case 'setGravity':
      worker.setGravity(data.x, data.y, data.z);
      break;
    case 'setGravityScale':
      worker.setGravityScale(data.idx, data.scale);
      break;
    case 'setFriction':
      worker.setFriction(data.idx, data.s);
      break;
    case 'setRestitution':
      worker.setRestitution(data.idx, data.s);
      break;
    case 'setDamping':
      worker.setDamping(data.idx, data.l, data.a);
      break;
    case 'setBodyTransform':
      worker.setBodyTransform(data.idx, data.x, data.y, data.z);
      break;
    case 'clearBody':
      worker.clearBody(data.idx);
      break;
    case 'activate':
      worker.activate(data.idx);
      break;
    case 'deactivate':
      worker.deactivate(data.idx);
      break;
    case 'removeRigidBody':
      worker.removeRigidBody(data.idx);
      break;
    case 'speedUpSimulation':
      worker.speedUpSimulation(data.value);
      break;
    case 'getPosition':
      const pos = worker.getPosition(data.idx);
      self.postMessage({cmd: 'getPosition', id, position: pos});
      break;
    case 'shootBody':
      worker.shootBody(data.idx, data.lx, data.ly, data.lz, data.ax, data.ay, data.az);
      break;
    default:
      console.warn(`Unknown command: ${cmd}`);
  }
};