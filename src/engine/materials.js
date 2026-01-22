import {fragmentWGSL} from "../shaders/fragment.wgsl";
import {fragmentWGSLMetal} from "../shaders/fragment.wgsl.metal";
import {fragmentWGSLNormalMap} from "../shaders/fragment.wgsl.normalmap";
import {fragmentWGSLPong} from "../shaders/fragment.wgsl.pong";
import {fragmentWGSLPower} from "../shaders/fragment.wgsl.power";
import {LOG_FUNNY_ARCADE} from "./utils";

/**
 * @description
 * Created for matrix-engine-wgpu project. MeshObj class estends Materials.
 * @variable material is engine meta data variable not real material object.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */
export default class Materials {
  constructor(device, material, glb, textureCache) {
    this.device = device;
    this.textureCache = textureCache;
    this.glb = glb;
    this.material = material;
    this.isVideo = false;
    this.videoIsReady = 'NONE';
    this.compareSampler = this.device.createSampler({
      compare: 'less-equal',           // safer for shadow comparison
      addressModeU: 'clamp-to-edge',   // prevents UV leaking outside
      addressModeV: 'clamp-to-edge',
      magFilter: 'linear',             // smooth PCF
      minFilter: 'linear',
    });
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
    // FX effect
    this.postFXModeBuffer = this.device.createBuffer({
      size: 4, // u32 = 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // Dymmy buffer
    this.dummySpotlightUniformBuffer = this.device.createBuffer({
      size: 80, // Must match size in shader
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.dummySpotlightUniformBuffer, 0, new Float32Array(20));
    // Create a 1x1 RGBA texture filled with white
    const mrDummyTex = this.device.createTexture({
      size: [1, 1, 1],
      format: this.getFormat(),
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    // Upload a single pixel
    const pixel = new Uint8Array([255, 255, 255, 255]); // white RGBA
    this.device.queue.writeTexture(
      {texture: mrDummyTex},
      pixel,
      {bytesPerRow: 4},
      [1, 1, 1]
    );
    this.metallicRoughnessTextureView = mrDummyTex.createView();
    this.metallicRoughnessSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    // 4 floats for baseColorFactor + 1 metallic + 1 roughness + 2 pad floats = 8 floats
    const materialPBRSize = 8 * 4; // 32 bytes
    this.materialPBRBuffer = this.device.createBuffer({
      size: materialPBRSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // Dummy values
    const baseColorFactor = [1.0, 1.0, 1.0, 1.0];
    const metallicFactor = 0.1;    // diffuse like plastic
    const roughnessFactor = 0.5;   // some gloss
    const pad = [0.0, 0.0];
    // Pack into Float32Array
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      ...pad
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);

    if(this.material.type == 'normalmap') {
      const normalTexInfo = this.glb.glbJsonData.materials[0].normalTexture;
      if(normalTexInfo) {
        const tex = this.glb.glbJsonData.glbTextures[normalTexInfo.index];
        this.normalTextureView = tex.createView();
        this.normalSampler = this.device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
        });
      } else {
        // console.log('>>>ERRR >>>normalTexture>>')
      }
    } else {
      // console.log('>DUMMY>normalTexture>')
      // dummy for normal map 1x1 neutral normal map
      this.normalDummyTex = device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      // RGBA value for neutral normal in tangent space
      const neutralNormal = new Uint8Array([128, 128, 255, 255]);
      this.device.queue.writeTexture(
        {texture: this.normalDummyTex},
        neutralNormal,
        {bytesPerRow: 4},
        [1, 1, 1]
      );
      // Create texture view & sampler
      this.normalTextureView = this.normalDummyTex.createView();
      this.normalSampler = this.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      });
    }
  }

  createDummyTexture(device, size = 256) {
    const data = new Uint8Array(size * size * 4);

    for(let i = 0;i < data.length;i += 4) {
      data[i + 0] = 0;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    const texture = device.createTexture({
      size: [size, size],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST,
    });

    device.queue.writeTexture(
      {texture},
      data,
      {bytesPerRow: size * 4},
      {width: size, height: size}
    );

    return texture;
  }

  /**
 * Change ONLY base color texture (binding = 3)
 * Does NOT rebuild pipeline or layout
 */
  changeTexture(newTexture) {
    // Accept GPUTexture OR GPUTextureView
    if(newTexture instanceof GPUTexture) {
      this.texture0 = newTexture;
    } else {
      this.texture0 = {createView: () => newTexture};
    }
    this.isVideo = false;
    // Recreate bind group only
    this.createBindGroupForRender();
  }

  changeMaterial(newType = 'graph', graphShader) {
    this.material.fromGraph = graphShader;
    this.material.type = newType;
    console.log('NOW CALL SETUP PIPELINE');

  }


  getMaterial() {
    // console.log('Material TYPE:', this.material.type);
    if(this.material.type == 'standard') {
      return fragmentWGSL;
    } else if(this.material.type == 'pong') {
      return fragmentWGSLPong;
    } else if(this.material.type == 'power') {
      return fragmentWGSLPower;
    } else if(this.material.type == 'metal') {
      return fragmentWGSLMetal;
    } else if(this.material.type == 'normalmap') {
      return fragmentWGSLNormalMap;
    } else if (this.material.type == 'graph') {
      //
      return this.material.fromGraph;
    }
    console.warn('Unknown material type:', this.material?.type);
    return fragmentWGSL; // fallback
  }

  getFormat() {
    if(this.material?.format == 'darker') {
      return 'rgba8unorm-srgb';
    } else if(this.material?.format == 'normal') {
      return 'rgba8unorm';
    } else {
      return 'rgba8unorm';
    }
  }
  // not affect all fs
  setupMaterialPBR(metallicFactor) {
    const baseColorFactor = [1.0, 1.0, 1.0, 1.0];
    const roughnessFactor = 0.5;   // some gloss
    const pad = [0.0, 0.0];
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      ...pad
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
  }

  updatePostFXMode(mode) {
    const arrayBuffer = new Uint32Array([mode]);
    this.device.queue.writeBuffer(this.postFXModeBuffer, 0, arrayBuffer);
  }

  // async loadTex0(texturesPaths) {
  //   this.sampler = this.device.createSampler({
  //     magFilter: 'linear',
  //     minFilter: 'linear',
  //   });
  //   return new Promise(async (resolve) => {
  //     const response = await fetch(texturesPaths[0]);
  //     const imageBitmap = await createImageBitmap(await response.blob());
  //     this.texture0 = this.device.createTexture({
  //       size: [imageBitmap.width, imageBitmap.height, 1], // REMOVED 1
  //       format: this.getFormat(),
  //       usage:
  //         GPUTextureUsage.TEXTURE_BINDING |
  //         GPUTextureUsage.COPY_DST |
  //         GPUTextureUsage.RENDER_ATTACHMENT,
  //     });
  //     this.device.queue.copyExternalImageToTexture(
  //       {source: imageBitmap},
  //       {texture: this.texture0},
  //       [imageBitmap.width, imageBitmap.height]
  //     );
  //     resolve()
  //   })
  // }

  async loadTex0(texturesPaths) {
    const path = texturesPaths[0];

    const {texture, sampler} =
      await this.textureCache.get(path, this.getFormat());

    this.texture0 = texture;
    this.sampler = sampler;
  }

  async loadVideoTexture(arg) {
    this.videoIsReady = 'MAYBE';
    if(arg.type === 'video') {
      this.video = document.createElement('video');
      this.video.src = arg.src || 'res/videos/tunel.mp4';
      this.video.crossOrigin = 'anonymous';
      this.video.autoplay = true;
      this.video.loop = true;
      document.body.append(this.video);
      this.video.style.display = 'none';
      this.video.style.position = 'absolute';
      this.video.style.top = '750px';
      this.video.style.left = '50px';
      await this.video.play();
      this.isVideo = true;
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
        this.isVideo = true;
      } catch(err) {
        console.error("❌ Failed to access camera:", err);
        return;
      }
    } else if(arg.type === 'canvas2d') {
      // Existing canvas (arg.el) — assume it's actively drawing
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.crossOrigin = 'anonymous';
      this.video.style.display = 'none';
      document.body.append(this.video);
      const stream = arg.el.captureStream?.() || arg.el.mozCaptureStream?.();
      if(!stream) {console.error('❌ Cannot capture stream from canvas2d'); return;}
      this.video.srcObject = stream;
      await this.video.play();
      this.isVideo = true;
    } else if(arg.type === 'canvas2d-inline') {
      // console.log('what is arg', arg);
      // Miniature inline-drawn canvas created dynamically
      const canvas = document.createElement('canvas');
      canvas.width = arg.width || 256;
      canvas.height = arg.height || 256;
      canvas.style.position = 'absolute';
      canvas.style.left = '-1000px';
      canvas.style.top = '0';
      // canvas.style.zIndex = '10000';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      if(typeof arg.canvaInlineProgram === 'function') {
        const drawLoop = () => {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          arg.canvaInlineProgram(ctx, canvas, arg.specialCanvas2dArg);
          ctx.restore();
          requestAnimationFrame(drawLoop);
        };
        drawLoop();
      } else {
        ctx.fillStyle = '#0ce325ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      this.video = document.createElement('video');
      this.video.style.position = 'absolute';
      // this.video.style.zIndex = '1';
      this.video.style.left = '0px';
      this.video.style.top = '0';
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.srcObject = canvas.captureStream(60);
      document.body.append(this.video);
      await this.video.play();
      await new Promise(resolve => {
        const check = () => {
          if(this.video.readyState >= 2) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });
      // console.log('Canvas video stream READY');
      this.isVideo = true;
    }
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    // ✅ Now - maybe noT
    this.createLayoutForRender();
    this.createBindGroupForRender();
    // dispatchEvent(new CustomEvent('update-pipeine', {detail: {}}))
  }

  updateVideoTexture() {
    if(!this.video || this.video.readyState < 2) {
      // console.info('this.video.readyState', this.video.readyState)
      return;
    }
    if(!this.externalTexture) {
      // create it once
      this.externalTexture = this.device.importExternalTexture({source: this.video});
      this.createBindGroupForRender();
      this.videoIsReady = 'YES';
      console.log("%c✅video bind.", LOG_FUNNY_ARCADE);
    } else {
      this.externalTexture = this.device.importExternalTexture({source: this.video});
      this.createBindGroupForRender();
    }
  }

  getMaterialTexture(glb, materialIndex) {
    const matDef = glb.glbJsonData.materials[materialIndex];

    if(!matDef) {
      console.warn('[engine] no material in glb...');
      return null;
    }

    if(matDef.pbrMetallicRoughness?.baseColorTexture) {
      const texIndex = matDef.pbrMetallicRoughness.baseColorTexture.index;
      return glb.glbJsonData.glbTextures[texIndex].createView();
    }

    return null;
  }
  getMaterialTextureFromMaterial(material) {
    if(!material || !material.pbrMetallicRoughness) return this.fallbackTextureView;

    const texInfo = material.pbrMetallicRoughness.baseColorTexture;
    if(!texInfo) return this.fallbackTextureView;

    const texIndex = texInfo.index;
    return this.glb.glbTextures[texIndex].createView();
  }

  createBindGroupForRender() {
    let textureResource = this.isVideo
      ? this.externalTexture
      : this.texture0.createView();
    // console.log('TEST TEX this.texture0 ', this.texture0);
    if(this.material.useTextureFromGlb === true) {
      // 0 probably always for basicColor
      const material = this.skinnedNode.mesh.primitives[0].material;
      const textureView = material.baseColorTexture.imageView;
      // const sampler = material.baseColorTexture.sampler;
      textureResource = textureView;
    }

    if(!textureResource || !this.sceneUniformBuffer || !this.shadowDepthTextureView) {
      if(!textureResource) console.log("%c❗Missing res texture ", LOG_FUNNY_ARCADE);
      if(!this.sceneUniformBuffer) console.warn("❗Missing res: this.sceneUniformBuffer: ", this.sceneUniformBuffer);
      // if(!this.shadowDepthTextureView) // console.warn("❗Missing res: this.shadowDepthTextureView: ", this.shadowDepthTextureView);
      if(typeof textureResource === 'undefined') {
        this.updateVideoTexture();
      }
      return;
    }
    if(this.isVideo == true) {
      // console.info("✅ video sceneBindGroupForRender");
      this.sceneBindGroupForRender = this.device.createBindGroup({
        label: 'sceneBindGroupForRender [video]',
        layout: this.bglForRender,
        entries: [
          {binding: 0, resource: {buffer: this.sceneUniformBuffer}, },
          {binding: 1, resource: this.shadowDepthTextureView, },
          {binding: 2, resource: this.compareSampler, },
          {binding: 3, resource: textureResource, },
          {binding: 4, resource: this.videoSampler, },
          {binding: 5, resource: {buffer: this.postFXModeBuffer}}
        ],
      });
      // Special case for video maybe better solution exist
      if(this.video.paused == true) this.video.play();
    } else {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        label: 'sceneBindGroupForRender [mesh][materials]',
        layout: this.bglForRender,
        entries: [
          {binding: 0, resource: {buffer: this.sceneUniformBuffer}, },
          {binding: 1, resource: this.shadowDepthTextureView, },
          {binding: 2, resource: this.compareSampler, },
          {binding: 3, resource: textureResource, },
          {binding: 4, resource: this.imageSampler, },
          {binding: 5, resource: {buffer: !this.spotlightUniformBuffer ? this.dummySpotlightUniformBuffer : this.spotlightUniformBuffer}, },
          {binding: 6, resource: this.metallicRoughnessTextureView},
          {binding: 7, resource: this.metallicRoughnessSampler},
          {binding: 8, resource: {buffer: this.materialPBRBuffer}},
          // NEW: dummy normal map
          {binding: 9, resource: this.normalTextureView},
          {binding: 10, resource: this.normalSampler},
        ],
      });
    }
  }

  createLayoutForRender() {
    let e = [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: {type: 'uniform'},
      },
      ...(this.isVideo == false
        ? [
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: "depth",
              viewDimension: "2d-array", // <- must match shadowMapArray
              multisampled: false,
            },
          },
        ] : [{
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "depth",
            viewDimension: "2d",
          },
        },])
      , {
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
          {
            binding: 5,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {type: 'uniform'},
          }
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
          {
            binding: 5,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {type: 'uniform'},
          },
          {
            binding: 6,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: 'float',
              viewDimension: '2d'
            }
          },
          {
            binding: 7,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {type: 'filtering'}
          },
          {
            binding: 8,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {type: 'uniform'}
          },
          {
            binding: 9,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {sampleType: 'float', viewDimension: '2d'},
          },
          {
            binding: 10,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {type: 'filtering'}
          }
        ])
    ];
    // console.log("BG E :  is used normal  ", this.material.type)
    this.bglForRender = this.device.createBindGroupLayout({label: 'bglForRender', entries: e, });
  }
}