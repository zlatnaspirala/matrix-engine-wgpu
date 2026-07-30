/**
 * THE BEAST - WGPU Code Creator Workspace
 * Author: AI Assistant (Google AI Studio Build)
 * Standalone TypeScript Layout Architecture
 */

import './index.css';

interface CodePreset {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  code: string;
  pipelineSpecs: string;
}

// State Management
const STATE = {
  activeTab: 'code_view', // 'code_view' | 'preview_simulator' | 'api_ref'
  selectedPresetId: 'basic_cube',
  temperature: 0.15,
  canvasId: 'canvas1',
  importStyle: 'esm', // 'esm' | 'script'
  importPrefix: '../',
  autoInit: true,
  vertexSetup: true,
  eventListeners: true,
  customWebGPULogs: [
    'SYS_BOOT: Matrix GPU Core V0.1 initialized.',
    'WGPU_INFO: GPUAdapter found [Intel/NVIDIA/AMD Unified Device]',
    'WGPU_STATUS: Canvas target container active & drawing pipeline loaded.',
    'LOG_INF: Ready for agent instructions.'
  ],
  sandboxLogs: [] as string[],
  showConsoleOverlay: true,
  simulationRunning: true,
  simulatedSpeed: 1.5,
  simulatedRotationDegrees: 0,
  showToast: false,
  toastMessage: ''
};

const isWebGPUSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;

// Realistic matrix-engine-wgpu style examples
const CODE_PRESETS: CodePreset[] = [
  {
    id: 'basic_cube',
    name: 'Standard Cube Generator',
    description: 'Instantiates a foundational const rotating by Y axis 3D Cube inside the WebGPU pipeline. Add to cube flameEmitter effect subpipeline.',
    systemPrompt: `You are THE BEAST WGPU Core Agent. Output only high-performance WebGPU boilerplate optimized for matrix-engine-wgpu.
Inject clean matrix manipulation bindings. Do not include verbose natural language chatter, output the executable TypeScript script.`,
    userPrompt: 'Load matrix-engine-wgpu core. Instantiate a glowing standard 3D Cube, direct it to compile onto canvas and apply continuous Y-axis rotation.',
    code: `
    
import {MatrixEngineWGPU} from "matrix-engine-wgpu";
import {downloadMeshes} from "matrix-engine-wgpu";
import {addRaycastsAABBListener} from "matrix-engine-wgpu";
import {isMobile, randomIntFromTo} from "matrix-engine-wgpu";
import {GenGeoTexture2} from "matrix-engine-wgpu";

  let loadObjFile = new MatrixEngineWGPU({
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

    loadObjFile.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      loadObjFile.addMeshObj({
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
      loadObjFile.addMeshObj({
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
      let MYCUBE = loadObjFile.addMeshObj({
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
          flameEmitter: true
        }
      })

      loadObjFile.lightContainer[0].setIntensity(15);
      loadObjFile.activateBloomEffect();
      loadObjFile.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      loadObjFile.lightContainer[0].behavior.value_ = -1;
      loadObjFile.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      loadObjFile.lightContainer[0].setPosition(0, 15, -10);
      loadObjFile.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {
        MYCUBE.effects.circle = new GenGeoTexture2(loadObjFile.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
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

    loadObjFile.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
        e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = loadObjFile;
    
    `,
    pipelineSpecs: 'Shaders: Standard WGPU | Topology: Triangle-List'
  },
 
];

// Quick Pocket API Directory for Matrix-Engine WGPU
const API_REFERENCES = [
  {
    title: 'MatrixEngineWGPU',
    syntax: 'const engine = new MatrixEngineWGPU(options, onLoadCallback);',
    description: 'Instantiates the core WebGPU framework. Connects the device context, registers shaders, lighting pipelines, shadow casters, bloom passes, and main camera parameters.'
  },
  {
    title: 'downloadMeshes',
    syntax: 'downloadMeshes({ cube: "./res/meshes/cube.obj" }, onLoad, { scale: [1,1,1] });',
    description: 'Pre-fetches, caches, and compiles static mesh resource geometry vectors (.obj) without double fetching.'
  },
  {
    title: 'addRaycastsAABBListener',
    syntax: 'addRaycastsAABBListener(canvasId, "click");',
    description: 'Attaches an event handler on the active viewport to execute precise 3D Raycasting hits against bounding boxes (AABBs).'
  },
  {
    title: 'GenGeoTexture2',
    syntax: 'new GenGeoTexture2(device, format, type, imagePath, intensity, cameraBuffer);',
    description: 'Procedurally instantiates complex dynamic render-to-texture surfaces or circle-burst emitters.'
  },
  {
    title: 'isMobile',
    syntax: 'const mobileFlag = isMobile();',
    description: 'Utility detector checking for touch capabilities or handheld agent signatures.'
  },
  {
    title: 'randomIntFromTo',
    syntax: 'const val = randomIntFromTo(min, max);',
    description: 'Produces a random discrete integer inside the selected bounds.'
  },
  {
    title: 'randomFloatFromTo',
    syntax: 'const val = randomFloatFromTo(min, max);',
    description: 'Utility for random float ranges. Useful for particle velocity or rotational speeds.'
  },
  {
    title: 'OSCILLATOR',
    syntax: 'const osc = new OSCILLATOR(min, max, speed);',
    description: 'Defines dynamic time-dependent wave generators mapping properties smoothly to uniforms.'
  },
  {
    title: 'SWITCHER',
    syntax: 'const s = new SWITCHER();',
    description: 'Quick switcher utility for swapping active visual pipeline configurations on meshes.'
  },
  {
    title: 'KaleidoscopeEffect',
    syntax: 'new KaleidoscopeEffect(device, options);',
    description: 'Attaches a highly customized procedural kaleidoscope shader overlay.'
  },
  {
    title: 'SpritesPack2D',
    syntax: 'new SpritesPack2D(app, config);',
    description: 'Creates high-performance 2D dynamic billboard sprite arrays mapped to a 3D perspective.'
  },
  {
    title: 'uploadGLBModel',
    syntax: 'uploadGLBModel(device, glbArrayBuffer, scene);',
    description: 'Converts complex GLB/GLTF binary structures into optimized custom GPU buffer instances.'
  },
  {
    title: 'rayIntersectsSphere',
    syntax: 'rayIntersectsSphere(rayOrigin, rayDir, sphereCenter, radius);',
    description: 'Solves geometric quadratic equations to detect ray-intersection vectors against sphere radius.'
  },
  {
    title: 'getRayFromMouse',
    syntax: 'getRayFromMouse(mouseX, mouseY, camera, viewportWidth, viewportHeight);',
    description: 'Normalizes mouse display coordinates and casts viewport-space vectors into world coordinates.'
  },
  {
    title: 'computeAABB',
    syntax: 'computeAABB(vertices);',
    description: 'Iterates flat float arrays to solve Axis-Aligned Bounding Box limits (min/max vertices).'
  },
  {
    title: 'MeshMorpher',
    syntax: 'new MeshMorpher(app, sourceMesh, targets);',
    description: 'Allows real-time linear interpolation (LERP) between distinct geometric shape vertex structures.'
  },
  {
    title: 'ProjectileSystem',
    syntax: 'projectileSystem.spawn(mesh, velocity);',
    description: 'Spawns and manages life-cycles for active projectile physics/bounding geometries.'
  },
  {
    title: 'GaussianSplatScene',
    syntax: 'new GaussianSplatScene(app, splatFilePath);',
    description: 'Streams, orders, and renders custom 3D Gaussian Splatting files into WebGPU buffers.'
  },
  {
    title: 'about',
    syntax: 'about();',
    description: 'Logs package versions, lists available shader topologies, and prints licensing credits onto the system console.'
  }
];

function logToBeastConsole(msg: string) {
  const timestamp = new Date().toLocaleTimeString().split(' ')[0];
  STATE.customWebGPULogs.push(`[${timestamp}] ${msg}`);
  if (STATE.customWebGPULogs.length > 50) {
    STATE.customWebGPULogs.shift();
  }
  renderLogs();
}

function renderLogs() {
  const logContainer = document.getElementById('beast-live-logs');
  if (logContainer) {
    logContainer.innerHTML = STATE.customWebGPULogs
      .map(log => `
        <div class="font-mono text-xs py-0.5 border-b border-zinc-900/40 flex items-start">
          <span class="text-orange-500 mr-2 shrink-0">▸</span>
          <span class="text-zinc-400 break-all select-all">${escapeHTML(log)}</span>
        </div>
      `).join('');
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}

function renderSandboxLogs() {
  const container = document.getElementById('sandbox-overlay-logs');
  if (container) {
    if (STATE.sandboxLogs.length === 0) {
      container.innerHTML = `<div class="text-zinc-600 italic text-[11px] p-2">No sandbox logs stream detected yet...</div>`;
      return;
    }
    container.innerHTML = STATE.sandboxLogs.map(log => {
      let colorClass = 'text-zinc-300';
      if (log.includes('[SANDBOX_ERROR]') || log.includes('[SANDBOX_EXCEPTION]')) {
        colorClass = 'text-red-400 font-semibold';
      } else if (log.includes('[SANDBOX_WARN]')) {
        colorClass = 'text-yellow-400';
      } else if (log.includes('[SANDBOX_LOG]') || log.includes('ℹ️')) {
        colorClass = 'text-green-400';
      }
      return `<div class="font-mono text-[11px] border-b border-zinc-900/30 py-0.5 px-1 hover:bg-zinc-950/40 select-all ${colorClass}">
        ${escapeHTML(log)}
      </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToastNotification(message: string) {
  STATE.showToast = true;
  STATE.toastMessage = message;
  
  const toastEl = document.getElementById('toast-notification');
  const toastText = document.getElementById('toast-text');
  if (toastEl && toastText) {
    toastText.innerText = message;
    toastEl.classList.remove('opacity-0', 'translate-y-4');
    toastEl.classList.add('opacity-100', 'translate-y-0');
    
    setTimeout(() => {
      toastEl.classList.remove('opacity-100', 'translate-y-0');
      toastEl.classList.add('opacity-0', 'translate-y-4');
      STATE.showToast = false;
    }, 2500);
  }
}

// Render overall main template inside index.html mount point
function buildWorkspace() {
  const appMount = document.getElementById('app');
  if (!appMount) return;

  const activePreset = CODE_PRESETS.find(p => p.id === STATE.selectedPresetId) || CODE_PRESETS[0];

  appMount.innerHTML = `
    <!-- Top sci-fi control panel bar height header -->
    <header class="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
      <div class="flex items-center gap-4">
        <div class="relative">
          <div class="w-10 h-10 bg-orange-600 rounded flex items-center justify-center font-display font-bold text-lg text-black tracking-tighter shadow-orange-500/10 shadow-lg border border-orange-500">
            Ω
          </div>
          <!-- Tiny active pulse pointer -->
          <span class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-950 animate-pulse"></span>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-display font-bold text-lg uppercase tracking-wider text-zinc-100 select-none">
              THE BEAST
            </h1>
            <span class="text-[9px] font-mono border border-orange-500/30 text-orange-400 bg-orange-950/30 px-1.5 rounded-sm select-none">
              V1.16.2
            </span>
          </div>
          <p class="text-[10.5px] font-mono text-zinc-400">
            SYS_MODE: <span class="text-green-400">STANDALONE_AGENT_CONFIG</span> | HOST: <span class="text-zinc-500">CORE_CONSOLE</span>
          </p>
        </div>
      </div>

      <!-- Live metrics and configuration readout -->
      <div class="flex flex-wrap items-center gap-4 md:gap-6 font-mono text-xs text-zinc-400">
        <div class="bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          <span>AGENT_TEMP: <strong class="text-zinc-100">${STATE.temperature.toFixed(2)}</strong></span>
        </div>
        <div class="bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>PIPELINE: <strong class="text-zinc-100 uppercase">${activePreset.id}</strong></span>
        </div>
        <div class="bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          <span>WGPU_STATE: <strong class="text-green-400">READY</strong></span>
        </div>
      </div>
    </header>

    <!-- Split Screen workspace workspace nested grid -->
    <main class="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden bg-zinc-950">
      
      <!-- LEFT PORT: Configurator and Core Prompt Generator (Column width: 5) -->
      <section class="lg:col-span-5 border-r border-zinc-800 flex flex-col overflow-y-auto max-h-screen lg:max-h-[calc(100vh-73px)] p-6 gap-6 bg-zinc-900/10">
        
        <!-- SYSTEM PRESETS BLOCK -->
        <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase text-orange-400 tracking-wider flex items-center gap-2">
              <span class="inline-block w-1.5 h-3 bg-orange-500"></span>
              CORE WORKSTATION PRESETS
            </h3>
            <span class="text-[10px] font-mono text-zinc-500">SELECT TO OVERWRITE PROMPTS</span>
          </div>

          <div class="grid grid-cols-1 gap-2">
            ${CODE_PRESETS.map(preset => `
              <button 
                id="preset-btn-${preset.id}"
                data-id="${preset.id}"
                class="preset-selector text-left p-2.5 rounded border transition-all ${
                  preset.id === STATE.selectedPresetId 
                    ? 'bg-orange-950/20 border-orange-500/60 text-orange-300 shadow-sm shadow-orange-500/5' 
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }"
              >
                <div class="flex items-center justify-between pointer-events-none mb-1">
                  <span class="font-display font-medium text-sm">${preset.name}</span>
                  <span class="text-[9px] font-mono border border-current px-1 rounded-sm">${preset.id.toUpperCase()}</span>
                </div>
                <p class="text-[11px] font-sans opacity-85 leading-relaxed pointer-events-none">${preset.description}</p>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- SYSTEM PROMPT CONFIGURATION BLOCK -->
        <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2">
              <span>⚙️</span> SYSTEM PROMPT - AGENT CONFIG
            </h3>
            <span class="text-[10px] font-mono text-zinc-500">ROLE DIRECTIVES</span>
          </div>

          <!-- SYSTEM INSTRUCTIONS FIELD -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between items-center text-xs text-zinc-400 font-mono">
              <label for="system-instructions-input">System Instructions (Role Play Spec)</label>
              <span class="text-[10px]" id="sys-char-count">0 chars</span>
            </div>
            <textarea
              id="system-instructions-input"
              rows="4"
              class="w-full bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors resize-y leading-relaxed"
              placeholder="Inject core constraints for WGPU compilation agent..."
            >${activePreset.systemPrompt}</textarea>
          </div>

          <!-- TEMPERATURE SLIDER -->
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center text-xs text-zinc-400 font-mono">
              <span class="flex items-center gap-1.5">
                <span>⚡</span> Creativity Temperature
              </span>
              <span class="text-orange-400 font-bold" id="temp-value-display">${STATE.temperature.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              id="temp-slider-input" 
              min="0.0" 
              max="1.0" 
              step="0.05" 
              value="${STATE.temperature}" 
              class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div class="flex justify-between text-[10px] font-mono text-zinc-500">
              <span>Strict / Code Precise</span>
              <span>Balanced</span>
              <span>Highly Creative</span>
            </div>
          </div>

          <!-- TARGET CANVAS INPUT & IMPORTS TOGGLES -->
          <div class="grid grid-cols-2 gap-3 mt-1">
            <div class="flex flex-col gap-1">
              <label for="canvas-id-input" class="text-[11px] font-mono text-zinc-400">Target Canvas ID</label>
              <input
                type="text"
                id="canvas-id-input"
                value="${STATE.canvasId}"
                class="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label for="import-style-select" class="text-[11px] font-mono text-zinc-400">Import Interface</label>
              <select
                id="import-style-select"
                class="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-orange-500"
              >
                <option value="esm" ${STATE.importStyle === 'esm' ? 'selected' : ''}>ES Modules (import)</option>
                <option value="script" ${STATE.importStyle === 'script' ? 'selected' : ''}>Dynamic Tags</option>
              </select>
            </div>
          </div>

          <!-- COMPILER COMPATIBILITY FLAGS -->
          <div class="border-t border-zinc-800/80 pt-3 flex flex-col gap-1.5">
            <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wide">Injector Injection Parameters</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-zinc-400 hover:text-zinc-200">
                <input type="checkbox" id="flag-auto-init" ${STATE.autoInit ? 'checked' : ''} class="rounded border-zinc-800 accent-orange-500 text-orange-500 bg-zinc-950 w-3.5 h-3.5" />
                <span>Auto-Init pipeline</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-zinc-400 hover:text-zinc-200">
                <input type="checkbox" id="flag-vertex-setup" ${STATE.vertexSetup ? 'checked' : ''} class="rounded border-zinc-800 accent-orange-500 text-orange-500 bg-zinc-950 w-3.5 h-3.5" />
                <span>Standard VS/FS</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-zinc-400 hover:text-zinc-200">
                <input type="checkbox" id="flag-event-listeners" ${STATE.eventListeners ? 'checked' : ''} class="rounded border-zinc-800 accent-orange-500 text-orange-500 bg-zinc-100 w-3.5 h-3.5" />
                <span>Input Hooks</span>
              </label>
            </div>
          </div>
        </div>

        <!-- TASK INPUT SECTION -->
        <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2">
              <span>✍️</span> INSTRUCTIONS INPUT (CORE PROMPT)
            </h3>
            <span class="text-[10px] font-mono text-orange-400 animate-pulse">● READY</span>
          </div>

          <!-- PROMPT TEXTAREA -->
          <div class="flex flex-col gap-1.5">
            <textarea
              id="user-prompt-input"
              rows="3"
              class="w-full bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-xs text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors leading-relaxed"
              placeholder="What should THE BEAST construct? E.g., spawn a rigid custom procedural torus matrix cube and setup mouse coordinate viewport rotational variables..."
            >${activePreset.userPrompt}</textarea>
          </div>

          <!-- METADATA CHIPS INJECTORS -->
          <div class="flex flex-col gap-1.5">
            <span class="text-[10.5px] font-mono text-zinc-500 uppercase">Variable Injection Chips (Click to insert)</span>
            <div class="flex flex-wrap gap-1.5">
              <button class="chip-btn bg-zinc-950 border border-zinc-800/80 hover:border-orange-500/50 px-2 py-1 text-[10.5px] font-mono text-orange-400 rounded transition-colors" data-insert="[canvas-target]">
                [CanvasTarget]
              </button>
              <button class="chip-btn bg-zinc-950 border border-zinc-800/80 hover:border-orange-500/50 px-2 py-1 text-[10.5px] font-mono text-zinc-400 rounded transition-colors" data-insert="[shader-pass-wgsl]">
                [ShaderWGSL]
              </button>
              <button class="chip-btn bg-zinc-950 border border-zinc-800/80 hover:border-orange-500/50 px-2 py-1 text-[10.5px] font-mono text-blue-400 rounded transition-colors" data-insert="[device-context]">
                [WGPUDevice]
              </button>
              <button class="chip-btn bg-zinc-950 border border-zinc-800/80 hover:border-orange-500/50 px-2 py-1 text-[10.5px] font-mono text-green-400 rounded transition-colors" data-insert="[app-onupdate-loop]">
                [OnUpdateFrame]
              </button>
              <button class="chip-btn bg-zinc-950 border border-zinc-800/80 hover:border-orange-500/50 px-2 py-1 text-[10.5px] font-mono text-purple-400 rounded transition-colors" data-insert="[physics-dynamic-mesh]">
                [PhysicsDynamic]
              </button>
            </div>
          </div>

          <!-- PRIMARY ACTION PANEL -->
          <div class="flex flex-col sm:flex-row gap-2 mt-2">
            <button
              id="btn-generate"
              class="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-display font-semibold text-xs py-3 px-4 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 glow-accent uppercase tracking-wider"
            >
              <span>🔥</span> GENERATE BEAST CODE
            </button>
            <button
              id="btn-mutate"
              class="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-xs py-3 px-4 rounded transition-colors cursor-pointer select-none truncate"
            >
              MUTATE DIRECTIVE
            </button>
          </div>
        </div>

      </section>

      <!-- RIGHT PORT: Code View, Sandbox Interactive Display, and Simulated Log Engine (Column width: 7) -->
      <section class="lg:col-span-7 flex flex-col h-full overflow-hidden max-h-screen lg:max-h-[calc(100vh-73px)]">
        
        <!-- WORKSPACE TAB SELECTORS -->
        <div class="border-b border-zinc-800 bg-zinc-950/60 p-4 flex justify-between items-center shrink-0">
          <div class="flex gap-2">
            <button
              id="tab-btn-code"
              class="tab-selector font-mono text-xs uppercase px-3 py-1.5 rounded transition-all cursor-pointer ${
                STATE.activeTab === 'code_view' 
                  ? 'bg-zinc-900 border border-zinc-800 text-orange-400 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }"
            >
              📂 GENERATED TEMPLATE CODE
            </button>
            <button
              id="tab-btn-simulator"
              class="tab-selector font-mono text-xs uppercase px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                STATE.activeTab === 'preview_simulator' 
                  ? 'bg-zinc-900 border border-zinc-800 text-orange-400 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }"
            >
              🖥️ SIMULATOR PREVIEW 
              <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
            </button>
            <button
              id="tab-btn-api"
              class="tab-selector font-mono text-xs uppercase px-3 py-1.5 rounded transition-all cursor-pointer ${
                STATE.activeTab === 'api_ref' 
                  ? 'bg-zinc-900 border border-zinc-800 text-orange-400 font-bold' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }"
            >
              📚 BEAST API DIRECTORY
            </button>
          </div>
          
          <div class="hidden sm:flex text-[10.5px] font-mono text-zinc-500">
            ACTIVE:_PORT_VIEW_READY
          </div>
        </div>

        <!-- TAB CONTENT MAIN FRAME -->
        <div class="flex-1 overflow-hidden flex flex-col min-h-[350px]">
          
          <!-- TAB 1: CODE VIEW -->
          <div id="tab-content-code" class="flex-1 ${STATE.activeTab === 'code_view' ? 'flex' : 'hidden'} flex-col overflow-hidden bg-zinc-950 relative">
            
            <!-- Metadata line about the generated boilerplate -->
            <div class="bg-zinc-950/80 border-b border-zinc-900 px-4 py-2 text-[11px] font-mono text-zinc-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
              <div>
                Target Pipeline State: <span class="text-orange-400 select-all">${activePreset.pipelineSpecs}</span>
              </div>
              <div class="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 rounded uppercase">
                language: typescript / javascript
              </div>
            </div>

            <!-- Scrollable source viewing container -->
            <div class="flex-1 overflow-hidden relative bg-zinc-950">
              <textarea
                id="code-content-block"
                class="w-full h-full bg-zinc-950 font-mono text-xs text-zinc-100 p-4 border-0 focus:outline-none focus:ring-0 leading-relaxed resize-none selection:bg-orange-500 selection:text-black"
                spellcheck="false"
                placeholder="/* Generated source template code appears here */"
              >${escapeHTML(activePreset.code)}</textarea>
            </div>

            <!-- Absolute anchor controls float panel -->
            <div class="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                id="btn-run-code"
                class="bg-green-600 hover:bg-green-500 text-black font-display font-semibold text-xs py-2 px-4 rounded transition-colors cursor-pointer shadow-lg shadow-green-500/10 flex items-center gap-1.5"
              >
                <span>⚡ RUN IN SANDBOX</span>
              </button>
              <button
                id="btn-copy-code"
                class="bg-orange-600 hover:bg-orange-500 text-black font-display font-medium text-xs py-2 px-3.5 rounded transition-colors cursor-pointer shadow-lg shadow-orange-500/10 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <span>COPY SPEC CODE</span>
              </button>
            </div>
          </div>

          <!-- TAB 2: SIMULATED SHADER / METRICS PREVIEW -->
          <div id="tab-content-simulator" class="flex-1 ${STATE.activeTab === 'preview_simulator' ? 'flex' : 'hidden'} flex-col overflow-y-auto p-6 bg-zinc-950 text-zinc-300 gap-6">
            
            <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              
              <!-- Left inside box: Canvas visual simulator representation -->
              <div class="md:col-span-7 bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between items-stretch gap-4 min-h-[380px] relative">
                <div class="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span class="text-xs font-mono text-zinc-400 uppercase tracking-widest leading-none">THE-BEAST-WGPU-SURFACE</span>
                    <div class="flex items-center gap-1 ${isWebGPUSupported ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400' : 'bg-amber-950/40 border-amber-900/80 text-amber-400'} border text-[9px] font-mono px-1.5 py-0.5 rounded leading-none">
                      <span class="w-1 h-1 rounded-full ${isWebGPUSupported ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}"></span>
                      ${isWebGPUSupported ? 'WEBGPU: OK' : 'NO WEBGPU'}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap justify-end">
                    <a href="?sandbox=true" target="_blank" id="btn-open-standalone" class="text-[10px] font-mono text-orange-400 hover:text-orange-300 transition-colors bg-orange-950/40 border border-orange-900/60 px-2.5 py-0.5 rounded uppercase cursor-pointer flex items-center gap-1">
                      <span>OPEN STANDALONE</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-2.5 h-2.5"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    </a>
                    <button id="btn-toggle-console-overlay" class="text-[10px] font-mono text-zinc-400 hover:text-orange-400 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase cursor-pointer">
                      ${STATE.showConsoleOverlay ? 'HIDE CONSOLE' : 'SHOW CONSOLE'}
                    </button>
                    <button id="btn-reload-sandbox" class="text-[10px] font-mono text-zinc-400 hover:text-orange-400 transition-colors bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase cursor-pointer">
                      RELOAD
                    </button>
                  </div>
                </div>

                <!-- Simulation visual vector target -->
                <div class="flex-1 w-full bg-black/40 border border-zinc-800 rounded relative overflow-hidden min-h-[250px]" id="sandbox-iframe-container">
                   <!-- Iframe will be injected here dynamically on run -->
                   <div id="sandbox-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/90 overflow-y-auto">
                     ${isWebGPUSupported ? `
                       <span class="text-3xl mb-2">⚡</span>
                       <h5 class="text-sm font-mono text-zinc-200 font-bold mb-1">SANDBOX READY</h5>
                       <p class="text-xs font-sans text-zinc-400 max-w-xs leading-relaxed">
                         Click <strong class="text-green-400">⚡ RUN CODE</strong> from the code tab to mount and execute the active pipeline.
                       </p>
                     ` : `
                       <span class="text-3xl mb-2">⚠️</span>
                       <h5 class="text-sm font-mono text-amber-400 font-bold mb-1 uppercase tracking-wide">WebGPU Disabled or Unsupported</h5>
                       <p class="text-[11px] font-sans text-zinc-400 max-w-sm leading-relaxed mb-3">
                         WebGPU is not enabled or supported on this device/browser. Nesting in multiple iframes can also block WebGPU access on mobile browsers.
                       </p>
                       <div class="bg-amber-950/20 border border-amber-900/60 rounded p-3 text-left max-w-sm text-[11px] font-mono text-amber-300">
                         <strong class="text-orange-400 block mb-1">HOW TO ACTIVATE:</strong>
                         <ul class="list-disc pl-4 space-y-1">
                           <li><strong>iOS 17+:</strong> Settings &gt; Safari &gt; Advanced &gt; Feature Flags &gt; Enable <strong>WebGPU</strong>.</li>
                           <li><strong>Android Chrome:</strong> Visit <code class="bg-black/40 px-1 py-0.5 text-orange-400 rounded">chrome://flags</code>, enable <code class="bg-black/40 px-1 py-0.5 text-orange-400 rounded">#enable-unsafe-webgpu</code>, then restart.</li>
                           <li><strong>Fallback:</strong> Try clicking <strong class="text-orange-400">OPEN STANDALONE</strong> above to load outside nested frames!</li>
                         </ul>
                       </div>
                     `}
                   </div>
                </div>

                <!-- Floating Console Overlay Panel inside the preview card -->
                <div id="sandbox-console-overlay" class="absolute bottom-16 left-5 right-5 h-[120px] bg-black/95 border border-zinc-800/85 rounded flex flex-col overflow-hidden transition-all duration-200 ${STATE.showConsoleOverlay ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-4 invisible pointer-events-none'}">
                  <div class="bg-zinc-950 px-2.5 py-1.5 border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono shrink-0">
                    <span class="text-orange-400 font-bold flex items-center gap-1">
                      <span class="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                      SANDBOX INTERCEPT CONSOLE
                    </span>
                    <button id="btn-clear-overlay-logs" class="text-zinc-500 hover:text-zinc-300 uppercase text-[9px]">
                      Clear
                    </button>
                  </div>
                  <div id="sandbox-overlay-logs" class="flex-1 overflow-y-auto p-1.5 flex flex-col bg-black/30 gap-1">
                    <!-- Dynamic logs stream -->
                  </div>
                </div>

                <!-- Live stats display -->
                <div class="w-full border-t border-zinc-800/80 pt-3 flex justify-between items-center font-mono text-[10px] text-zinc-500">
                  <span>SANDBOX ISOLATED DIRECT STREAM</span>
                  <span>STATUS: <strong class="text-green-400" id="sandbox-status-lbl">IDLE</strong></span>
                </div>
              </div>

              <!-- Right inside box: Interactive parameters sliders simulation -->
              <div class="md:col-span-5 bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 flex flex-col gap-4">
                <h4 class="text-xs font-mono text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  📁 LIVE SIMULATOR DIRECTIVES
                </h4>
                <p class="text-xs font-sans text-zinc-400 leading-relaxed">
                  Configure local or remote module maps so that standard relative import statements execute successfully inside the browser.
                </p>

                <!-- Base path prefix configurer -->
                <div class="flex flex-col gap-1.5 bg-zinc-950/60 p-3 border border-zinc-800 rounded">
                  <label for="import-prefix-input" class="text-xs font-mono text-zinc-300 flex items-center gap-1">
                    <span>🔗</span> Import Path Base Prefix
                  </label>
                  <p class="text-[10px] font-sans text-zinc-400 leading-relaxed">
                    Overwrites relative paths (<code class="text-zinc-200">../</code>) with local/remote paths.
                  </p>
                  <input
                    type="text"
                    id="import-prefix-input"
                    value="${STATE.importPrefix || '../'}"
                    placeholder="../"
                    class="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-orange-400 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <div class="flex flex-wrap gap-1 mt-1.5">
                    <button class="prefix-preset-btn text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 cursor-pointer" data-value="../">
                      Default (../)
                    </button>
                    <button class="prefix-preset-btn text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 cursor-pointer" data-value="http://localhost:3000/">
                      Local Port 3000
                    </button>
                    <button class="prefix-preset-btn text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 cursor-pointer" data-value="https://cdn.jsdelivr.net/gh/zlatnaspirala/matrix-engine-wgpu@main/">
                      GitHub Main CDN
                    </button>
                  </div>
                </div>

                <div class="border-t border-zinc-800/80 pt-3 text-[10px] font-mono text-zinc-500 leading-relaxed uppercase">
                  ACTIVE_GEOMETRY: CUBE_MESH_GRID_LIST<br/>
                  PIPELINE_STATUS: COMPILED_SUCCESSFULLY
                </div>
              </div>

            </div>

          </div>

          <!-- TAB 3: API REFERENCES POCKET -->
          <div id="tab-content-api" class="flex-1 ${STATE.activeTab === 'api_ref' ? 'flex' : 'hidden'} flex-col overflow-y-auto p-6 bg-zinc-950 text-zinc-300 gap-5">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 class="text-sm font-mono text-cyan-400 uppercase tracking-widest font-bold">
                📚 THE BEAST WGPU DIRECT API REFERENCE SHEET
              </h3>
              <span class="text-[10px] font-mono text-zinc-500">STANDALONE PARSER V1</span>
            </div>

            <p class="text-xs font-sans text-zinc-400 leading-relaxed mb-1">
              Here is a curated snapshot of native helper signatures compatible with matrix-engine-wgpu. These commands are directly generated when compile configurations align.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${API_REFERENCES.map(ref => `
                <div class="bg-zinc-900/40 border border-zinc-800/85 hover:border-zinc-700 rounded p-4 flex flex-col gap-2 select-all font-mono">
                  <h4 class="text-xs font-bold text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                    <span class="inline-block w-1 h-2.5 bg-orange-500"></span>
                    ${ref.title}
                  </h4>
                  <p class="text-[11px] text-zinc-400 font-sans tracking-wide leading-relaxed">${ref.description}</p>
                  <div class="bg-zinc-950 p-2.5 rounded border border-zinc-900/80 text-[11px] text-cyan-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    ${escapeHTML(ref.syntax)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- FOOTER LIVE SIMULATED CONSOLE STREAMS (NEVER CLUTTERS AND STYLISH) -->
        <article class="border-t border-zinc-800 bg-zinc-950/90 h-[170px] flex flex-col overflow-hidden shrink-0">
          <div class="bg-zinc-900/60 border-b border-zinc-900 px-4 py-2 flex justify-between items-center">
            <span class="text-[10.5px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
              THE BEAST WGPU OUTPUT CONSOLE STREAM
            </span>
            <div class="flex items-center gap-3">
              <span class="text-[9px] font-mono text-zinc-500 uppercase">SYS_LOGGING: ON</span>
              <button id="btn-clear-logs" class="text-[10px] font-mono text-zinc-400 hover:text-orange-400 transition-colors uppercase">
                CLEAR CONSOLE
              </button>
            </div>
          </div>
          <div id="beast-live-logs" class="flex-1 overflow-y-auto p-4 flex flex-col gap-0.5 bg-black/60 font-mono">
            <!-- Dynamically populated -->
          </div>
        </article>

      </main>
    </main>

    <!-- FLOATING RETRO-GLOW COMPATIBLE TOAST -->
    <div id="toast-notification" class="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-orange-500 text-orange-400 font-mono text-xs py-3 px-5 rounded-lg shadow-lg opacity-0 translate-y-4 transition-all duration-300 pointer-events-none z-50 flex items-center gap-2">
      <span class="text-orange-500">⚡</span>
      <span id="toast-text" class="tracking-wide">Copied specifications to clipboard</span>
    </div>
  `;

  bindWorkspaceEvents();
  renderLogs();
  renderSandboxLogs();
}

function bindWorkspaceEvents() {
  // Preset select event binding
  const presetButtons = document.querySelectorAll('.preset-selector');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (targetId) {
        STATE.selectedPresetId = targetId;
        const selected = CODE_PRESETS.find(p => p.id === targetId);
        if (selected) {
          logToBeastConsole(`Swapped workspace preset target to [${selected.name}].`);
          // Overwrite values based on preset
          const sysPromptInput = document.getElementById('system-instructions-input') as HTMLTextAreaElement;
          const userPromptInput = document.getElementById('user-prompt-input') as HTMLTextAreaElement;
          if (sysPromptInput) sysPromptInput.value = selected.systemPrompt;
          if (userPromptInput) userPromptInput.value = selected.userPrompt;
          
          buildWorkspace();
        }
      }
    });
  });

  // System instructions input tracker
  const sysPromptInput = document.getElementById('system-instructions-input') as HTMLTextAreaElement;
  const sysCharCount = document.getElementById('sys-char-count');
  if (sysPromptInput && sysCharCount) {
    sysCharCount.innerText = `${sysPromptInput.value.length} chars`;
    sysPromptInput.addEventListener('input', () => {
      sysCharCount.innerText = `${sysPromptInput.value.length} chars`;
    });
  }

  // Creativity Temp Slider
  const tempSlider = document.getElementById('temp-slider-input') as HTMLInputElement;
  const tempValueDisplay = document.getElementById('temp-value-display');
  if (tempSlider && tempValueDisplay) {
    tempSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      STATE.temperature = val;
      tempValueDisplay.innerText = val.toFixed(2);
    });
  }

  // Simulated speed slider
  const simSpeedSlider = document.getElementById('sim-speed-slider') as HTMLInputElement;
  const speedDisplayLabel = document.getElementById('speed-display-lbl');
  if (simSpeedSlider && speedDisplayLabel) {
    simSpeedSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      STATE.simulatedSpeed = val;
      speedDisplayLabel.innerText = `${val.toFixed(1)}x`;
    });
  }

  // Toggles bindings
  const canvasInput = document.getElementById('canvas-id-input') as HTMLInputElement;
  if (canvasInput) {
    canvasInput.addEventListener('change', () => {
      STATE.canvasId = canvasInput.value;
      logToBeastConsole(`Dynamic target canvas-id set to: "${STATE.canvasId}"`);
    });
  }

  const importSelect = document.getElementById('import-style-select') as HTMLSelectElement;
  if (importSelect) {
    importSelect.addEventListener('change', () => {
      STATE.importStyle = importSelect.value;
      logToBeastConsole(`Dynamic engine import module preset switched to reference [${STATE.importStyle.toUpperCase()}]`);
    });
  }

  // Compiler compatibility flag checkbox sync
  const chkAutoInit = document.getElementById('flag-auto-init') as HTMLInputElement;
  if (chkAutoInit) {
    chkAutoInit.addEventListener('change', () => {
      STATE.autoInit = chkAutoInit.checked;
      logToBeastConsole(`Auto init pipeline parameter toggled: ${STATE.autoInit}`);
    });
  }

  const chkVertexSetup = document.getElementById('flag-vertex-setup') as HTMLInputElement;
  if (chkVertexSetup) {
    chkVertexSetup.addEventListener('change', () => {
      STATE.vertexSetup = chkVertexSetup.checked;
      logToBeastConsole(`Base WGSL Vertex Shader bundle parameter toggled: ${STATE.vertexSetup}`);
    });
  }

  const chkEventListeners = document.getElementById('flag-event-listeners') as HTMLInputElement;
  if (chkEventListeners) {
    chkEventListeners.addEventListener('change', () => {
      STATE.eventListeners = chkEventListeners.checked;
      logToBeastConsole(`Keyboard key event listening coordinate tracker parameter toggled: ${STATE.eventListeners}`);
    });
  }

  // Chip Injector buttons
  const chipButtons = document.querySelectorAll('.chip-btn');
  chipButtons.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const val = (e.currentTarget as HTMLElement).getAttribute('data-insert');
      const userPromptInput = document.getElementById('user-prompt-input') as HTMLTextAreaElement;
      if (val && userPromptInput) {
        const start = userPromptInput.selectionStart;
        const end = userPromptInput.selectionEnd;
        const text = userPromptInput.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        userPromptInput.value = before + val + after;
        userPromptInput.focus();
        userPromptInput.selectionStart = userPromptInput.selectionEnd = start + val.length;
        logToBeastConsole(`Injected code variable identifier: ${val}`);
      }
    });
  });

  // Clear Logs
  const clearBtn = document.getElementById('btn-clear-logs');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      STATE.customWebGPULogs = [];
      logToBeastConsole('Active console buffer flushed.');
    });
  }

  // Tab Selection
  const setTab = (tabName: 'code_view' | 'preview_simulator' | 'api_ref') => {
    STATE.activeTab = tabName;
    const tabs = ['code', 'simulator', 'api'];
    const tabMapping: Record<string, string> = {
      code: 'code_view',
      simulator: 'preview_simulator',
      api: 'api_ref'
    };
    
    // Update selectors styling directly
    tabs.forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const content = document.getElementById(`tab-content-${t}`);
      if (btn && content) {
        if (tabMapping[t] === tabName) {
          btn.className = 'tab-selector font-mono text-xs uppercase px-3 py-1.5 rounded transition-all cursor-pointer bg-zinc-900 border border-zinc-800 text-orange-400 font-bold';
          content.classList.remove('hidden');
          content.classList.add('flex');
        } else {
          btn.className = 'tab-selector font-mono text-xs uppercase px-3 py-1.5 rounded transition-all cursor-pointer text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40';
          content.classList.remove('flex');
          content.classList.add('hidden');
        }
      }
    });
    logToBeastConsole(`Swapped active viewport channel to: [${tabName.toUpperCase()}]`);
  };

  const codeTabBtn = document.getElementById('tab-btn-code');
  if (codeTabBtn) codeTabBtn.addEventListener('click', () => setTab('code_view'));

  const simTabBtn = document.getElementById('tab-btn-simulator');
  if (simTabBtn) simTabBtn.addEventListener('click', () => setTab('preview_simulator'));

  const apiTabBtn = document.getElementById('tab-btn-api');
  if (apiTabBtn) apiTabBtn.addEventListener('click', () => setTab('api_ref'));

  // Copy Code Button
  const copyBtn = document.getElementById('btn-copy-code');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const codeEditor = document.getElementById('code-content-block') as HTMLTextAreaElement;
      const currentCode = codeEditor ? codeEditor.value : (CODE_PRESETS.find(p => p.id === STATE.selectedPresetId) || CODE_PRESETS[0]).code;
      navigator.clipboard.writeText(currentCode)
        .then(() => {
          showToastNotification('Copied specification blueprint!');
          logToBeastConsole('Code template written onto system clipboard buffer.');
        })
        .catch(() => {
          showToastNotification('Unable to write text buffer automatically');
        });
    });
  }

  // Run Code Button
  const runBtn = document.getElementById('btn-run-code');
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      executeSandboxCode();
      setTab('preview_simulator');
    });
  }

  // Reload Sandbox Button
  const reloadSandboxBtn = document.getElementById('btn-reload-sandbox');
  if (reloadSandboxBtn) {
    reloadSandboxBtn.addEventListener('click', () => {
      executeSandboxCode();
    });
  }

  // Import Prefix inputs and presets
  const prefixInput = document.getElementById('import-prefix-input') as HTMLInputElement;
  if (prefixInput) {
    prefixInput.addEventListener('change', () => {
      STATE.importPrefix = prefixInput.value;
      logToBeastConsole(`Relative path rewrite prefix set to: "${STATE.importPrefix}"`);
    });
  }

  const prefixPresetBtns = document.querySelectorAll('.prefix-preset-btn');
  prefixPresetBtns.forEach(pbtn => {
    pbtn.addEventListener('click', (e) => {
      const val = (e.currentTarget as HTMLElement).getAttribute('data-value');
      if (val && prefixInput) {
        prefixInput.value = val;
        STATE.importPrefix = val;
        logToBeastConsole(`Swapped rewrite prefix to preset: "${val}"`);
      }
    });
  });

  // Simulated color triggers
  const colorBtns = document.querySelectorAll('.color-btn');
  colorBtns.forEach(cbtn => {
    cbtn.addEventListener('click', (e) => {
      const color = (e.currentTarget as HTMLElement).getAttribute('data-color');
      const cubeEl = document.getElementById('beast-vector-cube');
      if (cubeEl && color) {
        // Clear old borders and highlights
        cubeEl.className = 'w-24 h-24 border rounded flex items-center justify-center relative transition-transform duration-75';
        
        // Update styling
        colorBtns.forEach(cb => {
          cb.className = `color-btn py-1.5 text-[11px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-400 rounded transition-all`;
        });
        (e.target as HTMLElement).className = 'color-btn py-1.5 text-[11px] font-mono bg-zinc-950 border border-orange-500 text-orange-400 rounded transition-all';

        if (color === 'orange') {
          cubeEl.classList.add('border-orange-500/80', 'bg-orange-950/20');
          cubeEl.style.boxShadow = '0 0 25px rgba(249,115,22,0.15)';
          logToBeastConsole('WebGPU pipeline render-pass clearColor swapped: BEAST ORANGE applied.');
        } else if (color === 'cyan') {
          cubeEl.classList.add('border-cyan-500/80', 'bg-cyan-950/20');
          cubeEl.style.boxShadow = '0 0 25px rgba(6,182,212,0.15)';
          logToBeastConsole('WebGPU pipeline render-pass clearColor swapped: RETRO CYAN applied.');
        } else if (color === 'matrix') {
          cubeEl.classList.add('border-green-500/80', 'bg-green-950/20');
          cubeEl.style.boxShadow = '0 0 25px rgba(34,197,94,0.15)';
          logToBeastConsole('WebGPU pipeline render-pass clearColor swapped: TOXIC SLATE applied.');
        }
      }
    });
  });

  // Toggle dynamic simulation running state
  const toggleSimBtn = document.getElementById('btn-toggle-sim');
  if (toggleSimBtn) {
    toggleSimBtn.addEventListener('click', () => {
      STATE.simulationRunning = !STATE.simulationRunning;
      if (STATE.simulationRunning) {
        toggleSimBtn.innerText = 'PAUSE ROTATIONAL PIPELINE';
        toggleSimBtn.className = 'w-full py-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900/60 font-mono text-xs text-zinc-300 rounded transition-colors cursor-pointer';
        logToBeastConsole('WGPU simulated render ticking loop UNPAUSED.');
      } else {
        toggleSimBtn.innerText = 'RESUME ROTATIONAL PIPELINE';
        toggleSimBtn.className = 'w-full py-2 border border-orange-500/40 bg-orange-950/10 hover:bg-orange-950/20 font-mono text-xs text-orange-400 rounded transition-colors cursor-pointer';
        logToBeastConsole('WGPU simulated render ticking loop PAUSED.');
      }
    });
  }

  // Generate / Compile simulation action triggers
  const btnGenerate = document.getElementById('btn-generate');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      const userPromptText = (document.getElementById('user-prompt-input') as HTMLTextAreaElement).value;
      const sysInstructionsText = (document.getElementById('system-instructions-input') as HTMLTextAreaElement).value;

      logToBeastConsole(`Initiated creative generator session...`);
      logToBeastConsole(`Prompt processed: "${userPromptText.substring(0, 45)}..."`);
      logToBeastConsole(`Compiling agent specifications (Temp: ${STATE.temperature}).`);

      // Mock compilation delay with terminal outputs
      let progress = 0;
      const progressSteps = [
        'Connecting matrix pipeline to GPU device...',
        'Spanning mesh buffers for active canvas viewport target...',
        'Compiling shaders using WGSL optimization loops...',
        'THE BEAST: Generated custom application code built and ready!'
      ];

      const interval = setInterval(() => {
        if (progress < progressSteps.length) {
          logToBeastConsole(progressSteps[progress]);
          progress++;
        } else {
          clearInterval(interval);
          // Show Toast
          showToastNotification('WGPU compilation successful!');
          // Switch to tab code view if not there
          setTab('code_view');
        }
      }, 500);
    });
  }

  const btnMutate = document.getElementById('btn-mutate');
  if (btnMutate) {
    btnMutate.addEventListener('click', () => {
      logToBeastConsole('Requesting directive mutation...');
      showToastNotification('Prompt mutated with optimal helper structures');
      const userPromptInput = document.getElementById('user-prompt-input') as HTMLTextAreaElement;
      if (userPromptInput) {
        userPromptInput.value += ' --optimization=WGPU_PERF --target=matrix-core';
        logToBeastConsole('Appended performance flags to core instruction console.');
      }
    });
  }

  // Toggle Sandbox Console Overlay listener
  const btnToggleOverlay = document.getElementById('btn-toggle-console-overlay');
  const overlayPanel = document.getElementById('sandbox-console-overlay');
  if (btnToggleOverlay && overlayPanel) {
    btnToggleOverlay.addEventListener('click', () => {
      STATE.showConsoleOverlay = !STATE.showConsoleOverlay;
      btnToggleOverlay.innerText = STATE.showConsoleOverlay ? 'HIDE CONSOLE' : 'SHOW CONSOLE';
      if (STATE.showConsoleOverlay) {
        overlayPanel.classList.remove('opacity-0', 'translate-y-4', 'invisible', 'pointer-events-none');
        overlayPanel.classList.add('opacity-100', 'translate-y-0', 'visible');
        renderSandboxLogs();
      } else {
        overlayPanel.classList.remove('opacity-100', 'translate-y-0', 'visible');
        overlayPanel.classList.add('opacity-0', 'translate-y-4', 'invisible', 'pointer-events-none');
      }
    });
  }

  // Clear Sandbox Overlay Logs listener
  const btnClearOverlay = document.getElementById('btn-clear-overlay-logs');
  if (btnClearOverlay) {
    btnClearOverlay.addEventListener('click', () => {
      STATE.sandboxLogs = [];
      renderSandboxLogs();
    });
  }
}

// Simulated active rotational draw loop using requestAnimationFrame
function runGraphicsSimulation() {
  if (STATE.simulationRunning) {
    STATE.simulatedRotationDegrees += 0.8 * STATE.simulatedSpeed;
    const cubeMesh = document.getElementById('beast-vector-cube');
    if (cubeMesh) {
      cubeMesh.style.transform = `rotateX(${STATE.simulatedRotationDegrees * 0.4}deg) rotateY(${STATE.simulatedRotationDegrees}deg) rotateZ(10deg)`;
    }
  }
  requestAnimationFrame(runGraphicsSimulation);
}

function executeSandboxCode() {
  const codeEditor = document.getElementById('code-content-block') as HTMLTextAreaElement;
  if (!codeEditor) return;

  const currentCode = codeEditor.value;
  const prefixInput = document.getElementById('import-prefix-input') as HTMLInputElement;
  const prefix = prefixInput ? prefixInput.value : (STATE.importPrefix || '../');
  STATE.importPrefix = prefix;

  logToBeastConsole('Re-constructing WebGPU Sandbox Isolated Execution Port...');
  
  // Clear old sandbox logs
  STATE.sandboxLogs = [];
  renderSandboxLogs();

  // Rewrite imports
  let processedCode = currentCode;
  if (prefix !== '../') {
    processedCode = processedCode.replace(/(from\s+['"])(\.\.\/|\.\/)/g, `$1${prefix}`);
  }

  // Save to localStorage so standalone fullscreen preview can access it on same origin
  localStorage.setItem('beast_active_code', processedCode);
  localStorage.setItem('beast_import_prefix', prefix);

  const container = document.getElementById('sandbox-iframe-container');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'sandbox-iframe';
  iframe.className = 'w-full h-full border-0 bg-[#030303]';
  // Allow scripts and same origin (for fetching local node_modules)
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  container.appendChild(iframe);

  const statusLabel = document.getElementById('sandbox-status-lbl');
  if (statusLabel) {
    statusLabel.innerText = 'RUNNING';
    statusLabel.className = 'text-green-400 font-bold';
  }

  const basePrefix = prefix === '../' ? '/node_modules/matrix-engine-wgpu/' : prefix;
  const indexJs = prefix === '../' ? '/node_modules/matrix-engine-wgpu/index.js' : `${prefix}index.js`;

  // Construct iframe source with all required elements for matrix-engine-wgpu
  const iframeHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script type="importmap">
      {
        "imports": {
          "matrix-engine-wgpu": "${indexJs}",
          "matrix-engine-wgpu/": "${basePrefix}",
          "../src/": "${basePrefix}src/",
          "../": "${basePrefix}",
          "gl-matrix": "/node_modules/gl-matrix/esm/index.js",
          "wgpu-matrix": "/node_modules/wgpu-matrix/dist/2.x/wgpu-matrix.module.js",
          "bvh-loader": "/node_modules/bvh-loader/index.js"
        }
      }
    </script>
    <style>
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background-color: #030303;
        overflow: hidden;
        color: #d4d4d8;
        font-family: monospace;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
        background: transparent;
      }
      #error-overlay {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        background: rgba(127, 29, 29, 0.95);
        color: #fecaca;
        padding: 12px;
        border-radius: 4px;
        font-size: 11px;
        border: 1px solid #f87171;
        white-space: pre-wrap;
        display: none;
        z-index: 9999;
        font-family: monospace;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
    </style>
  </head>
  <body>
    <!-- Real-time error overlay for sandbox -->
    <div id="error-overlay"></div>
    
    <!-- Required structures expected by matrix-engine-wgpu -->
    <div id="matrix-net" style="display:none;"></div>
    <div id="log" class="msg-box" style="display:none;"></div>
    <div id="msgBox" class="msg-box" style="display:none;"></div>
    
    <!-- Viewport canvas target -->
    <canvas id="canvas1"></canvas>
    
    <script>
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      function sendToParent(type, args) {
        window.parent.postMessage({
          type: 'WGPU_SANDBOX_LOG',
          logType: type,
          message: args.map(arg => {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (arg instanceof Error) return arg.message + '\\n' + arg.stack;
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg); } catch(e) { return String(arg); }
            }
            return String(arg);
          }).join(' ')
        }, '*');
      }

      console.log = function(...args) {
        sendToParent('info', args);
        originalLog.apply(console, args);
      };
      console.error = function(...args) {
        sendToParent('error', args);
        originalError.apply(console, args);
      };
      console.warn = function(...args) {
        sendToParent('warn', args);
        originalWarn.apply(console, args);
      };

      if (!navigator.gpu) {
        console.warn("⚠️ WebGPU NOT SUPPORTED! WebGPU is disabled or not supported on this browser/device. iOS/Android devices might require enabling specific browser flags.");
        const overlay = document.getElementById('error-overlay');
        if (overlay) {
          overlay.innerHTML = '⚠️ <strong>WebGPU NOT SUPPORTED ON THIS DEVICE</strong><br>' +
            'WebGPU is disabled or not supported on this browser/device.<br><br>' +
            '<strong>How to activate:</strong><br>' +
            '- <strong>iOS 17+:</strong> Settings &gt; Safari &gt; Advanced &gt; Feature Flags &gt; Enable <strong>WebGPU</strong>.<br>' +
            '- <strong>Android Chrome:</strong> Go to <code>chrome://flags</code>, enable <code>#enable-unsafe-webgpu</code>, then relaunch Chrome.';
          overlay.style.backgroundColor = 'rgba(146, 64, 14, 0.95)';
          overlay.style.color = '#fef3c7';
          overlay.style.borderColor = '#d97706';
          overlay.style.display = 'block';
        }
      }

      window.addEventListener('error', function(e) {
        const overlay = document.getElementById('error-overlay');
        if (overlay) {
          overlay.innerText = '🔴 UNCAUGHT RUNTIME EXCEPTION:\\n' + e.message + '\\nLine ' + e.lineno + ':' + e.colno;
          overlay.style.display = 'block';
        }
        sendToParent('exception', [e.message, 'at line', e.lineno, 'col', e.colno]);
      });
      
      window.addEventListener('unhandledrejection', function(e) {
        const overlay = document.getElementById('error-overlay');
        if (overlay) {
          overlay.innerText = '🔴 UNHANDLED PROMISE REJECTION:\\n' + (e.reason ? e.reason.message || e.reason : e);
          overlay.style.display = 'block';
        }
        sendToParent('exception', ['Unhandled Promise Rejection:', e.reason ? e.reason.message || e.reason : e]);
      });
    </script>
    <script type="module">
      ${processedCode}
    </script>
  </body>
</html>
  `;

  // Use srcdoc to safely load and execute the iframe HTML in isolated context without SecurityError!
  iframe.srcdoc = iframeHtml;

  logToBeastConsole('Isolated Sandbox stream online. Evaluating active ES bindings...');
}

function renderStandaloneSandbox() {
  const activeCode = localStorage.getItem('beast_active_code') || '';
  const importPrefix = localStorage.getItem('beast_import_prefix') || '../';
  
  // Clean up body
  document.body.innerHTML = `
    <div id="error-overlay" style="
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      background: rgba(146, 64, 14, 0.95);
      color: #fef3c7;
      border: 1px solid #d97706;
      padding: 16px;
      border-radius: 6px;
      font-size: 13px;
      white-space: pre-wrap;
      display: none;
      z-index: 9999;
      font-family: monospace;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    "></div>
    
    <a href="${window.location.origin + window.location.pathname}" style="
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(24, 24, 27, 0.85);
      border: 1px solid rgba(63, 63, 70, 0.8);
      color: #a1a1aa;
      padding: 8px 14px;
      font-size: 11px;
      font-family: monospace;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transition: all 0.2s;
    " onmouseover="this.style.borderColor='#f97316';this.style.color='#f97316';" onmouseout="this.style.borderColor='rgba(63, 63, 70, 0.8)';this.style.color='#a1a1aa';">⬅️ BACK TO WORKSPACE</a>

    <!-- Required structures expected by matrix-engine-wgpu -->
    <div id="matrix-net" style="display:none;"></div>
    <div id="log" class="msg-box" style="display:none;"></div>
    <div id="msgBox" class="msg-box" style="display:none;"></div>
    
    <canvas id="canvas1" style="
      display: block;
      width: 100%;
      height: 100%;
      background: transparent;
    "></canvas>
  `;

  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.width = '100%';
  document.body.style.height = '100%';
  document.body.style.backgroundColor = '#030303';
  document.body.style.overflow = 'hidden';
  document.body.style.fontFamily = 'monospace';

  // Add viewport meta tag if not present
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    document.head.appendChild(viewport);
  }

  // Set page title
  document.title = "THE BEAST WGPU - STANDALONE VIEW";

  // Create importmap script
  const basePrefix = importPrefix === '../' ? '/node_modules/matrix-engine-wgpu/' : importPrefix;
  const indexJs = importPrefix === '../' ? '/node_modules/matrix-engine-wgpu/index.js' : `${importPrefix}index.js`;

  const importMapScript = document.createElement('script');
  importMapScript.type = 'importmap';
  importMapScript.textContent = JSON.stringify({
    imports: {
      "matrix-engine-wgpu": indexJs,
      "matrix-engine-wgpu/": basePrefix,
      "../src/": `${basePrefix}src/`,
      "../": basePrefix,
      "gl-matrix": "/node_modules/gl-matrix/esm/index.js",
      "wgpu-matrix": "/node_modules/wgpu-matrix/dist/2.x/wgpu-matrix.module.js",
      "bvh-loader": "/node_modules/bvh-loader/index.js"
    }
  });
  document.head.appendChild(importMapScript);

  // Error listener script
  const inlineScript = document.createElement('script');
  inlineScript.textContent = `
    window.addEventListener('error', function(e) {
      const overlay = document.getElementById('error-overlay');
      if (overlay) {
        overlay.innerText = '🔴 UNCAUGHT RUNTIME EXCEPTION:\\n' + e.message + '\\nLine ' + e.lineno + ':' + e.colno;
        overlay.style.display = 'block';
        overlay.style.backgroundColor = 'rgba(127, 29, 29, 0.95)';
        overlay.style.borderColor = '#f87171';
        overlay.style.color = '#fecaca';
      }
    });
    window.addEventListener('unhandledrejection', function(e) {
      const overlay = document.getElementById('error-overlay');
      if (overlay) {
        overlay.innerText = '🔴 UNHANDLED PROMISE REJECTION:\\n' + (e.reason ? e.reason.message || e.reason : e);
        overlay.style.display = 'block';
        overlay.style.backgroundColor = 'rgba(127, 29, 29, 0.95)';
        overlay.style.borderColor = '#f87171';
        overlay.style.color = '#fecaca';
      }
    });
    if (!navigator.gpu) {
      const overlay = document.getElementById('error-overlay');
      if (overlay) {
        overlay.innerHTML = '⚠️ <strong>WebGPU NOT SUPPORTED ON THIS DEVICE</strong><br>' +
          'WebGPU is disabled or not supported on this browser/device.<br><br>' +
          '<strong>How to activate:</strong><br>' +
          '- <strong>iOS 17+:</strong> Settings &gt; Safari &gt; Advanced &gt; Feature Flags &gt; Enable <strong>WebGPU</strong>.<br>' +
          '- <strong>Android Chrome:</strong> Go to <code>chrome://flags</code>, enable <code>#enable-unsafe-webgpu</code>, then relaunch Chrome.';
        overlay.style.display = 'block';
      }
    }
  `;
  document.body.appendChild(inlineScript);

  // Dynamic Module Code script
  const codeScript = document.createElement('script');
  codeScript.type = 'module';
  codeScript.textContent = activeCode;
  document.body.appendChild(codeScript);
}

// Initial Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  // Check if we should render standalone sandbox fullscreen
  const params = new URLSearchParams(window.location.search);
  if (params.get('sandbox') === 'true') {
    renderStandaloneSandbox();
    return;
  }

  buildWorkspace();
  runGraphicsSimulation();
  
  // Register unified messaging listener
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'WGPU_SANDBOX_LOG') {
      const logType = event.data.logType;
      const message = event.data.message;
      
      let prefix = '⚙️';
      if (logType === 'error') prefix = '❌ [SANDBOX_ERROR]';
      else if (logType === 'warn') prefix = '⚠️ [SANDBOX_WARN]';
      else if (logType === 'exception') prefix = '🚨 [SANDBOX_EXCEPTION]';
      else prefix = 'ℹ️ [SANDBOX_LOG]';
      
      const fullLog = `${prefix} ${message}`;
      logToBeastConsole(fullLog);

      // Append log to overlay console panel
      STATE.sandboxLogs.push(fullLog);
      if (STATE.sandboxLogs.length > 50) {
        STATE.sandboxLogs.shift();
      }
      renderSandboxLogs();
      
      const statusLabel = document.getElementById('sandbox-status-lbl');
      if (statusLabel) {
        if (logType === 'error' || logType === 'exception') {
          statusLabel.innerText = 'EXCEPTION';
          statusLabel.className = 'text-red-500 font-bold';
        }
      }
    }
  });

  logToBeastConsole(`System core online. Welcome creator.`);
});
