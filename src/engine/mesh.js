import {BALL_SHADER, vertexShadowWGSL} from "../shaders/shaders";
import {mat4, vec3} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {createInputHandler} from "./engine";
import {makeMeshData1} from "./matrix-mesh";

var SphereLayout = {
  vertexStride: 8 * 4,
  positionsOffset: 0,
  normalOffset: 3 * 4,
  uvOffset: 6 * 4,
};

export default class MEMesh {

  constructor(canvas, device, context, o) {
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;

    this.mesh = o.mesh;

    // The input handler
    this.inputHandler = createInputHandler(window, canvas);
    this.cameras = o.cameras;

    console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef)
    this.cameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    } // |  WASD 'arcball' };

    this.lastFrameMS = 0;

    console.log('passed args', o.entityArgPass)
    this.shaderModule = device.createShaderModule({
      code: BALL_SHADER,
    });

    this.texturesPaths = [];

    o.texturesPaths.forEach((t) => {
      this.texturesPaths.push(t)
    })

    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new Position(o.position.x, o.position.y, o.position.z);
    console.log('cube added on pos : ', this.position)
    this.rotation = new Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;

    this.scale = o.scale;

    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: SphereLayout.vertexStride,
            attributes: [
              // position
              {shaderLocation: 0, offset: SphereLayout.positionsOffset, format: 'float32x3'},
              // normal
              {shaderLocation: 1, offset: SphereLayout.normalOffset, format: 'float32x3'},
              // uv
              {shaderLocation: 2, offset: SphereLayout.uvOffset, format: 'float32x2', },
            ],
          },
        ],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{format: this.presentationFormat, },],
      },
      primitive: {
        topology: 'triangle-list',
        // Backface culling since the sphere is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back',
      },
      // Enable depth testing so that the fragment closest to the camera
      // is rendered in front.
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    });

    this.depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // new

    this.mesh = makeMeshData1(this.mesh)
    this.shadowDepthTextureSize = 1024;
    // Create the model vertex buffer.
    const vertexBuffer = device.createBuffer({
      size: this.mesh.positions.length * 3 * 2 * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    {
      console.log('.....')
      const mapping = new Float32Array(vertexBuffer.getMappedRange());
      for(let i = 0;i < this.mesh.positions.length;++i) {
        mapping.set(this.mesh.positions[i], 6 * i);
        mapping.set(this.mesh.normals[i], 6 * i + 3);
      }
      vertexBuffer.unmap();
    }

    // Create the model index buffer.
    const indexCount = this.mesh.triangles.length * 3;
    const indexBuffer = device.createBuffer({
      size: indexCount * Uint16Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    {
      const mapping = new Uint16Array(indexBuffer.getMappedRange());
      for(let i = 0;i < this.mesh.triangles.length;++i) {
        mapping.set(this.mesh.triangles[i], 3 * i);
      }
      indexBuffer.unmap();
    }

    // Create the depth texture for rendering/sampling the shadow map.
    let shadowDepthTexture = device.createTexture({
      size: [this.shadowDepthTextureSize, this.shadowDepthTextureSize, 1],
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'depth32float',
    });
    this.shadowDepthTextureView = shadowDepthTexture.createView();

    // - end new

    this.uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Fetch the images and upload them into a GPUTexture.
    this.texture0 = null;
    this.moonTexture = null;

    this.settings = {
      useRenderBundles: true,
      asteroidCount: 2,
    };


    // new

    this.createShadowsPipline();

    // new

    this.loadTex0(this.texturesPaths, device).then(() => {
      this.loadTex1(device).then(() => {

        this.sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
        });

        this.transform = mat4.create();
        mat4.identity(this.transform);

        // Create one large central planet surrounded by a large ring of asteroids
        this.planet = this.createGeometry({
          scale: this.scale,
          useUVShema4x2: false
        });
        this.planet.bindGroup = this.createSphereBindGroup(this.texture0, this.transform);

        // can be used like instance draws
        var asteroids = [
          // this.createGeometry(0.2, 8, 6, 0.15),
        ];

        this.renderables = [this.planet];
        // this.ensureEnoughAsteroids(asteroids, this.transform);
        this.renderPassDescriptor = {
          colorAttachments: [
            {
              view: undefined,
              clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
              loadOp: this.entityArgPass.loadOp,
              storeOp: this.entityArgPass.storeOp,
            },
          ],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: this.entityArgPass.depthLoadOp,
            depthStoreOp: this.entityArgPass.depthStoreOp,
          },
        };

        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
        this.modelViewProjectionMatrix = mat4.create();

        this.frameBindGroup = device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [
            {
              binding: 0,
              resource: {buffer: this.uniformBuffer, },
            },
          ],
        });

        // The render bundle can be encoded once and re-used as many times as needed.
        // Because it encodes all of the commands needed to render at the GPU level,
        // those commands will not need to execute the associated JavaScript code upon
        // execution or be re-validated, which can represent a significant time savings.
        //
        // However, because render bundles are immutable once created, they are only
        // appropriate for rendering content where the same commands will be executed
        // every time, with the only changes being the contents of the buffers and
        // textures used. Cases where the executed commands differ from frame-to-frame,
        // such as when using frustrum or occlusion culling, will not benefit from
        // using render bundles as much.
        this.renderBundle;
        this.updateRenderBundle();
      })
    })
  }

  ensureEnoughAsteroids(asteroids, transform) {
    for(let i = this.renderables.length;i <= this.settings.asteroidCount;++i) {
      // Place copies of the asteroid in a ring.
      const radius = Math.random() * 1.7 + 1.25;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.015;
      const z = Math.cos(angle) * radius;

      mat4.identity(transform);
      mat4.translate(transform, [x, y, z], transform);
      mat4.rotateX(transform, Math.random() * Math.PI, transform);
      mat4.rotateY(transform, Math.random() * Math.PI, transform);
      this.renderables.push({
        ...asteroids[i % asteroids.length],
        bindGroup: this.createSphereBindGroup(this.moonTexture, transform),
      });
    }
  }

  updateRenderBundle() {
    console.log('[CUBE] updateRenderBundle')
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      colorFormats: [this.presentationFormat],
      depthStencilFormat: 'depth24plus',
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }

  createGeometry(options) {
    console.log('TEST ....')
    const mesh = this.mesh;
    // Create a vertex buffer from the sphere data.
    const vertices = this.device.createBuffer({
      size: mesh.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(vertices.getMappedRange()).set(mesh.vertices);
    vertices.unmap();

    const indices = this.device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(indices.getMappedRange()).set(mesh.indices);
    indices.unmap();

    return {
      vertices,
      indices,
      indexCount: mesh.indices.length,
    };
  }

  createSphereBindGroup(texture, transform) {

    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = this.device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(transform);
    uniformBuffer.unmap();

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: this.sampler,
        },
        {
          binding: 2,
          resource: texture.createView(),
        },
      ],
    });

    return bindGroup;
  }

  getTransformationMatrix(pos) {
    const now = Date.now();
    const deltaTime = (now - this.lastFrameMS) / this.cameraParams.responseCoef;
    this.lastFrameMS = now;

    // const viewMatrix = mat4.identity(); ORI
    const camera = this.cameras[this.cameraParams.type];
    const viewMatrix = camera.update(deltaTime, this.inputHandler());

    mat4.translate(viewMatrix, vec3.fromValues(pos.x, pos.y, pos.z), viewMatrix);
    mat4.rotateX(viewMatrix, Math.PI * this.rotation.getRotX(), viewMatrix);
    mat4.rotateY(viewMatrix, Math.PI * this.rotation.getRotY(), viewMatrix);
    mat4.rotateZ(viewMatrix, Math.PI * this.rotation.getRotZ(), viewMatrix);
    mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);

    return this.modelViewProjectionMatrix;
  }

  async loadTex1(device) {
    return new Promise(async (resolve) => {
      const response = await fetch('./res/textures/tex1.jpg');
      const imageBitmap = await createImageBitmap(await response.blob());
      this.moonTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      var moonTexture = this.moonTexture
      device.queue.copyExternalImageToTexture(
        {source: imageBitmap},
        {texture: moonTexture},
        [imageBitmap.width, imageBitmap.height]
      );
      resolve()
    })
  }

  async loadTex0(texturesPaths, device) {
    return new Promise(async (resolve) => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      console.log('WHAT IS THIS ', this)
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      var texture0 = this.texture0
      device.queue.copyExternalImageToTexture(
        {source: imageBitmap},
        {texture: texture0},
        [imageBitmap.width, imageBitmap.height]
      );
      resolve()
    })

  }


  // Render bundles function as partial, limited render passes, so we can use the
  // same code both to render the scene normally and to build the render bundle.
  renderScene(passEncoder) {

    if(typeof this.renderables === 'undefined') return;

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.frameBindGroup);

    // Loop through every renderable object and draw them individually.
    // (Because many of these meshes are repeated, with only the transforms
    // differing, instancing would be highly effective here. This sample
    // intentionally avoids using instancing in order to emulate a more complex
    // scene, which helps demonstrate the potential time savings a render bundle
    // can provide.)
    let count = 0;
    for(const renderable of this.renderables) {
      passEncoder.setBindGroup(1, renderable.bindGroup);
      passEncoder.setVertexBuffer(0, renderable.vertices);
      passEncoder.setIndexBuffer(renderable.indices, 'uint16');
      passEncoder.drawIndexed(renderable.indexCount);
      if(++count > this.settings.asteroidCount) {
        break;
      }
    }
  }

  createShadowsPipline() {

    // Create some common descriptors used for both the shadow pipeline
    // and the color rendering pipeline.
    const vertexBuffers = [
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
    const uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
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
          uniformBufferBindGroupLayout,
          uniformBufferBindGroupLayout,
        ],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: vertexShadowWGSL,
        }),
        buffers: vertexBuffers,
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
      },
      primitive,
    });

    //


    // Create a bind group layout which holds the scene uniforms and
    // the texture+sampler for depth. We create it manually because the WebPU
    // implementation doesn't infer this from the shader (yet).
    const bglForRender = this.device.createBindGroupLayout({
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


    const modelUniformBuffer = this.device.createBuffer({
      size: 4 * 16, // 4x4 matrix
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const sceneUniformBuffer = this.device.createBuffer({
      // Two 4x4 viewProj matrices,
      // one for the camera and one for the light.
      // Then a vec3 for the light position.
      // Rounded to the nearest multiple of 16.
      size: 2 * 4 * 16 + 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const sceneBindGroupForShadow = this.device.createBindGroup({
      layout: uniformBufferBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: sceneUniformBuffer,
          },
        },
      ],
    });

    const sceneBindGroupForRender = this.device.createBindGroup({
      layout: bglForRender,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: sceneUniformBuffer,
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

    const modelBindGroup = this.device.createBindGroup({
      layout: uniformBufferBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: modelUniformBuffer,
          },
        },
      ],
    });

    //


    this.createLight()

    //

  }

  createLight() {

    const upVector = vec3.fromValues(0, 1, 0);
    const origin = vec3.fromValues(0, 0, 0);

    this.lightPosition = vec3.fromValues(50, 100, -100);
    this.lightViewMatrix = mat4.lookAt(this.lightPosition, origin, upVector);
    this.lightProjectionMatrix = mat4.create();
    {
      const left = -80;
      const right = 80;
      const bottom = -80;
      const top = 80;
      const near = -200;
      const far = 300;
      mat4.ortho(left, right, bottom, top, near, far, this.lightProjectionMatrix);
    }

    this.lightViewProjMatrix = mat4.multiply(
      this.lightProjectionMatrix,
      this.lightViewMatrix
    );

  }

  draw = () => {
    if(this.moonTexture == null) {
      console.log('not ready')
      return;
    }
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      transformationMatrix.buffer,
      transformationMatrix.byteOffset,
      transformationMatrix.byteLength
    );
    this.renderPassDescriptor.colorAttachments[0].view = this.context
      .getCurrentTexture()
      .createView();
  }
}