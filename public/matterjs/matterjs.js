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
    this.TUNE = 0.005;
    this.kinematicTargets = new Map();
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
    this.engine = this.Engine.create({enableSleeping: true});
    this.engine.world.gravity.y = this.options.gravity;

    Matter.Events.on(this.engine, 'beforeUpdate', () => {
      this.tickKinematic();
    });

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

    // Convert ground size to Matter pixel space using the same TUNE logic
    // We divide by TUNE to map world units to Matter pixels
    const width = this.options.roundDimension / this.TUNE;
    const height = this.options.roundDimension / 4; // / this.TUNE;

    const ground = this.Bodies.rectangle(
      0,
      matterY, // Ensure this offset aligns with your render origin
      width,
      height,
      {
        isStatic: true,
        name: 'ground',
        friction: 0.3,
        restitution: 0.1
      }
    );

    this.World.add(this.engine.world, ground);
    this.rigidBodies.push(ground);

    // Keep your buffer allocation logic
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

    // convert beast world units → Matter pixel space
    const mx = (position.x || 0) / this.TUNE;
    const my = -(position.y || 0) / this.TUNE;  // flip Y
    const sw = (scale[0]) / this.TUNE * 2;
    const sh = (scale[1]) / this.TUNE * 2;

    let body = null;


    console.log('matter sw', scale[0] / this.TUNE, 'sh', scale[1] / this.TUNE);

    try {
      switch(geometry) {
        case 'Sphere':
          body = this.Bodies.circle(mx, my, sw * 0.5, {...rest, name});
          break;
        case 'Cube':
        case 'Box':
          body = this.Bodies.rectangle(mx, my, sw, sh, {...rest, name});
          break;
        case 'Polygon':
          if(pOptions.vertices) {
            body = this.Bodies.polygon(mx, my, pOptions.vertices.length / 2, sw * 0.5, {...rest, name});
          } else {
            body = this.Bodies.rectangle(mx, my, sw, sh, {...rest, name});
          }
          break;
        case 'ConvexHull':
        case 'BvhMesh':
          if(pOptions.vertices) {
            const verts = [];
            for(let i = 0;i < pOptions.vertices.length;i += 3) {
              verts.push({
                x: pOptions.vertices[i] * (scale[0] || 1) / this.TUNE,
                y: pOptions.vertices[i + 1] * (scale[1] || 1) / this.TUNE
              });
            }
            body = this.Bodies.rectangle(mx, my, sw, sh, {...rest, name});
          }
          break;
        default:
          console.warn(`Geometry ${geometry} not supported, using rectangle`);
          body = this.Bodies.rectangle(mx, my, sw, sh, {...rest, name});
      }
    } catch(e) {
      console.error(`Failed to create body ${geometry}:`, e);
      return -1;
    }

    if(!body) return -1;
    if(pOptions.sensor) body.isSensor = true;
    body.isKinematic = pOptions.state === 4 || pOptions.kinematic;
    if(body.isKinematic) {
      body.isStatic = true;
      body.label = 'kinematic';
    } else if(mass > 0) {
      this.Body.setMass(body, mass);
    } else {
      body.isStatic = true;
    }

    this.World.add(this.engine.world, body);
    this.rigidBodies.push(body);
    this._allocBuffer(this.rigidBodies.length);

    const idx = this.rigidBodies.length - 1;
    this.bodyMap.set(name, idx);

    if(this._snapshot) {
      const base = idx * FLOATS_PER_BODY;
      this._snapshot[base + 0] = body.position.x * this.TUNE;
      this._snapshot[base + 1] = -body.position.y * this.TUNE;  // flip back
      this._snapshot[base + 2] = 0;
      const quat = _eulerToQuat(0, 0, body.angle);
      this._snapshot[base + 3] = quat[0];
      this._snapshot[base + 4] = quat[1];
      this._snapshot[base + 5] = quat[2];
      this._snapshot[base + 6] = quat[3];
      this._snapshot[base + 7] = 1;
    }

    return idx;
  }

  tickKinematic() {
    for(const [idx, target] of this.kinematicTargets) {
      const body = this.rigidBodies[idx];
      if(!body) {this.kinematicTargets.delete(idx); continue;}

      const {tx, ty, lerpFactor} = target;
      const prevX = body.position.x;
      const prevY = body.position.y;

      const nextX = prevX + (tx - prevX) * lerpFactor;
      const nextY = prevY + (ty - prevY) * lerpFactor;

      // unlock → move → relock
      this.Body.setStatic(body, false);
      this.Body.setPosition(body, {x: nextX, y: nextY});
      this.Body.setVelocity(body, {x: nextX - prevX, y: nextY - prevY});
      this.Body.setStatic(body, true);
    }
  }

  setKinematicTransform(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const mx = x / this.TUNE;
    const my = -(y / this.TUNE);
    // const mx = x;
    // const my = y;
    // console.log('in worker X:', mx)
    // console.log('in worker Y:', my)
    this.Body.setPosition(body, {x: mx, y: my});
    // Set velocity to 0 immediately after move to stop it from "drifting"
    this.Body.setVelocity(body, {x: 0, y: 0});
    this.Body.setAngularVelocity(body, 0);
  }

  // implement for other later !
  // Worker logic
  // Keep track of target positions in a Map: targetPositions.set(idx, {x, y, z})
  setKinematicInterpolate(idx, targetX, targetY, targetZ = 0, lerpFactor = 0.1) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.kinematicTargets.set(idx, {
      tx: targetX / this.TUNE,
      ty: -(targetY / this.TUNE),
      lerpFactor
    });
  }

  //   setKinematicInterpolate(idx, targetX, targetY, targetZ , lerpFactor = 0.1) {
  //   const body = this.rigidBodies[idx];
  //   if (!body) return;

  //   const tx = targetX / this.TUNE;
  //   const ty = -(targetY / this.TUNE);
  //   const pos = body.position;

  //   // Instead of lerp (percentage), use move_toward (fixed step speed)
  //   const dx = tx - pos.x;
  //   const dy = ty - pos.y;
  //   const dist = Math.sqrt(dx * dx + dy * dy);

  //   // Define a maximum speed for your platform
  //   const maxSpeed = 0.5; 

  //   if (dist > 0.001) {
  //     const moveStep = Math.min(dist, maxSpeed);
  //     const ratio = moveStep / dist;
  //     const nextX = pos.x + dx * ratio;
  //     const nextY = pos.y + dy * ratio;

  //     this.Body.setPosition(body, {x: nextX, y: nextY});
  //     // Velocity is handled automatically by the engine's 
  //     // collision solver when you update position on a kinematic body
  //   }
  // }

  applyImpulse(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.applyForce(body, body.position, {x, y: -y});
  }

  applyTorque(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.rotate(body, z);
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

  getPosition(idx, msgID) {
    const body = this.rigidBodies[idx];
    if(!body) {
      self.postMessage({cmd: 'getPosition', id: msgID, position: null});
      return;
    }
    const pos = body.position;
    self.postMessage({
      cmd: 'getPosition',
      id: msgID,
      position: {
        x: pos.x,
        y: pos.y,
        z: 0
      }
    });
  }

  shootBody(idx, lx, ly, lz, ax, ay, az) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.Body.setVelocity(body, {x: lx, y: ly});
    body.angularVelocity = az;
  }

  isSleeping(idx, msgID) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    if(body.isSleeping) {
      console.log("The object is asleep and stationary.");
      self.postMessage({cmd: 'isSleeping', id: msgID, isSleeping: true});
    } else {
      console.log("The object is not asleep and stationary.");
      self.postMessage({cmd: 'isSleeping', id: msgID, isSleeping: false});
    }
  }

  //   Matter.Events.on(engine, 'sleepStart', (event) => {
  //     event.source.bodies.forEach(body => {
  //         if (body === myPinball) {
  //             console.log("Pinball has entered sleep state.");
  //         }
  //     });
  // });
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
    case 'setKinematicTransform2':
      // Loop through the data.count to process all batched updates
      for(let i = 0;i < data.count;i++) {
        const idx = data.idx[i];
        const x = data.pos[i * 3 + 0];
        const y = data.pos[i * 3 + 1];
        // const z = data.pos[i * 3 + 2] / this.TUNE;
        // Call the logic to actually move the body
        worker.setKinematicTransform(idx, x, y, 0);
      }
      break;
    case 'applyImpulse': worker.applyImpulse(data.idx, data.x, data.y, data.z); break;
    case 'applyTorque': worker.applyTorque(data.idx, data.x, data.y, data.z); break;
    case 'setLinearVelocity': worker.setLinearVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setBodyAngularVelocity': worker.setBodyAngularVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setGravity': worker.setGravity(data.x, data.y, data.z); break;
    case 'setGravityScale': worker.setGravityScale(data.idx, data.scale); break;
    case 'setFriction': worker.setFriction(data.idx, data.s); break;
    case 'setRestitution': worker.setRestitution(data.idx, data.s); break;
    case 'setDamping': worker.setDamping(data.idx, data.l, data.a); break;
    case 'setBodyTransform': worker.setBodyTransform(data.idx, data.x, data.y, data.z); break;
    case 'clearBody': worker.clearBody(data.idx); break;
    case 'activate': worker.activate(data.idx); break;
    case 'deactivate': worker.deactivate(data.idx); break;
    case 'removeRigidBody': worker.removeRigidBody(data.idx); break;
    case 'speedUpSimulation': worker.speedUpSimulation(data.value); break;
    case 'getPosition': worker.getPosition(data.idx, data.id); break;
    case 'shootBody': worker.shootBody(data.idx, data.lx, data.ly, data.lz, data.ax, data.ay, data.az); break;
    case 'isSleeping': worker.isSleeping(data.idx, data.id); break;
    case 'setKinematicInterpolate': worker.setKinematicInterpolate(data.idx, data.targetX, data.targetY, data.targetZ, data.lerpFactor = 0.1); break;
    default:
      console.warn(`Unknown command: ${cmd}`);
  }
};