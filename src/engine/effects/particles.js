import {mat4, quat, vec3} from "wgpu-matrix";
import {randomFloatFromTo, randomIntFromTo} from "../utils";
import {shredderEffectInstance} from "../../shaders/particles/particles.wgsl";

export const ACTION_PRESETS = {
  shredder: {
    motion: 'stream',
    spawnMode: 'continuous',

    lifeRange: [2.0, 4.0],
    scaleRange: [0.04, 0.12],

    angularVelRange: [4, 10],

    gravity: -0.4,
    drag: 0.2,

    emitterRadius: 0.25,
    spread: 1.5,
    noiseStrength: 1.2,

    colorRamp: [
      {t: 0.0, c: [0.30, 0.10, 1.00]},
      {t: 0.4, c: [0.80, 0.20, 1.00]},
      {t: 1.0, c: [1.00, 0.80, 0.30]},
    ],

    alphaRamp: [
      {t: 0, a: 0},
      {t: 0.1, a: 1},
      {t: 0.9, a: 1},
      {t: 1, a: 0},
    ]
  },
  orbitMagic: {
    motion: 'orbit',
    spawnMode: 'continuous',

    lifeRange: [6, 10],
    scaleRange: [0.05, 0.12],

    radiusRange: [0.5, 3.5],
    orbitSpeedRange: [0.5, 3.0],
    heightRange: [-1.0, 1.0],

    wobble: 0.35,

    angularVelRange: [0, 3],

    colorRamp: [
      {t: 0, c: [0.2, 0.8, 1]},
      {t: 1, c: [1, 1, 1]},
    ],

    alphaRamp: [
      {t: 0, a: 1},
      {t: 1, a: 1},
    ]
  },
  vortex: {
    motion: 'vortex',
    spawnMode: 'continuous',

    lifeRange: [4, 8],
    scaleRange: [0.04, 0.10],

    radiusRange: [1.5, 5.0],
    spinSpeed: 5.0,
    inwardSpeed: 0.5,

    angularVelRange: [2, 6],

    colorRamp: [
      {t: 0, c: [0.3, 0.1, 1]},
      {t: 1, c: [1, 0.4, 0.2]},
    ],

    alphaRamp: [
      {t: 0, a: 1},
      {t: 1, a: 0},
    ]
  },
  spiral: {
    motion: 'spiral',
    spawnMode: 'continuous',

    lifeRange: [3, 6],
    scaleRange: [0.04, 0.10],

    radiusRange: [0.2, 2.5],
    orbitSpeedRange: [2, 6],
    height: 5,
    expandSpeed: 0.15,

    angularVelRange: [3, 8],

    colorRamp: [
      {t: 0, c: [1, 0.5, 0.2]},
      {t: 1, c: [1, 1, 0.2]},
    ],

    alphaRamp: [
      {t: 0, a: 1},
      {t: 1, a: 0},
    ]
  },
  birds: {
    motion: 'flock',
    spawnMode: 'continuous',

    lifeRange: [5, 9],
    scaleRange: [0.15, 0.28],

    speedRange: [1.5, 2.5],

    drag: 0.02,

    flapFreq: [2, 4],
    flapAmount: 0.35,

    turnRate: 1.2,

    separationRadius: 0.8,
    cohesionStrength: 0.4,

    colorRamp: [
      {t: 0, c: [0.08, 0.08, 0.10]},
      {t: 1, c: [0.12, 0.10, 0.09]},
    ],

    alphaRamp: [
      {t: 0, a: 1},
      {t: 1, a: 0},
    ]
  },
  bloodSplat: {
    motion: 'burst',
    spawnMode: 'burst',
    lifeRange: [0.4, 0.9],
    scaleRange: [0.02, 0.09],
    gravity: -9.8,
    drag: 2.2,
    speedRange: [1.5, 5],
    spreadAngle: Math.PI * 0.6,
    angularVelRange: [4, 10],
    colorRamp: [
      {t: 0, c: [1, 0.05, 0.05]},
      {t: 0.4, c: [0.6, 0.02, 0.02]},
      {t: 1, c: [0.15, 0.02, 0.02]},
    ],
    alphaRamp: [
      {t: 0, a: 1},
      {t: 0.7, a: 1},
      {t: 1, a: 0},
    ]
  }
};

export function sampleRamp(ramp, t) {
  if(t <= ramp[0].t) return ramp[0];
  for(let i = 1;i < ramp.length;i++) {
    if(t <= ramp[i].t) {
      const a = ramp[i - 1], b = ramp[i];
      const span = b.t - a.t || 1;
      const f = (t - a.t) / span;
      if(a.c) return {c: lerp3(a.c, b.c, f)};
      return {a: a.a + (b.a - a.a) * f};
    }
  }
  return ramp[ramp.length - 1];
}

function lerp3(a, b, f) {return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]}

function randomAxis() {
  let x = Math.random() * 2 - 1;
  let y = Math.random() * 2 - 1;
  let z = Math.random() * 2 - 1;
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

export class ParticleActionEmitter {
  constructor(device, format, maxShards = 800, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.time = 0;
    this.enabled = true;
    this.maxShards = maxShards;
    // mat4(16) + timeSpeed(4) + params(4) + tint(4)
    this.floatsPerInstance = 28;//28;
    this.instanceData = new Float32Array(maxShards * this.floatsPerInstance);
    this.cameraBuffer = cameraBuffer;
    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();
    this._rotMatrix = mat4.create();
    this._q = quat.create();
    // ...same buffer/pipeline setup as before...
    this.shards = [];
    for(let i = 0;i < maxShards;i++) {
      this.shards.push({
        pos: [0, 0, 0],
        vel: [0, 0, 0],
        axis: [0, 0, 1],
        angle: 0,
        angularVel: 0,
        scale: 0.1,
        baseScale: 0.1,
        color: [1, 1, 1],
        alpha: 0,
        age: 0,
        life: 1,
        radius: randomIntFromTo(1, 20),
        phase: 0,
        orbitSpeed: 1,
        height: 0,
        target: [0, 0, 0],
        bank: 0,
        scaleMod: 1,
        active: false,
        seed: Math.random() * 1000,
      });
    }
    this.pathFn = null;
    this.setAction('shredder');
    this._initPipeline();
  }

  _tetraGeometry() {
    // unit tetrahedron, non-indexed, flat per-face normals (4 tris x 3 verts)
    const a = [0, 0.6, 0], b = [-0.5, -0.3, 0.35], c = [0.5, -0.3, 0.35], d = [0, -0.3, -0.5];
    const faces = [[a, c, b], [a, b, d], [a, d, c], [b, c, d]];
    const positions = [], normals = [];
    for(const [p0, p1, p2] of faces) {
      const e1 = vec3.subtract(p1, p0), e2 = vec3.subtract(p2, p0);
      const n = vec3.normalize(vec3.cross(e1, e2));
      for(const p of [p0, p1, p2]) {positions.push(...p); normals.push(...n);}
    }
    return {positions: new Float32Array(positions), normals: new Float32Array(normals)};
  }

  _initPipeline() {
    const {positions, normals} = this._tetraGeometry();
    this.vertexCount = positions.length / 3;
    this.posBuffer = this.device.createBuffer({size: positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.posBuffer, 0, positions);
    this.normBuffer = this.device.createBuffer({size: normals.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.normBuffer, 0, normals);

    this.modelBuffer = this.device.createBuffer({
      label: 'shredder modelBuffer',
      size: this.maxShards * this.floatsPerInstance * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      label: 'shredder bindGroupLayout',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      label: 'shredder bindGroup',
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: shredderEffectInstance});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});
    this.pipeline = this.device.createRenderPipeline({
      label: 'shredder pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]},
          {arrayStride: 12, attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}]}
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [
          {format: this.format}, // opaque, no blend — solid debris
          {format: 'rgba16float'},
          {format: 'rgba16float'}
        ]
      },
      primitive: {topology: "triangle-list", cullMode: "back"},
      depthStencil: {depthWriteEnabled: true, depthCompare: "less", format: "depth24plus"}
    });
  }

  setAction(name, overrides = {}) {
    const preset = ACTION_PRESETS[name];
    if(!preset) {console.warn(`Unknown action "${name}"`); return;}
    this.action = {...preset, ...overrides};
    this.actionName = name;
    if(this.action.spawnMode === 'continuous') {
      for(const s of this.shards) this._respawn(s, true);
    } else {
      for(const s of this.shards) s.active = false;
    }
  }

  burst(origin, dir = [0, 1, 0], count = this.maxShards) {
    let spawned = 0;
    for(const s of this.shards) {
      if(spawned >= count) break;
      if(s.active) continue;
      this._respawn(s, false, origin, dir);
      spawned++;
    }
  }

  setPath(fn) {this.pathFn = fn;}

  _respawn(s, staggerAge, origin = [0, 0, 0], dir = [0, 1, 0]) {
    const a = this.action;
    s.life = randomFloatFromTo(a.lifeRange[0], a.lifeRange[1]);
    s.age = staggerAge ? Math.random() * s.life : 0;
    s.baseScale = randomFloatFromTo(a.scaleRange[0], a.scaleRange[1]);
    s.angularVel = randomFloatFromTo(a.angularVelRange[0], a.angularVelRange[1]) * (Math.random() < 0.5 ? -1 : 1);
    s.active = true;
    s.axis = randomAxis();
    switch(a.motion) {
      case 'burst':
        const spread = a.spreadAngle;
        const speed = randomFloatFromTo(a.speedRange[0], a.speedRange[1]);
        const [dx, dy, dz] = randomConeDir(dir, spread);
        s.pos = [...origin];
        s.vel = [dx * speed, dy * speed, dz * speed];
        break;
      case 'flock':
        s.pos = [randomFloatFromTo(-3, 3), randomFloatFromTo(1, 3), randomFloatFromTo(-3, 3)];
        const s2 = randomFloatFromTo(a.speedRange[0], a.speedRange[1]);
        s.vel = [s2, 0, 0];
        break;
      case 'orbit':
        s.pos = [0, 0, 0];
        s.vel = [0, 0, 0];
        s.radius =
          randomFloatFromTo(a.radiusRange[0], a.radiusRange[1]);
        s.phase = Math.random() * Math.PI * 2;
        s.orbitSpeed = randomFloatFromTo(a.orbitSpeedRange[0], a.orbitSpeedRange[1]);
        s.height = randomFloatFromTo(a.heightRange[0], a.heightRange[1]);
        break;
      case 'spiral':

        s.pos = [0, 0, 0];
        s.vel = [0, 0, 0];

        s.radius =
          randomFloatFromTo(
            a.radiusRange[0],
            a.radiusRange[1]
          );

        s.phase =
          Math.random() * Math.PI * 2;

        s.orbitSpeed =
          randomFloatFromTo(
            a.orbitSpeedRange[0],
            a.orbitSpeedRange[1]
          );

        break;

      case 'vortex':
        s.pos = [0, 0, 0];
        s.vel = [0, 0, 0];
        s.radius = randomFloatFromTo(a.radiusRange[0], a.radiusRange[1]);
        s.phase = Math.random() * Math.PI * 2;
        s.orbitSpeed = randomFloatFromTo(2, 6);
        break;
      case 'stream':
        s.pos = [
          randomFloatFromTo(-a.emitterRadius, a.emitterRadius),
          randomFloatFromTo(-a.emitterRadius, a.emitterRadius),
          randomFloatFromTo(-a.emitterRadius, a.emitterRadius),
        ];
        s.vel = [
          randomFloatFromTo(-a.spread, a.spread),
          randomFloatFromTo(0, a.spread),
          randomFloatFromTo(-a.spread, a.spread),
        ];
        break;
      default:
        s.pos = [0, 0, 0];
        s.vel = [0, 0, 0];
        break;
    }
  }

  _updateMotion(s, dt) {
    const a = this.action;
    const t = s.age / s.life;
    switch(a.motion) {
      case 'path': {
        if(!this.pathFn) break;
        const base = this.pathFn(t);
        const jr = a.jitterRadius || 0;
        s.pos[0] = base[0] + Math.sin(s.seed + this.time * 1.7) * jr;
        s.pos[1] = base[1] + Math.cos(s.seed * 1.3 + this.time * 1.3) * jr;
        s.pos[2] = base[2];
        break;
      }

      case 'burst': {
        s.vel[1] += a.gravity * dt;
        const dragF = Math.max(0, 1 - a.drag * dt);
        s.vel[0] *= dragF;
        s.vel[1] *= dragF;
        s.vel[2] *= dragF;
        s.pos[0] += s.vel[0] * dt;
        s.pos[1] += s.vel[1] * dt;
        s.pos[2] += s.vel[2] * dt;
        s.scaleMod = 1 + t * 1.5;
        break;
      }
      case 'stream': {
        s.vel[1] += (a.gravity || 0) * dt;
        const dragF = Math.max(0, 1 - (a.drag || 0) * dt);
        s.vel[0] *= dragF;
        s.vel[1] *= dragF;
        s.vel[2] *= dragF;
        const noise = a.noiseStrength || 0;
        s.vel[0] += Math.sin(this.time * 5 + s.seed) * noise * dt;
        s.vel[1] += Math.cos(this.time * 4 + s.seed) * noise * dt;
        s.vel[2] += Math.sin(this.time * 6 + s.seed) * noise * dt;
        s.pos[0] += s.vel[0] * dt;
        s.pos[1] += s.vel[1] * dt;
        s.pos[2] += s.vel[2] * dt;
        break;
      }
      case 'flock': {
        let sepX = 0;
        let sepY = 0;
        let sepZ = 0;
        for(const o of this.shards) {
          if(o === s || !o.active)
            continue;
          const dx = s.pos[0] - o.pos[0];
          const dy = s.pos[1] - o.pos[1];
          const dz = s.pos[2] - o.pos[2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if(d2 > 0 && d2 < a.separationRadius * a.separationRadius) {
            sepX += dx / d2;
            sepY += dy / d2;
            sepZ += dz / d2;
          }
        }
        s.vel[0] += (sepX - s.vel[0] * a.drag) * dt;
        s.vel[1] += (
          sepY +
          Math.sin(this.time * a.flapFreq[0] + s.seed) * a.flapAmount -
          s.vel[1] * a.drag
        ) * dt;
        s.vel[2] += (sepZ - s.vel[2] * a.drag) * dt;
        s.pos[0] += s.vel[0] * dt;
        s.pos[1] += s.vel[1] * dt;
        s.pos[2] += s.vel[2] * dt;
        s.bank = Math.atan2(s.vel[2], s.vel[0]);
        break;
      }
      case 'orbit': {
        const radius = s.radius ?? 1;
        const speed = s.orbitSpeed ?? 1;
        s.phase += speed * dt;
        s.pos[0] = Math.cos(s.phase) * radius;
        s.pos[2] = Math.sin(s.phase) * radius;
        s.pos[1] =
          (s.height ?? 0) +
          Math.sin(s.phase * 2 + s.seed) * 0.25;
        break;
      }
      case 'spiral': {
        // s.phase += (s.orbitSpeed ?? 1) * dt;
        // s.pos[0] = Math.cos(s.phase) * s.radius;
        // s.pos[2] = Math.sin(s.phase) * s.radius;
        // s.pos[1] += (a.riseSpeed ?? 1) * dt;
        s.phase += s.orbitSpeed * dt;
        s.pos[0] = Math.cos(s.phase) * s.radius;
        s.pos[2] = Math.sin(s.phase) * s.radius;
        // Use lifetime as the vertical coordinate
        s.pos[1] = t * (a.height || 3.0);
        break;
      }
      case 'vortex': {
        s.phase += (a.spinSpeed ?? 4) * dt;
        s.radius -= (a.inwardSpeed ?? 0.5) * dt;
        if(s.radius < 0.05)
          s.radius = a.maxRadius || 2;
        s.pos[0] = Math.cos(s.phase) * s.radius;
        s.pos[2] = Math.sin(s.phase) * s.radius;
        break;
      }
      case 'fountain': {
        s.vel[1] += (a.gravity || -9.81) * dt;
        s.pos[0] += s.vel[0] * dt;
        s.pos[1] += s.vel[1] * dt;
        s.pos[2] += s.vel[2] * dt;
        break;
      }
      case 'wander': {
        const n = a.noiseStrength || 1;
        s.vel[0] += (Math.random() - 0.5) * n * dt;
        s.vel[1] += (Math.random() - 0.5) * n * dt;
        s.vel[2] += (Math.random() - 0.5) * n * dt;
        const drag = 1 - (a.drag || 0.1) * dt;
        s.vel[0] *= drag;
        s.vel[1] *= drag;
        s.vel[2] *= drag;
        s.pos[0] += s.vel[0] * dt;
        s.pos[1] += s.vel[1] * dt;
        s.pos[2] += s.vel[2] * dt;
        break;
      }
      case 'gravity': {
        const center = a.center || [0, 0, 0];
        let dx = center[0] - s.pos[0];
        let dy = center[1] - s.pos[1];
        let dz = center[2] - s.pos[2];
        const len = Math.hypot(dx, dy, dz) + 0.0001;
        dx /= len;
        dy /= len;
        dz /= len;
        const g = a.gravityStrength || 2;
        s.vel[0] += dx * g * dt;
        s.vel[1] += dy * g * dt;
        s.vel[2] += dz * g * dt;
        s.pos[0] += s.vel[0] * dt;
        s.pos[1] += s.vel[1] * dt;
        s.pos[2] += s.vel[2] * dt;
        break;
      }
      case 'bounce': {
        const limit = a.bounds || 3;
        s.pos[0] += s.vel[0] * dt;
        s.pos[1] += s.vel[1] * dt;
        s.pos[2] += s.vel[2] * dt;
        if(Math.abs(s.pos[0]) > limit) s.vel[0] *= -1;
        if(Math.abs(s.pos[1]) > limit) s.vel[1] *= -1;
        if(Math.abs(s.pos[2]) > limit) s.vel[2] *= -1;
        break;
      }
      default:
        break;
    }
  }

  updateInstanceData = (baseModelMatrix, dt = 0.016) => {
    const a = this.action;
    const floats = this.floatsPerInstance;
    for(let i = 0;i < this.shards.length;i++) {
      const s = this.shards[i];
      const off = i * floats;
      if(!s.active) {
        this.instanceData.fill(0, off, off + floats);
        continue;
      }
      s.age += dt;
      if(s.age >= s.life) {
        if(a.spawnMode === 'continuous') this._respawn(s, false);
        else {s.active = false; this.instanceData.fill(0, off, off + floats); continue;}
      }
      this._updateMotion(s, dt);
      s.angle += s.angularVel * dt;
      const t = Math.min(s.age / s.life, 1);
      const colorStop = sampleRamp(a.colorRamp, t);
      const alphaStop = sampleRamp(a.alphaRamp, t);
      if(colorStop.c) s.color = colorStop.c;
      s.alpha = alphaStop.a ?? s.alpha;
      const finalScale = s.baseScale * (s.scaleMod ?? 1) * s.alpha;
      quat.fromAxisAngle(s.axis, s.angle, this._q);
      mat4.fromQuat(this._q, this._rotMatrix);
      mat4.identity(this._localMatrix);
      mat4.translate(this._localMatrix, s.pos, this._localMatrix);
      mat4.multiply(this._localMatrix, this._rotMatrix, this._localMatrix);
      mat4.scale(this._localMatrix, [finalScale, finalScale, finalScale], this._localMatrix);
      mat4.identity(this._finalMatrix);
      mat4.multiply(baseModelMatrix, this._localMatrix, this._finalMatrix);
      this.instanceData.set(this._finalMatrix, off);
      this.instanceData[off + 16] = s.age;
      this.instanceData[off + 17] = s.life;
      this.instanceData[off + 18] = 0.0; 
      this.instanceData[off + 19] = 0.0; 
      this.instanceData[off + 20] = s.alpha;
      this.instanceData[off + 21] = t;
      this.instanceData[off + 22] = 0.0; 
      this.instanceData[off + 23] = 0.0; 
      this.instanceData[off + 24] = s.color[0];
      this.instanceData[off + 25] = s.color[1];
      this.instanceData[off + 26] = s.color[2];
      this.instanceData[off + 27] = 1.0;
    }
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData);
  }

  render(pass, mesh, viewProjMatrix, dt = 0.016) {
    this._dt = dt;
    this.time += dt;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.posBuffer);
    pass.setVertexBuffer(1, this.normBuffer);
    pass.draw(this.vertexCount, this.shards.length);
  }
}

function randomConeDir(dir, spread) {
  const theta = Math.random() * spread;
  const phi = Math.random() * Math.PI * 2;
  const [dx, dy, dz] = dir;
  // build orthonormal basis around dir, then perturb by theta/phi — standard cone sample
  let up = Math.abs(dy) < 0.99 ? [0, 1, 0] : [1, 0, 0];
  const right = vec3.normalize(vec3.cross(up, dir));
  const fwd = vec3.cross(dir, right);
  const sinT = Math.sin(theta);
  return [
    dx * Math.cos(theta) + (right[0] * Math.cos(phi) + fwd[0] * Math.sin(phi)) * sinT,
    dy * Math.cos(theta) + (right[1] * Math.cos(phi) + fwd[1] * Math.sin(phi)) * sinT,
    dz * Math.cos(theta) + (right[2] * Math.cos(phi) + fwd[2] * Math.sin(phi)) * sinT,
  ];
}