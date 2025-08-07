/**
 * @description
 * Created for matrix-engine-wgpu project.
 * MeshObj class estends Materials.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */

export default class Materials {
  constructor(device) {
    this.device = device;
    this.isVideo = false;
    // For shadow comparison
    this.compareSampler = this.device.createSampler({compare: 'less'});
    // For image textures (standard sampler)
    this.imageSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    // For external video textures (needs to be filtering sampler too!)
    this.videoSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
  }

  async loadTex0(texturesPaths) {
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    return new Promise(async (resolve) => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.texture0 = this.device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1], // REMOVED 1
        format: 'rgba8unorm',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.device.queue.copyExternalImageToTexture(
        {source: imageBitmap},
        {texture: this.texture0},
        [imageBitmap.width, imageBitmap.height]
      );
      resolve()
    })
  }

  async loadVideoTexture(arg) {
    this.isVideo = true;
    if(arg.type === 'video') {
      this.video = document.createElement('video');
      this.video.src = arg.src || 'res/videos/tunel.mp4';
      this.video.crossOrigin = 'anonymous';
      this.video.autoplay = true;
      this.video.loop = true;
      document.body.append(this.video);
      this.video.style.display = 'none';
      await this.video.play();
    } else if(arg.type === 'videoElement') {
      this.video = arg.el;
      await this.video.play();
    } else if(arg.type === 'camera') {
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      document.body.append(this.video);

      try {
        const stream = await (navigator.mediaDevices?.getUserMedia?.({
          video: {
            width: {ideal: 1280},
            height: {ideal: 720},
          },
          audio: false
        }));

        this.video.srcObject = stream;
        await this.video.play();
      } catch(err) {
        console.error("❌ Failed to access camera:", err);
        return;
      }
    } else if(arg.type === 'canvas2d') {
      // Existing canvas (arg.el) — assume it's actively drawing
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      document.body.append(this.video);

      // Create stream from existing canvas
      const stream = arg.el.captureStream?.() || arg.el.mozCaptureStream?.();
      if(!stream) {
        console.error('❌ Cannot capture stream from canvas2d');
        return;
      }

      this.video.srcObject = stream;
      await this.video.play();

    } else if(arg.type === 'canvas2d-inline') {
      // Miniature inline-drawn canvas created dynamically
      const canvas = document.createElement('canvas');
      canvas.width = arg.width || 256;
      canvas.height = arg.height || 256;
      const ctx = canvas.getContext('2d');

      if(typeof arg.canvaInlineProgram === 'function') {
        // Start drawing loop
        const drawLoop = () => {
          arg.canvaInlineProgram(ctx, canvas);
          requestAnimationFrame(drawLoop);
        };
        drawLoop();
      }

      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      document.body.append(this.video);

      const stream = canvas.captureStream?.() || canvas.mozCaptureStream?.();
      if(!stream) {
        console.error('❌ Cannot capture stream from inline canvas');
        return;
      }

      this.video.srcObject = stream;
      await this.video.play();
    }

    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // ✅ Now
    // includes externalTexture type
    this.createLayoutForRender();
    this.setupPipeline();
    setTimeout(() => this.createBindGroupForRender(), 1500);
  }

  updateVideoTexture() {
    if(!this.video || this.video.readyState < 2) return;
    this.externalTexture = this.device.importExternalTexture({source: this.video});
    this.createBindGroupForRender();
  }

  createBindGroupForRender() {
    const textureResource = this.isVideo
      ? this.externalTexture // must be set via updateVideoTexture
      : this.texture0.createView();
    // Log all bindings to debug
    if(!textureResource || !this.sceneUniformBuffer || !this.shadowDepthTextureView || !this.sampler) {
      console.warn("❗Missing res skipping...");
      return;
    }

    if(this.isVideo == true) {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [
          {
            binding: 0,
            resource: {buffer: this.sceneUniformBuffer},
          },
          {
            binding: 1,
            resource: this.shadowDepthTextureView,
          },
          {
            binding: 2,
            resource: this.compareSampler,
          },
          {
            binding: 3,
            resource: textureResource,
          },
          {
            binding: 4,
            resource: this.videoSampler,
          },
        ],
      });
    } else {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [
          {
            binding: 0,
            resource: {buffer: this.sceneUniformBuffer},
          },
          {
            binding: 1,
            resource: this.shadowDepthTextureView,
          },
          {
            binding: 2,
            resource: this.compareSampler,
          },
          {
            binding: 3,
            resource: textureResource,
          },
          {
            binding: 4,
            resource: this.imageSampler,
          },
        ],
      });
    }
  }

  createLayoutForRender() {
    this.bglForRender = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {type: 'uniform'},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {sampleType: 'depth'},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {type: 'comparison'},
        },
        ...(this.isVideo
          ? [ // VIDEO
            {
              binding: 3,
              visibility: GPUShaderStage.FRAGMENT,
              externalTexture: {},
            },
            {
              binding: 4,
              visibility: GPUShaderStage.FRAGMENT,
              sampler: {type: 'filtering'}, // for video sampling
            },
          ]
          : [ // IMAGE
            {
              binding: 3,
              visibility: GPUShaderStage.FRAGMENT,
              texture: {
                sampleType: 'float',
                viewDimension: '2d',
              },
            },
            {
              binding: 4,
              visibility: GPUShaderStage.FRAGMENT,
              sampler: {type: 'filtering'},
            },
          ])
      ],
    });
  }
}