import {mat4, vec3} from "wgpu-matrix";
import {ArcballCamera, RPGCamera, WASDCamera} from "./engine/engine.js";
import {createInputHandler} from "./engine/engine.js";
import MEMeshObj from "./engine/mesh-obj.js";
import MatrixAmmo from "./physics/matrix-ammo.js";
import {LOG_FUNNY_BIG_ARCADE, LOG_FUNNY_ARCADE, LOG_FUNNY_BIG_NEON, LOG_WARN, genName, mb, urlQuery, LOG_FUNNY, LOG_FUNNY_EXTRABIG, randomIntFromTo, isMobile} from "./engine/utils.js";
import {MultiLang} from "./multilang/lang.js";
import {MatrixSounds} from "./sounds/sounds.js";
import {downloadMeshes, play} from "./engine/loader-obj.js";
import {SpotLight} from "./engine/lights.js";
import {BVHPlayer} from "./engine/loaders/bvh.js";
import {BVHPlayerInstances} from "./engine/loaders/bvh-instaced.js";
import {Editor} from "./tools/editor/editor.js";
import MEMeshObjInstances from "./engine/instanced/mesh-obj-instances.js";
import {BloomPass, fullscreenQuadWGSL} from "./engine/postprocessing/bloom.js";
import {addRaycastsListener} from "./engine/raycast.js";
import {addOBJ, physicsBodiesGenerator, physicsBodiesGeneratorDeepPyramid, physicsBodiesGeneratorPyramid, physicsBodiesGeneratorTower, physicsBodiesGeneratorWall} from "./engine/generators/generator.js";
import {TextureCache} from "./engine/core-cache.js";
import {AudioAssetManager} from "./sounds/audioAsset.js";
import {graphAdapter} from "./tools/editor/flexCodexShaderAdapter.js";
import {VolumetricPass} from "./engine/postprocessing/volumetric.js";
import {FlameEmitter} from "./engine/effects/flame-emmiter.js";
import {HPBarEffect} from "./engine/effects/energy-bar.js";
import {MANABarEffect} from "./engine/effects/mana-bar.js";
import {PointerEffect} from "./engine/effects/pointerEffect.js";
import {FlameEffect} from "./engine/effects/flame.js";
import ProceduralMeshObj, {MeshMorpher} from "./engine/procedural-mesh.js";
import {FOUNTAIN_COLUMN_TOP, fountainBasinConfig, fountainBasinStoneConfig, fountainBasinWaterConfig, fountainCapConfig, fountainCurtainConfig, fountainMeshConfig, fountainStructureConfig, fountainWaterConfig} from "./engine/procedures/fontana.js";
import {fountainBasinFragmentWGSL, fountainCapFragmentWGSL, fountainCurtainFragmentWGSL, fountainWaterVertexWGSL} from "./shaders/fontana/fontana.wgsl.js";

/**
 * @description
 * Main engine root class.
 * @author Nikola Lukic 2026
 * @email zlatnaspirala@gmail.com
 * @web https://maximumroulette.com
 * @github zlatnaspirala
 */
export default class MatrixEngineWGPU {
  // Save class reference
  reference = {
    MEMeshObj,
    MEMeshObjInstances,
    BVHPlayerInstances,
    BVHPlayer,
    downloadMeshes,
    addRaycastsListener,
    graphAdapter,
    effectsClassRef: {
      FlameEffect,
      FlameEmitter,
      PointerEffect,
      HPBarEffect,
      MANABarEffect,
    }
  }

  mainRenderBundle = [];
  lightContainer = [];
  frame = () => {};
  entityHolder = [];
  lastTime = 0;
  entityArgPass = {
    loadOp: 'clear',
    storeOp: 'store',
    depthLoadOp: 'clear',
    depthStoreOp: 'store'
  }
  autoUpdate = [];
  matrixSounds = new MatrixSounds();
  audioManager = new AudioAssetManager();

  constructor(options, callback) {
    if(typeof options == 'undefined' || typeof options == "function") {
      this.options = {
        canvasSize: 'fullscreen',
        canvasId: 'canvas1',
        mainCameraParams: {
          type: 'WASD',
          responseCoef: 2000
        },
        clearColor: {r: 0.584, g: 0, b: 0.239, a: 1.0}
      }
      callback = options;
    }
    if(typeof options.clearColor === 'undefined') {
      options.clearColor = {r: 0.584, g: 0, b: 0.239, a: 1.0};
    }
    if(typeof options.canvasId === 'undefined') {
      options.canvasId = 'canvas1';
    }
    if(typeof options.mainCameraParams === 'undefined') {
      options.mainCameraParams = {
        type: 'WASD',
        responseCoef: 2000
      }
    }
    if(typeof options.dontUsePhysics == 'undefined') {
      this.physicsBodiesGenerator = physicsBodiesGenerator.bind(this);
      this.physicsBodiesGeneratorWall = physicsBodiesGeneratorWall.bind(this);
      this.physicsBodiesGeneratorPyramid = physicsBodiesGeneratorPyramid.bind(this);
      this.physicsBodiesGeneratorTower = physicsBodiesGeneratorTower.bind(this);
      this.physicsBodiesGeneratorDeepPyramid = physicsBodiesGeneratorDeepPyramid.bind(this);
    }
    this.editorAddOBJ = addOBJ.bind(this);

    this.label = new MultiLang();
    this.now = 0;

    this.logLoopError = true;
    // context select options
    if(typeof options.alphaMode == 'undefined') {
      options.alphaMode = "no";
    } else if(options.alphaMode != 'opaque' && options.alphaMode != 'premultiplied') {
      console.error("[webgpu][alphaMode] Wrong enum Valid:'opaque','premultiplied' !!!");
      return;
    }
    if(typeof options.useContex == 'undefined') options.useContex = "webgpu";

    // cache
    this._viewProjMatrix = mat4.create();
    this._invViewProj = mat4.create();
    this._tempViewProj = mat4.create();
    this._identity = mat4.identity();

    if(typeof options.dontUsePhysics === 'undefined') {this.matrixAmmo = new MatrixAmmo()}

    this.editor = undefined;
    if(typeof options.useEditor !== "undefined") {
      if(typeof options.projectType !== "undefined" && options.projectType == "created from editor") {
        this.editor = new Editor(this, "created from editor", options.projectName);
      } else if(typeof options.projectType !== "undefined" && options.projectType == "pre editor") {
        this.editor = new Editor(this, options.projectType);
      } else {
        this.editor = new Editor(this, "infly");
      }
    }

    window.addEventListener('keydown', e => {
      if(e.code == "F4") {
        e.preventDefault();
        mb.error(`Activated WebEditor view.`);
        app.activateEditor();
        return false;
      }
    }, {passive: true});

    this.activateEditor = () => {
      if(this.editor == null || typeof this.editor === 'undefined') {
        if(typeof options.projectType !== "undefined" && options.projectType == "created from editor") {
          this.editor = new Editor(this, "created from editor");
        } else if(typeof options.projectType !== "undefined" && options.projectType == "pre editor") {
          this.editor = new Editor(this, options.projectType);
        } else {
          this.editor = new Editor(this, "infly");
        }
        this.editor.editorHud.updateSceneContainer();
      } else {
        this.editor.editorHud.editorMenu.style.display = 'flex';
        this.editor.editorHud.assetsBox.style.display = 'flex';
        this.editor.editorHud.sceneProperty.style.display = 'flex';
        this.editor.editorHud.sceneContainer.style.display = 'flex';
      }
    };

    this.options = options;
    this.mainCameraParams = options.mainCameraParams;

    const target = this.options.appendTo || document.body;
    var canvas = document.createElement('canvas');
    canvas.id = this.options.canvasId;
    if(this.options.canvasSize == 'fullscreen') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = this.options.canvasSize.w;
      canvas.height = this.options.canvasSize.h;
    }
    target.append(canvas);

    const initialCameraPosition = vec3.create(0, 0, 0);
    this.mainCameraParams = {
      type: this.options.mainCameraParams.type,
      responseCoef: this.options.mainCameraParams.responseCoef
    };

    this.cameras = {
      arcball: new ArcballCamera({position: initialCameraPosition}),
      WASD: new WASDCamera({position: initialCameraPosition, canvas: canvas, pitch: 0.18, yaw: -0.1}),
      RPG: new RPGCamera({position: initialCameraPosition, canvas: canvas}),
    };

    if(urlQuery.lang != null) {
      this.label.loadMultilang(urlQuery.lang).then((r) => {
        this.label.get = r;
      }).catch((r) => {
        this.label.get = r;
      });
    } else {
      this.label.loadMultilang().then((r) => {
        this.label.get = r;
      }).catch((r) => {
        this.label.get = r;
      });
    }
    this.init({canvas, callback});
  }

  init = async ({canvas, callback}) => {
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice({
      extensions: ["ray_tracing"]
    });

    if(this.options.alphaMode == "no") {
      this.context = canvas.getContext('webgpu');
    } else if(this.options.alphaMode == "opaque") {
      this.context = canvas.getContext('webgpu', {alphaMode: 'opaque'});
    } else if(this.options.alphaMode == "opaque") {
      this.context = canvas.getContext('webgpu', {alphaMode: 'premultiplied'});
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    this.globalAmbient = vec3.create(0.5, 0.5, 0.5);
    this.MAX_SPOTLIGHTS = 20;
    this.inputHandler = createInputHandler(window, canvas);
    this.createGlobalStuff(callback);
    this.shadersPack = {};

    // if('OffscreenCanvas' in window) {
    //   console.log(`$cOffscreenCanvas is supported`, LOG_FUNNY_ARCADE);
    // } else {
    //   console.log(`%cOffscreenCanvas is NOT supported.`, LOG_FUNNY_ARCADE);
    // }
    console.log("%c ---------------------------------------------------------------------------------------------- ", LOG_FUNNY);
    console.log("%c 🧬 Matrix-Engine-Wgpu 🧬 ", LOG_FUNNY_BIG_NEON);
    console.log("%c ---------------------------------------------------------------------------------------------- ", LOG_FUNNY);
    console.log("%c Version 1.9.8 ", LOG_FUNNY);
    console.log("%c👽  ", LOG_FUNNY_EXTRABIG);
    console.log(
      "%cMatrix Engine WGPU - Port is open.\n" +
      "Creative power loaded with visual scripting.\n" +
      "Last features : Adding Gizmo , Optimised render in name of performance,\n" +
      " audioReactiveNode, onDraw , onKey , curve editor.\n" +
      "No tracking. No hype. Just solutions and high performance. 🔥", LOG_FUNNY_BIG_ARCADE);
    console.log(
      "%cSource code: 👉 GitHub:\nhttps://github.com/zlatnaspirala/matrix-engine-wgpu",
      LOG_FUNNY_ARCADE);
  };

  createGlobalStuff(callback) {
    this.SHADOW_RES = 512;
    this._bufferUpdates = [];

    this.textureCache = new TextureCache(this.device);
    this._destroyQueue = new Set();
    this.flushDestroyQueue = () => {
      if(!this._destroyQueue.size) return;
      this._destroyQueue.forEach(name => {
        this.removeSceneObjectByName(name);
      });
      this._destroyQueue.clear();
    };
    this.destroyByPrefix = (prefix) => {
      const toDestroy = [];
      for(const obj of this.mainRenderBundle) {
        if(obj.name.startsWith(prefix)) {
          toDestroy.push(obj.name);
        }
      }
      toDestroy.forEach(name =>
        this._destroyQueue.add(name)
      );
    };
    this.destroyBySufix = (sufix) => {
      const toDestroy = [];
      for(const obj of this.mainRenderBundle) {
        if(obj.name.endsWith(sufix)) {
          toDestroy.push(obj.name);
        }
      }
      toDestroy.forEach(name =>
        this._destroyQueue.add(name)
      );
    }

    // Just syntetic to help visual scripting part
    this.bloomPass = {
      enabled: false,
      setIntensity: (v) => {},
      setKnee: (v) => {},
      setBlurRadius: (v) => {},
      setThreshold: (v) => {},
    };

    this.volumetricPass = {
      enabled: false
    };

    this.bloomOutputTex = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.sceneTexture = this.device.createTexture({
      label: "final pipeline sceneTexture",
      size: [this.canvas.width, this.canvas.height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });

    this.sceneTextureView = this.sceneTexture.createView();
    this.presentSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });

    this.presentPipeline = this.device.createRenderPipeline({
      label: "final pipeline",
      layout: 'auto',
      vertex: {
        module: this.device.createShaderModule({code: fullscreenQuadWGSL()}),
        entryPoint: 'vert',
      },
      fragment: {
        module: this.device.createShaderModule({
          code: `
        @group(0) @binding(0) var hdrTex : texture_2d<f32>;
        @group(0) @binding(1) var samp : sampler;
        @fragment
        fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
          let uv = pos.xy / vec2<f32>(textureDimensions(hdrTex));
          let hdr = textureSample(hdrTex, samp, uv).rgb;
          // simple tonemap
          let ldr = hdr / (hdr + vec3(1.0));
          return vec4<f32>(ldr, 1.0);
        }
      `
        }),
        entryPoint: 'main',
        targets: [{format: isMobile() == true ? 'rgba8unorm' : 'bgra8unorm'}], // rgba16float  bgra8unorm rgba8unorm
      },
    });

    this.createBloomBindGroup();

    this.spotlightUniformBuffer = this.device.createBuffer({
      label: 'spotlightUniformBufferGLOBAL',
      size: this.MAX_SPOTLIGHTS * 144,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    this._lightsData = new Float32Array(this.MAX_SPOTLIGHTS * 36);
    this._emptyLight = new Float32Array(36);
    this.createTexArrayForShadows(callback)
    this.mainDepthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.mainDepthView = this.mainDepthTexture.createView();
    this.mainRenderPassDesc = {
      label: 'mainRenderPassDesc',
      colorAttachments: [{
        view: undefined,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [0.02, 0.02, 0.02, 1],
      }],
      depthStencilAttachment: {
        view: this.mainDepthView,       // fixed
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      },
    };

    // pointer effect-not in use
    const depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.depthTextureViewTrail = depthTexture.createView();

    this._transPassDesc = {
      colorAttachments: [{
        view: this.sceneTextureView,
        loadOp: 'load',
        storeOp: 'store',
        clearValue: {r: 0, g: 1, b: 0, a: 1},
      }],
      depthStencilAttachment: {
        view: this.mainDepthView,
        depthLoadOp: 'load',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      }
    };

    this.run(callback);
  }

  createTexArrayForShadows(callback) {
    this.createMe = () => {
      Math.max(1, this.lightContainer.length);
      let numberOfLights = 20;
      this.shadowTextureArray = this.device.createTexture({
        label: `shadowTextureArray[GLOBAL] num of light ${numberOfLights}`,
        size: {
          width: this.SHADOW_RES,
          height: this.SHADOW_RES,
          depthOrArrayLayers: numberOfLights,
        },
        dimension: '2d',
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });

      this.shadowArrayView = this.shadowTextureArray.createView({
        dimension: '2d-array'
      });

      this.shadowSampler = this.device.createSampler({
        label: 'shadowSampler[GLOBAL]',
        compare: 'less-equal',
        magFilter: 'linear',
        minFilter: 'linear',
      });

      this.shadowPassViews = [];
      for(let i = 0;i < numberOfLights;i++) {
        this.shadowPassViews[i] = this.shadowTextureArray.createView({
          dimension: '2d',
          baseArrayLayer: i,
          arrayLayerCount: 1,
          baseMipLevel: 0,
          mipLevelCount: 1,
        });
      }

      this.shadowVideoTexture = this.device.createTexture({
        size: [this.SHADOW_RES, this.SHADOW_RES],
        format: "depth32float",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });

      this.shadowVideoView = this.shadowTextureArray.createView({
        dimension: '2d',
        baseArrayLayer: 0,
        arrayLayerCount: 1
      });

      // this.run(callback);
    };
    this.createMe();
  }

  getSceneObjectByName = (name) => {return this.mainRenderBundle.find((sceneObject) => sceneObject.name === name)}

  getSceneLightByName = (name) => {return this.lightContainer.find((l) => l.name === name)}

  getNameFromPath(p) {return p.split(/[/\\]/).pop().replace(/\.[^/.]+$/, "");}

  removeSceneObjectByName = (name) => {
    const index = this.mainRenderBundle.findIndex(obj => obj.name === name);
    if(index === -1) {
      console.warn("%cScene object not found:" + name, LOG_FUNNY_ARCADE);
      return false;
    }
    const obj = this.mainRenderBundle[index];
    let testPB = app.matrixAmmo.getBodyByName(obj.name);
    if(testPB !== null) {
      try {
        this.matrixAmmo.dynamicsWorld.removeRigidBody(testPB);
      } catch(e) {
        console.warn("%cPhysics cleanup error:" + e, LOG_FUNNY_ARCADE);
      }
    }
    this.mainRenderBundle.splice(index, 1);
    return true;
  }

  addLight(o) {
    const camera = this.cameras[this.mainCameraParams.type];
    let newLight = new SpotLight(camera,
      this.inputHandler, this.device, this.lightContainer.length,
      this.shadowPassViews[this.lightContainer.length], this.shadowSampler
    );
    this.lightContainer.push(newLight);

    for(const mesh of this.mainRenderBundle) {
      mesh.shadowDepthTextureView = this.shadowArrayView;
      mesh.createBindGroupForRender();
    }
    console.log(`%cAdd light: ${newLight}`, LOG_FUNNY_ARCADE);
  }

  addMeshObj = (o, clearColor = this.options.clearColor) => {
    if(typeof o.name === 'undefined') {o.name = genName(9)}
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
    if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
    if(typeof o.material === 'undefined') {o.material = {type: 'standard'}}
    if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
    if(typeof o.scale === 'undefined') {o.scale = [1, 1, 1];}
    if(typeof o.raycast === 'undefined') {o.raycast = {enabled: false, radius: 2}}
    if(typeof o.useScale === 'undefined') {o.useScale = true;}
    if(typeof o.envMapParams === 'undefined') {o.envMapParams = null;}
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if(typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere", // must be fixed<<
        radius: (typeof o.scale == Number ? o.scale : o.scale[0]),
        name: o.name,
        rotation: o.rotation
      }
    }
    if(typeof o.physics.enabled === 'undefined') {o.physics.enabled = true}
    if(typeof o.physics.geometry === 'undefined') {o.physics.geometry = "Cube"}
    if(typeof o.physics.radius === 'undefined') {o.physics.radius = o.scale}
    if(typeof o.physics.mass === 'undefined') {o.physics.mass = 1;}
    if(typeof o.physics.name === 'undefined') {o.physics.name = o.name;}
    if(typeof o.physics.scale === 'undefined') {o.physics.scale = o.scale;}
    if(typeof o.physics.rotation === 'undefined') {o.physics.rotation = o.rotation;}
    o.physics.position = o.position;
    if(typeof o.objAnim == 'undefined' || typeof o.objAnim == null) {
      o.objAnim = null;
    } else {
      if(typeof o.objAnim.animations !== 'undefined') {
        o.objAnim.play = play;
      }
      // no need for single test it in future
      o.objAnim.meshList = o.objAnim.meshList;
      if(typeof o.mesh === 'undefined') {
        o.mesh = o.objAnim.meshList[0];
        console.info('objSeq animation is active.');
      }
      // scale for all second option!
      o.objAnim.scaleAll = function(s) {
        for(var k in this.meshList) {
          // console.log('SCALE meshList');
          this.meshList[k].setScale(s);
        }
      }
    }

    o.textureCache = this.textureCache;
    let AM = this.globalAmbient.slice();
    let myMesh1 = new MEMeshObj(this.canvas, this.device, this.context, o, this.inputHandler, AM);
    myMesh1.spotlightUniformBuffer = this.spotlightUniformBuffer;
    myMesh1.shadowVideoView = this.shadowVideoView;
    myMesh1.clearColor = clearColor;
    if(o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myMesh1, o.physics)
    }
    this.mainRenderBundle.push(myMesh1);
    this.sortRenderBundle();
    if(typeof this.editor !== 'undefined') {
      this.editor.editorHud.updateSceneContainer();
    }
  }

  addProceduralMeshObj = (o, clearColor = this.options.clearColor) => {
    if(typeof o.name === 'undefined') {o.name = genName(9);}
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4};}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0};}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0};}
    // GEOMETRY DEFAULTS - The key difference from addMeshObj
    if(typeof o.geometryA === 'undefined') {
      o.geometryA = {type: 'cube', size: 1};
    }
    if(typeof o.geometryB === 'undefined') {
      // Default to same as geometryA (no morph)
      o.geometryB = o.geometryA;
    }

    // MATERIAL & TEXTURE DEFAULTS
    if(typeof o.texturesPaths === 'undefined') {
      o.texturesPaths = ['./res/textures/default.png'];
    }
    if(typeof o.material === 'undefined') {
      o.material = {type: 'standard'};
    }
    if(typeof o.envMapParams === 'undefined') {
      o.envMapParams = null;
    }

    // CAMERA & SCALE DEFAULTS
    if(typeof o.mainCameraParams === 'undefined') {
      o.mainCameraParams = this.mainCameraParams;
    }
    if(typeof o.scale === 'undefined') {
      o.scale = [1, 1, 1];
    }
    if(typeof o.useScale === 'undefined') {
      o.useScale = true;
    }
    // RAYCAST DEFAULTS
    if(typeof o.raycast === 'undefined') {
      o.raycast = {enabled: false, radius: 2};
    }

    if(typeof o.pointerEffect === 'undefined') {o.pointerEffect = {enabled: false};}

    // ENTITY ARGS (for your engine's internal use)
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    o.textureCache = this.textureCache;

    // PHYSICS DEFAULTS
    if(typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        radius: (typeof o.scale === 'number' ? o.scale : o.scale[0]),
        name: o.name,
        rotation: o.rotation
      };
    }
    if(typeof o.physics.enabled === 'undefined') {
      o.physics.enabled = true;
    }
    if(typeof o.physics.geometry === 'undefined') {
      o.physics.geometry = "Cube";
    }
    if(typeof o.physics.radius === 'undefined') {
      o.physics.radius = o.scale;
    }
    if(typeof o.physics.mass === 'undefined') {
      o.physics.mass = 1;
    }
    if(typeof o.physics.name === 'undefined') {
      o.physics.name = o.name;
    }
    if(typeof o.physics.scale === 'undefined') {
      o.physics.scale = o.scale;
    }
    if(typeof o.physics.rotation === 'undefined') {
      o.physics.rotation = o.rotation;
    }
    o.physics.position = o.position;

    // MORPH ANIMATION DEFAULTS (new for ProceduralMeshObj)
    if(typeof o.morphAnimation === 'undefined') {
      o.morphAnimation = null;
    } else {
      // Set up auto-play morph animation if specified
      if(typeof o.morphAnimation.autoPlay !== 'undefined' && o.morphAnimation.autoPlay === true) {
        o.morphAnimation.enabled = true;
      }
    }

    // CREATE PROCEDURAL MESH OBJECT
    let AM = this.globalAmbient.slice();
    let myMesh = new ProceduralMeshObj(
      this.canvas,
      this.device,
      this.context,
      o,
      this.inputHandler,
      AM
    );

    myMesh.spotlightUniformBuffer = this.spotlightUniformBuffer;
    myMesh.clearColor = clearColor;
    if(o.physics.enabled === true) {
      this.matrixAmmo.addPhysics(myMesh, o.physics);
    }
    this.mainRenderBundle.push(myMesh);
    this.sortRenderBundle();
    if(typeof this.editor !== 'undefined') {
      this.editor.editorHud.updateSceneContainer();
    }
    return myMesh;
  }

  addFontana = (o, clearColor = this.options.clearColor) => {
    const px = o.position.x;
    const py = o.position.y;
    const pz = o.position.z;
    const TOP = FOUNTAIN_COLUMN_TOP;

    const geo1 = fountainStructureConfig(MeshMorpher);
    let m1 = this.addProceduralMeshObj({
      material: {type: 'free'}, name: 'fontana_column',
      position: {x: px, y: py, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [1, 1, 1], rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
      meshA: geo1.meshA, meshB: geo1.meshB, resolutionU: geo1.resolutionU, resolutionV: geo1.resolutionV,
      fragmentWGSL: fountainCurtainFragmentWGSL, vertexWGSL: fountainWaterVertexWGSL,
      pointerEffect: {
        enabled: true,
        flameEffect: false,
        flameEmitter: true,
      }
    });

    const geo2 = fountainBasinStoneConfig(MeshMorpher);
    let m2 = this.addProceduralMeshObj({
      material: {type: 'free'}, name: 'fontana_basin_stone',
      position: {x: px, y: py, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [1, 1, 1], rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
      meshA: geo2.meshA, meshB: geo2.meshB, resolutionU: geo2.resolutionU, resolutionV: geo2.resolutionV,
      fragmentWGSL: fountainCapFragmentWGSL, vertexWGSL: fountainWaterVertexWGSL,
    });

    const geo3 = fountainCapConfig(MeshMorpher);
    let m3 = this.addProceduralMeshObj({
      material: {type: 'fontana'}, name: 'fontana_cap',
      globalAmbient: [0.15, 0.72, 0.96, 1.0],
      position: {x: px, y: py + TOP * 0.8, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [1, 1, 1], rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
      meshA: geo3.meshA, meshB: geo3.meshB, resolutionU: geo3.resolutionU, resolutionV: geo3.resolutionV,
      fragmentWGSL: fountainCapFragmentWGSL, vertexWGSL: fountainWaterVertexWGSL,
    });

    const geo4 = fountainCurtainConfig(MeshMorpher);
    let m4 = this.addProceduralMeshObj({
      material: {type: 'fontana'}, name: 'fontana_curtain',
      globalAmbient: [0.12, 0.68, 0.94, 1.0],
      position: {x: px, y: py, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [1, 1, 1], rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
      meshA: geo4.meshA, meshB: geo4.meshB, resolutionU: geo4.resolutionU, resolutionV: geo4.resolutionV,
      fragmentWGSL: fountainCurtainFragmentWGSL, vertexWGSL: fountainWaterVertexWGSL,
      pointerEffect: {
        enabled: true,
        flameEffect: false,
        flameEmitter: true,
      }
    });

    const geo5 = fountainBasinWaterConfig(MeshMorpher);
    let m5 = this.addProceduralMeshObj({
      material: {type: 'fontana'}, name: 'fontana_basin_water',
      globalAmbient: [0.08, 0.55, 0.90, 1.0],
      position: {x: px, y: py + 0.01, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [1, 1, 1], rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
      meshA: geo5.meshA, meshB: geo5.meshB, resolutionU: geo5.resolutionU, resolutionV: geo5.resolutionV,
      fragmentWGSL: fountainBasinFragmentWGSL, vertexWGSL: fountainWaterVertexWGSL,
    });

    m1.rotation.setRotateY(1000);
    m4.setBlend(0.1);

    setTimeout(() => {
      m4.effects.flameEmitter.instanceTargets.forEach((i) => {
        i.color = [0, randomIntFromTo(0, 100), randomIntFromTo(50, 200)];
      })
    }, 1000)

    // m4.morphTo(1, 2000)
    // m4.morphAnimation.onComplete = (e) => {
    //   // console.log("ssssssssssssssssssssssssssssssssssssss", e)
    //   if(e == 1) m4.morphTo(0, 2000)
    //   if(e == 0) m4.morphTo(1, 2000)
    // }

  }

  createBloomBindGroup() {
    this.bloomBindGroup = this.device.createBindGroup({
      layout: this.presentPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: this.bloomOutputTex},
        {binding: 1, resource: this.presentSampler}
      ]
    })
    this.noBloomBindGroup = this.device.createBindGroup({
      layout: this.presentPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: this.sceneTexture.createView()},
        {binding: 1, resource: this.presentSampler}
      ]
    })
  }

  async run(callback) {
    this._lastPipeline = null;
    this.frame = this.frameSinglePass;
    setTimeout(() => {requestAnimationFrame(this.frame)}, 100);
    setTimeout(() => {callback(this)}, 200)
  }

  destroyProgram = () => {
    console.warn('%c[MatrixEngineWGPU] Destroy program', 'color: orange');
    this.frame = () => {};
    if(this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    // 2️⃣ Destroy scene objects
    for(const obj of this.mainRenderBundle) {
      try {
        obj?.destroy?.();
      } catch(e) {
        console.warn('Object destroy error:', obj?.name, e);
      }
    }
    this.mainRenderBundle.length = 0;

    // 3️⃣ Physics
    this.matrixAmmo?.destroy?.();
    this.matrixAmmo = null;

    // 4️⃣ Editor
    this.editor?.destroy?.();
    this.editor = null;

    // 5️⃣ Input
    this.inputHandler?.destroy?.();
    this.inputHandler = null;

    // 6️⃣ GLOBAL GPU RESOURCES
    this.mainDepthTexture?.destroy();
    this.shadowTextureArray?.destroy();
    this.shadowVideoTexture?.destroy();

    this.mainDepthTexture = null;
    this.shadowTextureArray = null;
    this.shadowVideoTexture = null;

    // 7️⃣ Lose WebGPU context
    try {
      this.context?.unconfigure?.();
    } catch {}

    // 8️⃣ Canvas
    this.canvas?.remove();

    this.canvas = null;
    this.device = null;
    this.context = null;
    this.adapter = null;

    console.warn('%c[MatrixEngineWGPU] Destroy complete ✔', 'color: lightgreen');
  };

  updateLights() {
    const floatsPerLight = 36;
    for(let i = 0;i < this.MAX_SPOTLIGHTS;i++) {
      if(this.lightContainer[i]?.update) this.lightContainer[i].update();
      this._lightsData.set(
        i < this.lightContainer.length
          ? this.lightContainer[i].getLightDataBuffer()
          : this._emptyLight,
        i * floatsPerLight
      );
    }
    this.device.queue.writeBuffer(this.spotlightUniformBuffer, 0, this._lightsData.buffer, this._lightsData.byteOffset, this._lightsData.byteLength);
  }

  frameSinglePass = () => {
    this.now = performance.now() / 1000;
    this.autoUpdate.forEach((_) => _.update())
    try {
      let commandEncoder = this.device.createCommandEncoder();
      if(this.matrixAmmo) this.matrixAmmo.updatePhysics();

      this.updateLights();
      for(let i = 0;i < this.mainRenderBundle.length;i++) {
        const mesh = this.mainRenderBundle[i];
        if(mesh.vertexAnimBuffer && mesh.vertexAnimParams) {
          mesh.time = this.now * mesh.deltaTimeAdapter;
          mesh.vertexAnimParams[0] = mesh.time;
          this.device.queue.writeBuffer(mesh.vertexAnimBuffer, 0, mesh.vertexAnimParams);
        }
        // Video handling...
        // if(mesh.isVideo && !mesh.externalTexture) {
        //   if(!mesh.isWaiting) {mesh.isWaiting = true; mesh.createBindGroupForRender();}
        //   continue;
        // }
        mesh.getTransformationMatrix(i);
        if(mesh.position.inMove == true) {mesh.updateModelUniformBuffer(i)}
        mesh.position.update();
        if(mesh.updateMorphAnimation) mesh.updateMorphAnimation(this.now);
        if(mesh.update) mesh.update();
        mesh.updateTime(this.now);
      }

      for(let i = 0;i < this.lightContainer.length;i++) {
        const light = this.lightContainer[i];
        const shadowPass = commandEncoder.beginRenderPass({
          label: "shadowPass",
          colorAttachments: [],
          depthStencilAttachment: {
            view: this.shadowPassViews[i],
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            depthClearValue: 1.0,
          }
        });
        let lastShadowPipeline = null;
        for(const [meshIndex, mesh] of this.mainRenderBundle.entries()) {
          let targetShadowPipeline;
          if(mesh instanceof BVHPlayerInstances) {
            mesh.updateInstanceData(mesh.modelMatrix);
            targetShadowPipeline = light.shadowPipelineInstanced;
          } else if(mesh instanceof ProceduralMeshObj) {
            targetShadowPipeline = light.shadowPipelineMorph;
          } else {
            targetShadowPipeline = light.shadowPipeline;
          }
          if(lastShadowPipeline !== targetShadowPipeline) {
            shadowPass.setPipeline(targetShadowPipeline);
            lastShadowPipeline = targetShadowPipeline;
          }
          if(mesh.videoIsReady == 'NONE') {
            shadowPass.setBindGroup(0, light.getShadowBindGroup(mesh, meshIndex));
            if(mesh instanceof BVHPlayerInstances) {
              shadowPass.setBindGroup(1, mesh.modelBindGroupInstanced);
            }
            else if(mesh instanceof ProceduralMeshObj) {
              shadowPass.setBindGroup(1, mesh.mainRenderBindGroup);
            }
            else {
              shadowPass.setBindGroup(1, mesh.modelBindGroup);
            }
            mesh.drawShadows(shadowPass, light);
          }
        }
        shadowPass.end();
      }
      // opacy
      this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
      let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
      let lastPipeline = null;
      for(const mesh of this.mainRenderBundle) {
        if(mesh.material?.useBlend) continue;
        const targetPipeline = mesh.pipeline || this.mainRenderBundle[0].pipeline;
        if(lastPipeline !== targetPipeline) {
          pass.setPipeline(targetPipeline);
          lastPipeline = targetPipeline;
        }
        mesh.drawElements(pass, this.lightContainer);
      }
      // blend
      for(const mesh of this.mainRenderBundle) {
        if(mesh.material?.useBlend !== true) continue;
        if(!mesh.sceneBindGroupForRender) {
          mesh.shadowDepthTextureView = this.shadowArrayView;
          mesh.setupPipeline();
        }
        pass.setPipeline(mesh.pipelineTransparent);
        mesh.drawElements(pass, this.lightContainer);
      }
      pass.end();

      const cam = this.cameras[this.mainCameraParams.type];
      if(this.collisionSystem) this.collisionSystem.update();
      const transPass = commandEncoder.beginRenderPass(this._transPassDesc);
      mat4.multiply(cam.projectionMatrix, cam.view, this._viewProjMatrix);
      const viewProjMatrix = this._viewProjMatrix;
      for(let meshIndex = 0;meshIndex < this.mainRenderBundle.length;meshIndex++) {
        const mesh = this.mainRenderBundle[meshIndex];
        if(mesh.effects) {
          for(const effectName in mesh.effects) {
            const effect = mesh.effects[effectName];
            if(effect.enabled === false) continue;
            if(effect.updateInstanceData) effect.updateInstanceData(mesh.modelMatrix);
            effect.render(transPass, mesh, viewProjMatrix);
          }
        }
      }
      transPass.end();
      if(this.volumetricPass.enabled === true) {
        mat4.invert(this._viewProjMatrix, this._invViewProj);
        const light = this.lightContainer[0];
        this.volumetricPass.render(commandEncoder, this.sceneTextureView, this.mainDepthView,
          this.shadowArrayView, {invViewProjectionMatrix: this._invViewProj},
          {viewProjectionMatrix: light.viewProjMatrix, direction: light.direction, }
        )
      }
      const canvasView = this.context.getCurrentTexture().createView();
      if(this.bloomPass.enabled == true) {
        const bloomInput = this.volumetricPass.enabled ? this.volumetricPass.compositeOutputTexView : this.sceneTextureView;
        this.bloomPass.render(commandEncoder, bloomInput, this.bloomOutputTex);
      }
      pass = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: canvasView,
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: {r: 0, g: 0, b: 0, a: 1}
        }]
      });
      pass.setPipeline(this.presentPipeline);
      pass.setBindGroup(0, this.bloomPass.enabled === true ? this.bloomBindGroup : this.noBloomBindGroup);
      pass.draw(6);
      pass.end();
      this.graphUpdate(this.now);
      this.device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(this.frame);
    } catch(err) {
      if(this.logLoopError) console.log('%cLoop(warn):' + err + " info : " + err.stack, LOG_WARN)
      requestAnimationFrame(this.frame);
    }
  }

  graphUpdate = (delta) => {}

  addGlbObj = (o, BVHANIM, glbFile, clearColor = this.options.clearColor) => {
    if(typeof o.name === 'undefined') {o.name = genName(9)}
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
    if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
    if(typeof o.material === 'undefined') {o.material = {type: 'standard'}}
    if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
    if(typeof o.scale === 'undefined') {o.scale = [1, 1, 1];}
    if(typeof o.raycast === 'undefined') {o.raycast = {enabled: false, radius: 2}}
    if(typeof o.pointerEffect === 'undefined') {o.pointerEffect = {enabled: false};}
    if(typeof o.useScale === 'undefined') {o.useScale = true;}

    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if(typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",//                   must be fixed<<
        radius: (typeof o.scale == Number ? o.scale : o.scale[0]),
        name: o.name,
        rotation: o.rotation
      }
    }
    if(typeof o.physics.enabled === 'undefined') {o.physics.enabled = true}
    if(typeof o.physics.geometry === 'undefined') {o.physics.geometry = "Cube"}
    if(typeof o.physics.radius === 'undefined') {o.physics.radius = o.scale}
    if(typeof o.physics.mass === 'undefined') {o.physics.mass = 1;}
    if(typeof o.physics.name === 'undefined') {o.physics.name = o.name;}
    if(typeof o.physics.scale === 'undefined') {o.physics.scale = o.scale;}
    if(typeof o.physics.rotation === 'undefined') {o.physics.rotation = o.rotation;}
    o.physics.position = o.position;
    if(typeof o.objAnim == 'undefined' || typeof o.objAnim == null) {
      o.objAnim = null;
    } else {
      alert('GLB not use objAnim (it is only for obj sequence). GLB use BVH skeletal for animation');
    }

    o.textureCache = this.textureCache;
    let skinnedNodeIndex = 0;
    for(const skinnedNode of glbFile.skinnedMeshNodes) {
      let c = 0;
      for(const primitive of skinnedNode.mesh.primitives) {
        // console.log(`count: ${c} primitive-glb: ${primitive}`);
        // primitive is mesh - probably with own material . material/texture per primitive
        // create scene object for each skinnedNode
        o.name = o.name + "-" + skinnedNode.name + '-' + c;
        const bvhPlayer = new BVHPlayer(
          o,
          BVHANIM,
          glbFile,
          c,
          skinnedNodeIndex,
          this.canvas,
          this.device,
          this.context,
          this.inputHandler,
          this.globalAmbient.slice());
        skinnedNodeIndex++;
        // console.log(`bvhPlayer!!!!!: ${bvhPlayer}`);
        bvhPlayer.spotlightUniformBuffer = this.spotlightUniformBuffer;
        bvhPlayer.clearColor = clearColor;
        // if(o.physics.enabled == true) {
        //   this.matrixAmmo.addPhysics(myMesh1, o.physics)
        // }
        // make it soft
        this.mainRenderBundle.push(bvhPlayer);
        this.sortRenderBundle();
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('updateSceneContainer', {detail: {}}))
        }, 50);
        c++;
      }
    }
    if(typeof this.editor !== 'undefined') {
      this.editor.editorHud.updateSceneContainer();
    }
  }

  addGlbObjInctance = (o, BVHANIM, glbFile, clearColor = this.options.clearColor) => {
    if(typeof o.name === 'undefined') {o.name = genName(9)}
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
    if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
    if(typeof o.material === 'undefined') {o.material = {type: 'standard'}}
    if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
    if(typeof o.scale === 'undefined') {o.scale = [1, 1, 1];}
    if(typeof o.raycast === 'undefined') {o.raycast = {enabled: false, radius: 2}}
    if(typeof o.pointerEffect === 'undefined') {
      o.pointerEffect = {
        enabled: false,
        pointer: false,
        ballEffect: false
      };
    }
    if(typeof o.useScale === 'undefined') {o.useScale = true;}
    if(typeof o.envMapParams === 'undefined') {o.envMapParams = null;}
    o.textureCache = this.textureCache;
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if(typeof o.physics === 'undefined') {
      o.physics = {
        scale: o.scale,
        enabled: true,
        geometry: "Sphere",//                   must be fixed<<
        radius: (typeof o.scale == Number ? o.scale : o.scale[0]),
        name: o.name,
        rotation: o.rotation
      }
    }
    if(typeof o.physics.enabled === 'undefined') {o.physics.enabled = true}
    if(typeof o.physics.geometry === 'undefined') {o.physics.geometry = "Cube"}
    if(typeof o.physics.radius === 'undefined') {o.physics.radius = o.scale}
    if(typeof o.physics.mass === 'undefined') {o.physics.mass = 1;}
    if(typeof o.physics.name === 'undefined') {o.physics.name = o.name;}
    if(typeof o.physics.scale === 'undefined') {o.physics.scale = o.scale;}
    if(typeof o.physics.rotation === 'undefined') {o.physics.rotation = o.rotation;}
    o.physics.position = o.position;
    if(typeof o.objAnim == 'undefined' || typeof o.objAnim == null) {
      o.objAnim = null;
    } else {
      console.warn('GLB not use objAnim (it is only for obj sequence). GLB use BVH skeletal for animation');
    }

    let skinnedNodeIndex = 0;
    for(const skinnedNode of glbFile.skinnedMeshNodes) {
      let c = 0;
      for(const primitive of skinnedNode.mesh.primitives) {
        // console.log(`count: ${c} primitive-glb: ${primitive}`);
        // primitive is mesh - probably with own material . material/texture per primitive
        // create scene object for each skinnedNode
        o.name = o.name + "_" + skinnedNode.name;
        // maybe later add logic from constructor
        // always fisrt sub mesh(skinnedmeg-vert group how comes from loaders)
        if(skinnedNodeIndex == 0) {} else {
          o.pointerEffect = {enabled: false};
        }
        const bvhPlayer = new BVHPlayerInstances(
          o,
          BVHANIM,
          glbFile,
          c,
          skinnedNodeIndex,
          this.canvas,
          this.device,
          this.context,
          this.inputHandler,
          this.globalAmbient.slice());
        // console.log(`bvhPlayer!!!!!: ${bvhPlayer}`);
        bvhPlayer.spotlightUniformBuffer = this.spotlightUniformBuffer;
        bvhPlayer.clearColor = clearColor;
        // if(o.physics.enabled == true) {
        //   this.matrixAmmo.addPhysics(myMesh1, o.physics)
        // }
        // make it soft
        setTimeout(() => {
          this.mainRenderBundle.push(bvhPlayer);
          this.sortRenderBundle();
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('updateSceneContainer', {detail: {}}))
          }, 50);
        }, 200)
        c++;
      }
      skinnedNodeIndex++;
    }
    if(typeof this.editor !== 'undefined') {
      this.editor.editorHud.updateSceneContainer();
    }
  }

  sortRenderBundle() {
    this.mainRenderBundle.sort((a, b) => {
      // blend meshes always go last (you already have a second loop for them)
      const aBlend = a.material?.useBlend ? 1 : 0;
      const bBlend = b.material?.useBlend ? 1 : 0;
      if(aBlend !== bBlend) return aBlend - bBlend;
      // group by pipeline reference
      const aPipe = a.pipeline || this.mainRenderBundle[0].pipeline;
      const bPipe = b.pipeline || this.mainRenderBundle[0].pipeline;
      if(aPipe < bPipe) return -1;
      if(aPipe > bPipe) return 1;
      return 0;
    });
  }

  activateBloomEffect = () => {
    if(this.bloomPass.enabled != true) {
      this.bloomPass = new BloomPass(this.canvas.width, this.canvas.height, this.device, 1.5);
      this.bloomPass.enabled = true;
    }
  }

  activateVolumetricEffect = () => {
    if(this.volumetricPass.enabled != true) {
      this.volumetricPass = new VolumetricPass(
        this.canvas.width,
        this.canvas.height,
        this.device,
        {
          density: 0.03,
          steps: 32,
          scatterStrength: 1.2,
          heightFalloff: 0.08,
          lightColor: [1.0, 0.88, 0.65],  // warm sunlight
        }
      ).init();
      this.volumetricPass.enabled = true;
    }
  }
}