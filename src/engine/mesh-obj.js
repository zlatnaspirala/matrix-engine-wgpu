import {mat4, vec3} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {createInputHandler} from "./engine";
import {vertexShadowWGSL} from '../shaders/vertexShadow.wgsl';
import {fragmentWGSL} from '../shaders/fragment.wgsl';
import {vertexWGSL} from '../shaders/vertex.wgsl';

export default class MEMeshObj {

  constructor(canvas, device, context, o) {

    this.done = false;
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;

    // Mesh stuff
    this.mesh = o.mesh;
    this.mesh.uvs = this.mesh.textures;
    console.log('mesh obj: ', this.mesh)

    this.inputHandler = createInputHandler(window, canvas);
    this.cameras = o.cameras;

    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    }

    this.lastFrameMS = 0;
    this.texturesPaths = [];
    o.texturesPaths.forEach((t) => {this.texturesPaths.push(t)})

    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.position = new Position(o.position.x, o.position.y, o.position.z);
    this.rotation = new Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;

    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 1024;
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 2000.0);
        this.modelViewProjectionMatrix = mat4.create();
        // console.log('cube added texturesPaths: ', this.texturesPaths)
        this.loadTex0(this.texturesPaths, device).then(() => {
          // console.log('loaded tex buffer for mesh:', this.texture0)
          resolve()
        })
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
        size: this.mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      {
        // const mapping = new Float32Array(this.vertexBuffer.getMappedRange());
        // // for(let i = 0;i < this.mesh.vertices.length;++i) {
        // //   mapping.set(this.mesh.vertices[i], 6 * i);
        // //   mapping.set(this.mesh.normals[i], 6 * i + 3);
        // // }
        // this.vertexBuffer.unmap();
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.mesh.vertices);
        this.vertexBuffer.unmap();
      }

      // NIDZA TEST SECOUND BUFFER
      // Create the model vertex buffer.
      this.vertexNormalsBuffer = this.device.createBuffer({
        size: this.mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      {
        new Float32Array(this.vertexNormalsBuffer.getMappedRange()).set(this.mesh.vertexNormals);
        this.vertexNormalsBuffer.unmap();
      }

      this.vertexTexCoordsBuffer = this.device.createBuffer({
        size: this.mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      {
        new Float32Array(this.vertexTexCoordsBuffer.getMappedRange()).set(this.mesh.textures);
        this.vertexTexCoordsBuffer.unmap();
      }

      // Create the model index buffer.
      this.indexCount = this.mesh.indices.length;
      this.indexBuffer = this.device.createBuffer({
        size: this.indexCount * Uint16Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
      });
      {
        // const mapping = new Uint16Array(this.indexBuffer.getMappedRange());
        // for(let i = 0;i < this.mesh.indices.length;++i) {
        //   mapping.set(this.mesh.indices[i], i);
        // }
        new Uint16Array(this.indexBuffer.getMappedRange()).set(this.mesh.indices);
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
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: 0,
              format: "float32x3",
            }
          ],
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [
            {
              // normal
              shaderLocation: 1,
              offset: 0,
              format: "float32x3",
            },
          ],
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          attributes: [
            {
              // uvs
              shaderLocation: 2,
              offset: 0,
              format: "float32x2",
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
          {
            binding: 3,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: 'float',
            }
          },
          {
            binding: 4,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            sampler: {
              type: 'filtering',
            }
          }
        ]
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
          {
            binding: 3,
            resource: this.texture0.createView(),
          },
          {
            binding: 4,
            resource: this.sampler,
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
      this.getTransformationMatrix = (pos) => {
        const now = Date.now();
        const deltaTime = (now - this.lastFrameMS) / this.cameraParams.responseCoef;
        this.lastFrameMS = now;

        // const this.viewMatrix = mat4.identity()
        const camera = this.cameras[this.cameraParams.type];
        this.viewMatrix = camera.update(deltaTime, this.inputHandler());

        mat4.translate(this.viewMatrix, vec3.fromValues(pos.x, pos.y, pos.z), this.viewMatrix);
        mat4.rotateX(this.viewMatrix, Math.PI * this.rotation.getRotX(), this.viewMatrix);
        mat4.rotateY(this.viewMatrix, Math.PI * this.rotation.getRotY(), this.viewMatrix);
        mat4.rotateZ(this.viewMatrix, Math.PI * this.rotation.getRotZ(), this.viewMatrix);
        mat4.multiply(this.projectionMatrix, this.viewMatrix, this.modelViewProjectionMatrix);

        return this.modelViewProjectionMatrix;
      }

      this.upVector = vec3.fromValues(0, 1, 0);
      this.origin = vec3.fromValues(0, 0, 0);

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

      // looks like affect on transformations for now const 0
      const modelMatrix = mat4.translation([0, 0, 0]);
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

        const lightData = lightPosition;
        this.device.queue.writeBuffer(
          this.sceneUniformBuffer,
          128,
          lightData.buffer,
          lightData.byteOffset,
          lightData.byteLength
        );

        const modelData = modelMatrix;
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

  async loadTex0(texturesPaths, device) {

    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    return new Promise(async (resolve) => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });

      device.queue.copyExternalImageToTexture(
        {source: imageBitmap},
        {texture: this.texture0},
        [imageBitmap.width, imageBitmap.height]
      );
      resolve()
    })
  }

  draw = (commandEncoder) => {
    if(this.done == false) return;
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(
      this.sceneUniformBuffer,
      64,
      transformationMatrix.buffer,
      transformationMatrix.byteOffset,
      transformationMatrix.byteLength
    );
    this.renderPassDescriptor.colorAttachments[0].view = this.context
      .getCurrentTexture()
      .createView();
    {
      const shadowPass = commandEncoder.beginRenderPass(this.shadowPassDescriptor);
      shadowPass.setPipeline(this.shadowPipeline);
      shadowPass.setBindGroup(0, this.sceneBindGroupForShadow);
      shadowPass.setBindGroup(1, this.modelBindGroup);
      shadowPass.setVertexBuffer(0, this.vertexBuffer);
      shadowPass.setVertexBuffer(1, this.vertexNormalsBuffer);
      shadowPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
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
      renderPass.setVertexBuffer(1, this.vertexNormalsBuffer);
      renderPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
      renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
      renderPass.drawIndexed(this.indexCount);
      renderPass.end();
    }
  }
}