import {UNLIT_SHADER} from "../shaders/shaders";
import {mat4, vec3} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {createInputHandler} from "./engine";

export default class MEBall {

  constructor(canvas, device, context, o) {
    this.context = context;
    this.device = device;

    // The input handler
    this.inputHandler = createInputHandler(window, canvas);
    this.cameras = o.cameras;
    this.scale = o.scale;
    console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef)
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    } // |  WASD 'arcball' };

    this.lastFrameMS = 0;

    this.entityArgPass = o.entityArgPass;

    this.SphereLayout = {
      vertexStride: 8 * 4,
      positionsOffset: 0,
      normalOffset: 3 * 4,
      uvOffset: 6 * 4,
    };

    this.texturesPaths = [];

    o.texturesPaths.forEach((t) => {
      this.texturesPaths.push(t)
    })

    this.position = new Position(o.position.x, o.position.y, o.position.z)
    this.rotation = new Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;

    this.shaderModule = device.createShaderModule({code: UNLIT_SHADER});
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: this.SphereLayout.vertexStride,
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: this.SphereLayout.positionsOffset,
                format: 'float32x3',
              },
              {
                // normal
                shaderLocation: 1,
                offset: this.SphereLayout.normalOffset,
                format: 'float32x3',
              },
              {
                // uv
                shaderLocation: 2,
                offset: this.SphereLayout.uvOffset,
                format: 'float32x2',
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: this.presentationFormat,
          },
        ],
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
    this.texture0 = null;
    this.moonTexture = null;

    this.settings = {
      useRenderBundles: true,
      asteroidCount: 15,
    };

    this.loadTex0(this.texturesPaths, device).then(() => {
      this.loadTex1(device).then(() => {
        this.sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
        });

        this.transform = mat4.create();
        mat4.identity(this.transform);

        // Create one large central planet surrounded by a large ring of asteroids
        this.planet = this.createGeometry(this.scale);
        this.planet.bindGroup = this.createSphereBindGroup(this.texture0, this.transform);

        var asteroids = [
          this.createGeometry(12, 8, 6, 0.15),
        ];

        this.renderables = [this.planet];

        // this.ensureEnoughAsteroids(asteroids, this.transform);
        this.renderPassDescriptor = {
          colorAttachments: [
            {
              view: undefined,
              clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
              loadOp:  this.entityArgPass.loadOp,
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
              resource: {
                buffer: this.uniformBuffer,
              },
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
    console.log('updateRenderBundle')
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      colorFormats: [this.presentationFormat],
      depthStencilFormat: 'depth24plus',
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }

  createGeometry(radius, widthSegments = 8, heightSegments = 4, randomness = 0) {

    const sphereMesh = this.createSphereMesh(radius, widthSegments, heightSegments, randomness);
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

  getTransformationMatrix(pos) {
    // const viewMatrix = mat4.identity();
    const now = Date.now();
    const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
    this.lastFrameMS = now;

    // const viewMatrix = mat4.identity(); ORI
    const camera = this.cameras[this.mainCameraParams.type];
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

  async loadTex0(paths, device) {
    return new Promise(async (resolve) => {
      const response = await fetch(paths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      console.log('loadTex0 WHAT IS THIS -> ', this)
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

  createSphereMesh(radius, widthSegments = 3, heightSegments = 3, randomness = 0) {
    const vertices = [];
    const indices = [];

    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const firstVertex = vec3.create();
    const vertex = vec3.create();
    const normal = vec3.create();

    let index = 0;
    const grid = [];

    // generate vertices, normals and uvs
    for(let iy = 0;iy <= heightSegments;iy++) {
      const verticesRow = [];
      const v = iy / heightSegments;
      // special case for the poles
      let uOffset = 0;
      if(iy === 0) {
        uOffset = 0.5 / widthSegments;
      } else if(iy === heightSegments) {
        uOffset = -0.5 / widthSegments;
      }

      for(let ix = 0;ix <= widthSegments;ix++) {
        const u = ix / widthSegments;
        // Poles should just use the same position all the way around.
        if(ix == widthSegments) {
          vec3.copy(firstVertex, vertex);
        } else if(ix == 0 || (iy != 0 && iy !== heightSegments)) {
          const rr = radius + (Math.random() - 0.5) * 2 * randomness * radius;
          // vertex
          vertex[0] = -rr * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
          vertex[1] = rr * Math.cos(v * Math.PI);
          vertex[2] = rr * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
          if(ix == 0) {
            vec3.copy(vertex, firstVertex);
          }
        }
        vertices.push(...vertex);

        // normal
        vec3.copy(vertex, normal);
        vec3.normalize(normal, normal);
        vertices.push(...normal);
        // uv
        vertices.push(u + uOffset, 1 - v);
        verticesRow.push(index++);
      }
      grid.push(verticesRow);
    }
    // indices
    for(let iy = 0;iy < heightSegments;iy++) {
      for(let ix = 0;ix < widthSegments;ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];

        if(iy !== 0) indices.push(a, b, d);
        if(iy !== heightSegments - 1) indices.push(b, c, d);
      }
    }

    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices),
    };
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