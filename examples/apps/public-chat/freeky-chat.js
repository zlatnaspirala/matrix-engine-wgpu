import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsListener} from "../../../src/engine/raycast.js";
import {MeshMorpher} from "../../../src/engine/procedural-mesh.js";
import {PVector} from "../../../src/engine/matrix-class.js";
import {activateNet2} from "../../../src/engine/networking/net.js";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";

export var loadFreekyChat = function() {

  let MYCUBE;
  let PLANE;
  let loadedMeshes = null;
  const remoteVideoCubes = new Map();
  const pendingRemoteStreams = new Map();
  const creatingRemoteVideoCubes = new Set();
  let localVideoCube = null;
  let pendingLocalStream = null;
  let creatingLocalVideoCube = false;

  // Native WebRTC owns exactly one DOM video element per remote stream.
  // The example only consumes that element for the engine's video texture.
  const addRemoteVideoCube = async (peerId, stream, video, trackId) => {
    if(!loadedMeshes?.cube || !freekyChat) {
      pendingRemoteStreams.set(peerId, {stream, video, trackId});
      return;
    }
    if(!video) {
      console.warn('[public-chat] streamPlaying did not provide its engine video element:', peerId);
      return;
    }

    const existing = remoteVideoCubes.get(peerId);
    if(existing) {
      if(existing.video !== video) {
        existing.video = video;
        existing.stream = stream;
        await existing.object.loadVideoTexture({type: 'videoElement', videoElement: video});
      }
      return;
    }
    if(creatingRemoteVideoCubes.has(peerId)) return;
    creatingRemoteVideoCubes.add(peerId);

    const videoTrackId = trackId || stream.getVideoTracks?.()[0]?.id || peerId;
    const safePeerId = String(peerId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const index = remoteVideoCubes.size;
    const object = freekyChat.addMeshObj({
      material: {type: 'standard'},
      position: {x: (index - 0.5) * 9, y: 8, z: -10},
      rotation: {x: 0, y: 0, z: 90},
      rotationSpeed: {x: 0, y: 0, z: 0},
      scale: [2, 2, 2],
      texturesPaths: ['./res/textures/cube-g1-extra_low.png'],
      name: 'remote-video-' + safePeerId,
      mesh: loadedMeshes.cube,
      physics: {enabled: true, geometry: "Cube"},
      raycast: {enabled: true, radius: 1}
    });

    try {
      await object.loadVideoTexture({type: 'videoElement', videoElement: video});
      remoteVideoCubes.set(peerId, {object, video, stream});
      console.log('[public-chat] remote video cube created:', peerId, object.name);
    } catch(error) {
      console.error('[public-chat] video texture initialization failed:', peerId, error);
      throw error;
    } finally {
      creatingRemoteVideoCubes.delete(peerId);
    }

    object.position.netObject = object.name;

    object.position.remoteName = 'local-video-' + safePeerId;

  };

  const addLocalVideoCube = async (stream, video, trackId, connectionId) => {
    if(!loadedMeshes?.cube || !freekyChat) {
      pendingLocalStream = {stream, video, trackId, connectionId};
      return;
    }
    if(!video) {
      console.warn('[public-chat] local stream did not provide its engine video element');
      return;
    }
    if(localVideoCube) {
      if(localVideoCube.video !== video) {
        localVideoCube.video = video;
        localVideoCube.stream = stream;
        await localVideoCube.object.loadVideoTexture({type: 'videoElement', videoElement: video});
      }
      return;
    }
    if(creatingLocalVideoCube) return;
    creatingLocalVideoCube = true;
    const videoTrackId = trackId || stream.getVideoTracks?.()[0]?.id || 'local';
    const localConnectionId = connectionId || freekyChat.net?.connection?.connectionId || 'local';
    const safeConnectionId = String(localConnectionId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const object = freekyChat.addMeshObj({
      material: {type: 'standard'},
      position: {x: 0, y: 8, z: -10},
      rotation: {x: 0, y: 0, z: 90},
      rotationSpeed: {x: 0, y: 0, z: 0},
      scale: [2, 2, 2],
      texturesPaths: ['./res/textures/cube-g1-extra_low.png'],
      name: 'local-video-' + safeConnectionId,
      mesh: loadedMeshes.cube,
      physics: {enabled: true, geometry: 'Cube'},
      raycast: {enabled: true, radius: 1}
    });
    try {
      await object.loadVideoTexture({type: 'videoElement', videoElement: video});
      localVideoCube = {object, video, stream};
      object.position.netObject = object.name;
      // Other peers create this same track as a remote-video cube.
      object.position.remoteName = 'remote-video-' + safeConnectionId;
      console.log('[public-chat] local video cube created:', {connectionId: localConnectionId, trackId: videoTrackId, name: object.name, remoteName: object.position.remoteName});
    } catch(error) {
      console.error('[public-chat] local video texture initialization failed:', error);
      throw error;
    } finally {
      creatingLocalVideoCube = false;
    }
  };

  addEventListener('streamPlaying', event => {
    const detail = event.detail || {};
    const target = detail.target;
    const video = target?.videos?.[0]?.video || detail.videoElement;
    const stream = detail.stream || video?.srcObject;
    const trackId = detail.trackId || stream?.getVideoTracks?.()[0]?.id;
    if(!stream || !video) return;
    if(detail.isLocal || target?.id === 'local-video') {
      addLocalVideoCube(stream, video, trackId, detail.connectionId || detail.peerId).catch(error => {
        console.error('[public-chat] could not create local video cube:', error);
      });
      return;
    }
    const peerId = detail.peerId;
    if(!peerId || target?.id?.indexOf('remote-video-') !== 0) return;
    addRemoteVideoCube(peerId, stream, video, trackId).catch(error => {
      console.error('[public-chat] could not create remote video cube:', peerId, error);
    });
  });

  addEventListener('connectionDestroyed', event => {
    const peerId = event.detail?.connectionId;
    const remote = remoteVideoCubes.get(peerId);
    if(remote) {
      // Native WebRTC owns and disposes the single video element.
      remote.object.position.setPosition(0, -10000, 0);
      remoteVideoCubes.delete(peerId);
    }
    pendingRemoteStreams.delete(peerId);
  });

  let freekyChat = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useCannon: true,
    fastRender: 0.9,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    freekyChat.addLight();
    addRaycastsListener();
    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        plane: "./res/meshes/blender/plane-sub10.obj",
        ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
        reel: "./res/meshes/obj/reel.obj"
      }, onGround, {scale: [1, 1, 1]})

      freekyChat.matrixPhysics.speedUpSimulation(2);

      freekyChat.net = activateNet2({
        backend: 'webrtc',
        sessionName: 'beast-room-01',
        domain: "https://localhost",
        signalingUrl: 'ws://localhost:2020',
        media: {audio: true, video: true}
      });

      //  subMesh.position.netObject = subMesh.name;
      addEventListener('net-ready', () => {
        console.log('net-ready- net-ready')
        // Networking
      })

      const W = 8;
      const H = 8;
      const NX = 10;
      const NY = 10;

      PLANE = app.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 15, z: -10},
        scale: [1, 1, 1],
        name: 'test',
        resolutionU: NX,
        resolutionV: NY,
        texturesPaths: ['./res/meshes/obj/modelpack19/hand-logo.webp'],
        meshA: MeshMorpher.clothPlane(W, H),
        meshB: MeshMorpher.clothPlane(W, H),
        physics: {
          enabled: true,
          geometry: "Cloth",
          nx: NX,
          ny: NY,
          width: W,
          height: H,
          pinTop: true
        }
      });

      let strength = 10;
      freekyChat.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected');
        let b = app.matrixPhysics.getBodyByName(e.detail.hitObject.name);
        app.matrixPhysics.applyImpulse(b, new PVector(
          e.detail.rayDirection[0] * strength,
          e.detail.rayDirection[1] * strength,
          e.detail.rayDirection[2] * strength))
        // if(e.detail.hitObject.name === 'test') {
        applyWindToCloth()
        // }
      });

      function applyWindToCloth(startIndex = 1, count = 121, nx = 10) {
        for(let i = 0;i < count;i++) {
          const row = Math.floor(i / (nx + 1));
          if(row === 0) continue;
          app.matrixPhysics.applyImpulse(startIndex + i, {
            x: Math.sin(performance.now() * 0.001) * 0.01,
            y: 0.01,
            z: 0.01
          });
        }
      }

    })

    async function onGround(m) {
      loadedMeshes = m;
      var glbFile11 = await fetch("./res/meshes/glb/beast_face_test.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, freekyChat.device)));
      freekyChat.addGlbObjInctance({
        material: {type: 'mirror', useTextureFromGlb: true},
        envMapParams: {
          baseColorMix: 0.75,
          mirrorTint: [0.9, 0.5, 1.0],      // Slight cool tint
          reflectivity: 0.5,                // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.001,           // No pulse (static)
          fresnelPower: 5.0,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        useScale: true,
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -20},
        name: 'robot',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp', './res/textures/env-maps/sky1.webp'],
      }, null, glbFile11);

      // A peer can publish before the scene meshes finish loading.
      for(const [peerId, media] of pendingRemoteStreams) {
        pendingRemoteStreams.delete(peerId);
        addRemoteVideoCube(peerId, media.stream, media.video, media.trackId).catch(error => {
          console.error('[public-chat] queued remote video cube failed:', peerId, error);
        });
      }
      if(pendingLocalStream) {
        const media = pendingLocalStream;
        pendingLocalStream = null;
        addLocalVideoCube(media.stream, media.video, media.trackId, media.connectionId).catch(error => {
          console.error('[public-chat] queued local video cube failed:', error);
        });
      }

      MYCUBE = freekyChat.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 1, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5, 1, 5],
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
        }
      })

      setTimeout(() => {
        MYCUBE.position.netObject = MYCUBE.name;
        MYCUBE.rotation.emitY = MYCUBE.name;
        PLANE.vertexAnim.enableCloth(1);
        app.activateHZB();
      }, 600)

      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(3.76);
      cam._dirtyAngle = true;

      // freekyChat.addMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 0, y: 15, z: -20},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 111, z: 0},
      //   scale: [5, 5, 5],
      //   texturesPaths: ['./res/meshes/obj/modelpack19/hand-logo.webp'],
      //   name: 'ball1',
      //   mesh: m.ball,
      //   physics: {
      //     enabled: true,
      //     geometry: "Sphere",
      //     group: 2,
      //     mask: -1,
      //   },
      //   raycast: {enabled: true, radius: 1}
      // })

      freekyChat.addMeshObj({
        position: {x: 0, y: -0.5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [25, 0.1, 25],
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.plane,
        physics: {enabled: false}
      });

      app.activateBloomEffect();
      // app.activateVolumetricEffect();

      freekyChat.lightContainer[0].setPosY(65);
      freekyChat.lightContainer[0].setIntensity(100);
    }
  })
  window.app = freekyChat;
}

// Activate if whne you wanna final prodc build.
// No need to pack whole examples.
loadFreekyChat();