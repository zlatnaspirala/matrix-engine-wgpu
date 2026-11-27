import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BlockingVolume,
  CameraPreset,
  DrawMode,
  GizmoMode,
  PlacementConfig,
  SnapStep,
  Vec3,
  VolumeTransform,
} from '../types/volume';
import {
  CATEGORY_META,
  clamp01,
  computeFacePlacementPosition,
  computeGroundPlacementPosition,
  DEFAULT_AMBIENT_COLOR,
  DEFAULT_BLEND_ALPHA,
  DEFAULT_PHYSICS,
  getPlacementCellKey,
  resolveAssetPathsOnCategoryChange,
  roundVec3,
} from '../utils/snap';

interface Viewport3DProps {
  volumes: BlockingVolume[];
  selectedId: string | null;
  placementConfig: PlacementConfig;
  drawMode: DrawMode;
  gizmoMode: GizmoMode;
  snapStep: SnapStep;
  showGrid: boolean;
  cameraPresetRequest: { preset: CameraPreset; seq: number } | null;
  hoverDrawPaused: boolean;
  onSelectVolume: (id: string | null) => void;
  onPlaceBatch: (newVolumes: Omit<BlockingVolume, 'id' | 'name'>[], label?: string) => void;
  onDeleteVolume: (id: string) => void;
  onLiveTransform: (id: string, transform: VolumeTransform) => void;
  onCommitTransform: (id: string, before: VolumeTransform, after: VolumeTransform) => void;
}

const _vec3 = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _normalMat = new THREE.Matrix3();
const _targetCamPos = new THREE.Vector3();
const _targetCtrlPos = new THREE.Vector3();
const _baseColor = new THREE.Color();

function applyVolumeMaterialColor(
  target: THREE.Color,
  baseHex: string,
  ambientColor?: Vec3
) {
  _baseColor.set(baseHex);
  if (!ambientColor) {
    target.copy(_baseColor);
    return;
  }
  const mr = THREE.MathUtils.clamp(ambientColor[0] * 2, 0.08, 2);
  const mg = THREE.MathUtils.clamp(ambientColor[1] * 2, 0.08, 2);
  const mb = THREE.MathUtils.clamp(ambientColor[2] * 2, 0.08, 2);
  target.setRGB(
    Math.min(1, _baseColor.r * mr),
    Math.min(1, _baseColor.g * mg),
    Math.min(1, _baseColor.b * mb)
  );
}

function buildVolumeItemFromConfig(
  cfg: PlacementConfig,
  position: Vec3
): Omit<BlockingVolume, 'id' | 'name'> {
  const resolved = resolveAssetPathsOnCategoryChange(
    cfg.category,
    cfg.filePath ?? '',
    cfg.texPath ?? ''
  );
  return {
    category: cfg.category,
    position,
    rotation: [...cfg.rotation],
    scale: [...cfg.scale],
    ambientColor: [...(cfg.ambientColor ?? DEFAULT_AMBIENT_COLOR)],
    isBlend: Boolean(cfg.isBlend),
    blendAlpha: clamp01(cfg.blendAlpha ?? DEFAULT_BLEND_ALPHA),
    filePath: resolved.filePath,
    texPath: resolved.texPath,
    physics: { ...(cfg.physics ?? DEFAULT_PHYSICS) },
  };
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  volumes,
  selectedId,
  placementConfig,
  drawMode,
  gizmoMode,
  snapStep,
  showGrid,
  cameraPresetRequest,
  hoverDrawPaused,
  onSelectVolume,
  onPlaceBatch,
  onDeleteVolume,
  onLiveTransform,
  onCommitTransform,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  // Refs for latest props so WebGL lifecycle stays mounted once
  const volumesRef = useRef(volumes);
  volumesRef.current = volumes;

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const configRef = useRef(placementConfig);
  configRef.current = placementConfig;

  const drawModeRef = useRef(drawMode);
  drawModeRef.current = drawMode;

  const gizmoModeRef = useRef(gizmoMode);
  gizmoModeRef.current = gizmoMode;

  const snapStepRef = useRef(snapStep);
  snapStepRef.current = snapStep;

  const showGridRef = useRef(showGrid);
  showGridRef.current = showGrid;

  const hoverPausedRef = useRef(hoverDrawPaused);
  hoverPausedRef.current = hoverDrawPaused;

  const callbacksRef = useRef({
    onSelectVolume,
    onPlaceBatch,
    onDeleteVolume,
    onLiveTransform,
    onCommitTransform,
  });
  callbacksRef.current = {
    onSelectVolume,
    onPlaceBatch,
    onDeleteVolume,
    onLiveTransform,
    onCommitTransform,
  };

  // Bridge hooks exposed from effect
  const sceneSyncRef = useRef<{
    syncVolumes: () => void;
    updateGrid: () => void;
    updateModeControls: () => void;
    updateGhost: () => void;
    animateToPreset: (preset: CameraPreset) => void;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0e1015');
    scene.fog = new THREE.FogExp2('#0e1015', 0.0022);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.25, 1000);
    camera.position.set(74, 58, 86);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Studio environment map for crisp PBR shading
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Three-point studio lighting rig
    const hemiLight = new THREE.HemisphereLight('#9dbce0', '#181c24', 0.85);
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#fff3e2', 1.85);
    keyLight.position.set(60, 95, 55);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 4;
    keyLight.shadow.camera.far = 260;
    const d = 92;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#7db3ff', 0.65);
    rimLight.position.set(-55, 42, -55);
    scene.add(rimLight);

    // OrbitControls
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = !isSoftwareGl;
    orbitControls.dampingFactor = 0.08;
    orbitControls.maxPolarAngle = Math.PI * 0.495;
    orbitControls.minDistance = 4;
    orbitControls.maxDistance = 360;
    orbitControls.target.set(0, 2, 0);

    // TransformControls
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setSize(0.85);
    const gizmoHelper = transformControls.getHelper();
    scene.add(gizmoHelper);

    // Ground plane (Y = 0)
    const groundGeo = new THREE.PlaneGeometry(520, 520);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#131720',
      roughness: 0.92,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundMesh.name = 'ground-plane';
    scene.add(groundMesh);

    // Grid group (rebuilt cleanly when snapStep changes)
    const gridGroup = new THREE.Group();
    scene.add(gridGroup);

    // Subtle origin axis lines & -1..1 unit reference frame at origin
    const axisGroup = new THREE.Group();
    const createAxisLine = (a: THREE.Vector3, b: THREE.Vector3, color: string) => {
      const g = new THREE.BufferGeometry().setFromPoints([a, b]);
      const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.72 });
      return new THREE.Line(g, m);
    };
    axisGroup.add(createAxisLine(new THREE.Vector3(-120, 0.01, 0), new THREE.Vector3(120, 0.01, 0), '#ef4444'));
    axisGroup.add(createAxisLine(new THREE.Vector3(0, 0.01, -120), new THREE.Vector3(0, 0.01, 120), '#3b82f6'));
    axisGroup.add(createAxisLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 8, 0), '#22c55e'));
    scene.add(axisGroup);

    // Natural unit cube geometry: -1 to +1 on all 3 axes (2x2x2 world units at scale 1,1,1)
    const unitCubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const unitEdgesGeo = new THREE.EdgesGeometry(unitCubeGeo);

    // Ghost preview mesh for upcoming cube placement
    const ghostGroup = new THREE.Group();
    const ghostMat = new THREE.MeshStandardMaterial({
      color: '#00ff00',
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const ghostMesh = new THREE.Mesh(unitCubeGeo, ghostMat);
    const ghostEdgeMat = new THREE.LineBasicMaterial({
      color: '#00ff00',
      transparent: true,
      opacity: 0.92,
    });
    const ghostEdges = new THREE.LineSegments(unitEdgesGeo, ghostEdgeMat);
    ghostGroup.add(ghostMesh, ghostEdges);
    ghostGroup.visible = false;
    scene.add(ghostGroup);

    // Placed volumes container & mesh map
    const volumesGroup = new THREE.Group();
    scene.add(volumesGroup);
    const volumeMeshes = new Map<
      string,
      {
        mesh: THREE.Mesh;
        edges: THREE.LineSegments;
        mat: THREE.MeshStandardMaterial;
        edgeMat: THREE.LineBasicMaterial;
      }
    >();

    // Render on demand + software WebGL pacing
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    // Camera transition state
    let camTransitionActive = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
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

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        renderDirty = false;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (camTransitionActive) {
          const lambda = 10;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, lambda, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, lambda, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, lambda, dt);

          orbitControls.target.x = THREE.MathUtils.damp(orbitControls.target.x, _targetCtrlPos.x, lambda, dt);
          orbitControls.target.y = THREE.MathUtils.damp(orbitControls.target.y, _targetCtrlPos.y, lambda, dt);
          orbitControls.target.z = THREE.MathUtils.damp(orbitControls.target.z, _targetCtrlPos.z, lambda, dt);

          const distPos = camera.position.distanceTo(_targetCamPos);
          const distTgt = orbitControls.target.distanceTo(_targetCtrlPos);
          if (distPos < 0.02 && distTgt < 0.02) {
            camera.position.copy(_targetCamPos);
            orbitControls.target.copy(_targetCtrlPos);
            camTransitionActive = false;
          } else {
            renderDirty = true;
          }
        }

        const needsMoreDamping = orbitControls.update();
        if (needsMoreDamping && orbitControls.enableDamping) {
          // OrbitControls fires 'change' when damping moves camera
        }

        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    orbitControls.addEventListener('change', requestRender);
    orbitControls.addEventListener('start', () => {
      camTransitionActive = false;
    });

    // Grid builder
    function updateGrid() {
      while (gridGroup.children.length > 0) {
        const child = gridGroup.children[0] as THREE.GridHelper;
        gridGroup.remove(child);
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }

      const visible = showGridRef.current;
      gridGroup.visible = visible;
      axisGroup.visible = visible;
      if (!visible) {
        requestRender();
        return;
      }

      const step = snapStepRef.current;
      const gridSize = 220;

      // Major grid every 4 units across the full 220x220 arena floor
      const majorDivs = gridSize / 4;
      const majorGrid = new THREE.GridHelper(gridSize, majorDivs, '#3c485e', '#2a3344');
      majorGrid.position.y = 0.004;
      const majorMat = majorGrid.material as THREE.Material;
      majorMat.polygonOffset = true;
      majorMat.polygonOffsetFactor = -1;
      majorMat.polygonOffsetUnits = -1;
      gridGroup.add(majorGrid);

      // Fine snap grid centered over the inner 120x120 zone when snapStep is finer
      if (step > 0 && step < 4) {
        const fineSpan = step <= 0.5 ? 64 : 160;
        const minorDivs = Math.min(Math.round(fineSpan / step), 160);
        const minorGrid = new THREE.GridHelper(fineSpan, minorDivs, '#202736', '#191f2b');
        minorGrid.position.y = 0.002;
        const minorMat = minorGrid.material as THREE.Material;
        minorMat.transparent = true;
        minorMat.opacity = 0.65;
        minorMat.polygonOffset = true;
        minorMat.polygonOffsetFactor = -1;
        minorMat.polygonOffsetUnits = -1;
        gridGroup.add(minorGrid);
      }

      requestRender();
    }

    // Sync React volumes to Three.js scene
    function syncVolumes() {
      const list = volumesRef.current;
      const nextIds = new Set(list.map((v) => v.id));
      const activeSelectedId = selectedIdRef.current;
      const activeMode = drawModeRef.current;

      // Remove deleted meshes
      for (const [id, entry] of volumeMeshes.entries()) {
        if (!nextIds.has(id)) {
          if (transformControls.object === entry.mesh) {
            transformControls.detach();
          }
          volumesGroup.remove(entry.mesh);
          entry.mat.dispose();
          entry.edgeMat.dispose();
          volumeMeshes.delete(id);
        }
      }

      // Add or update existing meshes
      for (const vol of list) {
        const meta = CATEGORY_META[vol.category] ?? CATEGORY_META.solid;
        const isSelected = vol.id === activeSelectedId;
        const opacity = vol.isBlend ? clamp01(vol.blendAlpha ?? DEFAULT_BLEND_ALPHA) : meta.opacity;
        const isTransparent = Boolean(vol.isBlend) || opacity < 0.999;

        let entry = volumeMeshes.get(vol.id);
        if (!entry) {
          const mat = new THREE.MeshStandardMaterial({
            color: meta.colorHex,
            roughness: 0.42,
            metalness: 0.14,
            transparent: isTransparent,
            opacity,
            depthWrite: !isTransparent,
          });
          const mesh = new THREE.Mesh(unitCubeGeo, mat);
          mesh.castShadow = !isSoftwareGl;
          mesh.receiveShadow = true;
          mesh.userData.volumeId = vol.id;

          const edgeMat = new THREE.LineBasicMaterial({
            color: meta.edgeHex,
            transparent: true,
            opacity: 0.7,
          });
          const edges = new THREE.LineSegments(unitEdgesGeo, edgeMat);
          mesh.add(edges);
          volumesGroup.add(mesh);

          entry = { mesh, edges, mat, edgeMat };
          volumeMeshes.set(vol.id, entry);
        }

        const { mesh, mat, edgeMat } = entry;
        mesh.position.set(vol.position[0], vol.position[1], vol.position[2]);
        mesh.rotation.set(
          THREE.MathUtils.degToRad(vol.rotation[0]),
          THREE.MathUtils.degToRad(vol.rotation[1]),
          THREE.MathUtils.degToRad(vol.rotation[2]),
          'XYZ'
        );
        mesh.scale.set(vol.scale[0], vol.scale[1], vol.scale[2]);

        applyVolumeMaterialColor(mat.color, meta.colorHex, vol.ambientColor);
        mat.transparent = isTransparent;
        mat.opacity = opacity;
        mat.depthWrite = !isTransparent;
        mat.emissive.set(isSelected ? '#00ff00' : '#000000');
        mat.emissiveIntensity = isSelected ? 0.3 : 0;

        edgeMat.color.set(isSelected ? '#00ff00' : meta.edgeHex);
        edgeMat.opacity = isSelected ? 1 : 0.7;
      }

      // Attach or detach gizmo
      if (activeMode === 'select' && activeSelectedId) {
        const selEntry = volumeMeshes.get(activeSelectedId);
        if (selEntry) {
          if (transformControls.object !== selEntry.mesh) {
            transformControls.attach(selEntry.mesh);
          }
        } else {
          transformControls.detach();
        }
      } else {
        transformControls.detach();
      }

      requestRender();
    }

    // TransformControls undo/redo integration
    let dragBeforeTransform: VolumeTransform | null = null;
    let isGizmoDragging = false;
    let lastGizmoDragEndTime = 0;

    const readMeshTransform = (mesh: THREE.Object3D): VolumeTransform => ({
      position: roundVec3([mesh.position.x, mesh.position.y, mesh.position.z], 3),
      rotation: roundVec3(
        [
          THREE.MathUtils.radToDeg(mesh.rotation.x),
          THREE.MathUtils.radToDeg(mesh.rotation.y),
          THREE.MathUtils.radToDeg(mesh.rotation.z),
        ],
        2
      ),
      scale: roundVec3(
        [
          Math.max(0.05, mesh.scale.x),
          Math.max(0.05, mesh.scale.y),
          Math.max(0.05, mesh.scale.z),
        ],
        3
      ),
    });

    transformControls.addEventListener('dragging-changed', (event) => {
      const dragging = Boolean(event.value);
      isGizmoDragging = dragging;
      if (!dragging) {
        lastGizmoDragEndTime = performance.now();
      }
      orbitControls.enabled = !dragging;
      const obj = transformControls.object;
      const volId = obj?.userData?.volumeId as string | undefined;

      if (dragging && obj && volId) {
        const current = volumesRef.current.find((v) => v.id === volId);
        dragBeforeTransform = current
          ? {
              position: [...current.position],
              rotation: [...current.rotation],
              scale: [...current.scale],
            }
          : readMeshTransform(obj);
      } else if (!dragging && obj && volId && dragBeforeTransform) {
        const after = readMeshTransform(obj);
        // Clamp scale >= 0.05 on mesh
        obj.scale.set(after.scale[0], after.scale[1], after.scale[2]);
        const changed =
          dragBeforeTransform.position.some((v, i) => v !== after.position[i]) ||
          dragBeforeTransform.rotation.some((v, i) => v !== after.rotation[i]) ||
          dragBeforeTransform.scale.some((v, i) => v !== after.scale[i]);
        if (changed) {
          callbacksRef.current.onCommitTransform(volId, dragBeforeTransform, after);
        }
        dragBeforeTransform = null;
      }
      requestRender();
    });

    transformControls.addEventListener('objectChange', () => {
      const obj = transformControls.object;
      const volId = obj?.userData?.volumeId as string | undefined;
      if (isGizmoDragging && obj && volId) {
        const live = readMeshTransform(obj);
        callbacksRef.current.onLiveTransform(volId, live);
      }
      requestRender();
    });

    function updateModeControls() {
      const mode = drawModeRef.current;
      const gizmo = gizmoModeRef.current;
      const step = snapStepRef.current;

      transformControls.setMode(gizmo);
      if (step > 0) {
        transformControls.setTranslationSnap(step);
        transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
        transformControls.setScaleSnap(Math.min(step, 0.5));
      } else {
        transformControls.setTranslationSnap(null);
        transformControls.setRotationSnap(null);
        transformControls.setScaleSnap(null);
      }

      if (mode === 'drag') {
        // Left mouse / 1-finger touch paints continuously; right-drag / 2-finger orbits & zooms
        orbitControls.mouseButtons = {
          LEFT: null as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.ROTATE,
        };
        orbitControls.touches = {
          ONE: null as unknown as THREE.TOUCH,
          TWO: THREE.TOUCH.DOLLY_PAN,
        };
      } else {
        orbitControls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        };
        orbitControls.touches = {
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        };
      }

      if (mode === 'select' && selectedIdRef.current) {
        const selEntry = volumeMeshes.get(selectedIdRef.current);
        if (selEntry) transformControls.attach(selEntry.mesh);
      } else {
        transformControls.detach();
      }

      updateGhost();
      requestRender();
    }

    // Raycasting & placement preview
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerInside = false;
    let lastHoverTargetPos: Vec3 | null = null;
    let lastHoverTargetVolId: string | null = null;
    let isDrawingDrag = false;
    let strokePlane: THREE.Plane | null = null;
    let strokePendingVolumes: Omit<BlockingVolume, 'id' | 'name'>[] = [];
    const strokeCellKeys = new Set<string>();
    let pointerDownScreen = { x: 0, y: 0 };
    let lastMoveStamp = 0;

    function updateGhostAppearance() {
      const cfg = configRef.current;
      const meta = CATEGORY_META[cfg.category] ?? CATEGORY_META.solid;
      applyVolumeMaterialColor(ghostMat.color, meta.colorHex, cfg.ambientColor);
      ghostMat.opacity = cfg.isBlend
        ? Math.max(0.16, Math.min(0.65, clamp01(cfg.blendAlpha) * 0.75))
        : 0.34;
      ghostEdgeMat.color.set(meta.edgeHex);
      ghostMesh.rotation.set(
        THREE.MathUtils.degToRad(cfg.rotation[0]),
        THREE.MathUtils.degToRad(cfg.rotation[1]),
        THREE.MathUtils.degToRad(cfg.rotation[2]),
        'XYZ'
      );
      ghostMesh.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      ghostEdges.rotation.copy(ghostMesh.rotation);
      ghostEdges.scale.copy(ghostMesh.scale);
    }

    function updateGhost() {
      const mode = drawModeRef.current;
      updateGhostAppearance();
      const canShowPlaceGhost =
        pointerInside &&
        !isGizmoDragging &&
        (mode === 'click' || mode === 'drag' || (mode === 'hover' && !hoverPausedRef.current));

      if (!canShowPlaceGhost || !lastHoverTargetPos) {
        ghostGroup.visible = false;
      } else {
        ghostGroup.visible = true;
        ghostGroup.position.set(
          lastHoverTargetPos[0],
          lastHoverTargetPos[1],
          lastHoverTargetPos[2]
        );
      }

      // Highlight hovered volume in erase mode
      for (const [id, entry] of volumeMeshes.entries()) {
        if (mode === 'erase' && id === lastHoverTargetVolId) {
          entry.mat.emissive.set('#ef4444');
          entry.mat.emissiveIntensity = 0.45;
          entry.edgeMat.color.set('#fca5a5');
        } else if (id !== selectedIdRef.current) {
          const vol = volumesRef.current.find((v) => v.id === id);
          if (vol) {
            const meta = CATEGORY_META[vol.category];
            entry.mat.emissive.set('#000000');
            entry.mat.emissiveIntensity = 0;
            entry.edgeMat.color.set(meta.edgeHex);
          }
        }
      }
      requestRender();
    }

    function computeRaycastTarget(
      clientX: number,
      clientY: number,
      planeOverride: THREE.Plane | null = null
    ): { placementPos: Vec3 | null; hitVolumeId: string | null; hitYPlane: number | null } {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const mode = drawModeRef.current;
      const cfg = configRef.current;
      const step = snapStepRef.current;

      // In stroke plane-lock mode (drag / hover paint), intersect the locked horizontal plane
      if (planeOverride) {
        const hitPt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(planeOverride, hitPt)) {
          const sx = step > 0 ? Math.round(hitPt.x / step) * step : hitPt.x;
          const sz = step > 0 ? Math.round(hitPt.z / step) * step : hitPt.z;
          const pos = computeGroundPlacementPosition(
            _vec3.set(sx, 0, sz),
            cfg,
            step
          );
          // Adjust Y to the locked plane height if plane wasn't Y=0
          const planeY = -planeOverride.constant;
          pos[1] = Number((pos[1] + planeY).toFixed(3));
          return { placementPos: pos, hitVolumeId: null, hitYPlane: planeY };
        }
        return { placementPos: null, hitVolumeId: null, hitYPlane: null };
      }

      const meshTargets: THREE.Object3D[] = [];
      for (const entry of volumeMeshes.values()) {
        meshTargets.push(entry.mesh);
      }

      if (mode === 'select' || mode === 'erase') {
        const hits = raycaster.intersectObjects(meshTargets, false);
        if (hits.length > 0) {
          const volId = hits[0].object.userData.volumeId as string;
          return { placementPos: null, hitVolumeId: volId, hitYPlane: null };
        }
        return { placementPos: null, hitVolumeId: null, hitYPlane: null };
      }

      // Placement modes: raycast cubes + ground plane
      const targets = [...meshTargets, groundMesh];
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length === 0) {
        return { placementPos: null, hitVolumeId: null, hitYPlane: null };
      }

      const first = hits[0];
      if (first.object === groundMesh) {
        const pos = computeGroundPlacementPosition(first.point, cfg, step);
        return { placementPos: pos, hitVolumeId: null, hitYPlane: 0 };
      }

      const hitVolId = first.object.userData.volumeId as string;
      const hitVol = volumesRef.current.find((v) => v.id === hitVolId);
      if (!hitVol || !first.face) {
        return { placementPos: null, hitVolumeId: hitVolId, hitYPlane: null };
      }

      // Convert local face normal to world normal
      _normalMat.getNormalMatrix(first.object.matrixWorld);
      _normal.copy(first.face.normal).applyMatrix3(_normalMat).normalize();

      const pos = computeFacePlacementPosition(hitVol, _normal, cfg, step);
      return { placementPos: pos, hitVolumeId: hitVolId, hitYPlane: null };
    }

    function tryAddToStroke(pos: Vec3) {
      const cfg = configRef.current;
      const key = getPlacementCellKey(pos, cfg.scale, cfg.rotation);
      if (strokeCellKeys.has(key)) return;

      // Also check existing scene cubes to avoid exact overlap on move draw
      const alreadyExists = volumesRef.current.some(
        (v) => getPlacementCellKey(v.position, v.scale, v.rotation) === key
      );
      if (alreadyExists) {
        strokeCellKeys.add(key);
        return;
      }

      strokeCellKeys.add(key);
      const item = buildVolumeItemFromConfig(cfg, pos);

      if (drawModeRef.current === 'drag') {
        // Group drag stroke into a single undoable batch on pointerup, while placing live!
        strokePendingVolumes.push(item);
        // Immediate visual placement for responsive drawing
        callbacksRef.current.onPlaceBatch([item], '__LIVE_STROKE_CHUNK__');
      } else {
        // Hover move draw places immediately as single undoable step (or small batch)
        callbacksRef.current.onPlaceBatch([item], 'Move Draw Block');
      }
    }

    // Track continuous drag stroke for single clean Undo entry!
    // Actually, even simpler: in `drag` mode, we show a temporary preview mesh group during the drag,
    // and commit the entire stroke in one `onPlaceBatch` call on pointerup! That way Undo/Redo stays 100% atomic!
    const dragStrokePreviewGroup = new THREE.Group();
    scene.add(dragStrokePreviewGroup);

    function clearDragStrokePreviews() {
      while (dragStrokePreviewGroup.children.length > 0) {
        const child = dragStrokePreviewGroup.children[0] as THREE.Mesh;
        dragStrokePreviewGroup.remove(child);
        if (child.material) {
          (child.material as THREE.Material).dispose();
        }
      }
    }

    function addDragStrokePreviewMesh(item: Omit<BlockingVolume, 'id' | 'name'>) {
      const meta = CATEGORY_META[item.category] ?? CATEGORY_META.solid;
      const mat = new THREE.MeshStandardMaterial({
        color: meta.colorHex,
        roughness: 0.42,
        metalness: 0.14,
        transparent: true,
        opacity: item.isBlend ? Math.max(0.16, clamp01(item.blendAlpha)) : 0.85,
      });
      applyVolumeMaterialColor(mat.color, meta.colorHex, item.ambientColor);
      const mesh = new THREE.Mesh(unitCubeGeo, mat);
      mesh.position.set(item.position[0], item.position[1], item.position[2]);
      mesh.rotation.set(
        THREE.MathUtils.degToRad(item.rotation[0]),
        THREE.MathUtils.degToRad(item.rotation[1]),
        THREE.MathUtils.degToRad(item.rotation[2]),
        'XYZ'
      );
      mesh.scale.set(item.scale[0], item.scale[1], item.scale[2]);
      const edgeMat = new THREE.LineBasicMaterial({ color: '#00ff00' });
      const edges = new THREE.LineSegments(unitEdgesGeo, edgeMat);
      mesh.add(edges);
      dragStrokePreviewGroup.add(mesh);
      requestRender();
    }

    const onPointerEnter = () => {
      pointerInside = true;
    };

    const onPointerLeave = () => {
      pointerInside = false;
      lastHoverTargetPos = null;
      lastHoverTargetVolId = null;
      updateGhost();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isGizmoDragging) return;
      pointerDownScreen = { x: e.clientX, y: e.clientY };

      if (e.button === 0 && drawModeRef.current === 'drag') {
        isDrawingDrag = true;
        strokePendingVolumes = [];
        strokeCellKeys.clear();
        clearDragStrokePreviews();

        const res = computeRaycastTarget(e.clientX, e.clientY, null);
        // Lock drag stroke to the ground plane (or horizontal plane of hit) so drag paints cleanly!
        const hitY = res.hitYPlane !== null ? res.hitYPlane : 0;
        strokePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -hitY);

        if (res.placementPos) {
          const cfg = configRef.current;
          const key = getPlacementCellKey(res.placementPos, cfg.scale, cfg.rotation);
          const alreadyExists = volumesRef.current.some(
            (v) => getPlacementCellKey(v.position, v.scale, v.rotation) === key
          );
          if (!alreadyExists) {
            strokeCellKeys.add(key);
            const item = buildVolumeItemFromConfig(cfg, res.placementPos);
            strokePendingVolumes.push(item);
            addDragStrokePreviewMesh(item);
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveStamp < 18) return;
      lastMoveStamp = now;

      pointerInside = true;
      if (isGizmoDragging) return;

      const mode = drawModeRef.current;
      const activePlane = isDrawingDrag && mode === 'drag' ? strokePlane : null;
      const res = computeRaycastTarget(e.clientX, e.clientY, activePlane);
      lastHoverTargetPos = res.placementPos;
      lastHoverTargetVolId = res.hitVolumeId;
      updateGhost();

      // Drag Draw (Left button held)
      if (isDrawingDrag && mode === 'drag' && res.placementPos) {
        const cfg = configRef.current;
        const key = getPlacementCellKey(res.placementPos, cfg.scale, cfg.rotation);
        if (!strokeCellKeys.has(key)) {
          const alreadyExists = volumesRef.current.some(
            (v) => getPlacementCellKey(v.position, v.scale, v.rotation) === key
          );
          strokeCellKeys.add(key);
          if (!alreadyExists) {
            const item = buildVolumeItemFromConfig(cfg, res.placementPos);
            strokePendingVolumes.push(item);
            addDragStrokePreviewMesh(item);
          }
        }
      }

      // Free Hover Move Draw (no mouse button held, not paused, not orbiting)
      if (
        mode === 'hover' &&
        !hoverPausedRef.current &&
        e.buttons === 0
      ) {
        // Lock to ground plane (Y=0) for predictable mouse-move painting
        const groundPlaneOnly = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const groundRes = computeRaycastTarget(e.clientX, e.clientY, groundPlaneOnly);
        if (groundRes.placementPos) {
          lastHoverTargetPos = groundRes.placementPos;
          updateGhost();
          tryAddToStroke(groundRes.placementPos);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;

      if (isDrawingDrag) {
        isDrawingDrag = false;
        strokePlane = null;
        clearDragStrokePreviews();
        if (strokePendingVolumes.length > 0) {
          const count = strokePendingVolumes.length;
          callbacksRef.current.onPlaceBatch(
            strokePendingVolumes,
            count === 1 ? 'Place Block' : `Draw ${count} Blocks`
          );
          strokePendingVolumes = [];
        }
        strokeCellKeys.clear();
        return;
      }

      if (
        isGizmoDragging ||
        transformControls.axis !== null ||
        performance.now() - lastGizmoDragEndTime < 80
      ) {
        return;
      }

      const dx = e.clientX - pointerDownScreen.x;
      const dy = e.clientY - pointerDownScreen.y;
      const movedPx = Math.hypot(dx, dy);
      const tapThreshold = e.pointerType === 'touch' ? 12 : 5;
      if (movedPx > tapThreshold) return; // Ignore orbit drags

      const mode = drawModeRef.current;
      const res = computeRaycastTarget(e.clientX, e.clientY, null);

      if (mode === 'click') {
        if (e.shiftKey && res.hitVolumeId) {
          callbacksRef.current.onDeleteVolume(res.hitVolumeId);
          return;
        }
        if (res.placementPos) {
          const cfg = configRef.current;
          callbacksRef.current.onPlaceBatch(
            [buildVolumeItemFromConfig(cfg, res.placementPos)],
            'Place Block'
          );
        }
      } else if (mode === 'select') {
        callbacksRef.current.onSelectVolume(res.hitVolumeId);
      } else if (mode === 'erase') {
        if (res.hitVolumeId) {
          callbacksRef.current.onDeleteVolume(res.hitVolumeId);
        }
      }
    };

    const el = renderer.domElement;
    el.addEventListener('pointerenter', onPointerEnter);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    function animateToPreset(preset: CameraPreset) {
      _targetCtrlPos.set(0, 2, 0);
      if (preset === 'perspective') {
        _targetCamPos.set(74, 58, 86);
      } else if (preset === 'top') {
        _targetCamPos.set(0, 155, 0.01);
        _targetCtrlPos.set(0, 0, 0);
      } else if (preset === 'front') {
        _targetCamPos.set(0, 32, 118);
      } else if (preset === 'iso') {
        _targetCamPos.set(-86, 68, 86);
      }
      camTransitionActive = true;
      lastTime = performance.now();
      requestRender();
    }

    sceneSyncRef.current = {
      syncVolumes,
      updateGrid,
      updateModeControls,
      updateGhost,
      animateToPreset,
    };

    updateGrid();
    syncVolumes();
    updateModeControls();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerenter', onPointerEnter);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('webglcontextlost', handleContextLost);
      el.removeEventListener('webglcontextrestored', handleContextRestored);

      transformControls.dispose();
      orbitControls.dispose();
      unitCubeGeo.dispose();
      unitEdgesGeo.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      ghostMat.dispose();
      ghostEdgeMat.dispose();
      envTarget.dispose();

      for (const entry of volumeMeshes.values()) {
        entry.mat.dispose();
        entry.edgeMat.dispose();
      }
      volumeMeshes.clear();

      renderer.dispose();
      if (el.parentNode === container) {
        container.removeChild(el);
      }
    };
  }, []);

  // Sync volumes & selection
  useEffect(() => {
    sceneSyncRef.current?.syncVolumes();
  }, [volumes, selectedId]);

  // Sync grid & snap
  useEffect(() => {
    sceneSyncRef.current?.updateGrid();
    sceneSyncRef.current?.updateModeControls();
  }, [snapStep, showGrid]);

  // Sync draw mode & gizmo mode
  useEffect(() => {
    sceneSyncRef.current?.updateModeControls();
  }, [drawMode, gizmoMode, hoverDrawPaused]);

  // Sync ghost preview when placement config changes
  useEffect(() => {
    sceneSyncRef.current?.updateGhost();
  }, [placementConfig]);

  // Trigger camera presets
  useEffect(() => {
    if (cameraPresetRequest) {
      sceneSyncRef.current?.animateToPreset(cameraPresetRequest.preset);
    }
  }, [cameraPresetRequest]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0e1015]">
      <div
        ref={mountRef}
        className="w-full h-full cursor-crosshair"
        aria-label="3D Blocking Volume Viewport"
      />
      {contextLost && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0e1015]/95 text-center p-6">
          <p className="text-base font-semibold text-slate-100">
            WebGL rendering context was interrupted
          </p>
          <p className="mt-1 text-sm text-slate-400 max-w-md">
            Your browser temporarily suspended GPU resources. Restore or reload the page to resume editing.
          </p>
        </div>
      )}
    </div>
  );
};
