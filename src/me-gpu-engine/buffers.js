export default class MatrixEngineGPUCreateBuffers {
  device = null;
  constructor(device) {
    this.device = device;
    this.MY_GPU_BUFFER = {};
    this.createSimpleCubeBuffers();
  }

  createSimpleCubeBuffers() {
    const positions = new Float32Array([
      1, 1, -1,
      1, 1, 1,
      1, -1, 1,
      1, -1, -1,

      -1, 1, 1,
      -1, 1, -1,
      -1, -1, -1,
      -1, -1, 1,

      -1, 1, 1,
      1, 1, 1,
      1, 1, -1,
      -1, 1, -1,

      -1, -1, -1,
      1, -1, -1,
      1, -1, 1,
      -1, -1, 1,

      1, 1, 1,
      -1, 1, 1,
      -1, -1, 1,
      1, -1, 1,

      -1, 1, -1,
      1, 1, -1,
      1, -1, -1,
      -1, -1, -1]);
      
    const normals = new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]);
    const texcoords = new Float32Array([1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1]);
    this.MY_GPU_BUFFER.indices = new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23]);
    this.MY_GPU_BUFFER.positionBuffer = this.createBuffer(this.device, positions, GPUBufferUsage.VERTEX);
    this.MY_GPU_BUFFER.normalBuffer = this.createBuffer(this.device, normals, GPUBufferUsage.VERTEX);
    this.MY_GPU_BUFFER.texcoordBuffer = this.createBuffer(this.device, texcoords, GPUBufferUsage.VERTEX);
    this.MY_GPU_BUFFER.indicesBuffer = this.createBuffer(this.device, this.MY_GPU_BUFFER.indices, GPUBufferUsage.INDEX);
  }

  createCubeVertices() {
    const vertexData = new Float32Array([
      //  position   |  texture coordinate
      //-------------+----------------------
      // front face     select the top left image
      -1, 1, 1, 0, 0,
      -1, -1, 1, 0, 0.5,
      1, 1, 1, 0.25, 0,
      1, -1, 1, 0.25, 0.5,
      // right face     select the top middle image
      1, 1, -1, 0.25, 0,
      1, 1, 1, 0.5, 0,
      1, -1, -1, 0.25, 0.5,
      1, -1, 1, 0.5, 0.5,
      // back face      select to top right image
      1, 1, -1, 0.5, 0,
      1, -1, -1, 0.5, 0.5,
      -1, 1, -1, 0.75, 0,
      -1, -1, -1, 0.75, 0.5,
      // left face       select the bottom left image
      -1, 1, 1, 0, 0.5,
      -1, 1, -1, 0.25, 0.5,
      -1, -1, 1, 0, 1,
      -1, -1, -1, 0.25, 1,
      // bottom face     select the bottom middle image
      1, -1, 1, 0.25, 0.5,
      -1, -1, 1, 0.5, 0.5,
      1, -1, -1, 0.25, 1,
      -1, -1, -1, 0.5, 1,
      // top face        select the bottom right image
      -1, 1, 1, 0.5, 0.5,
      1, 1, 1, 0.75, 0.5,
      -1, 1, -1, 0.5, 1,
      1, 1, -1, 0.75, 1,
    ]);
    const indexData = new Uint16Array([
      0, 1, 2, 2, 1, 3,  // front
      4, 5, 6, 6, 5, 7,  // right
      8, 9, 10, 10, 9, 11,  // back
      12, 13, 14, 14, 13, 15,  // left
      16, 17, 18, 18, 17, 19,  // bottom
      20, 21, 22, 22, 21, 23,  // top
    ]);

    return {
      vertexData,
      indexData,
      numVertices: indexData.length,
    };
  }

  createBuffer(device, data, usage) {
    const buffer = device.createBuffer({
      size: data.byteLength,
      usage,
      mappedAtCreation: true,
    });
    const dst = new data.constructor(buffer.getMappedRange());
    dst.set(data);
    buffer.unmap();
    return buffer;
  }

}
