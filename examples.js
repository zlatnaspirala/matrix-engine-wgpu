/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * @version 1.19.00
 * @www maximumroulette.com 2026
 */
import {loadCameraTexture} from "./examples/camera-texture.js";
import {loadGLBLoader} from "./examples/glb-loader.js";
import {myLights} from "./examples/my-lights.js";
import {loadObjFile} from "./examples/load-obj-file.js";
import {loadObjsSequence} from "./examples/load-objs-sequence.js";
import {physicsPlayground} from "./examples/physics-playground.js";
import {procMesh} from "./examples/procedural-mesh.js";
import {snakeLightsInstanced} from "./examples/snake-lights-instanced.js";
import {snakeLights} from "./examples/snake-lights.js";
import {loadVideoTexture} from "./examples/video-texture.js";
import {byId, isMobile, urlQuery} from "./src/engine/utils.js";
import {mazeGame} from "./examples/maze.js";
import {flipperJolt} from "./examples/flipper-jolt.js";
import {flipperAmmo} from "./examples/flipper-ammo.js";
import {testJolt} from "./examples/physics-test-jolt.js";
import {testCannonES} from "./examples/physics-test-cannones.js";
import {canvasInline} from "./examples/canvas-inline.js";
import {loadCinematicCamera} from "./examples/cinematic-camera.js";
import {loadDestructionProcedural} from "./examples/destruction-procedural.js";
import {loadKale} from "./examples/kale.js";
import {loadHZB} from "./examples/hzb-ray.js";
import {loadKinematicCollision} from "./examples/kinematic-collision.js";
import {loadSprite1} from "./examples/2D-world.js";
import {loadSprite2} from "./examples/2D-world-matter.js";
import {loadDrumCannon} from "./examples/drum-cannon.js";
import {loadGaussianSplat} from "./examples/gaussian-splat.js";
import {loadGaussianSplatVertAnim} from "./examples/gaussian-vertex-anim.js";
import {loadHand} from "./examples/games/nui/hand.js";
import {loadStreamRenderHost} from "./examples/stream-render.js";
import {loadHang3d} from "./examples/games/first-person-shooter/hang3d.js";
import {loadMenuBeast} from "./examples/games/my-nui/menu-beast.js";
import {loadBVHRawExample} from "./examples/bvh-skeletal.js";
import {loadBVHRawExampleShared} from "./examples/bvh-skeletal-shared-mat.js";
import {loadWaterEffects} from "./examples/water-effect.js";
import {loadParticles} from "./examples/particles.js";
import {loadRunner} from "./examples/games/my-nui/real-runner.js";
import {loadCryptoGrid} from "./examples/crypto-grid.js";
import {loadEarth} from "./examples/earth.js";

const switchDemo = (id) => {
  const url = new URL(window.location.href);
  url.searchParams.set('demo', id);
  if(id == 31) {
    window.location.href = url.toString() + '&fs=true';
  } else {
    window.location.href = url.toString();
  }
};

const hideMenu = () => {document.getElementById('examples').style.left = "-150px"}

byId('loadObjFile').addEventListener("click", () => switchDemo('1'));
byId('physicsPlayground').addEventListener("click", () => switchDemo('2'));
byId('camera-texture').addEventListener("click", () => switchDemo('3'));
byId('video-texture').addEventListener("click", () => switchDemo('4'));
byId('objs-anim').addEventListener("click", () => switchDemo('5'));
byId('glb-loader').addEventListener("click", () => switchDemo('6'));
byId('procedural-mesh').addEventListener("click", () => switchDemo('7'));
byId('myLights').addEventListener("click", () => switchDemo('9'));
byId('snake-light').addEventListener("click", () => switchDemo('10'));
byId('snake-light-instanced').addEventListener("click", () => switchDemo('11'));
byId('maze').addEventListener("click", () => switchDemo('12'));
byId('flipper-jolt').addEventListener("click", () => switchDemo('13'));
if(isMobile() === true) {byId('flipper-ammo').remove()} else {
  byId('flipper-ammo').addEventListener("click", () => switchDemo('14'));
}
byId('test-jolt').addEventListener("click", () => switchDemo('15'));
byId('test-cannones').addEventListener("click", () => switchDemo('16'));
byId('canvas-inline').addEventListener("click", () => switchDemo('17'));
byId('cinematicCamera').addEventListener("click", () => switchDemo('18'));
byId('destruction-procedure').addEventListener("click", () => switchDemo('19'));
byId('loadkale').addEventListener("click", () => switchDemo('20'));
byId('loadhzb').addEventListener("click", () => switchDemo('21'));
byId('loadKCollision').addEventListener("click", () => switchDemo('22'));
byId('loadSprite1').addEventListener("click", () => switchDemo('23'));
byId('loadSprite2').addEventListener("click", () => switchDemo('24'));
byId('loadDrumCannon').addEventListener("click", () => switchDemo('25'));
byId('loadGaussianSplat').addEventListener("click", () => switchDemo('26'));
byId('loadGaussianSplatVertAnim').addEventListener("click", () => switchDemo('27'));
byId('loadStreamRenderHost').addEventListener("click", () => switchDemo('29'));
byId('hand').addEventListener("click", () => switchDemo('28'));
byId('hang3d').addEventListener("click", () => switchDemo('30'));
if(byId('loadMenuBeast')) {byId('loadMenuBeast').addEventListener("click", () => switchDemo('31'))}
byId('loadBVHSkeletal').addEventListener("click", () => switchDemo('32'));
byId('loadBVHSkeletalShared').addEventListener("click", () => switchDemo('33'));
byId('loadWaterEffects').addEventListener("click", () => switchDemo('34'));
byId('loadParticles').addEventListener("click", () => switchDemo('35'));
byId('loadRunner').addEventListener("click", () => switchDemo('36'));
byId('loadCryptoGrid').addEventListener("click", () => switchDemo('37'));
byId('loadEarth').addEventListener("click", () => switchDemo('38'));

byId('jamb').addEventListener("click", () => window.open('https://goldenspiral.itch.io/jamb-3d-deluxe', '_blank'));
// byId('moba').addEventListener("click", () => window.open('https://goldenspiral.itch.io/forest-of-hollow-blood', '_blank'));
byId('moba').addEventListener("click", () => window.open('https://maximumroulette.com/apps/fohb', '_blank'));

window.loadObjFile = loadObjFile;

if(urlQuery['demo'] === '1') {
  loadObjFile();
} else if(urlQuery['demo'] === '2') {
  physicsPlayground();
} else if(urlQuery['demo'] === '3') {
  loadCameraTexture();
} else if(urlQuery['demo'] === '4') {
  loadVideoTexture();
} else if(urlQuery['demo'] === '5') {
  loadObjsSequence();
} else if(urlQuery['demo'] === '6') {
  loadGLBLoader();
} else if(urlQuery['demo'] === '7') {
  procMesh();
} else if(urlQuery['demo'] === '8') {
  loadObjFile();
} else if(urlQuery['demo'] === '9') {
  myLights();
} else if(urlQuery['demo'] === '10') {
  snakeLights();
} else if(urlQuery['demo'] === '11') {
  snakeLightsInstanced();
} else if(urlQuery['demo'] === '12') {
  mazeGame();
} else if(urlQuery['demo'] === '13') {
  flipperJolt();
} else if(urlQuery['demo'] === '14') {
  flipperAmmo();
} else if(urlQuery['demo'] === '15') {
  testJolt();
} else if(urlQuery['demo'] === '16') {
  testCannonES();
} else if(urlQuery['demo'] === '17') {
  canvasInline();
} else if(urlQuery['demo'] === '18') {
  loadCinematicCamera();
} else if(urlQuery['demo'] === '19') {
  loadDestructionProcedural();
} else if(urlQuery['demo'] === '20') {
  loadKale();
} else if(urlQuery['demo'] === '21') {
  loadHZB();
} else if(urlQuery['demo'] === '22') {
  loadKinematicCollision();
} else if(urlQuery['demo'] === '23') {
  loadSprite1();
} else if(urlQuery['demo'] === '24') {
  loadSprite2();
} else if(urlQuery['demo'] === '25') {
  loadDrumCannon();
} else if(urlQuery['demo'] === '26') {
  loadGaussianSplat();
} else if(urlQuery['demo'] === '27') {
  loadGaussianSplatVertAnim();
} else if(urlQuery['demo'] === '28') {
  loadHand();
} else if(urlQuery['demo'] === '29') {
  loadStreamRenderHost();
} else if(urlQuery['demo'] === '30') {
  loadHang3d();
} else if(urlQuery['demo'] === '31') {
  loadMenuBeast();
} else if(urlQuery['demo'] === '32') {
  loadBVHRawExample();
} else if(urlQuery['demo'] === '33') {
  loadBVHRawExampleShared();
} else if(urlQuery['demo'] === '34') {
  loadWaterEffects();
} else if(urlQuery['demo'] === '35') {
  loadParticles();
} else if(urlQuery['demo'] === '36') {
  loadRunner();
} else if(urlQuery['demo'] === '37') {
  loadCryptoGrid();
} else if(urlQuery['demo'] === '38') {
  loadEarth();
} else {
  loadObjFile();
}

setTimeout(() => {hideMenu()}, 2000);