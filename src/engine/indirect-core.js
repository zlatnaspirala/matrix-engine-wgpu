// GPUIndirectBuffer.js
export class GPUIndirectBuffer {
  constructor(device, maxDraws = 256) {
    this.device = device;
    this.maxDraws = maxDraws;
    this.drawCount = 0;

    // Single buffer: maxDraws * 5 uint32 per draw (indexCount, instanceCount, firstIndex, baseVertex, firstInstance)
    this.buffer = device.createBuffer({
      size: maxDraws * 20, // 5 uint32 × 4 bytes
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    this.data = new Uint32Array(this.buffer.getMappedRange());
    this.buffer.unmap();
  }

  // CPU write (for now, before GPU compute)
  writeDrawCall(drawIndex, indexCount, instanceCount, firstIndex = 0, baseVertex = 0, firstInstance = 0) {
    if(drawIndex >= this.maxDraws) return;
    const offset = drawIndex * 5;
    this.data[offset + 0] = indexCount;
    this.data[offset + 1] = instanceCount;
    this.data[offset + 2] = firstIndex;
    this.data[offset + 3] = baseVertex;
    this.data[offset + 4] = firstInstance;
  }

  flush(queue) {
    queue.writeBuffer(this.buffer, 0, this.data);
  }

  getBuffer() {
    return this.buffer;
  }
}

export class ComputeCullingSystem {
  constructor(device, gpuCapabilities, maxInstances = 4096) {
    this.device = device;
    this.gpuCapabilities = gpuCapabilities;
    this.maxInstances = maxInstances;

    // Input: instance data (position, bounds, etc.)
    this.instanceBuffer = device.createBuffer({
      size: maxInstances * 32, // vec3 pos + f32 radius + padding
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    this.instanceData = new Float32Array(this.instanceBuffer.getMappedRange());
    this.instanceBuffer.unmap();

    // Output: indirect draw buffer (written by compute)
    this.indirectBuffer = device.createBuffer({
      size: maxInstances * 20, // 5 uint32 per draw
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Counter: how many draws were culled in
    this.counterBuffer = device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Uniforms: frustum + camera data
    this.cullingParams = device.createBuffer({
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.createPipeline();
  }

  createPipeline() {
    const code = this.getComputeShaderCode();
    const module = this.device.createShaderModule({code});

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {type: 'uniform'},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {type: 'read-only-storage'},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {type: 'storage'},
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {type: 'storage'},
        },
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cullingParams}},
        {binding: 1, resource: {buffer: this.instanceBuffer}},
        {binding: 2, resource: {buffer: this.indirectBuffer}},
        {binding: 3, resource: {buffer: this.counterBuffer}},
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.pipeline = this.device.createComputePipeline({
      layout: pipelineLayout,
      compute: {module, entryPoint: 'main'},
    });
  }

  getComputeShaderCode() {
    return `
struct CullingParams {
  viewMatrix: mat4x4f,
  projMatrix: mat4x4f,
  cameraPos: vec3f,
  maxDistance: f32,
}

struct Instance {
  position: vec3f,
  radius: f32,
}

struct IndirectDraw {
  indexCount: u32,
  instanceCount: u32,
  firstIndex: u32,
  baseVertex: u32,
  firstInstance: u32,
}

@group(0) @binding(0) var<uniform> params: CullingParams;
@group(0) @binding(1) var<storage, read> instances: array<Instance>;
@group(0) @binding(2) var<storage, read_write> indirectDraws: array<IndirectDraw>;
@group(0) @binding(3) var<storage, read_write> drawCounter: atomic<u32>;

fn isInFrustum(pos: vec3f) -> bool {
  let viewPos = (params.viewMatrix * vec4f(pos, 1.0)).xyz;
  let projPos = params.projMatrix * vec4f(viewPos, 1.0);
  let ndc = projPos.xyz / projPos.w;
  return all(ndc.xyz >= vec3f(-1.0)) && all(ndc.xyz <= vec3f(1.0));
}

fn isInDistance(pos: vec3f) -> bool {
  let dist = distance(pos, params.cameraPos);
  return dist < params.maxDistance;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let idx = gid.x;
  if (idx >= arrayLength(&instances)) { return; }
  
  let inst = instances[idx];
  
  // Frustum + distance culling
  let inFrustum = isInFrustum(inst.position);
  let inDistance = isInDistance(inst.position);
  
  if (inFrustum && inDistance) {
    // Atomic append: get next slot
    let drawIdx = atomicAdd(&drawCounter, 1u);
    
    if (drawIdx < arrayLength(&indirectDraws)) {
      indirectDraws[drawIdx] = IndirectDraw(
        36u,           // indexCount (example: triangle mesh)
        1u,            // instanceCount (1 per indirect call)
        0u,            // firstIndex
        0u,            // baseVertex
        u32(idx)       // firstInstance — tells vertex shader which instance
      );
    }
  }
}
    `;
  }

  // Called once per frame BEFORE render
  execute(commandEncoder, viewMatrix, projMatrix, cameraPos, maxDist = 1000.0) {
    // Update culling params
    const paramData = new Float32Array(36);
    // Row-major: viewMatrix
    for(let i = 0;i < 16;i++) paramData[i] = viewMatrix[i];
    // projMatrix
    for(let i = 0;i < 16;i++) paramData[16 + i] = projMatrix[i];
    // cameraPos
    paramData[32] = cameraPos[0];
    paramData[33] = cameraPos[1];
    paramData[34] = cameraPos[2];
    paramData[35] = maxDist;

    this.device.queue.writeBuffer(this.cullingParams, 0, paramData);

    // Reset counter
    this.device.queue.writeBuffer(this.counterBuffer, 0, new Uint32Array([0]));

    // Dispatch compute
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);

    const workgroups = Math.ceil(this.maxInstances / 256);
    pass.dispatchWorkgroups(workgroups);
    pass.end();
  }

  updateInstance(index, position, radius) {
    const offset = index * 8; // 2 float4 slots per instance
    this.instanceData[offset + 0] = position[0];
    this.instanceData[offset + 1] = position[1];
    this.instanceData[offset + 2] = position[2];
    this.instanceData[offset + 3] = radius;
  }

  flushInstances() {
    this.device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceData);
  }

  getIndirectBuffer() {
    return this.indirectBuffer;
  }
}
