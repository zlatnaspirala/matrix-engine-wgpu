// EXAMPLES INJECTION SECTION (3 slots, user-picked)

import { sprite2dSlotMashine } from "./prompts/2D-world";
import { Platformer2DPhysics } from "./prompts/2D-world-matter";
import { DRUMBALLS } from "./prompts/3d-drum-balls";
import { BVH_SKELETAL_ANIMS } from "./prompts/bvh-skeletal-shared-mat";
import { CAMERA_EXAMPLE } from "./prompts/camera-texture";
import { CINEMATIC_CAMERA } from "./prompts/cinematic-camera";
import { MAZE_EXAMPLE } from "./prompts/maze";
import { FLIPPER } from "./prompts/flipper-jolt";
import { canvas2DInline } from "./prompts/canvas-inline";
import { gaussianSplat } from "./prompts/gaussian-splat";
import { waterEffect } from "./prompts/water-effect";
import { cannonTest } from "./prompts/physics-test-cannones";

export const EXAMPLES=[
  { name: 'Maze (no physics, collisionSystem)', code: MAZE_EXAMPLE },
  { name: 'Real physics DRUM BALLS infinity rounds with 5 numbers', code: DRUMBALLS },
  { name: '2D Platformer (2d matterJS physics)', code: Platformer2DPhysics },
  { name: 'Slot mashine constructed from 2d sprites animations segments', code: sprite2dSlotMashine },
  { name: 'BVH Skeletal animation - every bone have ray hit handled.', code: BVH_SKELETAL_ANIMS },
  { name: 'Camera example vs morphMesh', code: CAMERA_EXAMPLE },
  { name: 'Cinematic camera movement/animation', code: CINEMATIC_CAMERA },
  { name: 'Flipper game with real physics', code: FLIPPER },
  { name: 'canvas2D draws inline', code: canvas2DInline },
  { name: 'Gaussian Splat load', code: gaussianSplat },
  { name: 'Water effect and navigation mesh with character movement.', code : waterEffect},
  { name : 'cannon example', code : cannonTest},
];

export let SELECTION_DOM: HTMLSelectElement[]=[];

export function getExamplesSection() {
  const examplesSection=document.createElement('div');
  examplesSection.className='flex flex-col gap-1 shrink-0';

  const examplesLabel=document.createElement('label');
  examplesLabel.className='text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1';
  examplesLabel.innerHTML='<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> INJECT_EXAMPLES';

  const examplesRow=document.createElement('div');
  examplesRow.className='flex items-center gap-1.5';

  const exampleSelects: HTMLSelectElement[]=[];

  for(let i=0; i<3; i++) {
    const sel=document.createElement('select');
    sel.className='flex-1 min-w-0 bg-slate-900 text-amber-300 text-[10px] px-1.5 py-1 rounded border border-amber-800/80 focus:border-amber-400 focus:outline-none cursor-pointer font-mono truncate';

    const noneOpt=document.createElement('option');
    noneOpt.value='';
    noneOpt.innerText=`-- SLOT ${i+1} --`;
    sel.appendChild(noneOpt);

    EXAMPLES.forEach((ex, idx) => {
      const opt=document.createElement('option');
      opt.value=String(idx);
      opt.innerText=ex.name;
      sel.appendChild(opt);
    });

    exampleSelects.push(sel);
    examplesRow.appendChild(sel);
  }

  SELECTION_DOM=exampleSelects; // assign the whole array once, after the loop

  examplesSection.appendChild(examplesLabel);
  examplesSection.appendChild(examplesRow);
  return examplesSection;
}