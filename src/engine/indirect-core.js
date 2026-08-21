/**
 * @description
 * Matrix Engine WGPU
 * GPU based culling
 */

export class ComputeCullingSystem {
  constructor(device, gpuCapabilities, maxInstances = 4096) {
    this.device = device;
    this.gpuCapabilities = gpuCapabilities;
    this.maxInstances = maxInstances;
    this.maxDrawCalls = 500;

    // Instance data
    this.instanceBuffer = device.createBuffer({
      label: 'instanceBuffer',
      size: maxInstances * 80,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      // mappedAtCreation: true,
    });
    // this.instanceData = new Float32Array(this.instanceBuffer.getMappedRange());
    // this.instanceBuffer.unmap();
    this.instanceData = new Float32Array(maxInstances * 20);

    // Visibility list (culled indices)
    this.visibilityBuffer = device.createBuffer({
      label: 'visibilityBuffer',
      size: maxInstances * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Counter: total visible count
    this.counterBuffer = device.createBuffer({
      label: 'counterBuffer',
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    // Indirect draw buffer (GPU-written by compute shader)
    this.indirectBuffer = device.createBuffer({
      label: "GPU Indirect Buffer",
      size: this.maxDrawCalls * 20,
      usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // CPU-side copy for initialization
    this.indirectData = new Uint32Array(this.maxDrawCalls * 5);

    // Mesh-to-instance mapping
    this.instanceMeshMap = device.createBuffer({
      label: 'instanceMeshMap',
      size: maxInstances * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    this.instanceMeshData = new Uint32Array(this.instanceMeshMap.getMappedRange());
    this.instanceMeshMap.unmap();

    // Culling params
    this.cullingParams = device.createBuffer({
      label: 'cullingParams',
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.visibleCount = 0;
    this.createPipeline();
  }

  setMeshDrawCommand(meshIndex, indexCount, instanceCount, firstInstance, firstIndex = 0, baseVertex = 0) {
    const offset = meshIndex * 5;
    this.indirectData[offset + 0] = indexCount;
    this.indirectData[offset + 1] = instanceCount;
    this.indirectData[offset + 2] = firstIndex;
    this.indirectData[offset + 3] = baseVertex;
    this.indirectData[offset + 4] = firstInstance;
  }

  flushIndirectBuffer() {
    this.device.queue.writeBuffer(this.indirectBuffer, 0, this.indirectData);
           console.log("Indirect buffer content:", this.indirectData);
  }

  getComputeShaderCode() {
    return `
struct CullingParams {
  viewMatrix: mat4x4f,
  projMatrix: mat4x4f,
  cameraPos: vec3f,
  maxDistance: f32,
}
struct Instance {model: mat4x4<f32>, colorMult : vec4<f32>};
struct DrawCommand {
  indexCount: u32,
  instanceCount: atomic<u32>,
  firstIndex: u32,
  baseVertex: u32,
  firstInstance: u32,
}

@group(0) @binding(0) var<uniform> params: CullingParams;
@group(0) @binding(1) var<storage, read> instances: array<Instance>;
@group(0) @binding(2) var<storage, read_write> visibleIndices: array<u32>;
@group(0) @binding(3) var<storage, read_write> visibleCounter: atomic<u32>;
@group(0) @binding(4) var<storage, read_write> indirectCommands: array<DrawCommand>;
@group(0) @binding(5) var<storage, read> instanceMeshMap: array<u32>;

fn isInFrustum(pos: vec3f, radius: f32) -> bool {
  let viewPos = (params.viewMatrix * vec4f(pos, 1.0)).xyz;
  let projPos = params.projMatrix * vec4f(viewPos, 1.0);
  let ndc = projPos.xyz / projPos.w;
  return abs(ndc.x) <= 1.2 && abs(ndc.y) <= 1.2 && abs(ndc.z) <= 1.2;
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
  let position = inst.model[3].xyz;
  if (isInFrustum(position, 1.0) &&
      isInDistance(position)) {
      let visIdx = atomicAdd(&visibleCounter, 1u);
      if (visIdx < arrayLength(&visibleIndices)) {
          visibleIndices[visIdx] = idx;
      }
      let meshIdx = instanceMeshMap[idx];
      atomicAdd(&indirectCommands[meshIdx].instanceCount, 1u);
  }
}
  `;
  }

  createPipeline() {
    const code = this.getComputeShaderCode();
    const module = this.device.createShaderModule({code});
    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'read-only-storage'}},
        {binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'storage'}},
        {binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'storage'}},
        {binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'storage'}},
        {binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: {type: 'read-only-storage'}},
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cullingParams}},
        {binding: 1, resource: {buffer: this.instanceBuffer}},
        {binding: 2, resource: {buffer: this.visibilityBuffer}},
        {binding: 3, resource: {buffer: this.counterBuffer}},
        {binding: 4, resource: {buffer: this.indirectBuffer}},
        {binding: 5, resource: {buffer: this.instanceMeshMap}},
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

  async execute(commandEncoder, viewMatrix, projMatrix, cameraPos, maxDist = 1000.0) {
    const paramData = new Float32Array(36);
    for(let i = 0;i < 16;i++) paramData[i] = viewMatrix[i];
    for(let i = 0;i < 16;i++) paramData[16 + i] = projMatrix[i];
    paramData[32] = cameraPos[0];
    paramData[33] = cameraPos[1];
    paramData[34] = cameraPos[2];
    paramData[35] = maxDist;
    this.device.queue.writeBuffer(this.cullingParams, 0, paramData);
    this.device.queue.writeBuffer(this.counterBuffer, 0, new Uint32Array([0]));
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(Math.ceil(this.maxInstances / 256));
    pass.end();
  }

  // updateInstance(index, position, radius, meshIndex = 0) {
  //   const offset = index * 8;
  //   this.instanceData[offset + 0] = position[0];
  //   this.instanceData[offset + 1] = position[1];
  //   this.instanceData[offset + 2] = position[2];
  //   this.instanceData[offset + 3] = radius;
  //   this.instanceMeshData[index] = meshIndex;
  // }

  updateInstance(index, position, radius, meshIndex = 0) {
  const offset = index * 20;  // ← 20 floats per instance
  // Write mat4x4 (16 floats) + colorMult (4 floats)
  // Identity matrix with position translation
  this.instanceData[offset + 0] = 1;  this.instanceData[offset + 1] = 0;  this.instanceData[offset + 2] = 0;  this.instanceData[offset + 3] = 0;
  this.instanceData[offset + 4] = 0;  this.instanceData[offset + 5] = 1;  this.instanceData[offset + 6] = 0;  this.instanceData[offset + 7] = 0;
  this.instanceData[offset + 8] = 0;  this.instanceData[offset + 9] = 0;  this.instanceData[offset + 10] = 1; this.instanceData[offset + 11] = 0;
  this.instanceData[offset + 12] = position[0];
  this.instanceData[offset + 13] = position[1];
  this.instanceData[offset + 14] = position[2];
  this.instanceData[offset + 15] = 1;
  
  // colorMult
  this.instanceData[offset + 16] = 1;
  this.instanceData[offset + 17] = 1;
  this.instanceData[offset + 18] = 1;
  this.instanceData[offset + 19] = 1;
  
  this.instanceMeshData[index] = meshIndex;
}

  flushInstances() {
    this.device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceData);
    this.device.queue.writeBuffer(this.instanceMeshMap, 0, this.instanceMeshData);
  }

  getIndirectBuffer() {return this.indirectBuffer;}
  getVisibilityBuffer() {return this.visibilityBuffer;}
  getVisibleCount() {return this.visibleCount;}
}

export class IndirectRenderingManager {
  constructor() {
    this.indirectMeshes = [];
    this.drawCallMap = new Map();
    this.meshToIndexMap = new Map();
  }

  // Register a mesh when it's created or added to the scene
  registerIndirectDraw(mesh) {
    console.log('REGISTER ___', mesh.name);
    const drawIndex = this.drawCallMap.size; // Assign a unique sequential index

    if(!mesh.instanceCount) {
      mesh.instanceCount = 1;
    }
    // Track global instance index for compute culling
    mesh.globalInstanceIndex = this.getTotalInstanceCount();
    mesh.indirectDrawIndex = drawIndex;
    this.meshToIndexMap.set(mesh.name, drawIndex);

    this.indirectMeshes.push(mesh);
    this.drawCallMap.set(drawIndex, {
      mesh: mesh,
      indexCount: mesh.indexCount || 36,
      instanceCount: mesh.instanceCount || 1,
    });

    return drawIndex;
  }

  getTotalInstanceCount() {
    let count = 0;
    for(const mesh of this.indirectMeshes) {
      count += mesh.instanceCount || 1;
    }
    return count;
  }

  getDrawCallsByPipeline() {
    // Group your registered meshes by their material/pipeline
    const pipelineMap = new Map();
    for(const mesh of this.indirectMeshes) {
      const pipeline = mesh.material.pipeline; // Or however you grab your pipeline
      if(!pipelineMap.has(pipeline)) {
        pipelineMap.set(pipeline, []);
      }
      pipelineMap.get(pipeline).push(mesh);
    }
    return pipelineMap;
  }
}