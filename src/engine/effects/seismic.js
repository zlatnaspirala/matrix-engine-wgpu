import {mat4, vec3} from "wgpu-matrix";
import {GeometryFactory} from "../geometry-factory";

export const EarthquakePresets = {
  default: {
    latitude: 44.8,
    longitude: 20.46,
    magnitude: 5.0,
    speed: 0.3,
    waveCount: 4.0,
    waveSpacing: 0.15,
    waveWidth: 0.005,
    intensity: 2.5,
    epicenterIntensity: 5.0,
    epicenterRadius: 0.01,
    sphereScale: 1.0,
    displacement: 0.012,
    waveColor: [1.0, 0.16, 0.025],
    epicenterColor: [1.0, 0.75, 0.08],
    enabled: true,
  },
};

export class EarthquakeEffect {
  constructor(device, format, colorFormat, params = {}, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.colorFormat = colorFormat ?? format;
    const config = typeof params === "string" ? (EarthquakePresets[params] ?? EarthquakePresets.default) : params;
    const defaults = EarthquakePresets.default;
    this.latitude = config.latitude ?? defaults.latitude;
    this.longitude = config.longitude ?? defaults.longitude;
    this.magnitude = config.magnitude ?? defaults.magnitude;
    this.speed = config.speed ?? defaults.speed;
    this.blend = params.blend ?? {
      color: {srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add"},
      alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
    };
    this.waveCount = config.waveCount ?? defaults.waveCount;
    this.waveSpacing = config.waveSpacing ?? defaults.waveSpacing;
    this.waveWidth = config.waveWidth ?? defaults.waveWidth;
    this.intensity = config.intensity ?? defaults.intensity;
    this.epicenterIntensity = config.epicenterIntensity ?? defaults.epicenterIntensity;
    this.epicenterRadius = config.epicenterRadius ?? defaults.epicenterRadius;
    this.sphereScale = config.sphereScale ?? defaults.sphereScale;
    this.displacement = config.displacement ?? defaults.displacement;
    this.waveColor = config.waveColor ?? defaults.waveColor;
    this.epicenterColor = config.epicenterColor ?? defaults.epicenterColor;
    this.enabled = config.enabled ?? defaults.enabled;
    this.time = 0;
    this._epicenter = new Float32Array(4);
    this._params0 = new Float32Array(4);
    this._params1 = new Float32Array(4);
    this._waveColor = new Float32Array(4);
    this._epicenterColor = new Float32Array(4);
    this._uniformData = new Float32Array(40);
    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();
    this._initPipeline();
    if(config.useParentMesh) {
      this.insertGeometry(config.useParentMesh);
    } else {
      this.setGeometry("sphere", this.sphereScale, config.segments ?? 96);
    }
    this.currentGeometry = "sphere";
  }

  setScale(scale) {
    this.sphereScale = scale;
    this.setGeometry(this.currentGeometry, this.sphereScale, 96);
  }

  updateData(data = {}) {
    if(data.latitude !== undefined) {this.latitude = Number(data.latitude);}
    if(data.longitude !== undefined) {this.longitude = Number(data.longitude);}
    if(data.magnitude !== undefined) {this.magnitude = Number(data.magnitude);}
    if(data.speed !== undefined) {this.speed = Number(data.speed);}
    if(data.intensity !== undefined) {this.intensity = Number(data.intensity);}
    if(data.waveCount !== undefined) {this.waveCount = Number(data.waveCount);}
    if(data.waveSpacing !== undefined) {this.waveSpacing = Number(data.waveSpacing);}
    if(data.waveWidth !== undefined) {this.waveWidth = Number(data.waveWidth);}
    if(data.enabled !== undefined) {this.enabled = !!data.enabled;}
    if(data.lat !== undefined) {this.latitude = Number(data.lat);}
    if(data.lon !== undefined) {this.longitude = Number(data.lon);}
    if(data.lng !== undefined) {this.longitude = Number(data.lng);}
    return this;
  }

  setTarget(latitude, longitude) {
    this.latitude = Number(latitude);
    this.longitude = Number(longitude);
    return this;
  }

  setMagnitude(magnitude) {
    this.magnitude = Number(magnitude);
    return this;
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
    return this;
  }

  setGeometry(type, size = 1, segments = 96) {
    const geo = GeometryFactory.create(type, size, segments);
    this.currentGeometry = type;
    this.vertexBuffer = this._uploadVertex(geo.positions);
    this.uvBuffer = this._uploadVertex(geo.uvs);
    const byteLen = geo.indices.byteLength;
    const paddedByteLen = Math.ceil(byteLen / 4) * 4;
    this.indexBuffer = this.device.createBuffer({size: paddedByteLen, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, });
    if(byteLen % 4 !== 0) {
      const paddedData = new Uint8Array(paddedByteLen);
      paddedData.set(new Uint8Array(geo.indices.buffer, geo.indices.byteOffset, byteLen));
      this.device.queue.writeBuffer(this.indexBuffer, 0, paddedData);
    } else {
      this.device.queue.writeBuffer(this.indexBuffer, 0, geo.indices);
    }
    this.indexCount = geo.indices.length;
    this.indexFormat = geo.indices instanceof Uint16Array ? "uint16" : "uint32";
  }

  insertGeometry(mesh) {
    this.vertexBuffer = mesh.vertexBuffer;
    this.uvBuffer = mesh.vertexTexCoordsBuffer;
    this.indexBuffer = mesh.indexBuffer;
    this.indexCount = mesh.indexCount;
    this.indexFormat = 'uint16';
  }

  _uploadVertex(data) {
    const buffer = this.device.createBuffer({size: data.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(buffer, 0, data);
    return buffer;
  }

  _initPipeline() {
    this.modelBuffer = this.device.createBuffer({size: 160, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: "uniform"}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "uniform"}}
      ],
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}}
      ]
    });
    const shaderModule = this.device.createShaderModule({code: earthquakeEffectShader});
    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      }),
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]},
          {arrayStride: 8, attributes: [{shaderLocation: 1, offset: 0, format: "float32x2", }]},
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [
          {
            format: this.colorFormat,
            blend: this.blend
          },
          {format: "rgba16float"}, {format: "rgba16float"}
        ]
      },
      primitive: {topology: "triangle-list", cullMode: "back", },
      depthStencil: {depthWriteEnabled: false, depthCompare: "greater", format: "depth24plus", },
    });
  }

  updateInstanceData(baseModelMatrix) {
    if(!this.enabled) {return;}
    this.time += 0.016;
    mat4.identity(this._localMatrix);
    mat4.identity(this._finalMatrix);
    mat4.scale(this._localMatrix, [this.sphereScale, this.sphereScale, this.sphereScale], this._localMatrix);
    mat4.multiply(baseModelMatrix, this._localMatrix, this._finalMatrix);
    // Calibration
    const lonOffset = -0.9;
    const lat = this.latitude * Math.PI / 180.0;
    // Negate the longitude to match your horizontally-inverted texture file
    const lon = -this.longitude * Math.PI / 180.0 -lonOffset;
    const cosLat = Math.cos(lat);
    this._epicenter[0] = cosLat * Math.sin(lon);
    this._epicenter[1] = Math.sin(lat);
    this._epicenter[2] = cosLat * Math.cos(lon);
    this._epicenter[3] = 0;
    const magnitude = Math.max(0.0, this.magnitude);
    const magnitudeStrength = Math.min(1.0, Math.max(0.15, magnitude / 8.0));
    const effectiveIntensity = this.intensity * (0.35 + magnitudeStrength * 1.65);
    const effectiveDisplacement = this.displacement * (0.4 + magnitudeStrength * 1.6);
    this._params0[0] = this.time;
    this._params0[1] = this.speed;
    this._params0[2] = magnitude;
    this._params0[3] = this.enabled ? 1.0 : 0.0;
    this._params1[0] = this.waveCount;
    this._params1[1] = this.waveSpacing;
    this._params1[2] = this.waveWidth;
    this._params1[3] = effectiveIntensity;
    this._uniformData.set(this._finalMatrix, 0);
    this._uniformData.set(this._params0, 16);
    this._uniformData.set(this._epicenter, 20);
    this._uniformData.set(this._params1, 24);
    this._uniformData[28] = effectiveDisplacement;
    this._uniformData[29] = this.epicenterRadius;
    this._uniformData[30] = this.epicenterIntensity * (0.4 + magnitudeStrength * 1.6);
    this._uniformData[31] = 0.0;
    this._uniformData[32] = this.waveColor[0];
    this._uniformData[33] = this.waveColor[1];
    this._uniformData[34] = this.waveColor[2];
    this._uniformData[35] = 1.0;
    this._uniformData[36] = this.epicenterColor[0];
    this._uniformData[37] = this.epicenterColor[1];
    this._uniformData[38] = this.epicenterColor[2];
    this._uniformData[39] = 1.0;
    this.device.queue.writeBuffer(this.modelBuffer, 0, this._uniformData);
  }

  draw(pass, viewProjMatrix) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, this.indexFormat);
    pass.drawIndexed(this.indexCount);
  }

  render(pass, mesh, viewProjMatrix) {
    if(!this.enabled) {return;}
    this.draw(pass, viewProjMatrix);
  }
}

export const earthquakeEffectShader = `
struct Camera {
  viewProj : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,
  params0 : vec4<f32>,
  epicenter : vec4<f32>,
  params1 : vec4<f32>,
  effect : vec4<f32>,
  waveColor : vec4<f32>,
  epicenterColor : vec4<f32>,
};

@group(0) @binding(1) var<uniform> modelData : ModelData;

struct VSIn {
  @location(0)
  position : vec3<f32>,
  @location(1)
  uv : vec2<f32>,
};

struct VSOut {
  @builtin(position)
  position : vec4<f32>,
  @location(0)
  uv : vec2<f32>,
  @location(1)
  worldNormal : vec3<f32>,
  @location(2)
  worldPos : vec3<f32>,
  @location(3)
  localDir : vec3<f32>,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  let correctedPosition = vec3<f32>(input.position.x, input.position.y, input.position.z);
  let surfaceDir = normalize(correctedPosition);
  let epicenter = normalize(modelData.epicenter.xyz);
  let cosineAngle = clamp(dot(surfaceDir, epicenter), -1.0, 1.0);
  let angularDistance = acos(cosineAngle);
  let time = modelData.params0.x;
  let speed = max(modelData.params0.y, 0.001);
  let magnitude = max(modelData.params0.z, 0.0);
  let waveCount = max(modelData.params1.x, 1.0);
  let spacing = max(modelData.params1.y, 0.001);
  let width = max(modelData.params1.z, 0.001);
  let magnitudeFactor = clamp(magnitude / 8.0, 0.0, 1.0);
  let travel = time * speed * (0.35 + magnitudeFactor * 0.65);
  let phase = angularDistance - travel;
  let wavePosition = phase / spacing;
  let distanceToWave = abs(fract(wavePosition + 0.5) - 0.5) * spacing;
  let ring = 1.0 - smoothstep(0.0, width, distanceToWave);
  let waveLimit = waveCount * spacing;
  let waveRange = smoothstep(waveLimit, max(waveLimit - spacing, 0.001), angularDistance);
  let maxEffectRadius = 0.6;
  let distanceFade = 1.0 - smoothstep(maxEffectRadius * 0.5, maxEffectRadius, angularDistance);
  let ringEnergy = ring * waveRange * distanceFade;
  let displacement = modelData.effect.x * ringEnergy * (0.35 + 0.65 * (1.0 - smoothstep(0.0, 3.14159265, angularDistance))) * (0.25 + magnitudeFactor * 0.75);
  let displacedPosition = input.position + surfaceDir * displacement;
  let worldPosition = modelData.model * vec4<f32>(displacedPosition, 1.0);

  let normalMatrix = mat3x3<f32>(
    modelData.model[0].xyz,
    modelData.model[1].xyz,
    modelData.model[2].xyz
  );

  output.position = camera.viewProj * worldPosition;
  output.worldNormal = normalize(normalMatrix * surfaceDir);
  output.worldPos = worldPosition.xyz;
  output.uv = input.uv;
  output.localDir = surfaceDir;

  return output;
}

struct FragOut {
  @location(0)
  color : vec4f,
  @location(1)
  normal : vec4f,
  @location(2)
  worldPos : vec4f,
};

@fragment
fn fsMain(input : VSOut) -> FragOut {
  let surfaceDir = normalize(input.localDir);
  let epicenter = normalize(modelData.epicenter.xyz);
  let cosineAngle = clamp(dot(surfaceDir, epicenter), -1.0, 1.0);
  let angularDistance = acos(cosineAngle);

  let time = modelData.params0.x;
  let speed = max(modelData.params0.y, 0.001);
  let magnitude = max(modelData.params0.z, 0.0);
  let waveCount = max(modelData.params1.x, 1.0);
  let spacing = max(modelData.params1.y, 0.001);
  let width = max(modelData.params1.z, 0.001);
  let magnitudeFactor = clamp(magnitude / 8.0, 0.0, 1.0);
  let travel = time * speed * (0.35 + magnitudeFactor * 0.65);
  let phase = angularDistance - travel;
  let wavePosition = phase / spacing;
  let distanceToWave = abs(fract(wavePosition + 0.5) - 0.5) * spacing;

  // fwidth-based AA: edge width follows screen-space derivative instead of a fixed angle width
  let aaWidth = max(fwidth(distanceToWave), 0.0008);
  let ring = 1.0 - smoothstep(width - aaWidth, width + aaWidth, distanceToWave);

  let waveLimit = waveCount * spacing;
  let waveRange = smoothstep(waveLimit, max(waveLimit - spacing, 0.001), angularDistance);

  let maxEffectRadius = 0.6;
  let distanceFade = 1.0 - smoothstep(maxEffectRadius * 0.5, maxEffectRadius, angularDistance);
  let distanceEnergy = 0.35 + 0.65 * (1.0 - smoothstep(0.0, 3.14159265, angularDistance));
  let epicenterRadius = max(modelData.effect.y, 0.001);
  let aaEpi = max(fwidth(angularDistance), 0.0008);
  let epicenterMask = 1.0 - smoothstep(epicenterRadius * 0.9 - aaEpi, epicenterRadius * 0.9 + aaEpi, angularDistance);
  let waveColor = modelData.waveColor.xyz;
  let epicenterColor = modelData.epicenterColor.xyz;
  let waveEnergy = ring * waveRange * distanceFade * distanceEnergy * modelData.params1.w;
  let waveContribution = waveColor * waveEnergy;
  let epicenterEnergy = epicenterMask * modelData.effect.z;
  let epicenterContribution = epicenterColor * epicenterEnergy;
  let halo = smoothstep(0.0, 1.0, ring) * 0.08 * distanceEnergy;
  let finalColor = waveContribution + epicenterContribution + waveColor * halo;
  let alpha = clamp(waveEnergy + epicenterEnergy + halo, 0.0, 1.0);
  return FragOut(
    vec4f(finalColor, alpha),
    vec4f(input.worldNormal, 0.0),
    vec4f(input.worldPos, 1.0)
  );
}`;