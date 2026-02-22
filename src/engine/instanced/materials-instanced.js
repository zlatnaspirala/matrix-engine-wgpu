import {mirrorIlluminateFragmentWGSL} from "../../shaders/fragment.mirror.wgsl";
import {fragmentWGSL} from "../../shaders/fragment.wgsl";
import {fragmentWGSLMetal} from "../../shaders/fragment.wgsl.metal";
import {fragmentWGSLNormalMap} from "../../shaders/fragment.wgsl.normalmap";
import {fragmentWGSLPong} from "../../shaders/fragment.wgsl.pong";
import {fragmentWGSLPower} from "../../shaders/fragment.wgsl.power";
import {fragmentWGSLInstanced} from "../../shaders/instanced/fragment.instanced.wgsl";
import {fragmentWaterWGSL} from "../../shaders/water/water-c.wgls";

/**
 * @description
 * Created for matrix-engine-wgpu project.
 * MeshObj class estends Materials.
 * @var material is engine meta data variable not real material object.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */
export default class MaterialsInstanced {
  constructor(device, material, glb) {
    this.device = device;
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

    this.createBufferForWater();
  }

  createBufferForWater = () => {
    // new water test
    this.waterBindGroupLayout = this.device.createBindGroupLayout({
      label: 'Water MAT Bind Group Layout for main pass',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: 'uniform'
        }
      }]
    });
    this.waterParamsBuffer = this.device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.waterParamsData = new Float32Array([
      0.0, 0.2, 0.4,       // deepColor (vec3f)
      0.5,                 // waveSpeed
      0.0, 0.5, 0.7,       // shallowColor (vec3f)
      4.0,                 // waveScale
      0.15,                // waveHeight
      3.0,                 // fresnelPower
      128.0,               // specularPower
      0.0                  // padding
    ]);
    this.device.queue.writeBuffer(this.waterParamsBuffer, 0, this.waterParamsData);
    this.waterBindGroup = this.device.createBindGroup({
      layout: this.waterBindGroupLayout,
      entries: [{
        binding: 0,
        resource: {buffer: this.waterParamsBuffer}
      }]
    });
    // To update values at runtime:
    this.updateWaterParams = (deepColor, shallowColor, waveSpeed, waveScale, waveHeight, fresnelPower, specularPower) => {
      const data = new Float32Array([
        deepColor[0], deepColor[1], deepColor[2],
        waveSpeed,
        shallowColor[0], shallowColor[1], shallowColor[2],
        waveScale,
        waveHeight,
        fresnelPower,
        specularPower,
        0.0  // padding
      ]);
      device.queue.writeBuffer(waterParamsBuffer, 0, data);
    }
  }

  createMirrorIlluminateBindGroup(mirrorBindGroupLayout, opts) {
    const defaults = {
      mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
      reflectivity: 0.25,               // 25% reflection blend
      illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
      illuminateStrength: 0.4,          // Gentle rim
      illuminatePulse: 0.0,             // No pulse (static)
      fresnelPower: 4.0,                // Medium-sharp edge
      envLodBias: 1.5,                  // Slightly blurred env
    };
    const cfg = {...defaults, ...opts};
    const PARAMS_SIZE = 80;
    const paramsBuffer = this.device.createBuffer({
      label: 'MirrorIlluminateParams',
      size: PARAMS_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.writeParamsMirror = (o) => {
      const data = new Float32Array(16); // Was 12, now 16
      const t = o.mirrorTint ?? cfg.mirrorTint;
      data[0] = t[0];
      data[1] = t[1];
      data[2] = t[2];
      data[3] = o.reflectivity ?? cfg.reflectivity;
      const ic = o.illuminateColor ?? cfg.illuminateColor;
      data[4] = ic[0];
      data[5] = ic[1];
      data[6] = ic[2];
      data[7] = o.illuminateStrength ?? cfg.illuminateStrength;
      data[8] = o.illuminatePulse ?? cfg.illuminatePulse;
      data[9] = o.fresnelPower ?? cfg.fresnelPower;
      data[10] = o.envLodBias ?? cfg.envLodBias;
      data[11] = o.usePlanarReflection ? 1.0 : 0.0;
      data[12] = o.baseColorMix ?? cfg.baseColorMix;
      data[13] = 0; // padding
      data[14] = 0; // padding
      data[15] = 0; // padding
      this.device.queue.writeBuffer(paramsBuffer, 0, data);
    }
    this.writeParamsMirror(cfg);
    const samplerDummy = this.device.createSampler({
      label: 'EnvMap Sampler',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'clamp-to-edge',
    });
    // ── Dummy 1×1 white env texture (used when no real env map is supplied) ──
    const envTexture = cfg.envTexture instanceof GPUTexture ? cfg.envTexture :
      cfg.envTexture.texture ?? (() => {
        console.warn('⚠️ No envTexture provided, using white dummy!');
        const tex = this.device.createTexture({
          label: 'MirrorEnvDummy',
          size: [1, 1],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        });
        this.device.queue.writeTexture(
          {texture: tex},
          new Uint8Array([255, 0, 0, 255]),
          {bytesPerRow: 4},
          [1, 1],
        );
        return tex;
      })();
    const bindGroup = this.device.createBindGroup({
      label: 'MirrorIlluminate BindGroup',
      layout: mirrorBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: paramsBuffer}},
        {binding: 1, resource: envTexture.createView()},
        {binding: 2, resource: cfg.envTexture.sampler ?? samplerDummy},
      ],
    });
    return {
      bindGroup,
      paramsBuffer,
      /** Call this at runtime to hot-update mirror params without rebuilding. */
      updateParams: (o) => this.writeParamsMirror(o),
    };
  }

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
    this.setupPipeline();
  }

  setBlend = (alpha) => {
    this.material.useBlend = true;
    this.setupMaterialPBR([1, 1, 1, alpha]);
  }

  getMaterial() {
    // make it for all after all....
    if(this.material.type == 'standard') {
      return fragmentWGSLInstanced;
    } else if(this.material.type == 'pong') {
      return fragmentWGSLPong;
    } else if(this.material.type == 'power') {
      return fragmentWGSLPower;
    } else if(this.material.type == 'metal') {
      return fragmentWGSLMetal;
    } else if(this.material.type == 'normalmap') {
      return fragmentWGSLNormalMap;
    } else if(this.material.type == 'water') {
      return fragmentWaterWGSL;
    } else if(this.material.type == 'graph') {
      return this.material.fromGraph;
    } else if(this.material.type === "mirror") {
      return mirrorIlluminateFragmentWGSL;
    }
    //  else if(this.material.type == 'mix1') {
    //   return fragmentWGSLMix1;
    // }
    console.warn('Unknown material type use standard:', this.material?.type);
    return fragmentWGSL;
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

  setupMaterialPBR(baseColorFactor, metallicFactor, roughnessFactor) {
    if(!metallicFactor) metallicFactor = [0.5, 0.5, 0.5];
    if(!baseColorFactor) baseColorFactor = [1.0, 1.0, 1.0, 0.5];
    if(!roughnessFactor) roughnessFactor = 0.5;
    const pad = [0.0];
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      0.5,
      ...pad
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
  }

  updatePostFXMode(mode) {
    const arrayBuffer = new Uint32Array([mode]);
    this.device.queue.writeBuffer(this.postFXModeBuffer, 0, arrayBuffer);
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
        format: this.getFormat(),
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

  async loadEnvMap(texturesPaths, isEnvMap = false) {
    const path = texturesPaths[1] || texturesPaths[0];
    const {texture, sampler} = await this.textureCache.get(path, this.getFormat(), isEnvMap);
    return {
      texture, sampler
    }
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
      this.video.playsInline = true;
      this.video.style.display = 'none';
      document.body.append(this.video);
      const stream = arg.el.captureStream?.() || arg.el.mozCaptureStream?.();
      if(!stream) {console.error('❌ Cannot capture stream from canvas2d'); return;}
      this.video.srcObject = stream;
      await this.video.play();
      this.isVideo = true;
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
      this.isVideo = true;
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
    // ✅ Now - maybe noT
    this.createLayoutForRender();
  }

  updateVideoTexture() {
    if(!this.video || this.video.readyState < 2) return;
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
      // console.log('TEST TEX material use from file ', this.name);
      // 0 probably always for basicColor
      const material = this.skinnedNode.mesh.primitives[0].material;
      const textureView = material.baseColorTexture.imageView;
      // const sampler = material.baseColorTexture.sampler;
      textureResource = textureView;
    }

    if(!textureResource || !this.sceneUniformBuffer || !this.shadowDepthTextureView) {
      if(!textureResource) console.warn("❗Missing res texture: ", textureResource);
      if(!this.sceneUniformBuffer) console.warn("❗Missing res: this.sceneUniformBuffer: ", this.sceneUniformBuffer);
      // if(!this.shadowDepthTextureView) console.warn("❗Missing res: this.shadowDepthTextureView: ", this.shadowDepthTextureView);
      if(typeof textureResource === 'undefined') {
        this.updateVideoTexture();
      }
      return;
    }
    if(this.isVideo == true) {
      // console.info("✅ video sceneBindGroupForRender");
      this.sceneBindGroupForRender = this.device.createBindGroup({
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