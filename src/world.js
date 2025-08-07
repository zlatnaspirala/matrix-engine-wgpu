import {vec3} from "wgpu-matrix";
import MEBall from "./engine/ball.js";
import MECube from './engine/cube.js';
import {ArcballCamera, WASDCamera} from "./engine/engine.js";
import MEMesh from "./engine/mesh.js";
import MEMeshObj from "./engine/mesh-obj.js";
import MatrixAmmo from "./physics/matrix-ammo.js";
import {LOG_WARN, genName, mb, scriptManager, urlQuery} from "./engine/utils.js";
import {MultiLang} from "./multilang/lang.js";
import {MatrixSounds} from "./sounds/sounds.js";
import {play} from "./engine/loader-obj.js";

export default class MatrixEngineWGPU {

  mainRenderBundle = [];
  rbContainer = [];
  frame = () => {};

  entityHolder = [];

  entityArgPass = {
    loadOp: 'clear',
    storeOp: 'store',
    depthLoadOp: 'clear',
    depthStoreOp: 'store'
  }

  matrixAmmo = new MatrixAmmo();
  matrixSounds = new MatrixSounds();

  // The input handler
  constructor(options, callback) {
    // console.log('typeof options ', typeof options )
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
    this.options = options;
    this.mainCameraParams = options.mainCameraParams;

    const target = this.options.appendTo || document.body;
    var canvas = document.createElement('canvas')
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
    // console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef)
    this.mainCameraParams = {
      type: this.options.mainCameraParams.type,
      responseCoef: this.options.mainCameraParams.responseCoef
    }

    this.cameras = {
      arcball: new ArcballCamera({position: initialCameraPosition}),
      WASD: new WASDCamera({position: initialCameraPosition}),
    };

    this.label = new MultiLang()
    if(urlQuery.lang != null) {
      this.label.loadMultilang(urlQuery.lang).then((r) => {
        this.label.get = r;
      });
    } else {
      this.label.loadMultilang().then((r) => {
        this.label.get = r;
      });
    }

    this.init({canvas, callback})
  }

  init = async ({canvas, callback}) => {
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice({
      extensions: ["ray_tracing"]
    });

    // Maybe works in ssl with webworkers...
    // const adapterInfo = await this.adapter.requestAdapterInfo();
    // var test = this.adapter.features()
    // console.log(adapterInfo.vendor);
    // console.log('test' + test);
    // console.log("FEATURES : " + this.adapter.features)

    this.context = canvas.getContext('webgpu');

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

    this.run(callback)
  };

  getSceneObjectByName(name) {
    return this.mainRenderBundle.find((sceneObject) => sceneObject.name === name )
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

  // Not in use for now
  addMesh = (o) => {
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
    if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
    if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
    if(typeof o.scale === 'undefined') {o.scale = 1;}
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if(typeof o.name === 'undefined') {o.name = 'random' + Math.random();}
    if(typeof o.mesh === 'undefined') {
      throw console.error('arg mesh is empty...');
      return;
    }
    console.log('Mesh procedure', o)
    let myMesh1 = new MEMesh(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myMesh1);
  }

  addMeshObj = (o , clearColor=this.options.clearColor) => {
    if(typeof o.name === 'undefined') {o.name = genName(9)}
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
    if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
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
    //  console.log('Mesh procedure', o)
    // TEST OBJS SEQ ANIMS 
    if(typeof o.objAnim == 'undefined' || typeof o.objAnim == null) {
      o.objAnim = null;
    } else {
      // console.log('o.anim', o.objAnim)
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
          console.log('SCALE');
          this.meshList[k].setScale(s);
        }
      }
    }
    let myMesh1 = new MEMeshObj(this.canvas, this.device, this.context, o);
    myMesh1.clearColor = clearColor;
    if(o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myMesh1, o.physics)
    }
    this.mainRenderBundle.push(myMesh1);
  }

  run(callback) {
    setTimeout(() => {requestAnimationFrame(this.frame)}, 500)
    setTimeout(() => {callback(this)}, 20)
  }

  destroyProgram = () => {
    this.mainRenderBundle = undefined;
    this.canvas.remove();
  }

  frameSinglePass = () => {
    if(typeof this.mainRenderBundle == 'undefined') return;
    try {
      let shadowPass = null;
      let renderPass;
      let commandEncoder = this.device.createCommandEncoder();

      this.mainRenderBundle.forEach((meItem, index) => {
        meItem.position.update();
      })

      if (this.matrixAmmo) this.matrixAmmo.updatePhysics();

      this.mainRenderBundle.forEach((meItem, index) => {
        meItem.draw(commandEncoder);

        shadowPass = commandEncoder.beginRenderPass(meItem.shadowPassDescriptor);
        shadowPass.setPipeline(meItem.shadowPipeline);
        meItem.drawShadows(shadowPass);
        shadowPass.end();
      })

      this.mainRenderBundle.forEach((meItem, index) => {
        if(index == 0) {
          renderPass = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
          renderPass.setPipeline(meItem.pipeline);
        }
      })

      this.mainRenderBundle.forEach((meItem, index) => {
        meItem.drawElements(renderPass);
      })
      if(renderPass) renderPass.end();

      this.device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(this.frame);
    } catch(err) {
      console.log('%cDraw func (err):' + err, LOG_WARN)
      requestAnimationFrame(this.frame);
    }
  }

  framePassPerObject = () => {
    let commandEncoder = this.device.createCommandEncoder();
    this.matrixAmmo.updatePhysics();
    this.mainRenderBundle.forEach((meItem, index) => {
      if(index === 0) {
        if(meItem.renderPassDescriptor) meItem.renderPassDescriptor.colorAttachments[0].loadOp = 'clear';
      } else {
        if(meItem.renderPassDescriptor) meItem.renderPassDescriptor.colorAttachments[0].loadOp = 'load';
      }
      // Update transforms, physics, etc. (optional)
      meItem.draw(commandEncoder); // optional: if this does per-frame updates
      if(meItem.renderBundle) {
        // Set up view per object
        meItem.renderPassDescriptor.colorAttachments[0].view =
          this.context.getCurrentTexture().createView();
        const passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
        passEncoder.executeBundles([meItem.renderBundle]); // ✅ Use only this bundle
        passEncoder.end();
      } else {
        meItem.draw(commandEncoder); // fallback if no renderBundle
      }
    });
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame);
  }
}