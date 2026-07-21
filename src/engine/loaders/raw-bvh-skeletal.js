import MEBvh from "bvh-loader";
import {radToDeg} from "../utils.js";

export function BVHSkeletal(path, name = "addName", m, texturePaths = undefined, SKELETON_SCALE = 1, position = {x: 0, y: 0, z: -10}, rotation = {x: 0, y: 0, z: 0}, sharedMaterial = false) {
  var animBVH = new MEBvh();
  animBVH.myName = name;
  return new Promise((resolve, reject) => {
    animBVH.parse_file(path).then(() => {
      animBVH.plot_hierarchy();
      animBVH.BONE_SCALE = 0.5;
      animBVH.THICKNESS = 0.5;

      var r = animBVH.frame_pose(0);
      var KEYS = animBVH.joint_names();
      var BONES = buildBoneMap(animBVH);
      let ALL_MESHES = [];
      animBVH.position = position;
      animBVH.rotation = rotation;
      for(var x = 0;x < r[0].length;x++) {
        var boneName = animBVH.myName + '_' + KEYS[x];
        const mesh = app.addMeshObj({
          material: {type: 'mirror', share: sharedMaterial},
          position: position,
          rotation: rotation,
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: texturePaths ? texturePaths : undefined,
          name: boneName,
          mesh: m.cube,
          physics: {enabled: false},
          raycast: {enabled: true, radius: 2},
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
        });
        ALL_MESHES.push(mesh);
      }

      animBVH.setupScale = () => {
        for(var x = 0;x < ALL_MESHES.length;x++) {
          const bone = BONES[x];
          if(!bone) {
            ALL_MESHES[x].setBlend(0.5);
            ALL_MESHES[x].scale[0] = animBVH.THICKNESS * SKELETON_SCALE;
            ALL_MESHES[x].scale[1] = animBVH.THICKNESS * SKELETON_SCALE;
            ALL_MESHES[x].scale[2] = animBVH.THICKNESS * SKELETON_SCALE;
            continue;
          }
          bone.scaledLength = bone.length * animBVH.BONE_SCALE * SKELETON_SCALE;
          ALL_MESHES[x].scale[0] = animBVH.THICKNESS * SKELETON_SCALE;
          ALL_MESHES[x].scale[1] = bone.scaledLength;
          ALL_MESHES[x].scale[2] = animBVH.THICKNESS * SKELETON_SCALE;
        }
      };

      animBVH.setupScale()

      animBVH.ALL_MESHES = ALL_MESHES;
      const MESH_POS = ALL_MESHES.map(m => m.position);
      const MESH_ROT = ALL_MESHES.map(m => m.rotation);
      let all = animBVH.all_frame_poses();
      let countAnim = 0;
      const numFrames = all[0].length;
      const numMeshes = ALL_MESHES.length;
      let dx, dy, dz, len, invLen, clampedDx, thetaZ, thetaX;
      let p, parentPos, bone;

      app.autoUpdate.push({
        update: () => {
          const framePos = all[0][countAnim];
          for(var x = 0;x < numMeshes;x++) {
            bone = BONES[x];
            p = framePos[x];
            if(!bone) {
              MESH_POS[x].SetX(p[0] * SKELETON_SCALE + position.x);
              MESH_POS[x].SetY(p[1] * SKELETON_SCALE + position.y);
              MESH_POS[x].SetZ(p[2] * SKELETON_SCALE + position.z);
              continue;
            }
            parentPos = framePos[bone.parentIndex];
            MESH_POS[x].SetX((p[0] + parentPos[0]) * 0.5 * SKELETON_SCALE + position.x);
            MESH_POS[x].SetY((p[1] + parentPos[1]) * 0.5 * SKELETON_SCALE + position.y);
            MESH_POS[x].SetZ((p[2] + parentPos[2]) * 0.5 * SKELETON_SCALE + position.z);
            // direction is unit-length, unaffected by scale — no change needed here
            dx = p[0] - parentPos[0];
            dy = p[1] - parentPos[1];
            dz = p[2] - parentPos[2];
            len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
            invLen = 1 / len;
            dx *= invLen; dy *= invLen; dz *= invLen;
            clampedDx = dx < -1 ? -1 : (dx > 1 ? 1 : dx);
            thetaZ = -Math.asin(clampedDx);
            thetaX = Math.atan2(dz, dy);
            MESH_ROT[x].setRotationX(radToDeg(thetaX));
            MESH_ROT[x].setRotationZ(radToDeg(thetaZ));
          }
          countAnim++;
          if(countAnim >= numFrames - 1) countAnim = 0;
        }
      });
      resolve(animBVH);
    }).catch((err) => {reject(err);});
  });
}

export function buildBoneMap(bvh) {
  const keys = bvh.joint_names();
  const nameToIndex = {};
  keys.forEach((k, i) => nameToIndex[k] = i);

  return keys.map((k) => {
    const joint = bvh.joints[k];
    if(!joint.parent) return null;
    const [ox, oy, oz] = joint.offset;
    return {
      parentIndex: nameToIndex[joint.parent.name],
      length: Math.sqrt(ox * ox + oy * oy + oz * oz) || 0.0001
    };
  });
}