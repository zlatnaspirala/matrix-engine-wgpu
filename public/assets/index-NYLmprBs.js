(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const I of o.addedNodes)I.tagName==="LINK"&&I.rel==="modulepreload"&&r(I)}).observe(document,{childList:!0,subtree:!0});function t(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(a){if(a.ep)return;a.ep=!0;const o=t(a);fetch(a.href,o)}})();(function(){for(var s={},e=window.location.search.substring(1),t=e.split("&"),r=0;r<t.length;r++){var a=t[r].split("=");if(typeof s[a[0]]>"u")s[a[0]]=decodeURIComponent(a[1]);else if(typeof s[a[0]]=="string"){var o=[s[a[0]],decodeURIComponent(a[1])];s[a[0]]=o}else s[a[0]].push(decodeURIComponent(a[1]))}return s})();const N="font-family: system-ui; font-size:16px; font-weight:400;color:#ffffff;text-shadow: 2px 2px 6px #000;background:linear-gradient(90deg,#111,#222); padding:12px 18px;";new Headers({"Content-Type":"application/json",Accept:"application/json"});new Headers({"Content-Type":"text/html",Accept:"text/plain"});class H{constructor(){this.ws=null,this.updateSceneEvent=new CustomEvent("updateSceneContainer",{detail:{}}),this.ws=new WebSocket("ws://localhost:1243"),this.ws.onopen=()=>{console.log("%c[CODE CREATOR][WS OPEN]",N),document.dispatchEvent(new CustomEvent("code-creator-ready",{}))},this.ws.onmessage=e=>{try{const t=JSON.parse(e.data);console.log("%c[EDITOR][WS MESSAGE]",N,t),t.refresh=="refresh"?setTimeout(()=>document.dispatchEvent(this.updateSceneEvent),1e3):t.aiGenGraph&&t.ok==!0?(console.log("TheBeast Creator ✅:",t.aiGenNodes),document.dispatchEvent(new CustomEvent("on-ai-response",{detail:t.aiGenNodes}))):console.info("no_handler",t)}catch(t){console.error("[WS ERROR PARSE]",t)}},this.ws.onerror=e=>{console.error("%c[WS ERROR]","color: red",e),document.dispatchEvent(new CustomEvent("editor-not-running",{detail:{}}))},this.ws.onclose=()=>{console.log("%c[WS CLOSED]","color: gray")},this.attachEvents()}attachEvents(){document.addEventListener("aiGenGraphCall",e=>{console.info("%caiGenGraphCall fluxCodexVertex <signal>",N);let t={action:"aiGenGraphCall",prompt:e.detail};t=JSON.stringify(t),this.ws.send(t)})}}const V=`You are a Matrix engine WGPU (The beast) code project generator.
TheBeast is super fast webgpu rendering engine with focus on mobile browsers always count on performance optimisation.

Your task:
Convert a natural language description into a the-beast top level code made ONLY from the allowed code examples listed below.
NEVER include explanations or comments in output!
ALWAYS finish job to the end.


RULES:
- Use ONLY code explicitly listed.
- NEVER invent new functions types.
- Output ONLY valid Javascript code.
- Do NOT include explanations or comments.
- NOTE: World 3d space is Y-up , camera usually look at -z , cube geometry tooks 2 units in space.
  It means if you wanna add two cube side by side than use spacing 2 (for example cube1 position.x =-1 and cube2.position.x = 1)
- Use alsways uniq name for new scene object!


RECOMMENDED:
- If ask "create me house", you dont just use 3 cubes you must buidl whole house with doors , windows , use scale cube.

STRICT RULES (DO NOT VIOLATE):
- Just follow examples

RESOURCE LIST:
____INJECT_RES_MANIFEST____


WRAPPER FOR EVERY EXAMPLE:
import { MatrixEngineWGPU, downloadMeshes, addRaycastsAABBListener, isMobile, randomIntFromTo, GenGeoTexture2 } from "matrix-engine-wgpu";

let beastApp = new MatrixEngineWGPU({
  canvasSize: 'fullscreen',
  fastRender: 0.9,
  dontUsePhysics: true,
  MAX_SPOTLIGHTS: 1,
  MAX_BONES: 0,
  mainCameraParams: {
    type: 'firstPersonCamera',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  beastApp.addLight();
  // if you double call downloadMeshes for same path engine use cached values no double fetch...
  downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
    onLoadObj, {scale: [1, 1, 1]})
  downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

  addRaycastsAABBListener('canvas1', 'click');

  function onGround(m) {
    beastApp.addMeshObj({
      material: {type: 'standard', share: true},
      position: {x: 0, y: -5, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/textures/floor1.webp'], //, './res/textures/env-maps/sky1_lod_mid.webp'],
      name: 'floor',
      mesh: m.cube,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      }
    })
  }

  async function onLoadObj(m) {
    beastApp.addMeshObj({
      material: {type: 'standard', share: true},
      position: {x: 0, y: -1, z: -20},
      rotation: {x: 0, y: 0, z: 0},
      scale: [100, 100, 100],
      rotationSpeed: {x: 0, y: 0.1, z: 0},
      texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
      name: 'sky',
      mesh: m.ball,
      physics: {
        enabled: false,
        geometry: "Sphere"
      }
    });

    // material: {type: 'mirror', share: true }, share: true if not defined it is false.
    let MYCUBE = beastApp.addMeshObj({
      material: {type: 'mirror'},
      position: {x: 0, y: 4, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 1, z: 0},
      scale: [3, 5, 1],
      texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
      name: 'cube',
      mesh: m.cube,
      envMapParams: {
        baseColorMix: 0.1,                // CLEAR SKY
        mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
        reflectivity: 0.75,               // 25% reflection blend
        illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
        illuminateStrength: 1.5,          // Gentle rim
        illuminatePulse: 0.1,             // No pulse (static)
        fresnelPower: 5,                  // Medium-sharp edge
        envLodBias: 1.5,
        usePlanarReflection: false,       // Must be false - WIP
      },
      raycast: {enabled: true, radius: 1},
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      pointerEffect: {
        enabled: true,
        flameEmitter: true,
        bloodBurst: true
      }
    })

    beastApp.lightContainer[0].setIntensity(15);
    beastApp.activateBloomEffect();
    beastApp.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
    beastApp.lightContainer[0].behavior.value_ = -1;
    beastApp.lightContainer[0].updater.push((light) => {
      light.setTargetX(light.behavior.setPath0());
      light.setPosX(light.behavior.setPath0());
    })
    beastApp.lightContainer[0].setPosition(0, 15, -10);
    beastApp.lightContainer[0].setTarget(0, 0, -10);

    setTimeout(() => {
      MYCUBE.effects.circle = new GenGeoTexture2(beastApp.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
      app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
      MYCUBE.effects.flameEmitter.rotSpeed = 1;
      // Nice fire tourch effect.
      MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
        -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
        0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);
      MYCUBE.setAmbient(2, 3, 0.5);
      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(10);
      app.buildRenderBuckets();
      cam._dirtyAngle = true;
    }, 700);
  }
  beastApp.canvas.addEventListener("ray.hit.event", (e) => {
    console.log('ray.hit.event detected');
    if(e.detail.hitObject.name.startsWith('cube')) {
      e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
      e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
      e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
      app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
    }
  });
})
window.app = beastApp;


EXAMPLE MAZE (no rreal physics - used collisionSystem)

import { MatrixEngineWGPU, downloadMeshes, addRaycastsAABBListener, CollisionSystem, isMobile } from "matrix-engine-wgpu";

let maze = new MatrixEngineWGPU({
  canvasSize: 'fullscreen',
  fastRender: 0.9,
  render: 'culling',
  dontUsePhysics: true,
  MAX_SPOTLIGHTS: 1,
  MAX_BONES: 0,
  mainCameraParams: {
    type: 'firstPersonCamera',
    // type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {
  let mazeSize = 50;
  const spacing = 2;
  maze.collisionSystem = new CollisionSystem(maze);

  maze.addLight();
  addRaycastsAABBListener();
  // 1. Load the Cube Mesh
  downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
    generateMazeLogic(m);

    let floor = maze.addMeshObj({
      shadowsCast: false,
      material: {type: 'standard', share: false},
      position: {x: 0, y: 0, z: 0},
      scale: [80, 0.1, 80],
      texturesPaths: ['./res/textures/blankgray2.webp'],
      // becouse nano render use single mat per objectScene entity text not changed!
      name: 'floor',
      mesh: m.cube,
      physics: {enabled: false, mass: 0, geometry: "Cube"}
    });
    floor.ignoreCulling = true;

    setTimeout(() => {
      const checker2 = floor.createCheckerboardTexture(256, 128, [110, 150, 50, 255], [0, 0, 0, 1]);
      let samplerTest = maze.device.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
      });
      floor.changeTexture(checker2, samplerTest);
      floor.setUVScale(12, 12);

    }, 500)

  }, {scale: [1, 1, 1]});


  function generateMazeLogic(meshes) {
    if(mazeSize % 2 === 0) mazeSize += 1;
    let grid = Array(mazeSize).fill().map(() => Array(mazeSize).fill(0));
    function walk(x, y) {
      grid[y][x] = 1;
      let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);
      for(let [dx, dy] of dirs) {
        let nx = x + dx * 2, ny = y + dy * 2;
        if(nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && grid[ny][nx] === 0) {
          grid[y + dy][x + dx] = 1;
          walk(nx, ny);
        }
      }
    }
    walk(1, 1); // Start from (1,1) so (0,0) stays wall
    // Seal entire perimeter
    for(let i = 0;i < mazeSize;i++) {
      grid[0][i] = 0;
      grid[mazeSize - 1][i] = 0;
      grid[i][0] = 0;
      grid[i][mazeSize - 1] = 0;
    }
    // Carve entrance top-left, exit bottom-right
    grid[1][0] = 1;                          // entrance: left wall, row 1
    grid[mazeSize - 2][mazeSize - 1] = 1;    // exit: right wall, second-to-last row
    // Instantiate walls (unchanged)
    for(let y = 0;y < mazeSize;y++) {
      for(let x = 0;x < mazeSize;x++) {
        if(grid[y][x] === 0) {
          const wallName = "wall_" + x + "_" + y;
          let test = maze.addMeshObj({
            shadowsCast: false,
            material: {type: 'dark', shared: true},
            position: {
              x: x * spacing - (mazeSize * spacing) / 2,
              y: 0,
              z: y * spacing - (mazeSize * spacing) / 2
            },
            scale: [1, 3, 1],
            texturesPaths: ['./res/textures/blankgray2.webp'],
            name: wallName,
            mesh: meshes.cube,
            physics: {enabled: false, mass: 0, geometry: "Cube"}
          });
          maze.collisionSystem.registerStatic((test.name), test.position, 1.1, 'walls');
        }
      }
    }

    const light = maze.lightContainer[0];
    light.setPosition(0, 200, 0)
    light.setIntensity(8.5);

    maze.cameras.firstPersonCamera.movementSpeed = 0.1;
    maze.collisionSystem.registerCamera(app.cameras.firstPersonCamera.position, 1.0);
    maze.cameras.firstPersonCamera.setPosition(-49, 10.40, -49);

    let test2 = maze.addMeshObj({
      shadowsCast: false,
      material: {type: 'standard'},
      position: {
        x: -51,
        y: 0,
        z: -49
      },
      texturesPaths: ['./res/textures/floor1.webp'],
      // becouse nano render use single mat per objectScene entity text not changed!
      name: 'enter',
      mesh: meshes.cube,
      physics: {enabled: false, mass: 0, geometry: "Cube"}
    });
    maze.collisionSystem.registerStatic((test2.name), test2.position, 1.2, 'walls');
  }
})
window.app = maze;


EXAMPLE Drum Balls (with real physics)

import { MatrixEngineWGPU, downloadMeshes, addRaycastsAABBListener, addRaycastsListener, isMobile, randomIntFromTo, KaleidoscopeEmitter, KaleidoscopeEffect, KaleidoscopePresets } from "matrix-engine-wgpu";

let DRUM = new MatrixEngineWGPU({
canvasSize: 'fullscreen',
useJolt: true,
fastRender: 0.8,
MAX_SPOTLIGHTS: 4,
MAX_BONES: 0,
mainCameraParams: {
type: 'WASD',
responseCoef: 1000
},
clearColor: {r: 0, b: 0, g: 0, a: 1}
}, () => {

addRaycastsAABBListener();
addEventListener('PhysicsReady', () => {
downloadMeshes({
  cube: "./res/meshes/blender/cube.obj",
  plane: "./res/meshes/blender/plane.obj",
  planeZ: "./res/meshes/obj/plane-z.obj",
  ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
  reel: "./res/meshes/obj/reel.obj",
  side: "./res/meshes/obj/drumpart.obj",
  side2: "./res/meshes/obj/drumpart2.obj",
  drum: "./res/meshes/blender/drum.obj"
}, onGround, {scale: [1, 1, 1]})

if(isMobile() === false) {
  app.physicsBodiesChain('standard', {x: -25, y: 40, z: -15}, undefined, ['./res/textures/star-fantazy.png']);
  app.matrixPhysics.speedUpSimulation(5);
}
})

async function onGround(m) {
let cam = app.getCamera();
cam.setYaw(0);
cam.setPitch(-0.15);
cam.setZ(25);
cam.setY(24);
cam._dirtyAngle = true;

// Ground
let floor = DRUM.addMeshObj({
  position: {x: 0, y: -0.5, z: -10},
  rotation: {x: 0, y: 0, z: 0},
  rotationSpeed: {x: 0, y: 0, z: 0},
  scale: [35, 1, 35],
  texturesPaths: ['res/icons/512.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
  name: 'ground',
  mesh: m.plane,
  physics: {enabled: false}
});

let icon = DRUM.addMeshObj({
  material: {type: 'mirror'},
  envMapParams: {
    baseColorMix: 0.85,                // CLEAR SKY
    mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
    reflectivity: 0.75,               // 25% reflection blend
    illuminateColor: [1, 0.7, 0.2], // Soft cyan
    illuminateStrength: 1.5,          // Gentle rim
    illuminatePulse: 0.1,             // No pulse (static)
    fresnelPower: 1,                  // Medium-sharp edge
    envLodBias: 5.5,
    usePlanarReflection: false,       // ✅ Env map mode
  },
  position: {x: 20, y: 20.5, z: -10},
  rotation: {x: 90, y: 0, z: 0},
  rotationSpeed: {x: 0, y: 0, z: 1},
  scale: [5, 1, 5],
  texturesPaths: ['res/icons/512.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
  name: 'icon',
  mesh: m.plane,
  physics: {enabled: false}
});

function createDrum(app, m, cx, drumY, cz) {
  const o = (dx, dy, dz) => ({x: cx + dx, y: drumY + dy, z: cz + dz});

  const drum0 = app.addMeshObj({
    material: {type: 'standard'},
    position: o(0, 0, 0),
    rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [4.3, 0.5, 4.3], name: 'bure_bottom', mesh: m.cube,
    physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
    raycast: {enabled: false, radius: 1}
  });

  const drumTop = app.addMeshObj({
    material: {type: 'standard'},
    position: o(10, 17, -2),
    rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [5, 1, 7], name: 'bure_top1', mesh: m.cube,
    physics: {enabled: true, kinematic: true, mass: 0, geometry: 'Cube', layer: 0},
    raycast: {enabled: false, radius: 1}
  });

  const drumTopTop = app.addMeshObj({
    material: {type: 'standard'},
    position: o(10, 19.5, -2),
    rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [5, 1, 7], name: 'toptop', mesh: m.cube,
    physics: {enabled: true, kinematic: true, mass: 0, geometry: 'Cube', layer: 0},
    raycast: {enabled: false, radius: 1}
  });

  const drumTopBlockCube1 = app.addMeshObj({
    material: {type: 'standard'},
    position: o(-3.3, 15.8, +7),
    rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [1.45, 1.45, 1], name: 'bure_topBlock1', mesh: m.cube,
    physics: {enabled: true, mass: 0, geometry: 'Cube', layer: 0},
    raycast: {enabled: false, radius: 1}
  });

  const drumTopBlockCube2 = app.addMeshObj({
    material: {type: 'standard'},
    position: o(3.3, 15.8, +7),
    rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [1.45, 1.45, 1], name: 'bure_topBlock2', mesh: m.cube,
    physics: {enabled: true, mass: 0, geometry: 'Cube', layer: 0},
    raycast: {enabled: false, radius: 1}
  });

  const drumTopAngled = app.addMeshObj({
    material: {type: 'standard'},
    position: o(0, 18, +8.5),
    rotation: {x: 50, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [5.5, 1, 4], name: 'bure_topA', mesh: m.cube,
    physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
    raycast: {enabled: false, radius: 1}
  });

  const drum1 = app.addMeshObj({
    material: {type: 'standard'},
    position: o(0, 6.5, +6.5),
    rotation: {x: 20, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [4.5, 8, 0.5], name: 'bure_r1', mesh: m.cube,
    physics: {
      enabled: true, mass: 0, geometry: 'Cube',
      vertices: m.reel.vertices, indices: m.reel.indices, group: 1
    },
    raycast: {enabled: false, radius: 1}
  });

  const drum2 = app.addMeshObj({
    material: {type: 'standard'},
    position: o(0, 6.5, -7.5),
    rotation: {x: -20, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [4.5, 8, 0.5], name: 'bure_r2', mesh: m.cube,
    physics: {
      enabled: true, mass: 0, geometry: 'Cube',
      vertices: m.reel.vertices, indices: m.reel.indices, group: 1
    },
    raycast: {enabled: false, radius: 1}
  });

  const drum3 = app.addMeshObj({
    material: {type: 'standard'},
    position: o(5.5, 8, 0),
    rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [0.5, 10, 8], name: 'bure_l1', mesh: m.cube,
    physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
    raycast: {enabled: false, radius: 1}
  });

  const drum4 = app.addMeshObj({
    material: {type: 'standard'},
    position: o(-7, 8, 0),
    rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [2, 10, 8], name: 'bure_l2', mesh: m.cube,
    physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
    raycast: {enabled: true, radius: 1}
  });

  const ballcatch = app.addMeshObj({
    material: {type: 'standard'},
    position: o(0, 10, -15),
    rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [5, 1, 5], name: 'ballcatch', mesh: m.cube,
    physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
    raycast: {enabled: false, radius: 1}
  });


  // visual drum object
  const drumFinal = app.addMeshObj({
    material: {type: 'standard'},
    position: o(0, -21, 0),
    rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
    scale: [5, 5, 5], name: 'drumFinal', mesh: m.drum,
    physics: {enabled: false, mass: 0, geometry: 'Cube', group: 1},
    raycast: {enabled: false, radius: 1},
    pointerEffect: {
      enabled: true,
      flameEmitter: true,
      flameEffect: true
    }
  });

  DRUM.drumFinal = drumFinal;

  const parts = [drum0, drum1, drum2, drum3, drum4,
    drumTop, drumTopAngled, drumTopTop,
    drumTopBlockCube1, drumTopBlockCube2, ballcatch];

  drumFinal.setBlend(0.2)
  setTimeout(() => parts.forEach(p => p.setBlend(0.01)), 200);

  return {
    drum0, drum1, drum2, drum3, drum4,
    drumTop, drumTopTop, drumTopAngled,
    drumTopBlockCube1, drumTopBlockCube2,
    ballcatch,
    toptopName: 'toptop',
    topName: 'bure_top1'
  };
}

DRUM.drumConfig = {cx: 0, drumY: 21, cz: -20};

let sky = DRUM.addMeshObj({
  material: {type: 'dark', share: true},
  position: {x: 0, y: -1, z: -20},
  rotation: {x: 0, y: 0, z: 0},
  scale: [100, 100, 100],
  rotationSpeed: {x: 0, y: 0.2, z: 0},
  texturesPaths: ['./res/textures/spiral-1.webp'],
  name: 'sky',
  mesh: m.ball,
  physics: {
    enabled: false,
    geometry: "Sphere"
  }
});

const drum = createDrum(DRUM, m, 0, 21, -20);

// not isolated bug yet - selecting not precise!
setTimeout(async () => {
  sky.setAmbient(0.18, 0, 0.05);
  floor.effects.kale = new KaleidoscopeEmitter(DRUM.device, 'rgba16float', 30, DRUM.cameraBuffer);
  // just for dev
  DRUM.sky = sky;
  DRUM.drumFinal.effects.kale = new KaleidoscopeEffect(DRUM.device, 'rgba16float',
    'diamond', KaleidoscopePresets.fast, DRUM.cameraBuffer);

  const keys = Object.keys(geometryTypes);
  const randomType = keys[Math.floor(Math.random() * keys.length)];
  DRUM.drumFinal.effects.flameEffect.setGeometry(randomType, 10);
  DRUM.drumFinal.effects.flameEmitter.recreateVertexDataCrazzy(5);

  const checker2 = floor.createCheckerboardTexture(256, 128, [0, 10, 0, 0], [120, 0, 0, 255]);
  let samplerTest = DRUM.device.createSampler({
    magFilter: 'nearest',
    minFilter: 'nearest',
    addressModeU: 'repeat',
    addressModeV: 'repeat',
  });
  floor.changeTexture(checker2, samplerTest);
  floor.setUVScale(12, 12);


  let toptopID = DRUM.matrixPhysics.getBodyByName('toptop');
  let topID = DRUM.matrixPhysics.getBodyByName('bure_top1');

  let textures = [];
  for(var j = 1;j < 40;j++) {
    textures.push('res/textures/numbers/' + j + '}.png')
  }

  DRUM.physicsBodiesGenerator(
    "standard",
    {x: 0, y: 50, z: -20},
    {x: 0, y: 0, z: 0},
    textures,
    "balls",
    "Sphere",
    false,
    [1, 1, 1],
    35, 100, null,
    {x: 1.1, y: 1.1, z: 1.1} // offset - just little to not get ball on ball effect
  ).then((T) => {
    console.log(T)
    DRUM.BALLS_ID = T;
    DRUM.BALLS_ID_INIT = T;
    DRUM.SLICED = [];
    DRUM.SLICED_PERMAMENT = [];
    DRUM.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('bure_l2')) {
      }
    });

    setTimeout(async () => {
      const {cx, drumY, cz} = DRUM.drumConfig;
      app.matrixPhysics.setBodyTransform(toptopID, cx - 1.5, drumY + 20, cz - 2);
      app.matrixPhysics.setBodyTransform(topID, cx - 1.5, drumY + 15, cz - 2);
      setTimeout(() => {
        DRUM.updaterDrum.checkWin = true;
      }, 500)
    }, 500)
  })
}, 1500)

DRUM.faceCamera = (idx, duration = 1.0) => {
  const totalFrames = Math.round(duration * 60);
  let frame = 0;
  const targetAngle = Math.PI; // face toward +Z (camera)
  const interval = setInterval(() => {
    if(frame >= totalFrames) {
      clearInterval(interval);
      return;
    }
    const t = frame / totalFrames;
    const eased = t * t * (3 - 2 * t);
    const angle = targetAngle * eased;
    const qy = Math.sin(angle * 0.5);
    const qw = Math.cos(angle * 0.5);
    app.matrixPhysics.setKinematicRotation(idx, 0, qy, 0, qw);
    frame++;
  }, 1000 / 60);
}

DRUM.animateSpiral = (idx, delay, opts) => {
  const {radius, height, rotations, centerX, centerZ, startY, duration = 5.0} = opts;
  const totalFrames = Math.round(duration * 60);
  let frame = 0;
  setTimeout(() => {
    const interval = setInterval(() => {
      if(frame >= totalFrames) {
        clearInterval(interval);
        app.matrixPhysics.setKinematicTransform(idx, centerX, height, centerZ);
        return;
      }
      const t = frame / totalFrames;
      const eased = t * t * (3 - 2 * t);          // smoothstep
      const r = radius * (1 - eased);              // shrinks to 0
      const angle = t * Math.PI * 2 * rotations;   // winds in

      const x = centerX + Math.cos(angle) * r;
      const z = centerZ + Math.sin(angle) * r;
      const y = startY + (height - startY) * eased;
      app.matrixPhysics.setKinematicTransform(idx, x, y, z);
      frame++;
    }, 1000 / 60);
  }, delay);
}

DRUM.matrixPhysics.detectCollision = (e) => {
  const body0Name = e.detail.body0Name;
  const body1Name = e.detail.body1Name;
  const rayDirection = e.detail.rayDirection;
  if(body0Name === "toptop" && body1Name.startsWith("balls_") ||
    body1Name === "toptop" && body0Name.startsWith("balls_")) {
    const ID = app.matrixPhysics.getBodyByName(body1Name);
    const index = app.BALLS_ID.indexOf(ID);
    if(index > -1) {
      let sliced = app.BALLS_ID.splice(index, 1);
      DRUM.SLICED.push(sliced[0]);
    }
  } else if(body0Name === "bure_bottom" && body1Name.startsWith("balls_") ||
    body1Name === "bure_bottom" && body0Name.startsWith("balls_")) {
    const ID = app.matrixPhysics.getBodyByName(body1Name);
    if(app.BALLS_ID && app.BALLS_ID.indexOf(ID) === -1) {
      app.BALLS_ID.push(ID);
    }
  } else if(body1Name === "ballcatch" && body0Name.startsWith("balls_") ||
    body0Name === "ballcatch" && body1Name.startsWith("balls_")) {
    const ID = app.matrixPhysics.getBodyByName(body1Name);
    console.log('DETECTED WIN BALL', e.detail);
    DRUM.SLICED_PERMAMENT.push(ID);
    const slot = DRUM.SLICED_PERMAMENT.length;
    if(slot === 5) {
      console.log('DETECTED LAST WIN BALL', e.detail);
      DRUM.updaterDrum.checkWin = false;
      setTimeout(() => {
        DRUM.SLICED_PERMAMENT.forEach((ballID) => {
          app.faceCamera(ballID, 1)
        });
        setTimeout(() => {
          DRUM.SLICED_PERMAMENT.forEach((ballID) => {
            app.matrixPhysics.setKinematicTransform(ballID, 0, 26, -15);
            app.matrixPhysics.switchToDinamic(ballID);
          });
          setTimeout(() => {
            DRUM.SLICED_PERMAMENT.length = 0;
            DRUM.SLICED.length = 0;
            DRUM.BALLS_ID = DRUM.BALLS_ID_INIT;
            DRUM.updaterDrum.checkWin = true;
          }, 2000)

        }, 8000)
      }, 4500)
    }
    app.faceCamera(ID, 5)
    app.matrixPhysics.switchToKinematic(ID);
    app.animateSpiral(ID, 200, {
      radius: 15,
      rotations: 5,
      centerX: 0,
      centerZ: -15,
      startY: 25,
      height: 0 + slot * 3,
      duration: 5.0
    });
  }
};

DRUM.updaterDrum = {
  checkWin: false,
  c: 0,
  update: function() {
    this.c++;
    if(this.checkWin === true && this.c > 10) {
      app.matrixPhysics.lotteryMachineShake(app.BALLS_ID, 270)
      this.c = 0;
    }
  }
};

const NUM_LIGHTS = isMobile() === true ? 2 : 4;
const ORBIT_RADIUS = 15;
const ORBIT_SPEED = 1;
const TARGET = {x: 0, y: 25, z: -10};

const LIGHT_COLORS = [
  [10.0, 0.2, 0.2],
  [1.0, 1.6, 0.1],
  [0.2, 0.2, 10.0],
  [1.0, 10.0, 3.1],
  [0.2, 1.0, 0.2],
  [0.1, 1.0, 0.6],
  [0.1, 0.6, 1.0],
  [0.6, 0.1, 1.0],
  [1.0, 0.1, 0.8],
  [1.0, 0.1, 0.4],
];

for(let i = 0;i < NUM_LIGHTS;i++) {
  DRUM.addLight();
}

for(let i = 0;i < NUM_LIGHTS;i++) {
  const light = DRUM.lightContainer[i];
  const angleOffset = (i / NUM_LIGHTS) * Math.PI * 2;
  const color = LIGHT_COLORS[i];
  light.setIntensity(55);
  light.setColor(color);
  const heightOffset = Math.sin(angleOffset) * 2;
  light.setPosition(
    TARGET.x + Math.cos(angleOffset) * ORBIT_RADIUS,
    4 + heightOffset,
    TARGET.z + Math.sin(angleOffset) * ORBIT_RADIUS
  );
  light.setTarget(TARGET.x, TARGET.y, TARGET.z);
  light.orbitAngle = angleOffset;
  light.updater.push((light) => {
    light.orbitAngle += ORBIT_SPEED * 0.01;
    const height = 4 + Math.sin(light.orbitAngle + angleOffset) * 2;
    const x = TARGET.x + Math.cos(light.orbitAngle) * ORBIT_RADIUS;
    const z = TARGET.z + Math.sin(light.orbitAngle) * ORBIT_RADIUS;
    light.setPosition(x, height, z);
    light.setTarget(TARGET.x, TARGET.y, TARGET.z);
  });
}

DRUM.autoUpdate.push(DRUM.updaterDrum);
if(isMobile() == false) {
  app.activateBloomEffect();
  app.bloomPass.setBlurRadius(1)
}
}

})
window.app = DRUM;
`,G=V;let W=["On load create a cube named box1 at position (0, 3, 0) and make const rotate by y axis.",`Build the House with non physics cubes. Build 3 floors, walls and roof.
  Make big house with space inside! 
  Don't use physics generators, use simple nonphysics cubes.
  To make it optimised you can use scale.`,"Set texture for object with name 'FLOOR'. Use file with name 'cube-g1_low.webp' ","Create a nonPhysics Cube and enable raycast, on hit make object translateByZ","Create start from cubes - use nonphysics cubes.","Create a pyramid of cubes with 4 levels"],K=["ollama","groq","anthropic","google"];new H;const Y=document.getElementById("root")||document.body;Y.innerHTML="";const g=document.createElement("div");g.className="flex h-screen w-screen bg-black text-emerald-400 font-mono overflow-hidden text-xs";const h=document.createElement("div");h.className="w-1/2 min-w-[320px] max-w-[600px] border-r border-emerald-900/60 bg-slate-950 flex flex-col h-full";const E=document.createElement("div");E.className="px-3 py-2 border-b border-emerald-900/60 flex items-center justify-between bg-black/80";const T=document.createElement("div");T.className="flex items-center gap-2";const L=document.createElement("div");L.className="w-6 h-6 rounded bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]";L.innerText="⚡";const F=document.createElement("div");F.innerHTML='<h1 class="font-bold text-xs text-emerald-300 tracking-wider">BEAST_AI // EDITOR</h1><p class="text-[10px] text-emerald-600">MEEditorClient Flux Codex</p>';T.appendChild(L);T.appendChild(F);const C=document.createElement("div");C.className="flex items-center gap-1.5";const P=document.createElement("label");P.className="text-[10px] text-emerald-600 font-mono";P.innerText="PROVIDER:";const M=document.createElement("select");M.className="bg-slate-900 text-emerald-300 text-[11px] px-2 py-1 rounded border border-emerald-800/80 focus:border-emerald-400 focus:outline-none cursor-pointer uppercase font-mono";K.forEach(s=>{const e=document.createElement("option");e.value=s,e.innerText=s,M.appendChild(e)});C.appendChild(P);C.appendChild(M);E.appendChild(T);E.appendChild(C);const b=document.createElement("div");b.className="p-3 flex-1 flex flex-col gap-2.5 min-h-0 overflow-y-auto bg-slate-950/90";const S=document.createElement("div");S.className="flex-1 flex flex-col gap-1 min-h-[110px]";const v=document.createElement("div");v.className="flex items-center justify-between";const O=document.createElement("label");O.className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1";O.innerHTML='<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> SYSTEM_PROMPT';const f=document.createElement("button");f.type="button";f.className="text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors cursor-pointer font-mono";f.innerText="[RESET]";v.appendChild(O);v.appendChild(f);const u=document.createElement("textarea");u.id="systemPromptInput";u.className="flex-1 w-full bg-black/90 text-cyan-200 text-[11px] p-2 rounded border border-cyan-900/60 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-none font-mono leading-relaxed";u.placeholder="System prompt configuration...";u.value=G;f.addEventListener("click",()=>{u.value=G});S.appendChild(v);S.appendChild(u);const w=document.createElement("div");w.className="flex-1 flex flex-col gap-1 min-h-[130px]";const R=document.createElement("div");R.className="flex items-center justify-between gap-2";const k=document.createElement("label");k.className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 shrink-0";k.innerHTML='<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> USER_TASK';const D=document.createElement("div");D.className="flex items-center gap-1.5 overflow-hidden";const d=document.createElement("select");d.id="taskPresetsSelect";d.className="bg-slate-900 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded border border-emerald-800/80 focus:border-emerald-400 focus:outline-none cursor-pointer font-mono max-w-[210px] truncate";const _=document.createElement("option");_.value="";_.innerText="-- PRESET TASKS --";d.appendChild(_);W.forEach((s,e)=>{const t=document.createElement("option");t.value=s.trim();const r=s.trim().replace(/\s+/g," ");t.innerText=`${e+1}. ${r.length>35?r.slice(0,35)+"...":r}`,d.appendChild(t)});const y=document.createElement("button");y.type="button";y.className="text-[10px] text-emerald-600 hover:text-emerald-400 transition-colors cursor-pointer font-mono shrink-0";y.innerText="[CLEAR]";D.appendChild(d);D.appendChild(y);R.appendChild(k);R.appendChild(D);const c=document.createElement("textarea");c.id="taskInput";c.className="flex-1 w-full bg-black/90 text-emerald-200 text-[11px] p-2 rounded border border-emerald-900/60 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 resize-none font-mono leading-relaxed";c.placeholder="Type user task or select a preset above...";c.value=W[0];d.addEventListener("change",()=>{d.value&&(c.value=d.value)});y.addEventListener("click",()=>{c.value="",d.value=""});w.appendChild(R);w.appendChild(c);const n=document.createElement("button");n.type="button";n.className="w-full py-2 px-3 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/60 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-[0.99]";n.innerText="▶ DISPATCH aiGenGraphCall";const z=document.createElement("div");z.className="border-t border-emerald-900/60 p-2.5 bg-black/60 flex flex-col gap-1.5 max-h-36 shrink-0";const B=document.createElement("div");B.className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-between";B.innerHTML='<span>DISPATCHED_EVENTS_LOG</span><span className="text-[9px] text-emerald-700">WS STATUS: ONLINE</span>';const m=document.createElement("div");m.className="overflow-y-auto space-y-1.5 text-[10px] font-mono max-h-24 pr-1";m.innerHTML='<p class="text-emerald-800 italic py-0.5">&gt; Ready. Click Dispatch to emit CustomEvent.</p>';z.appendChild(B);z.appendChild(m);n.addEventListener("click",()=>{const s=M.value,e=u.value,t=c.value;document.dispatchEvent(new CustomEvent("aiGenGraphCall",{detail:{provider:s,systemPrompt:e,task:t,prompt:`${e}

Task:
${t}`}})),m.querySelector(".italic")&&(m.innerHTML="");const r=document.createElement("div");r.className="p-1.5 rounded bg-slate-900/90 border border-emerald-900/80 flex flex-col gap-0.5",r.innerHTML=`
    <div class="flex items-center justify-between text-[9px]">
      <span class="text-emerald-400 font-bold uppercase">[${s}]</span>
      <span class="text-emerald-700">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="text-emerald-200 truncate"><span class="text-emerald-600">&gt; Task:</span> ${t||"(empty)"}</div>
  `,m.insertBefore(r,m.firstChild);const a=n.innerText;n.innerText="✓ DISPATCHED EVENT!",n.className=n.className.replace("bg-emerald-950","bg-cyan-950").replace("text-emerald-300","text-cyan-300").replace("border-emerald-500/60","border-cyan-400"),setTimeout(()=>{n.innerText=a,n.className=n.className.replace("bg-cyan-950","bg-emerald-950").replace("text-cyan-300","text-emerald-300").replace("border-cyan-400","border-emerald-500/60")},1200)});b.appendChild(S);b.appendChild(w);b.appendChild(n);h.appendChild(E);h.appendChild(b);h.appendChild(z);const A=document.createElement("div");A.className="flex-1 bg-black flex flex-col h-full overflow-hidden";function X(s){let e=typeof s=="string"?s:JSON.stringify(s,null,2);e=e.replace(/```html/gi,"").replace(/```javascript/gi,"").replace(/```js/gi,"").replace(/```/g,"").trim(),e=e.replace(/import\s+MatrixEngineWGPU\s+from\s+['"]\.\.?\/src\/world\.js['"];?/g,'import { MatrixEngineWGPU } from "matrix-engine-wgpu";'),e=e.replace(/from\s+['"]\.\.?\/src\/[^'"]+['"]/g,'from "matrix-engine-wgpu"');const t=`<script type="importmap">
  {
    "imports": {
      "matrix-engine-wgpu": "https://esm.sh/matrix-engine-wgpu@1.16.2"
    }
  }
  <\/script>`;return e.includes("<html")||e.includes("<!DOCTYPE")||e.includes("<body")?(e.includes('type="importmap"')||(e=e.replace("<head>",`<head>
`+t)),e):`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI Preview</title>
  ${t}
  <style>
    body { margin: 0; background: #0a0e17; color: #10b981; font-family: monospace; padding: 16px; overflow: auto; }
    canvas { display: block; max-width: 100%; margin: 0 auto; }
    pre { background: #111827; padding: 12px; border-radius: 6px; border: 1px solid #1f2937; white-space: pre-wrap; word-break: break-all; }
  </style>
  <script>
    window.addEventListener('error', function(e) {
      const errBox = document.createElement('pre');
      errBox.style.color = '#f87171';
      errBox.innerText = '[EXECUTION ERROR]\\n' + (e.error?.stack || e.message);
      document.body.appendChild(errBox);
    });
    window.addEventListener('unhandledrejection', function(e) {
      const errBox = document.createElement('pre');
      errBox.style.color = '#f87171';
      errBox.innerText = '[UNHANDLED REJECTION]\\n' + (e.reason?.stack || e.reason);
      document.body.appendChild(errBox);
    });
  <\/script>
</head>
<body>
  <div id="app"></div>
  <script type="module">
${e}
  <\/script>
</body>
</html>`}const x=document.createElement("div");x.className="p-2 bg-slate-950 border-b border-emerald-900/60 flex items-center gap-2";const U=document.createElement("span");U.className="text-[10px] text-emerald-600 font-mono shrink-0";U.innerText="IFRAME_SRC:";const p=document.createElement("input");p.type="text";p.placeholder="Enter src URL or leave empty for direct AI srcdoc preview...";p.className="flex-1 bg-black text-emerald-300 text-[11px] px-2 py-1 rounded border border-emerald-900/60 focus:outline-none focus:border-emerald-400 font-mono";const l=document.createElement("span");l.className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 shrink-0";l.innerText="SRCDOC: WAITING";x.appendChild(U);x.appendChild(p);x.appendChild(l);const j=document.createElement("div");j.className="flex-1 w-full h-full relative bg-slate-950";const i=document.createElement("iframe");i.id="previewIframe";i.title="AI Output Preview";i.className="w-full h-full border-0 bg-white";i.src="about:blank";p.addEventListener("input",()=>{p.value.trim()?(i.removeAttribute("srcdoc"),i.src=p.value.trim(),l.innerText="SRC URL MODE",l.className="text-[10px] text-amber-400 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 shrink-0"):(i.src="about:blank",l.innerText="SRCDOC: WAITING",l.className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80 shrink-0")});j.appendChild(i);document.addEventListener("on-ai-response",s=>{const e=s;if(console.log("[AI RESPONSE RECEIVED] Loading into iframe.srcdoc:",e.detail),e.detail!==void 0&&e.detail!==null){const t=X(e.detail);i.removeAttribute("src"),i.srcdoc=t,l.innerText="SRCDOC LOADED ✓",l.className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/80 shrink-0 font-bold"}});A.appendChild(x);A.appendChild(j);g.appendChild(h);g.appendChild(A);Y.appendChild(g);
