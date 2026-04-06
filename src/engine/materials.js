import {fragmentWGSL} from "../shaders/fragment.wgsl";
import {fragmentWGSLMetal} from "../shaders/fragment.wgsl.metal";
import {fragmentWGSLNormalMap} from "../shaders/fragment.wgsl.normalmap";
import {fragmentWGSLPong} from "../shaders/fragment.wgsl.pong";
import {fragmentWGSLPower} from "../shaders/fragment.wgsl.power";
import {fragmentWGSLMix1} from "../shaders/mixed/fragmentMix1.wgsl";
import {fragmentWaterWGSL} from "../shaders/water/water-c.wgls";
import {mirrorIlluminateFragmentWGSL} from "../shaders/fragment.mirror.wgsl";
import {byId, LOG_FUNNY_ARCADE} from "./utils";
import {fragmentWGSLGPT} from "../shaders/fragment.gpt.wgsl";
import {fragmentWGSLNoCut} from "../shaders/fragment.wgsl.noCut";
import {miniWGSL} from "../shaders/minimalist/mini.wgsl";
import {miniaWGSL} from "../shaders/minimalist/mini-a.wgsl";
import {midaWGSL} from "../shaders/minimalist/mid-a.wgsl";
import {hybridWGSL} from "../shaders/minimalist/hybrid.wgsl";
import {coloraWGSL} from "../shaders/minimalist/color-a.wgsl";
import {colorbWGSL} from "../shaders/minimalist/color-b.wgsl";
import {fountainBasinFragmentWGSL} from "../shaders/fontana/fontana.wgsl";

/**
 * @description
 * Created for matrix-engine-wgpu project. MeshObj class estends Materials.
 * @variable material is engine meta data variable not real material object.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */
export default class Materials {
  constructor(device, material, glb, textureCache, isVideo) {
    this.device = device;
    this.textureCache = textureCache;
    this.glb = glb;
    this.material = material;
    if(typeof isVideo !== 'undefined') {
      this.isVideo = true;
    } else {this.isVideo = false}
    this.videoIsReady = 'NONE';
    this.imageSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: "repeat",
      addressModeV: "repeat",
      addressModeW: "repeat",
    });
    this.videoSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    // FX effect
    this.postFXModeBuffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // Dymmy
    this.dummySpotlightUniformBuffer = this.device.createBuffer({
      size: 80,
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
    const materialPBRSize = 52; // 32 bytes
    this.materialPBRBuffer = this.device.createBuffer({
      size: materialPBRSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const baseColorFactor = [1.0, 1.0, 1.0, 1.0];
    const metallicFactor = 0.5;
    const roughnessFactor = 0.5;
    const effectMix = 0.0;            // NEW: 0.0 = normal PBR, 1.0 = full effect
    const lightingEnabled = 1.0;      // NEW: 1.0 = lighting on, 0.0 = effect only
    const ambientColor = [0.5, 0.5, 0.5];
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      effectMix,
      lightingEnabled,
      ...ambientColor,
      0.0
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
    this._materialParams = {baseColorFactor, metallicFactor, roughnessFactor, effectMix, lightingEnabled, ambientColor};

    if(this.material.type == 'normalmap') {
      const normalTexInfo = this.glb.glbJsonData.materials[0].normalTexture;
      if(normalTexInfo) {
        const tex = this.glb.glbJsonData.glbTextures[normalTexInfo.index];
        this.normalTextureView = tex.createView();
        this.normalSampler = this.device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
        });
      }
    } else {
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

    if(this.material.type == 'water') {
      this.createBufferForWater();
    }
  }

  createBufferForWater = () => {
    this.waterBindGroupLayout = this.device.createBindGroupLayout({
      label: '[Water]BindGroupLayout',
      entries: [{binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}]
    });
    this.waterParamsBuffer = this.device.createBuffer({
      label: '[WaterParams]Buffer',
      size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
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
    console.log('>>>>>>>>>>>>>>CREATION>>>>>>>>>>>>>>>')
    this.waterBindGroup = this.device.createBindGroup({
      label: 'waterBG',
      layout: this.waterBindGroupLayout,
      entries: [{
        binding: 0,
        resource: {buffer: this.waterParamsBuffer}
      }]
    });

    this.updateWaterParams = (deepColor, shallowColor, waveSpeed, waveScale, waveHeight, fresnelPower, specularPower) => {
      const data = new Float32Array([
        deepColor[0], deepColor[1], deepColor[2],
        waveSpeed,
        shallowColor[0], shallowColor[1], shallowColor[2],
        waveScale,
        waveHeight,
        fresnelPower,
        specularPower,
        0.0
      ]);
      this.device.queue.writeBuffer(this.waterParamsBuffer, 0, data);
    }
    // this.drawElements = this.drawElementsOrigin;
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
   * @description
   * Change ONLY base color texture (binding = 3)
   * Does NOT rebuild pipeline or layout
   **/
  changeTexture(newTexture, sampler) {
    // Accept GPUTexture OR GPUTextureView
    if(newTexture instanceof GPUTexture) {
      this.texture0 = newTexture;
    } else {
      this.texture0 = {createView: () => newTexture};
    }
    this.isVideo = false;
    if(sampler) this.imageSampler = sampler;
    // Recreate bind group only
    this.createBindGroupForRender();
  }

  changeMaterial(newType = 'graph', graphShader) {
    this.material.fromGraph = graphShader;
    this.material.type = newType;
    // this.setupPipeline();
  }

  createCheckerboardTexture(size = 256, tileSize = 32, colorA = [255, 0, 0, 255], colorB = [255, 255, 255, 255]) {

    const mipLevelCount = Math.floor(Math.log2(size)) + 1;

    const texture = this.device.createTexture({
      size: [size, size, 1],
      format: 'rgba8unorm',
      // mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });

    const data = new Uint8Array(size * size * 4);

    for(let y = 0;y < size;y++) {
      for(let x = 0;x < size;x++) {
        const tileX = Math.floor(x / tileSize);
        const tileY = Math.floor(y / tileSize);
        const color = (tileX + tileY) % 2 === 0 ? colorA : colorB;
        const i = (y * size + x) * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = color[3];
      }
    }

    this.device.queue.writeTexture(
      {texture},
      data,
      {bytesPerRow: size * 4},
      [size, size, 1]
    );

    return texture;
  }

  setBlend = (alpha) => {
    this.material.useBlend = true;
    // this.setupMaterialPBR([1, 1, 1, alpha]);
    this.setupMaterialPBR([1, 0, 0, alpha]);
    // this.setupPipeline()
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
    } else if(this.material.type == 'gpt') {
      return fragmentWGSLGPT;
    } else if(this.material.type == 'water') {
      return fragmentWaterWGSL;
    } else if(this.material.type == 'graph') {
      // console.warn('Unknown material ???????????????:', this.material?.type);
      return this.material.fromGraph;
    } else if(this.material.type == 'mix1') {
      return fragmentWGSLMix1; // ?
    } else if(this.material.type === "mirror") {
      return mirrorIlluminateFragmentWGSL;
    } else if(this.material.type === "free") {
      return fragmentWGSLNoCut;
    } else if(this.material.type === "fontana") {
      return fountainBasinFragmentWGSL;
    } else if(this.material.type === "mini") {
      return miniWGSL;
    } else if(this.material.type === "minia") {
      return miniaWGSL;
    } else if(this.material.type === "mida") {
      return midaWGSL;
    } else if(this.material.type === "hybrid") {
      return hybridWGSL;
    } else if(this.material.type === "colora") {
      return coloraWGSL;
    } else if(this.material.type === "colorb") {
      return colorbWGSL;
    }

    console.warn('Unknown material type:', this.material?.type);
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

  setupMaterialPBR(baseColorFactor, metallicFactor, roughnessFactor, effectMix = 0.0, lightingEnabled = 1.0, ambientColor = [1.0, 1.0, 1.0]) {
    if(!metallicFactor) metallicFactor = 0.5;
    if(!baseColorFactor) baseColorFactor = [0.5, 0.5, 0.5, 1.0];
    if(!roughnessFactor) roughnessFactor = 0.5;
    const materialArray = new Float32Array([
      ...baseColorFactor,       // 4 floats
      metallicFactor,           // 1
      roughnessFactor,          // 1
      effectMix,                // 1
      lightingEnabled,          // 1
      ...ambientColor,          // 3 floats
      0.0,                      // padding
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
    this._materialParams = {baseColorFactor, metallicFactor, roughnessFactor, effectMix, lightingEnabled, ambientColor};
  }

  setAmbient(r, g, b) {
    if(!this._materialParams) return;
    this._materialParams.ambientColor = [r, g, b];
    this.device.queue.writeBuffer(this.materialPBRBuffer, 32, new Float32Array([r, g, b, 0.0]));
  }

  setMixEffectMode(mode = 'normal') {
    let effectMix = 0.0;
    let lightingEnabled = 1.0;
    switch(mode) {
      case 'normal':
        effectMix = 0.0;
        lightingEnabled = 1.0;
        break;
      case 'subtle':
        effectMix = 0.3;
        lightingEnabled = 1.0;
        break;
      case 'blend':
        effectMix = 0.5;
        lightingEnabled = 1.0;
        break;
      case 'full':
        effectMix = 1.0;
        lightingEnabled = 1.0;
        break;
      case 'pure':
        effectMix = 1.0;
        lightingEnabled = 0.0;
        break;
    }
    const baseColorFactor = this.currentBaseColor || [1.0, 1.0, 1.0, 1.0];
    const metallicFactor = this.currentMetallic || 0.1;
    const roughnessFactor = this.currentRoughness || 0.5;
    this.setupMaterialPBR(baseColorFactor, metallicFactor, roughnessFactor, effectMix, lightingEnabled);
  }

  updatePostFXMode(mode) {
    const arrayBuffer = new Uint32Array([mode]);
    this.device.queue.writeBuffer(this.postFXModeBuffer, 0, arrayBuffer);
  }

  async loadTex0(texturesPaths) {
    return new Promise(async (resolve) => {
      const path = texturesPaths[0];
      const {texture, sampler} = await this.textureCache.get(path, this.getFormat());
      this.texture0 = texture;
      this.sampler = sampler;
      resolve();
    });
  }

  async loadEnvMap(texturesPaths, isEnvMap = false) {
    const path = texturesPaths[1] || texturesPaths[0];
    const {texture, sampler} = await this.textureCache.get(path, this.getFormat(), isEnvMap);
    return {
      texture, sampler
    }
  }

  async loadVideoTexture(arg) {
    console.log('100000000000000000000000000000000')
    this.videoIsReady = 'MAYBE';

    this.isVideo = true;
    this.drawElements = this.drawVideoElements;

    if(arg.type === 'video') {
      this.video = document.createElement('video');
      this.video.src = arg.src || 'res/videos/tunel.mp4';
      this.video.crossOrigin = 'anonymous';
      this.video.autoplay = true;
      this.video.loop = true;
      document.body.append(this.video);
      // this.video.style.display = 'none';
      this.video.style.position = 'absolute';
      this.video.style.width = '640px';
      this.video.style.height = '480px';
      this.video.style.top = '-20px';
      this.video.style.left = '50%';
      this.video.play();
      this.video.addEventListener('canplay', () => {
        // alert('++++');
        if(this.video.readyState >= 3) {
          alert('++++ > 3 ');
        }
      }, {once: true});
      this.video.addEventListener('canplaythrough', () => {
        console.log('_cideo can playt +++++++++++++++++++++++++++');
        if(this.video.readyState >= 3) {
          this.externalTexture = this.device.importExternalTexture({source: this.video});
          console.log('++++ > 3   ++++  ' + this.externalTexture);
          if(!this.externalTexture) alert('ERROR ' + this.externalTexture);
          this.sampler = this.device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
          });
          this.createLayoutForRender();
          this.createMaterialBindGroupVideo();
        }
      }, {once: false});

    } else if(arg.type === 'videoElement') {
      this.video = arg.el;
      await this.video.play();
    } else if(arg.type === 'camera') {
      if(!byId(`core-${this.name}`)) {
        this.video = document.createElement('video');
        this.video.id = `core-${this.name}`;
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
          console.info("❌ Failed to access camera:", err);
          // return;
        }
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
      this.video.play();
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
      this.video.play();
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

    this.createLayoutForRender();
    // this.createBindGroupForRender();
    this.createMaterialBindGroupVideo();
  }

  updateVideoTexture() {
    // if(!this.video || this.video.readyState < 2) return;
    this.externalTexture = this.device.importExternalTexture({source: this.video});
    this.createMaterialBindGroupVideo();
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
    let textureResource = this.texture0.createView();
    if(this.material.useTextureFromGlb === true) {
      const material = this.skinnedNode.mesh.primitives[0].material;
      textureResource = material.baseColorTexture.imageView;
    }

    if(this.isVideo == true) return;
    // console.log('CREATE NORMAL this.materialBindGroup');
    this.materialBindGroup = this.device.createBindGroup({
      label: 'materialBindGroup normal',
      layout: this.materialBGL,
      entries: [
        {binding: 0, resource: textureResource},
        {binding: 1, resource: this.imageSampler},

        {binding: 2, resource: this.metallicRoughnessTextureView},
        {binding: 3, resource: this.metallicRoughnessSampler},

        {binding: 4, resource: {buffer: this.materialPBRBuffer}},

        {binding: 5, resource: this.normalTextureView},
        {binding: 6, resource: this.normalSampler},
      ]
    });

  }

  createLayoutForRender() {
    // this.materialBGL = this.device.createBindGroupLayout({
    //   label: 'MaterialBGL',
    //   entries: [
    //     {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}},
    //     {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
    //     {binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}},
    //     {binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
    //     {binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
    //     {binding: 5, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}},
    //     {binding: 6, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
    //   ]
    // });
    this.materialVideoBGL = this.device.createBindGroupLayout({
      label: 'MaterialVideoBGL',
      entries: [
        {binding: 0, visibility: GPUShaderStage.FRAGMENT, externalTexture: {}},
        {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}
      ]
    });
  }

  createMaterialBindGroupVideo() {
    if(!this.externalTexture) return;
    console.log('SET VIDEO BIND GROUP')
    this.materialBindGroup = this.device.createBindGroup({
      label: 'materialVideoBGL',
      layout: this.materialVideoBGL,
      entries: [
        {binding: 0, resource: this.externalTexture},
        {binding: 1, resource: this.videoSampler},
        {binding: 2, resource: {buffer: this.postFXModeBuffer}}
      ]
    });
  }
}