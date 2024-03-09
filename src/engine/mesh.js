
import {mat4, vec3} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {createInputHandler} from "./engine";

import {vertexShadowWGSL} from './final/vertexShadow.wgsl';
import {fragmentWGSL} from './final/fragment.wgsl';
import {vertexWGSL} from './final/vertex.wgsl';

export default class MEMesh {

  constructor(canvas, device, context, o) {
    this.done = false;
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;
    this.mesh = o.mesh;
    this.inputHandler = createInputHandler(window, canvas);
    this.cameras = o.cameras;
    console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef)
    this.cameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    }
    this.lastFrameMS = 0;
    this.texturesPaths = [];
    o.texturesPaths.forEach((t) => {this.texturesPaths.push(t)})
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new Position(o.position.x, o.position.y, o.position.z);
    console.log('cube added on pos : ', this.position)
    this.rotation = new Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;

    // new
    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 1024;
        // this.adapter = await navigator.gpu.requestAdapter();
        // this.device = await this.adapter.requestDevice();
        // this.context = canvas.getContext('webgpu');
        resolve()
      })
    }

    this.runProgram().then(() => {

      const aspect = canvas.width / canvas.height;
      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
      });

      // Create the model vertex buffer.
      this.vertexBuffer = this.device.createBuffer({
        size: this.mesh.positions.length * 3 * 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      {
        const mapping = new Float32Array(this.vertexBuffer.getMappedRange());
        for(let i = 0;i < this.mesh.positions.length;++i) {
          mapping.set(this.mesh.positions[i], 6 * i);
          mapping.set(this.mesh.normals[i], 6 * i + 3);
        }
        this.vertexBuffer.unmap();
      }

      // Create the model index buffer.
      this.indexCount = this.mesh.triangles.length * 3;
      this.indexBuffer = this.device.createBuffer({
        size: this.indexCount * Uint16Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
      });
      {
        const mapping = new Uint16Array(this.indexBuffer.getMappedRange());
        for(let i = 0;i < this.mesh.triangles.length;++i) {
          mapping.set(this.mesh.triangles[i], 3 * i);
        }
        this.indexBuffer.unmap();
      }

      // Create the depth texture for rendering/sampling the shadow map.
      this.shadowDepthTexture = this.device.createTexture({
        size: [this.shadowDepthTextureSize, this.shadowDepthTextureSize, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: 'depth32float',
      });
      this.shadowDepthTextureView = this.shadowDepthTexture.createView();

      // Create some common descriptors used for both the shadow pipeline
      // and the color rendering pipeline.
      this.vertexBuffers = [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 6,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: 0,
              format: 'float32x3',
            },
            {
              // normal
              shaderLocation: 1,
              offset: Float32Array.BYTES_PER_ELEMENT * 3,
              format: 'float32x3',
            },
          ],
        },
      ];

      const primitive = {
        topology: 'triangle-list',
        cullMode: 'back',
      };

      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: 'uniform',
            },
          },
        ],
      });

      this.shadowPipeline = this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [
            this.uniformBufferBindGroupLayout,
            this.uniformBufferBindGroupLayout,
          ],
        }),
        vertex: {
          module: this.device.createShaderModule({
            code: vertexShadowWGSL,
          }),
          buffers: this.vertexBuffers,
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: 'depth32float',
        },
        primitive,
      });

      // Create a bind group layout which holds the scene uniforms and
      // the texture+sampler for depth. We create it manually because the WebPU
      // implementation doesn't infer this from the shader (yet).
      this.bglForRender = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: 'uniform',
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: 'depth',
            },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: {
              type: 'comparison',
            },
          },
        ],
      });

      this.pipeline = this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bglForRender, this.uniformBufferBindGroupLayout],
        }),
        vertex: {
          module: this.device.createShaderModule({
            code: vertexWGSL,
          }),
          buffers: this.vertexBuffers,
        },
        fragment: {
          module: this.device.createShaderModule({
            code: fragmentWGSL,
          }),
          targets: [
            {
              format: presentationFormat,
            },
          ],
          constants: {
            shadowDepthTextureSize: this.shadowDepthTextureSize,
          },
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: 'depth24plus-stencil8',
        },
        primitive,
      });

      const depthTexture = this.device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus-stencil8',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });

      this.renderPassDescriptor = {
        colorAttachments: [
          {
            // view is acquired and set in render loop.
            view: undefined,

            clearValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0},
            loadOp: 'load',
            storeOp: 'store',
          },
        ],
        depthStencilAttachment: {
          view: depthTexture.createView(),

          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
          stencilClearValue: 0,
          stencilLoadOp: 'clear',
          stencilStoreOp: 'store',
        },
      };

      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16, // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.sceneUniformBuffer = this.device.createBuffer({
        // Two 4x4 viewProj matrices,
        // one for the camera and one for the light.
        // Then a vec3 for the light position.
        // Rounded to the nearest multiple of 16.
        size: 2 * 4 * 16 + 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.sceneBindGroupForShadow = this.device.createBindGroup({
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.sceneUniformBuffer,
            },
          },
        ],
      });

      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.sceneUniformBuffer,
            },
          },
          {
            binding: 1,
            resource: this.shadowDepthTextureView,
          },
          {
            binding: 2,
            resource: this.device.createSampler({
              compare: 'less',
            }),
          },
        ],
      });

      this.modelBindGroup = this.device.createBindGroup({
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.modelUniformBuffer,
            },
          },
        ],
      });

      // Rotates the camera around the origin based on time.
      this.getCameraViewProjMatrix = () => {
        const eyePosition = vec3.fromValues(0, 50, -100);

        const rad = Math.PI * (Date.now() / 2000);
        const rotation = mat4.rotateY(mat4.translation(this.origin), rad);
        vec3.transformMat4(eyePosition, rotation, eyePosition);

        const viewMatrix = mat4.lookAt(eyePosition, this.origin, this.upVector);

        mat4.multiply(this.projectionMatrix, viewMatrix, this.viewProjMatrix);
        return this.viewProjMatrix;
      }
      // --------------------renderBundle
      // this.renderables = [this.planet];
      // --------------------

      this.eyePosition = vec3.fromValues(0, 50, -100);
      this.upVector = vec3.fromValues(0, 1, 0);
      this.origin = vec3.fromValues(0, 0, 0);

      this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 2000.0);
      const viewMatrix = mat4.lookAt(this.eyePosition, this.origin, this.upVector);

      const lightPosition = vec3.fromValues(50, 100, -100);
      const lightViewMatrix = mat4.lookAt(lightPosition, this.origin, this.upVector);
      const lightProjectionMatrix = mat4.create();
      {
        const left = -80;
        const right = 80;
        const bottom = -80;
        const top = 80;
        const near = -200;
        const far = 300;
        mat4.ortho(left, right, bottom, top, near, far, lightProjectionMatrix);
      }

      const lightViewProjMatrix = mat4.multiply(
        lightProjectionMatrix,
        lightViewMatrix
      );

      this.viewProjMatrix = mat4.multiply(this.projectionMatrix, viewMatrix);

      // Move the model so it's centered.
      const modelMatrix = mat4.translation([0, -45, 0]);

      // The camera/light aren't moving, so write them into buffers now.
      {
        const lightMatrixData = lightViewProjMatrix; // as Float32Array;
        this.device.queue.writeBuffer(
          this.sceneUniformBuffer,
          0,
          lightMatrixData.buffer,
          lightMatrixData.byteOffset,
          lightMatrixData.byteLength
        );

        const cameraMatrixData = this.viewProjMatrix; //  as Float32Array;
        this.device.queue.writeBuffer(
          this.sceneUniformBuffer,
          64,
          cameraMatrixData.buffer,
          cameraMatrixData.byteOffset,
          cameraMatrixData.byteLength
        );

        const lightData = lightPosition; // as Float32Array;
        this.device.queue.writeBuffer(
          this.sceneUniformBuffer,
          128,
          lightData.buffer,
          lightData.byteOffset,
          lightData.byteLength
        );

        const modelData = modelMatrix; // as Float32Array;
        this.device.queue.writeBuffer(
          this.modelUniformBuffer,
          0,
          modelData.buffer,
          modelData.byteOffset,
          modelData.byteLength
        );
      }

      this.shadowPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment: {
          view: this.shadowDepthTextureView,
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
        },
      };

      this.done = true;
    })
  }

  draw = (commandEncoder) => {
    // let commandEncoder = this.device.createCommandEncoder();
    if(this.done == false) return;

    const cameraViewProj = this.getCameraViewProjMatrix();
    this.device.queue.writeBuffer(
      this.sceneUniformBuffer,
      64,
      cameraViewProj.buffer,
      cameraViewProj.byteOffset,
      cameraViewProj.byteLength
    );


    // console.log('log this.cameraViewProj', cameraViewProj)

    this.renderPassDescriptor.colorAttachments[0].view = this.context
      .getCurrentTexture()
      .createView();
    //  const commandEncoder = this.device.createCommandEncoder();
    {
      const shadowPass = commandEncoder.beginRenderPass(this.shadowPassDescriptor);
      shadowPass.setPipeline(this.shadowPipeline);
      shadowPass.setBindGroup(0, this.sceneBindGroupForShadow);
      shadowPass.setBindGroup(1, this.modelBindGroup);
      shadowPass.setVertexBuffer(0, this.vertexBuffer);
      shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
      shadowPass.drawIndexed(this.indexCount);
      shadowPass.end();
    }
    {
      const renderPass = commandEncoder.beginRenderPass(this.renderPassDescriptor);
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.sceneBindGroupForRender);
      renderPass.setBindGroup(1, this.modelBindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
      renderPass.drawIndexed(this.indexCount);

      renderPass.end();
    }

    //  this.device.queue.submit([commandEncoder.finish()]);
    // requestAnimationFrame(frame);

  }

}