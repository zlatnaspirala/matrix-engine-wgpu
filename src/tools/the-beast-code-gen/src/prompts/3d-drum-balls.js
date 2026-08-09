export const DRUMBALLS = `

EXAMPLE Drum Balls (with real physics - infinity plays drum 5 numbers round)

import { MatrixEngineWGPU, downloadMeshes, addRaycastsAABBListener, addRaycastsListener, isMobile, randomIntFromTo, KaleidoscopeEmitter, KaleidoscopeEffect, KaleidoscopePresets , geometryTypes} from "matrix-engine-wgpu";

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
    baseColorMix: 0.85,               
    mirrorTint: [0.9, 0.95, 1.0],     
    reflectivity: 0.75,
    illuminateColor: [1, 0.7, 0.2], 
    illuminateStrength: 1.5,
    illuminatePulse: 0.1,
    fresnelPower: 1,
    envLodBias: 5.5,
    usePlanarReflection: false,       // ✅ MUST BE FALSE!
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
`;