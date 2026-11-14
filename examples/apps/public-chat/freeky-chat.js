import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsListener} from "../../../src/engine/raycast.js";
import {MeshMorpher} from "../../../src/engine/procedural-mesh.js";
import {PVector} from "../../../src/engine/matrix-class.js";
import {activateNet2} from "../../../src/engine/networking/net.js";

export var loadFreekyChat = function() {

  let MYCUBE;
  let PLANE;
  let loadedMeshes = null;
  const remoteVideoCubes = new Map();
  const pendingRemoteStreams = new Map();

  // Native WebRTC delivers a real MediaStream per remote peer.
  // Reuse the engine's existing videoElement texture path (also used by MOBA).
  const creatingRemoteVideoCubes = new Set();
  const addRemoteVideoCube = async (peerId, stream) => {
    if(!loadedMeshes || !loadedMeshes.cube || !freekyChat) {
      pendingRemoteStreams.set(peerId, stream);
      return;
    }
    const existing = remoteVideoCubes.get(peerId);
    if(existing) {
      if(existing.stream === stream) return;
      existing.stream = stream;
      existing.video.srcObject = stream;
      await existing.object.loadVideoTexture({type: 'videoElement', videoElement: existing.video});
      if(existing.audio && stream.getAudioTracks().length) {
        existing.audio.srcObject = new MediaStream(stream.getAudioTracks());
        existing.audio.play().catch(error => console.warn('[public-chat] remote audio autoplay blocked:', peerId, error));
      }
      return;
    }
    // A MediaStream can produce both audio-track and video-track events.
    // Do not create a second cube while the first track is initializing it.
    if(creatingRemoteVideoCubes.has(peerId)) return;
    creatingRemoteVideoCubes.add(peerId);

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true; // Keep texture playback independent from audio autoplay policy.
    video.srcObject = stream;
    video.style.position = 'fixed';
    video.style.width = '2px';
    video.style.height = '2px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    document.body.appendChild(video);

    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.srcObject = new MediaStream(stream.getAudioTracks());
    audio.style.display = 'none';
    document.body.appendChild(audio);
    audio.play().catch(error => console.warn('[public-chat] remote audio autoplay blocked:', peerId, error));

    const index = remoteVideoCubes.size;
    const object = freekyChat.addMeshObj({
      material: {type: 'standard'},
      position: {
        x: (index - 0.5) * 9,
        y: 8,
        z: -24
      },
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      scale: [4, 3, 0.2],
      texturesPaths: ['./res/textures/cube-g1-extra_low.png'],
      name: 'remote-video-' + String(peerId).replace(/[^a-zA-Z0-9_-]/g, '_'),
      mesh: loadedMeshes.cube,
      physics: {enabled: false},
      raycast: {enabled: false, radius: 1}
    });

    try {
      await object.loadVideoTexture({type: 'videoElement', videoElement: video});
      remoteVideoCubes.set(peerId, {object, video, audio, stream});
      console.log('[public-chat] remote video cube created:', peerId, object.name);
    } catch(error) {
      video.pause();
      video.srcObject = null;
      video.remove();
      audio.pause();
      audio.srcObject = null;
      audio.remove();
      throw error;
    } finally {
      creatingRemoteVideoCubes.delete(peerId);
    }
  };

  addEventListener('webrtc-track', event => {
    const {peerId, stream} = event.detail || {};
    if(!peerId || !stream || !stream.getVideoTracks().length) return;
    addRemoteVideoCube(peerId, stream).catch(error => {
      console.error('[public-chat] could not create remote video cube:', peerId, error);
    });
  });

  addEventListener('connectionDestroyed', event => {
    const peerId = event.detail?.connectionId;
    const remote = remoteVideoCubes.get(peerId);
    if(!remote) return;
    // Stop displaying this peer's media and release its video element.
    remote.video.pause();
    remote.video.srcObject = null;
    remote.video.remove();
    remote.audio?.pause();
    if(remote.audio) {
      remote.audio.srcObject = null;
      remote.audio.remove();
    }
    // Keep the scene object hidden; engine scene-object removal is not exposed
    // through the public API used by this example.
    remote.object.position.setPosition(0, -10000, 0);
    remoteVideoCubes.delete(peerId);
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
      // A peer can publish before the scene meshes finish loading.
      for(const [peerId, stream] of pendingRemoteStreams) {
        pendingRemoteStreams.delete(peerId);
        addRemoteVideoCube(peerId, stream).catch(error => {
          console.error('[public-chat] queued remote video cube failed:', peerId, error);
        });
      }

      MYCUBE = freekyChat.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 4, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3, 5, 3],
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
      }, 500)

      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(3.76);
      cam._dirtyAngle = true;

      freekyChat.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 15, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 111, z: 0},
        scale: [5, 5, 5],
        texturesPaths: ['./res/meshes/obj/modelpack19/hand-logo.webp'],
        name: 'ball1',
        mesh: m.ball,
        physics: {
          enabled: true,
          geometry: "Sphere",
          group: 2,
          mask: -1,
        },
        raycast: {enabled: true, radius: 1}
      })

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
      app.activateVolumetricEffect();

      freekyChat.lightContainer[0].setPosY(65);
      freekyChat.lightContainer[0].setIntensity(100);
    }
  })
  window.app = freekyChat;
}

// Activate if whne you wanna final prodc build.
// No need to pack whole examples.
loadFreekyChat();