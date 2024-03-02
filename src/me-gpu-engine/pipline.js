
import {vec3, mat4} from "wgpu-matrix";

// CUBE TEXTURE BASE OBJECT
export default class MECubeTexPipline {

  depthTexture;
  cubeTexPipeline = null;
  renderPassDescriptor = null;
  context = null;
  device = null;

  constructor(device, presentationFormat, moduleCubeTex, context, canvas) {
    this.canvas = canvas;
    this.context = context;
    this.device = device;
    this.cubeTexPipeline = device.createRenderPipeline({
      label: '2 attributes',
      layout: 'auto',
      vertex: {
        module: moduleCubeTex,
        entryPoint: 'vs',
        buffers: [
          {
            arrayStride: (3 + 2) * 4, // (3+2) floats 4 bytes each
            attributes: [
              {shaderLocation: 0, offset: 0, format: 'float32x3'},  // position
              {shaderLocation: 1, offset: 12, format: 'float32x2'},  // texcoord
            ],
          },
        ],
      },
      fragment: {
        module: moduleCubeTex,
        entryPoint: 'fs',
        targets: [{format: presentationFormat}],
      },
      primitive: {
        cullMode: 'back',
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    });
  }

  loadObjProgram(device, bufferManager, sampler, texture) {

    // matrix
    const uniformBufferSize = (16) * 4;
    this.uniformBuffer = device.createBuffer({
      label: 'uniforms',
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.uniformValues = new Float32Array(uniformBufferSize / 4);

    // offsets to the various uniform values in float32 indices
    const kMatrixOffset = 0;

    this.matrixValue = this.uniformValues.subarray(kMatrixOffset, kMatrixOffset + 16);

    const {vertexData, indexData, numVertices} = bufferManager.createCubeVertices();
    this.numVertices = numVertices;
    this.vertexBuffer = device.createBuffer({
      label: 'vertex buffer vertices',
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

    this.indexBuffer = device.createBuffer({
      label: 'index buffer',
      size: vertexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.indexBuffer, 0, indexData);

    this.bindGroup = device.createBindGroup({
      label: 'bind group for object',
      layout: this.cubeTexPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.uniformBuffer}},
        {binding: 1, resource: sampler},
        {binding: 2, resource: texture.createView()},
      ],
    });

    this.renderPassDescriptor = {
      label: 'our basic canvas renderPass',
      colorAttachments: [
        {
          // view: <- to be filled out when we render
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        // view: <- to be filled out when we render
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };

    const degToRad = d => d * Math.PI / 180;

    this.settings = {
      rotation: [degToRad(20), degToRad(25), degToRad(0)],
    };

    // const radToDegOptions = {min: -360, max: 360, step: 1, converters: GUI.converters.radToDeg};

  }

  draw() {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    const canvasTexture = this.context.getCurrentTexture();
    this.renderPassDescriptor.colorAttachments[0].view = canvasTexture.createView();

    // If we don't have a depth texture OR if its size is different
    // from the canvasTexture when make a new depth texture
    if(!this.depthTexture ||
      this.depthTexture.width !== canvasTexture.width ||
      this.depthTexture.height !== canvasTexture.height) {
      if(this.depthTexture) {
        this.depthTexture.destroy();
      }
      this.depthTexture = this.device.createTexture({
        size: [canvasTexture.width, canvasTexture.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
    this.renderPassDescriptor.depthStencilAttachment.view = this.depthTexture.createView();

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass(this.renderPassDescriptor);

    pass.setPipeline(this.cubeTexPipeline);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');

    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    mat4.perspective(
      60 * Math.PI / 180,
      aspect,
      0.1,      // zNear
      10,      // zFar
      this.matrixValue,
    );
    const view = mat4.lookAt(
      [0, 1, 5],  // camera position
      [0, 0, 0],  // target
      [0, 1, 0],  // up
    );
    mat4.multiply(this.matrixValue, view, this.matrixValue);
    mat4.rotateX(this.matrixValue, this.settings.rotation[0], this.matrixValue);
    mat4.rotateY(this.matrixValue, this.settings.rotation[1], this.matrixValue);
    mat4.rotateZ(this.matrixValue, this.settings.rotation[2], this.matrixValue);

    // upload the uniform values to the uniform buffer
    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformValues);
    pass.setBindGroup(0, this.bindGroup);
    pass.drawIndexed(this.numVertices);

    pass.end();

    // const commandBuffer = encoder.finish();
    // this.device.queue.submit([commandBuffer]);
  }
}