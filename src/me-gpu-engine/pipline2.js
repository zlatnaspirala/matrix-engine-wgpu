
import {vec3, mat4} from "wgpu-matrix";
import {shaderSrc} from "../shaders/shaders";
import MatrixEngineGPUCreateBuffers from "./buffers";

// CUBE TEXTURE BASE OBJECT
export default class MECubeTexPipline2 {

  depthTexture;
  cubeTexPipeline = null;
  renderPassDescriptor = null;
  context = null;
  device = null;

  constructor(device, presentationFormat, context, canvas, canvasInfo ) {
    this.presentationFormat = presentationFormat;
    this.canvas = canvas;
    this.context = context;
    this.device = device;
    this.shaderModule = this.device.createShaderModule({code: shaderSrc});

    this.buffersManager = new MatrixEngineGPUCreateBuffers(this.device);

    // test duplicate
    this.canvasInfo = {
      canvas: this.canvas,
      presentationFormat: this.presentationFormat,
      // these are filled out in resizeToDisplaySize
      renderTarget: undefined,
      renderTargetView: undefined,
      depthTexture: undefined,
      depthTextureView: undefined,
      sampleCount: 4, // can be 1 or 4
    };

    this.createPixelTextures();
    this.createPipline() 
  }

  createPixelTextures() {

    this.tex = this.device.createTexture({
      size: [2, 2],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    this.device.queue.writeTexture(
      {texture: this.tex},
      new Uint8Array([
        255, 255, 128, 255, 128, 255, 255, 255, 255, 128, 255, 255, 255, 128, 128, 255,
      ]),
      {bytesPerRow: 8, rowsPerImage: 2},
      {width: 2, height: 2},
    );

    
    this.sampler = this.device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
    });

  }

  createPipline() {
    var shaderModule = this.shaderModule;
    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "myVSMain",
        buffers: [
          // position
          {
            arrayStride: 3 * 4, // 3 floats, 4 bytes each
            attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}],
          },
          // normals
          {
            arrayStride: 3 * 4, // 3 floats, 4 bytes each
            attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}],
          },
          // texcoords
          {
            arrayStride: 2 * 4, // 2 floats, 4 bytes each
            attributes: [{shaderLocation: 2, offset: 0, format: "float32x2"}],
          },
        ],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "myFSMain",
        targets: [{format: this.presentationFormat}],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
      ...(this.canvasInfo.sampleCount > 1 && {
        multisample: {
          count: this.canvasInfo.sampleCount,
        },
      }),
    });

    this.createPP();
  }

  createPP() {
    const vUniformBufferSize = 2 * 16 * 4; // 2 mat4s * 16 floats per mat * 4 bytes per float
    const fUniformBufferSize = 3 * 4; // 1 vec3 * 3 floats per vec3 * 4 bytes per float

    this.vsUniformBuffer = this.device.createBuffer({
      size: Math.max(16, vUniformBufferSize),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.fsUniformBuffer = this.device.createBuffer({
      size: Math.max(16, fUniformBufferSize),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.vsUniformValues = new Float32Array(2 * 16); // 2 mat4s
    this.worldViewProjection = this.vsUniformValues.subarray(0, 16);
    this.worldInverseTranspose = this.vsUniformValues.subarray(16, 32);
    this.fsUniformValues = new Float32Array(3); // 1 vec3
    this.lightDirection = this.fsUniformValues.subarray(0, 3);

    console.log("test this.textureManager.sampler ", this.sampler);

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.vsUniformBuffer}},
        {binding: 1, resource: {buffer: this.fsUniformBuffer}},
        {binding: 2, resource: this.sampler},
        {binding: 3, resource: this.tex.createView()},
      ],
    });

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          // view: undefined, // Assigned later
          // resolveTarget: undefined, // Assigned Later
          clearValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0},
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        // view: undefined,  // Assigned later
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

  resizeToDisplaySize(device, canvasInfo) {
    const {
      canvas,
      renderTarget,
      presentationFormat,
      depthTexture,
      sampleCount,
    } = canvasInfo;
    const width = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientWidth),);
    const height = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientHeight),);

    const needResize = !canvasInfo.renderTarget || width !== canvas.width || height !== canvas.height;
    if(needResize) {
      if(renderTarget) {renderTarget.destroy()}
      if(depthTexture) {depthTexture.destroy()}
      canvas.width = width;
      canvas.height = height;

      if(sampleCount > 1) {
        const newRenderTarget = device.createTexture({
          size: [canvas.width, canvas.height],
          format: presentationFormat,
          sampleCount,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        canvasInfo.renderTarget = newRenderTarget;
        canvasInfo.renderTargetView = newRenderTarget.createView();
      }

      const newDepthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      canvasInfo.depthTexture = newDepthTexture;
      canvasInfo.depthTextureView = newDepthTexture.createView();
    }
    return needResize;
  }

  

  draw(commandEncoder, c) {

    let clientWidth = this.canvas.clientWidth;
    let clientHeight = this.canvas.clientHeight;
    const projection = mat4.perspective((30 * Math.PI) / 180,
      clientWidth / clientHeight, 0.5, 10)
    var eye = [1, 4, -6];
    var target = [0, 0, -2];
    var up = [0, 1, 0];

    var view = mat4.lookAt(eye, target, up);
    var viewProjection = mat4.multiply(projection, view);
    var world = mat4.rotationY(c);
    mat4.transpose(mat4.inverse(world), this.worldInverseTranspose);
    mat4.multiply(viewProjection, world, this.worldViewProjection);
    vec3.normalize([1, 8, -10], this.lightDirection);

    
    this.resizeToDisplaySize(this.device, this.canvasInfo);

    this.device.queue.writeBuffer(this.vsUniformBuffer, 0, this.vsUniformValues);
    this.device.queue.writeBuffer(this.fsUniformBuffer, 0, this.fsUniformValues);

    if(this.canvasInfo.sampleCount === 1) {
      const colorTexture = this.context.getCurrentTexture();
      this.renderPassDescriptor.colorAttachments[0].view = colorTexture.createView();
    } else {
      this.renderPassDescriptor.colorAttachments[0].view = this.canvasInfo.renderTargetView;
      this.renderPassDescriptor.colorAttachments[0].resolveTarget = this.context.getCurrentTexture().createView();
    }
    this.renderPassDescriptor.depthStencilAttachment.view = this.canvasInfo.depthTextureView;

    // const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.setVertexBuffer(0, this.buffersManager.MY_GPU_BUFFER.positionBuffer);
    passEncoder.setVertexBuffer(1, this.buffersManager.MY_GPU_BUFFER.normalBuffer);
    passEncoder.setVertexBuffer(2, this.buffersManager.MY_GPU_BUFFER.texcoordBuffer);
    passEncoder.setIndexBuffer(this.buffersManager.MY_GPU_BUFFER.indicesBuffer, "uint16");
    passEncoder.drawIndexed(this.buffersManager.MY_GPU_BUFFER.indices.length);

    passEncoder.end();
    // this.device.queue.submit([commandEncoder.finish()]);



  }
}