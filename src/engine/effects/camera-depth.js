// DepthWebcamVoxelEffect.js
//
// Webcam-driven voxel heightfield effect for matrix-engine-wgpu.
// Samples the live webcam feed each frame (via GPUExternalTexture), converts
// luminance -> per-cell height in a compute pass, then instance-draws a unit
// cube mesh across a grid, offsetting each instance's Y by its sampled height.
//
// Assumption: no hardware depth camera is assumed. If you have a real depth
// source (WebXR depth API, RealSense, etc.) replace `_dispatchHeightCompute`'s
// sample source — everything else (buffers, render pipeline, instancing)
// stays the same since it just reads a `f32` height per cell from storage.
//
// Follows engine conventions:
//   - effect.render(pass, mesh, viewProjMatrix, dt)
//   - effect.updateInstanceData(baseModelMatrix)
//   - deferred G-buffer, MRT normal/worldPos as rgba16float
//   - wgpu-matrix for CPU-side math
//   - storage buffers for instancing
//
// The height/color compute pass is self-contained: it uses its own command
// encoder and submits immediately inside render(), so it works with the
// plain 4-arg interface above without needing the engine's main encoder.

import {mat4} from 'wgpu-matrix';

const HEIGHT_WORKGROUP_SIZE = 8;

// -------------------- WGSL: compute pass (luminance -> height, rgb -> color) --------------------
const COMPUTE_SHADER = /* wgsl */ `
struct GridParams {
  cols: u32,
  rows: u32,
  heightScale: f32,
  smoothing: f32, // 0..1 temporal lerp factor
};

@group(0) @binding(0) var webcamTex: texture_2d<f32>;
@group(0) @binding(1) var webcamSampler: sampler;
@group(0) @binding(2) var<storage, read_write> cells: array<vec4<f32>>; // x=height, yzw=color
@group(0) @binding(3) var<uniform> params: GridParams;

fn luminance(c: vec3<f32>) -> f32 {
  return dot(c, vec3<f32>(0.299, 0.587, 0.114));
}

@compute @workgroup_size(${HEIGHT_WORKGROUP_SIZE}, ${HEIGHT_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.cols || gid.y >= params.rows) {
    return;
  }

  let uv = vec2<f32>(
    (f32(gid.x) + 0.5) / f32(params.cols),
    (f32(gid.y) + 0.5) / f32(params.rows)
  );

  // webcamTex is a plain sampled texture we refresh via copyExternalImageToTexture
  // each frame (see _dispatchHeightCompute) -- avoids texture_external's spotty
  // compute-stage support and single-submit lifetime.
  let sampleColor = textureSampleLevel(webcamTex, webcamSampler, uv, 0.0);
  let targetHeight = luminance(sampleColor.rgb) * params.heightScale;
  let targetF = vec4<f32>(targetHeight, sampleColor.rgb);

  let idx = gid.y * params.cols + gid.x;
  let prev = cells[idx];
  cells[idx] = mix(targetF, prev, params.smoothing);
}
`;

// -------------------- WGSL: render pass (instanced voxel cubes) --------------------
const RENDER_SHADER = /* wgsl */ `
struct SceneUniforms {
  viewProj: mat4x4<f32>,
  baseModel: mat4x4<f32>,
};

struct GridLayout {
  cols: u32,
  rows: u32,
  spacing: f32,
  voxelScale: f32,
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(0) @binding(1) var<uniform> grid: GridLayout;
@group(0) @binding(2) var<storage, read> cells: array<vec4<f32>>; // x=height, yzw=color

struct VertexIn {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
};

struct VertexOut {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) color: vec3<f32>,
};

@vertex
fn vs_main(vin: VertexIn, @builtin(instance_index) instanceIdx: u32) -> VertexOut {
  let col = instanceIdx % grid.cols;
  let row = instanceIdx / grid.cols;

  let cell = cells[instanceIdx];
  let h = cell.x;

  // Grid centered on origin in local XZ, height rises along local Y.
  let halfW = f32(grid.cols) * grid.spacing * 0.5;
  let halfD = f32(grid.rows) * grid.spacing * 0.5;

  let cellOffset = vec3<f32>(
    f32(col) * grid.spacing - halfW,
    0.0,
    f32(row) * grid.spacing - halfD
  );

  // Scale the unit cube: XZ footprint fixed, Y stretched to sampled height.
  let heightClamped = max(h, 0.01);
  let scaled = vec3<f32>(
    vin.position.x * grid.voxelScale,
    vin.position.y * heightClamped,
    vin.position.z * grid.voxelScale
  );

  // Sit each voxel on the grid plane (unit cube assumed centered at origin,
  // extents -0.5..0.5) so it grows upward from y=0 rather than from center.
  let sitOffset = vec3<f32>(0.0, heightClamped * 0.5, 0.0);

  let localPos = scaled + sitOffset + cellOffset;
  let worldPos4 = scene.baseModel * vec4<f32>(localPos, 1.0);

  var out: VertexOut;
  out.clipPos = scene.viewProj * worldPos4;
  out.worldPos = worldPos4.xyz;
  // Base model assumed uniformly scaled/no shear for this effect; if that
  // stops holding true, swap to the inverse-transpose normal matrix.
  out.normal = normalize((scene.baseModel * vec4<f32>(vin.normal, 0.0)).xyz);
  out.color = cell.yzw;
  return out;
}

struct FragOut {
  @location(0) color: vec4<f32>,
  @location(1) normal: vec4<f32>,
  @location(2) worldPos: vec4<f32>,
};

@fragment
fn fs_main(vin: VertexOut) -> FragOut {
  var out: FragOut;
  out.color = vec4<f32>(vin.color, 1.0);
  out.normal = vec4<f32>(vin.normal * 0.5 + 0.5, 1.0);
  out.worldPos = vec4<f32>(vin.worldPos, 1.0);
  return out;
}
`;

export class DepthWebcamVoxelEffect {
  /**
   * @param {GPUDevice} device
   * @param {object} opts
   * @param {number} [opts.cols=64]
   * @param {number} [opts.rows=48]
   * @param {number} [opts.spacing=0.08]      grid cell spacing, local units
   * @param {number} [opts.voxelScale=0.07]   voxel XZ footprint, local units
   * @param {number} [opts.heightScale=2.0]   max voxel height at luminance=1
   * @param {number} [opts.smoothing=0.6]     0 = snap to new frame, ~0.6-0.85 = smoothed
   * @param {GPUTextureFormat} [opts.normalFormat='rgba16float']
   * @param {GPUTextureFormat} [opts.worldPosFormat='rgba16float']
   * @param {GPUTextureFormat} [opts.colorFormat='rgba16float']  matches engine's
   *        3-target G-buffer MRT layout: [color, normal, worldPos]
   */
  constructor(device, opts = {}) {
    this.device = device;
    this.cols = opts.cols ?? 64;
    this.rows = opts.rows ?? 48;
    this.spacing = opts.spacing ?? 0.09;
    this.voxelScale = opts.voxelScale ?? 0.06;
    this.heightScale = opts.heightScale ?? 2.0;
    this.smoothing = opts.smoothing ?? 0.6;
    this.normalFormat = opts.normalFormat ?? 'rgba16float';
    this.worldPosFormat = opts.worldPosFormat ?? 'rgba16float';
    this.colorFormat = opts.colorFormat ?? 'rgba16float';

    this.instanceCount = this.cols * this.rows;

    this.video = null;
    this.videoReady = false;
    this._stream = null;

    this._baseModelMatrix = mat4.identity();

    this._buildStaticResources();
  }

  // -------------------- setup --------------------

  /**
   * Requests webcam access and starts the video element. Call once before
   * the first render() (render() will simply skip work until this resolves).
   * @param {MediaStreamConstraints} [constraints]
   */
  async initWebcam(constraints = {video: {width: 640, height: 480}, audio: false}) {
    this._stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = this._stream;

    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => resolve();
    });
    await this.video.play();

    this.videoWidth = this.video.videoWidth;
    this.videoHeight = this.video.videoHeight;
    this._createWebcamTexture();

    this.videoReady = true;
  }

  _createWebcamTexture() {
    const device = this.device;

    this.webcamTexture = device.createTexture({
      label: 'depthWebcamVoxel-webcamTex',
      size: [this.videoWidth, this.videoHeight],
      format: 'rgba8unorm',
      // RENDER_ATTACHMENT is required by copyExternalImageToTexture even
      // though we only ever read from this texture in the compute shader.
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Static bind group -- unlike texture_external, a regular texture's
    // view is stable across frames, so this only needs to be built once.
    this.computeBindGroup = device.createBindGroup({
      label: 'depthWebcamVoxel-computeBG',
      layout: this.computeBindGroupLayout,
      entries: [
        {binding: 0, resource: this.webcamTexture.createView()},
        {binding: 1, resource: this.webcamSampler},
        {binding: 2, resource: {buffer: this.heightsBuffer}},
        {binding: 3, resource: {buffer: this.computeParamsBuffer}},
      ],
    });
  }

  _buildStaticResources() {
    const device = this.device;

    // storage buffer: one vec4 per grid cell (x=height, yzw=webcam color)
    this.heightsBuffer = device.createBuffer({
      label: 'depthWebcamVoxel-heights',
      size: this.instanceCount * 4 * 4, // vec4<f32> = 16 bytes/cell
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // compute pass uniforms: cols, rows, heightScale, smoothing
    this.computeParamsBuffer = device.createBuffer({
      label: 'depthWebcamVoxel-computeParams',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.computeParamsBuffer,
      0,
      new Uint32Array([this.cols, this.rows])
    );
    device.queue.writeBuffer(
      this.computeParamsBuffer,
      8,
      new Float32Array([this.heightScale, this.smoothing])
    );

    this.webcamSampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    this.computeBindGroupLayout = device.createBindGroupLayout({
      label: 'depthWebcamVoxel-computeBGL',
      entries: [
        {binding: 0, visibility: GPUShaderStage.COMPUTE, texture: {sampleType: 'float'}},
        {binding: 1, visibility: GPUShaderStage.COMPUTE, sampler: {}},
        {binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'storage'}},
        {binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'uniform'}},
      ],
    });

    this.computePipeline = device.createComputePipeline({
      label: 'depthWebcamVoxel-computePipeline',
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.computeBindGroupLayout],
      }),
      compute: {
        module: device.createShaderModule({code: COMPUTE_SHADER}),
        entryPoint: 'main',
      },
    });

    // render pass uniforms: viewProj (mat4) + baseModel (mat4) = 128 bytes
    this.sceneUniformBuffer = device.createBuffer({
      label: 'depthWebcamVoxel-sceneUniforms',
      size: 128,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // grid layout uniforms: cols, rows, spacing, voxelScale
    this.gridLayoutBuffer = device.createBuffer({
      label: 'depthWebcamVoxel-gridLayout',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      this.gridLayoutBuffer,
      0,
      new Uint32Array([this.cols, this.rows])
    );
    device.queue.writeBuffer(
      this.gridLayoutBuffer,
      8,
      new Float32Array([this.spacing, this.voxelScale])
    );

    this.renderBindGroupLayout = device.createBindGroupLayout({
      label: 'depthWebcamVoxel-renderBGL',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'read-only-storage'}},
      ],
    });

    this.renderBindGroup = device.createBindGroup({
      label: 'depthWebcamVoxel-renderBG',
      layout: this.renderBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.sceneUniformBuffer}},
        {binding: 1, resource: {buffer: this.gridLayoutBuffer}},
        {binding: 2, resource: {buffer: this.heightsBuffer}},
      ],
    });

    // Vertex layout assumed to match the engine's standard cube mesh:
    // location(0) = position (vec3), location(1) = normal (vec3).
    // Adjust attribute slots here if GeometryFactory's cube differs.
    this.renderPipeline = device.createRenderPipeline({
      label: 'depthWebcamVoxel-renderPipeline',
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.renderBindGroupLayout],
      }),
      vertex: {
        module: device.createShaderModule({code: RENDER_SHADER}),
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 6 * 4,
            attributes: [
              {shaderLocation: 0, offset: 0, format: 'float32x3'},
              {shaderLocation: 1, offset: 3 * 4, format: 'float32x3'},
            ],
          },
        ],
      },
      fragment: {
        module: device.createShaderModule({code: RENDER_SHADER}),
        entryPoint: 'fs_main',
        targets: [
          {format: this.colorFormat},
          {format: this.normalFormat},
          {format: this.worldPosFormat},
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
  }

  // Per-frame 
  updateInstanceData(baseModelMatrix) {
    this._baseModelMatrix = baseModelMatrix;
    this.device.queue.writeBuffer(this.sceneUniformBuffer, 64, baseModelMatrix);
  }

  _dispatchHeightCompute() {
    if(!this.videoReady) return;
    // Refresh the backing texture from the current video frame. Cheaper and
    // far more portable than re-importing a texture_external every frame.
    try {
      this.device.queue.copyExternalImageToTexture(
        {source: this.video, flipY: false},
        {texture: this.webcamTexture},
        [this.videoWidth, this.videoHeight]
      );
    } catch(e) {
      // Video not ready this tick (e.g. tab backgrounded) — skip frame.
      return;
    }

    // Self-contained: own command encoder, submitted immediately, so this
    // effect works with the plain 4-arg render(pass, mesh, viewProj, dt)
    // interface and doesn't require the engine to hand us its main encoder.
    // Submission order on the queue guarantees this runs (and the storage
    // buffer write lands) before the main frame's encoder is submitted later
    // this frame, so the render pass below reads fresh data.
    const encoder = this.device.createCommandEncoder({label: 'depthWebcamVoxel-computeEncoder'});
    const pass = encoder.beginComputePass({label: 'depthWebcamVoxel-heightPass'});
    pass.setPipeline(this.computePipeline);
    pass.setBindGroup(0, this.computeBindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(this.cols / HEIGHT_WORKGROUP_SIZE),
      Math.ceil(this.rows / HEIGHT_WORKGROUP_SIZE)
    );
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  /**
   * @param {GPURenderPassEncoder} pass  active G-buffer render pass
   * @param {{vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer, indexCount: number}} mesh
   *        unit cube mesh (position+normal interleaved), from GeometryFactory
   * @param {Float32Array} viewProjMatrix mat4, column-major
   * @param {number} dt
   */
  render(pass, mesh, viewProjMatrix, dt) {
    this.device.queue.writeBuffer(this.sceneUniformBuffer, 0, viewProjMatrix);
    this._dispatchHeightCompute();
    if(!this.videoReady) return;
    pass.setPipeline(this.renderPipeline);
    pass.setBindGroup(0, this.renderBindGroup);
    pass.setVertexBuffer(0, mesh.vertexBuffer);
    pass.setIndexBuffer(mesh.indexBuffer, 'uint16');
    pass.drawIndexed(mesh.indexCount, this.instanceCount);
  }

  dispose() {
    if(this._stream) {for(const track of this._stream.getTracks()) track.stop()}
    this.heightsBuffer?.destroy();
    this.computeParamsBuffer?.destroy();
    this.sceneUniformBuffer?.destroy();
    this.gridLayoutBuffer?.destroy();
    this.webcamTexture?.destroy();
  }
}