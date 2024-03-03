import {BALL_SHADER} from "../shaders/shaders";
import {SphereLayout} from "./ballsBuffer";
import {mat4, vec3} from 'wgpu-matrix';

export default class MECube {

  constructor(canvas, device, context ) {
    this.device = device;
    this.context = context;
    
    this.shaderModule = device.createShaderModule({
      code: BALL_SHADER,
    });

    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

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

    this.uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Fetch the images and upload them into a GPUTexture.
    this.planetTexture = null;
    this.moonTexture = null;

    this.settings = {
      useRenderBundles: true,
      asteroidCount: 15,
    };

    this.loadTex1(device).then(() => {
      this.loadTex2(device).then(() => {

        this.sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
        });

        this.transform = mat4.create();
        mat4.identity(this.transform);

        // Create one large central planet surrounded by a large ring of asteroids
        this.planet = this.createSphereRenderable(1.0);
        this.planet.bindGroup = this.createSphereBindGroup(this.planetTexture, this.transform);

        var asteroids = [
          this.createSphereRenderable(0.2, 8, 6, 0.15),
          this.createSphereRenderable(0.13, 8, 6, 0.15)
        ];

        this.renderables = [this.planet];

        // this.ensureEnoughAsteroids(asteroids, this.transform);

        this.renderPassDescriptor = {
          colorAttachments: [
            {
              view: undefined,
              clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
              loadOp: 'clear',
              storeOp: 'store',
            },
          ],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
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
    console.log('sss')
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      colorFormats: [this.presentationFormat],
      depthStencilFormat: 'depth24plus',
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }

  createSphereRenderable(radius, widthSegments = 32, heightSegments = 16, randomness = 0) {

    const sphereMesh = this.createCubeVertices();
    // Create a vertex buffer from the sphere data.
    const vertices = this.device.createBuffer({
      size: sphereMesh.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(vertices.getMappedRange()).set(sphereMesh.vertices);
    vertices.unmap();

    const indices = this.device.createBuffer({
      size: sphereMesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(indices.getMappedRange()).set(sphereMesh.indices);
    indices.unmap();

    return {
      vertices,
      indices,
      indexCount: sphereMesh.indices.length,
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

  getTransformationMatrix() {
    const viewMatrix = mat4.identity();
    mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
    const now = Date.now() / 1000;
    mat4.rotateZ(viewMatrix, Math.PI * 0, viewMatrix);
    mat4.rotateX(viewMatrix, Math.PI * 0, viewMatrix);
    mat4.rotateY(viewMatrix, now * 1, viewMatrix);
    mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);
    return this.modelViewProjectionMatrix;
  }

  async loadTex2(device) {
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

  async loadTex1(device) {
    return new Promise(async (resolve) => {
      const response = await fetch('./res/textures/tex1.jpg');
      const imageBitmap = await createImageBitmap(await response.blob());
      console.log('WHAT IS THIS ', this)
      this.planetTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      var planetTexture = this.planetTexture
      device.queue.copyExternalImageToTexture(
        {source: imageBitmap},
        {texture: planetTexture},
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

  createCubeVertices(options) {
    if(typeof options === 'undefined') {
      var options = {
        scale: 1
      }
    }

    const vertices = new Float32Array([
      //  position   |  texture coordinate
      //-------------+----------------------
      // front face     select the top left image  1, 0.5,   

      -1, 1, 1, 1, 0, 0, 0, 0,
      -1, -1, 1, 1, 0, 0, 0, 0.5,
      1, 1, 1, 1, 0, 0, 0.25, 0,
      1, -1, 1, 1, 0, 0, 0.25, 0.5,

      // right face     select the top middle image
      1, 1, -1, 1, 0, 0, 0.25, 0,
      1, 1, 1, 1, 0, 0, 0.5, 0,
      1, -1, -1, 1, 0, 0, 0.25, 0.5,
      1, -1, 1, 1, 0, 0, 0.5, 0.5,
      // back face      select to top right image
      1, 1, -1, 1, 0, 0, 0.5, 0,
      1, -1, -1, 1, 0, 0, 0.5, 0.5,
      -1, 1, -1, 1, 0, 0, 0.75, 0,
      -1, -1, -1, 1, 0, 0, 0.75, 0.5,
      // left face       select the bottom left image
      -1, 1, 1, 1, 0, 0, 0, 0.5,
      -1, 1, -1, 1, 0, 0, 0.25, 0.5,
      -1, -1, 1, 1, 0, 0, 0, 1,
      -1, -1, -1, 1, 0, 0, 0.25, 1,
      // bottom face     select the bottom middle image
      1, -1, 1, 1, 0, 0, 0.25, 0.5,
      -1, -1, 1, 1, 0, 0, 0.5, 0.5,
      1, -1, -1, 1, 0, 0, 0.25, 1,
      -1, -1, -1, 1, 0, 0, 0.5, 1,
      // top face        select the bottom right image
      -1, 1, 1, 1, 0, 0, 0.5, 0.5,
      1, 1, 1, 1, 0, 0, 0.75, 0.5,
      -1, 1, -1, 1, 0, 0, 0.5, 1,
      1, 1, -1, 1, 0, 0, 0.75, 1,
    ]);

    const indices = new Uint16Array([
      0, 1, 2, 2, 1, 3,  // front
      4, 5, 6, 6, 5, 7,  // right
      8, 9, 10, 10, 9, 11,  // back
      12, 13, 14, 14, 13, 15,  // left
      16, 17, 18, 18, 17, 19,  // bottom
      20, 21, 22, 22, 21, 23,  // top
    ]);

    return {
      vertices,
      indices,
      numVertices: indices.length,
    };
  }

  draw = () => {
  if(this.moonTexture == null) {
    console.log('not ready')
    return;
  }
  const transformationMatrix = this.getTransformationMatrix(0, 0.5, -5);
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