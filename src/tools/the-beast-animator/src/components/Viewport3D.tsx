import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';
import { MediaPipeFaceMesh3D } from '../engine/mediapipeFaceMesh3D';
import type { ActiveMixamoRig } from '../engine/mixamoSkeleton';
import type { MotionSourceMode } from '../types/mocap';

export type CameraPreset = 'three-quarter' | 'front' | 'side' | 'top' | 'face-portrait';

interface Viewport3DProps {
  rig: ActiveMixamoRig;
  mode: MotionSourceMode;
  showSkeleton: boolean;
  bvhText: string;
  bvhPlaybackPlaying: boolean;
  cameraPreset: CameraPreset;
  cameraTrigger: number;
  faceMesh3DRef: MutableRefObject<MediaPipeFaceMesh3D | null>;
  onTickFrame: (nowMs: number, deltaSec: number) => void;
}

const CAMERA_PRESETS: Record<
  CameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  'three-quarter': { pos: [1.9, 1.45, 2.75], target: [0, 0.92, 0] },
  front: { pos: [0, 1.15, 3.1], target: [0, 0.92, 0] },
  side: { pos: [3.1, 1.15, 0], target: [0, 0.92, 0] },
  top: { pos: [0, 4.1, 0.7], target: [0, 0.92, 0] },
  'face-portrait': { pos: [0.02, 1.0, 0.44], target: [0, 1.0, 0] },
};

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Viewport3D({
  rig,
  mode,
  showSkeleton,
  bvhText,
  bvhPlaybackPlaying,
  cameraPreset,
  cameraTrigger,
  faceMesh3DRef,
  onTickFrame,
}: Viewport3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Mutable refs so React state updates never recreate the WebGL context
  const onTickRef = useRef(onTickFrame);
  onTickRef.current = onTickFrame;

  const modeRef = useRef(mode);
  modeRef.current = mode;

  const bvhPlayingRef = useRef(bvhPlaybackPlaying);
  bvhPlayingRef.current = bvhPlaybackPlaying;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rigContainerRef = useRef<THREE.Group | null>(null);
  const faceStageRef = useRef<THREE.Group | null>(null);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);
  const bvhGroupRef = useRef<THREE.Group | null>(null);
  const bvhMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const shadowPlaneRef = useRef<THREE.Mesh | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const cameraTargetGoalRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(1.9, 1.45, 2.75),
    target: new THREE.Vector3(0, 0.92, 0),
  });

  // Trigger smooth camera preset transition
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    cameraTargetGoalRef.current.pos.set(...preset.pos);
    cameraTargetGoalRef.current.target.set(...preset.target);
    cameraTargetGoalRef.current.active = true;
  }, [cameraPreset, cameraTrigger]);

  // Initialize Three.js WebGL stage once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored,
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d11);
    scene.fog = new THREE.FogExp2(0x0b0d11, 0.055);
    sceneRef.current = scene;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.08, 60);
    camera.position.set(1.9, 1.45, 2.75);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.92, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 0.32;
    controls.maxDistance = 10.0;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.update();
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      cameraTargetGoalRef.current.active = false;
    });

    // Studio 3-point warm/cool lighting rig
    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x111827, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    keyLight.position.set(3.2, 5.0, 3.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -2.5;
    keyLight.shadow.camera.right = 2.5;
    keyLight.shadow.camera.top = 2.5;
    keyLight.shadow.camera.bottom = -2.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.05);
    rimLight.position.set(-3.0, 3.2, -3.2);
    scene.add(rimLight);

    // Studio stage floor + metric grid + radial contact shadow
    const floorGeo = new THREE.CircleGeometry(18, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1218,
      roughness: 0.88,
      metalness: 0.08,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.position.y = -0.002;
    scene.add(floorMesh);
    floorMeshRef.current = floorMesh;

    const grid = new THREE.GridHelper(16, 32, 0x3a4354, 0x1b202b);
    grid.position.y = 0.001;
    (grid.material as THREE.Material).polygonOffset = true;
    (grid.material as THREE.Material).polygonOffsetFactor = -1;
    (grid.material as THREE.Material).polygonOffsetUnits = -1;
    scene.add(grid);
    gridRef.current = grid;

    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.7,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.004;
    scene.add(shadowPlane);
    shadowPlaneRef.current = shadowPlane;

    // Rig container, dedicated Face Mesh container & BVH verification container
    const rigContainer = new THREE.Group();
    rigContainer.name = 'Active_Rig_Stage';
    scene.add(rigContainer);
    rigContainerRef.current = rigContainer;

    const faceStage = new THREE.Group();
    faceStage.name = 'MediaPipe_Face_Stage';
    faceStage.position.set(0, 1.0, 0);
    faceStage.visible = false;
    const faceMesh3D = new MediaPipeFaceMesh3D();
    faceStage.add(faceMesh3D.group);
    scene.add(faceStage);
    faceStageRef.current = faceStage;
    faceMesh3DRef.current = faceMesh3D;

    const bvhContainer = new THREE.Group();
    bvhContainer.name = 'BVH_Verification_Stage';
    bvhContainer.visible = false;
    scene.add(bvhContainer);
    bvhGroupRef.current = bvhContainer;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let frameId = 0;
    let disposed = false;
    let lastTimeMs = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const nowMs = performance.now();
      const deltaSec = Math.min((nowMs - lastTimeMs) / 1000, 0.1);
      lastTimeMs = nowMs;

      // Smooth damped camera preset transitions
      const goal = cameraTargetGoalRef.current;
      if (goal.active) {
        const lambda = 7.5;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          goal.pos.x,
          lambda,
          deltaSec,
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          goal.pos.y,
          lambda,
          deltaSec,
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          goal.pos.z,
          lambda,
          deltaSec,
        );
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          goal.target.x,
          lambda,
          deltaSec,
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          goal.target.y,
          lambda,
          deltaSec,
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          goal.target.z,
          lambda,
          deltaSec,
        );
        if (
          camera.position.distanceTo(goal.pos) < 0.01 &&
          controls.target.distanceTo(goal.target) < 0.01
        ) {
          camera.position.copy(goal.pos);
          controls.target.copy(goal.target);
          goal.active = false;
        }
      }

      controls.update();

      if (modeRef.current === 'bvh') {
        if (bvhMixerRef.current && bvhPlayingRef.current) {
          bvhMixerRef.current.update(deltaSec);
        }
      } else {
        onTickRef.current(nowMs, deltaSec);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost,
      );
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored,
      );
      controls.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      shadowTex.dispose();
      faceMesh3D.dispose();
      faceMesh3DRef.current = null;
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Mount / swap ActiveMixamoRig into scene
  useEffect(() => {
    const scene = sceneRef.current;
    const rigContainer = rigContainerRef.current;
    if (!scene || !rigContainer) return;

    rigContainer.clear();
    rigContainer.add(rig.rootObject);

    if (skeletonHelperRef.current) {
      scene.remove(skeletonHelperRef.current);
      skeletonHelperRef.current.dispose();
      skeletonHelperRef.current = null;
    }

    const helperTarget = rig.bones.Hips || rig.rootObject;
    const helper = new THREE.SkeletonHelper(helperTarget);
    const mat = helper.material as THREE.LineBasicMaterial;
    mat.color.setHex(0xf59e0b);
    mat.depthTest = false;
    mat.transparent = true;
    mat.opacity = 0.85;
    helper.renderOrder = 10;
    helper.visible = showSkeleton && mode !== 'bvh' && mode !== 'face';
    scene.add(helper);
    skeletonHelperRef.current = helper;

    return () => {
      if (skeletonHelperRef.current) {
        scene.remove(skeletonHelperRef.current);
        skeletonHelperRef.current.dispose();
        skeletonHelperRef.current = null;
      }
    };
  }, [rig]);

  // Keep Face Scene and Pose Scene cleanly separated
  useEffect(() => {
    const isFace = mode === 'face';
    const isBvh = mode === 'bvh';
    if (faceStageRef.current) {
      faceStageRef.current.visible = isFace;
    }
    if (rigContainerRef.current) {
      rigContainerRef.current.visible = !isFace && !isBvh;
    }
    if (bvhGroupRef.current) {
      bvhGroupRef.current.visible = isBvh;
    }
    if (skeletonHelperRef.current) {
      skeletonHelperRef.current.visible = showSkeleton && !isFace && !isBvh;
    }
    if (shadowPlaneRef.current) {
      shadowPlaneRef.current.visible = !isFace && !isBvh;
    }
    if (gridRef.current) {
      gridRef.current.visible = !isFace;
    }
    if (floorMeshRef.current) {
      floorMeshRef.current.visible = !isFace;
    }
    if (controlsRef.current) {
      controlsRef.current.maxPolarAngle = isFace
        ? Math.PI * 0.85
        : Math.PI * 0.495;
    }
  }, [rig, mode, showSkeleton]);

  // Parse BVH ASCII text with Three.js BVHLoader when in BVH Inspector mode
  useEffect(() => {
    const bvhContainer = bvhGroupRef.current;
    if (!bvhContainer) return;

    bvhContainer.clear();
    bvhMixerRef.current = null;

    if (mode !== 'bvh' || !bvhText.trim()) return;

    try {
      const loader = new BVHLoader();
      const result = loader.parse(bvhText);
      const skeletonRoot = result.skeleton.bones[0];
      const holder = new THREE.Group();
      // BVH exported in cm -> scale 0.01 to meters
      holder.scale.setScalar(0.01);
      holder.add(skeletonRoot);

      const helper = new THREE.SkeletonHelper(skeletonRoot);
      const mat = helper.material as THREE.LineBasicMaterial;
      mat.color.setHex(0x38bdf8);
      holder.add(helper);

      bvhContainer.add(holder);

      const mixer = new THREE.AnimationMixer(skeletonRoot);
      const action = mixer.clipAction(result.clip);
      action.play();
      bvhMixerRef.current = mixer;
    } catch {
      // Malformed BVH safely ignored
    }
  }, [mode, bvhText]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D11]/95 z-30">
          <div className="px-6 py-4 rounded-xl bg-[#131720] border border-[#252C3B] text-center max-w-sm">
            <p className="text-sm font-semibold text-[#F3F5F8]">
              WebGL Context Paused
            </p>
            <p className="text-xs text-[#8B94A5] mt-1">
              Restoring 3D Mixamo viewport resources automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
