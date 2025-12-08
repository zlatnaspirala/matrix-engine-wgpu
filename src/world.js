import {mat4, vec3} from "wgpu-matrix";
import MEBall from "./engine/ball.js";
import MECube from './engine/cube.js';
import {ArcballCamera, RPGCamera, WASDCamera} from "./engine/engine.js";
import {createInputHandler} from "./engine/engine.js";
import MEMeshObj from "./engine/mesh-obj.js";
import MatrixAmmo from "./physics/matrix-ammo.js";
import {LOG_FUNNY_SMALL, LOG_WARN, genName, mb, scriptManager, urlQuery} from "./engine/utils.js";
import {MultiLang} from "./multilang/lang.js";
import {MatrixSounds} from "./sounds/sounds.js";
import {play} from "./engine/loader-obj.js";
import {SpotLight} from "./engine/lights.js";
import {BVHPlayer} from "./engine/loaders/bvh.js";
import {BVHPlayerInstances} from "./engine/loaders/bvh-instaced.js";
import {Editor} from "./tools/editor/editor.js";

/**
 * @description
 * Main engine root class.
 * @author Nikola Lukic 2025
 * @email zlatnaspirala@gmail.com
 * @web https://maximumroulette.com
 * @github zlatnaspirala
 */
export default class MatrixEngineWGPU {

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
  // matrixAmmo = new MatrixAmmo();
  matrixSounds = new MatrixSounds();

  constructor(options, callback) {
    if(typeof options == 'undefined' || typeof options == "function") {
      this.options = {
        useSingleRenderPass: true,
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
      this.matrixAmmo = new MatrixAmmo();
    }

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
        mb.error(`Activated WebEditor, you can use it infly there is no saves for now.`);
        app.activateEditor();
        return false;
      }
    });

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

    // The camera types
    const initialCameraPosition = vec3.create(0, 0, 0);
    this.mainCameraParams = {
      type: this.options.mainCameraParams.type,
      responseCoef: this.options.mainCameraParams.responseCoef
    };

    this.cameras = {
      arcball: new ArcballCamera({position: initialCameraPosition}),
      WASD: new WASDCamera({position: initialCameraPosition, canvas: canvas}),
      RPG: new RPGCamera({position: initialCameraPosition, canvas: canvas}),
    };

    this.label = new MultiLang()
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
      });;
    }
    this.init({canvas, callback})
  }

  init = async ({canvas, callback}) => {
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice({
      extensions: ["ray_tracing"]
    });

    this.context = canvas.getContext('webgpu');
    // this.context = canvas.getContext('webgpu', { alphaMode: 'opaque' });
    // this.context = canvas.getContext('webgpu', { alphaMode: 'premultiplied' });
    const devicePixelRatio = window.devicePixelRatio;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    if(this.options.useSingleRenderPass == true) {
      this.frame = this.frameSinglePass;
    } else {
      this.frame = this.framePassPerObject;
    }

    this.globalAmbient = vec3.create(0.5, 0.5, 0.5);
    this.MAX_SPOTLIGHTS = 20;
    this.inputHandler = createInputHandler(window, canvas);
    this.createGlobalStuff();
    this.run(callback)
  };

  createGlobalStuff() {
    this.spotlightUniformBuffer = this.device.createBuffer({
      label: 'spotlightUniformBufferGLOBAL',
      size: this.MAX_SPOTLIGHTS * 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.SHADOW_RES = 1024;
    this.createTexArrayForShadows()

    this.mainDepthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.mainDepthView = this.mainDepthTexture.createView();

    this.mainRenderPassDesc = {
      label: 'mainRenderPassDesc',
      colorAttachments: [{
        view: undefined,                // set each frame
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
  }
  createTexArrayForShadows() {
    let numberOfLights = this.lightContainer.length;
    if(this.lightContainer.length == 0) {
      setTimeout(() => {
        // console.info('Test light again...')
        this.createMe();
      }, 800);
    }

    this.createMe = () => {
      Math.max(1, this.lightContainer.length);
      if(this.lightContainer.length == 0) {
        setTimeout(() => {
          // console.info('Create now test...')
          this.createMe();
        }, 800);
        return;
      }

      // console.warn('Create this.shadowTextureArray...')
      this.shadowTextureArray = this.device.createTexture({
        label: `shadowTextureArray[GLOBAL] num of light ${numberOfLights}`,
        size: {
          width: 1024,
          height: 1024,
          depthOrArrayLayers: numberOfLights, // at least 1
        },
        dimension: '2d',
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });

      this.shadowArrayView = this.shadowTextureArray.createView({
        dimension: '2d-array'
      });

      this.shadowVideoTexture = this.device.createTexture({
        size: [1024, 1024],
        format: "depth32float",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      });

      this.shadowVideoView = this.shadowVideoTexture.createView({
        dimension: "2d",
      });
    }

    this.createMe();
  }

  getSceneObjectByName(name) {
    return this.mainRenderBundle.find((sceneObject) => sceneObject.name === name)
  }

  // Not in use for now
  addCube = (o) => {
    if(typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {x: 0, y: 0, z: -4},
        texturesPaths: ['./res/textures/default.png'],
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      }
    } else {
      if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
      if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
      if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
      if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
      if(typeof o.scale === 'undefined') {o.scale = 1;}
      if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }

    if(typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        radius: o.scale,
        name: o.name,
        rotation: o.rotation
      }
    }
    if(typeof o.position !== 'undefined') {o.physics.position = o.position;}
    if(typeof o.physics.enabled === 'undefined') {o.physics.enabled = true}
    if(typeof o.physics.geometry === 'undefined') {o.physics.geometry = "Sphere"}
    if(typeof o.physics.radius === 'undefined') {o.physics.radius = o.scale}
    if(typeof o.physics.mass === 'undefined') {o.physics.mass = 1;}
    if(typeof o.physics.name === 'undefined') {o.physics.name = o.name;}
    if(typeof o.physics.scale === 'undefined') {o.physics.scale = o.scale;}
    if(typeof o.physics.rotation === 'undefined') {o.physics.rotation = o.rotation;}

    let myCube1 = new MECube(this.canvas, this.device, this.context, o)
    if(o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myCube1, o.physics);
    }
    this.mainRenderBundle.push(myCube1);
  }

  // Not in use for now
  addBall = (o) => {
    if(typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {x: 0, y: 0, z: -4},
        texturesPaths: ['./res/textures/default.png'],
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      }
    } else {
      if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
      if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
      if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
      if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
      if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
      if(typeof o.scale === 'undefined') {o.scale = 1;}
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }

    if(typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        radius: o.scale,
        name: o.name,
        rotation: o.rotation
      }
    }
    if(typeof o.position !== 'undefined') {o.physics.position = o.position;}
    if(typeof o.physics.enabled === 'undefined') {o.physics.enabled = true}
    if(typeof o.physics.geometry === 'undefined') {o.physics.geometry = "Sphere"}
    if(typeof o.physics.radius === 'undefined') {o.physics.radius = o.scale}
    if(typeof o.physics.mass === 'undefined') {o.physics.mass = 1;}
    if(typeof o.physics.name === 'undefined') {o.physics.name = o.name;}
    if(typeof o.physics.scale === 'undefined') {o.physics.scale = o.scale;}
    if(typeof o.physics.rotation === 'undefined') {o.physics.rotation = o.rotation;}

    let myBall1 = new MEBall(this.canvas, this.device, this.context, o);
    if(o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myBall1, o.physics)
    }
    this.mainRenderBundle.push(myBall1);
  }

  addLight(o) {
    const camera = this.cameras[this.mainCameraParams.type];
    let newLight = new SpotLight(camera, this.inputHandler, this.device);
    this.lightContainer.push(newLight);
    this.createTexArrayForShadows();
    console.log(`%cAdd light: ${newLight}`, LOG_FUNNY_SMALL);
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

    let AM = this.globalAmbient.slice();
    let myMesh1 = new MEMeshObj(this.canvas, this.device, this.context, o, this.inputHandler, AM);
    myMesh1.spotlightUniformBuffer = this.spotlightUniformBuffer;
    myMesh1.clearColor = clearColor;
    if(o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myMesh1, o.physics)
    }
    this.mainRenderBundle.push(myMesh1);

    if(typeof this.editor !== 'undefined') {
      this.editor.editorHud.updateSceneContainer();
    }
  }

  run(callback) {
    setTimeout(() => {requestAnimationFrame(this.frame)}, 500)
    setTimeout(() => {callback(this)}, 20)
  }

  destroyProgram = () => {
    this.mainRenderBundle = [];
    this.canvas.remove();
  }

  updateLights() {
    const floatsPerLight = 36; // not 20 anymore
    const data = new Float32Array(this.MAX_SPOTLIGHTS * floatsPerLight);
    for(let i = 0;i < this.MAX_SPOTLIGHTS;i++) {
      if(i < this.lightContainer.length) {
        const buf = this.lightContainer[i].getLightDataBuffer();
        data.set(buf, i * floatsPerLight);
      } else {
        data.set(new Float32Array(floatsPerLight), i * floatsPerLight);
      }
    }
    this.device.queue.writeBuffer(this.spotlightUniformBuffer, 0, data.buffer);
  }

  frameSinglePass = () => {
    if(typeof this.mainRenderBundle == 'undefined' || this.mainRenderBundle.length == 0) {
      setTimeout(() => {requestAnimationFrame(this.frame)}, 100);
      return;
    }
    this.mainRenderBundle.forEach((meItem, index) => {
      if(meItem.isVideo == true) {
        if(!meItem.externalTexture) { // || meItem.video.readyState < 2) {
          // console.log('no rendere for video not ready')
          // this.externalTexture = this.device.importExternalTexture({source: this.video});
          meItem.createBindGroupForRender();
          setTimeout(() => {
            requestAnimationFrame(this.frame)
          }, 1000)
          return;
        }
      }
    })

    try {
      let commandEncoder = this.device.createCommandEncoder();
      this.updateLights()
      // 1️⃣ Update light data (position, direction, uniforms)
      for(const light of this.lightContainer) {
        light.update()
        this.mainRenderBundle.forEach((meItem, index) => {
          meItem.updateModelUniformBuffer()
          meItem.getTransformationMatrix(this.mainRenderBundle, light, index)
        })
      }
      if(this.matrixAmmo) this.matrixAmmo.updatePhysics();

      let now, deltaTime;

      for(let i = 0;i < this.lightContainer.length;i++) {
        const light = this.lightContainer[i];
        let ViewPerLightRenderShadowPass = this.shadowTextureArray.createView({
          dimension: '2d',
          baseArrayLayer: i,
          arrayLayerCount: 1, // must be > 0
          baseMipLevel: 0,
          mipLevelCount: 1,
        });

        const shadowPass = commandEncoder.beginRenderPass({
          label: "shadowPass",
          colorAttachments: [],
          depthStencilAttachment: {
            view: ViewPerLightRenderShadowPass,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            depthClearValue: 1.0,
          }
        });

        now = performance.now() / 1000;
        // shadowPass.setPipeline(light.shadowPipeline);
        for(const [meshIndex, mesh] of this.mainRenderBundle.entries()) {
          if(mesh instanceof BVHPlayerInstances) {
            mesh.updateInstanceData(mesh.getModelMatrix(mesh.position))
            shadowPass.setPipeline(light.shadowPipelineInstanced);
          } else {
            // must be base meshObj
            shadowPass.setPipeline(light.shadowPipeline);
          }

          if(mesh.videoIsReady == 'NONE') {
            shadowPass.setBindGroup(0, light.getShadowBindGroup(mesh, meshIndex));
            // if(mesh.glb && mesh.glb.skinnedMeshNodes) {
            // shadowPass.setBindGroup(1, light.getShadowBindGroup_bones(meshIndex));
            // } else {
            if(mesh instanceof BVHPlayerInstances) {
              shadowPass.setBindGroup(1, mesh.modelBindGroupInstanced);
            } else {
              shadowPass.setBindGroup(1, mesh.modelBindGroup);
            }
            // }
            mesh.drawShadows(shadowPass, light);
          }
        }
        shadowPass.end();
      }
      const currentTextureView = this.context.getCurrentTexture().createView();
      this.mainRenderPassDesc.colorAttachments[0].view = currentTextureView;
      let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
      // Loop over each mesh

      for(const mesh of this.mainRenderBundle) {
        mesh.position.update()
        if(mesh.update) {
          now = performance.now() / 1000; // seconds
          deltaTime = now - (this.lastTime || now);
          this.lastTime = now;
          mesh.update(deltaTime); // glb
        }
        pass.setPipeline(mesh.pipeline);
        if(!mesh.sceneBindGroupForRender || (mesh.FINISH_VIDIO_INIT == false && mesh.isVideo == true)) {
          for(const m of this.mainRenderBundle) {
            if(m.isVideo == true) {
              console.log('✅shadowVideoView', this.shadowVideoView)
              m.shadowDepthTextureView = this.shadowVideoView;
              m.FINISH_VIDIO_INIT = true;
              m.setupPipeline();
            } else {
              m.shadowDepthTextureView = this.shadowArrayView;
              m.setupPipeline();
            }
          }
        }
        mesh.drawElements(pass, this.lightContainer);
      }
      pass.end();

      // 3) resolve collisions AFTER positions changed
      if(this.collisionSystem) this.collisionSystem.update();
      // 4) render / send network updates / animations etc

      // transparent pointerEffect pass (load color, load depth)
      const transPassDesc = {
        colorAttachments: [{view: currentTextureView, loadOp: 'load', storeOp: 'store'}],
        depthStencilAttachment: {
          view: this.mainDepthView,
          depthLoadOp: 'load',
          depthStoreOp: 'store',
          depthClearValue: 1.0,
        }
      };
      const transPass = commandEncoder.beginRenderPass(transPassDesc);
      const viewProjMatrix = mat4.multiply(this.cameras[this.mainCameraParams.type].projectionMatrix,
        this.cameras[this.mainCameraParams.type].view, mat4.identity());
      for(const mesh of this.mainRenderBundle) {
        if(mesh.effects) Object.keys(mesh.effects).forEach(effect_ => {
          const effect = mesh.effects[effect_];
          if(effect.enabled == false) return;
          let md = mesh.getModelMatrix(mesh.position);
          if(effect.updateInstanceData) effect.updateInstanceData(md);
          effect.render(transPass, mesh, viewProjMatrix)
        });
      }
      transPass.end();

      this.device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(this.frame);
    } catch(err) {
      console.log('%cLoop(err):' + err + " info : " + err.stack, LOG_WARN)
      requestAnimationFrame(this.frame);
    }
  }

  framePassPerObject = () => {
    let commandEncoder = this.device.createCommandEncoder();
    if(this.matrixAmmo.rigidBodies && this.matrixAmmo.rigidBodies.length > 0) this.matrixAmmo.updatePhysics();
    this.mainRenderBundle.forEach((meItem, index) => {
      if(index === 0) {
        if(meItem.renderPassDescriptor) meItem.renderPassDescriptor.colorAttachments[0].loadOp = 'clear';
      } else {
        if(meItem.renderPassDescriptor) meItem.renderPassDescriptor.colorAttachments[0].loadOp = 'load';
      }
      // Update transforms, physics, etc. (optional)
      meItem.draw(commandEncoder);
      if(meItem.renderBundle) {
        // Set up view per object
        meItem.renderPassDescriptor.colorAttachments[0].view =
          this.context.getCurrentTexture().createView();
        const passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
        passEncoder.executeBundles([meItem.renderBundle]); // ✅ Use only this bundle
        passEncoder.end();
      } else {
        meItem.draw(commandEncoder);
      }
    });
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame);
  }

  // ---------------------------------------
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
        setTimeout(() => {this.mainRenderBundle.push(bvhPlayer)}, 800);
        // this.mainRenderBundle.push(bvhPlayer)
        c++;
      }
    }
    if(typeof this.editor !== 'undefined') {
      this.editor.editorHud.updateSceneContainer();
    }
  }

  // NEW TEST INSTANCED DRAWS
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
        setTimeout(() => {this.mainRenderBundle.push(bvhPlayer)}, 200)
        c++;
      }
      skinnedNodeIndex++;
    }
    if(typeof this.editor !== 'undefined') {
      this.editor.editorHud.updateSceneContainer();
    }
  }
}