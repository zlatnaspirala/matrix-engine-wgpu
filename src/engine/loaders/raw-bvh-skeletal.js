import MEBvh from "bvh-loader";
import {radToDeg} from "../utils.js";

export let BONE_SCALE = 0.5;
export let THICKNESS = 0.15;

export function BVHSkeletal(path, m ,texturePath = undefined) {
  var animBVH = new MEBvh();
  return new Promise((resolve, reject) => {
    animBVH.parse_file(path).then(() => {
      animBVH.plot_hierarchy();
      var r = animBVH.frame_pose(0);
      var KEYS = animBVH.joint_names();
      var BONES = buildBoneMap(animBVH);
      let ALL_MESHES = [];
      for(var x = 0;x < r[0].length;x++) {
        // console.log("->" + KEYS[x] + "-> position: " + r[0][x] + " rotation: " + r[1][x]);
        var boneName = 'BVH' + KEYS[x];
        const mesh = app.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: 0, y: -5, z: -10},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: texturePath ? [texturePath] : undefined,
          name: boneName,
          mesh: m.cube,
          physics: {enabled: false}
        });
        ALL_MESHES.push(mesh);
      }
      for(var x = 0;x < ALL_MESHES.length;x++) {
        const bone = BONES[x];
        if(!bone) {
          ALL_MESHES[x].setBlend(0.5);
          continue;
        }
        bone.scaledLength = bone.length * BONE_SCALE;
        ALL_MESHES[x].scale[0] = THICKNESS;
        ALL_MESHES[x].scale[1] = bone.scaledLength;
        ALL_MESHES[x].scale[2] = THICKNESS;
      }
      animBVH.ALL_MESHES = ALL_MESHES;
      const MESH_POS = ALL_MESHES.map(m => m.position);
      const MESH_ROT = ALL_MESHES.map(m => m.rotation);
      let all = animBVH.all_frame_poses();
      let countAnim = 0;
      const numFrames = all[0].length;
      const numMeshes = ALL_MESHES.length;
      let dx, dy, dz, len, invLen, clampedDx, thetaZ, thetaX;
      let p, parentPos, bone;
      let animDeltaDuration = 20;
      app.autoUpdate.push({
        update: () => {
          animDeltaDuration--;
          if(animDeltaDuration > 1) {
            return;
          }
          animDeltaDuration = 20;
          const framePos = all[0][countAnim];
          for(var x = 0;x < numMeshes;x++) {
            bone = BONES[x];
            p = framePos[x];
            if(!bone) {
              MESH_POS[x].SetX(p[0]);
              MESH_POS[x].SetY(p[1]);
              MESH_POS[x].SetZ(p[2]);
              //  console.log("Root joint:", KEYS[x], "mesh:", ALL_MESHES[x].name);
              continue;
            }
            parentPos = framePos[bone.parentIndex];
            MESH_POS[x].SetX((p[0] + parentPos[0]) * 0.5);
            MESH_POS[x].SetY((p[1] + parentPos[1]) * 0.5);
            MESH_POS[x].SetZ((p[2] + parentPos[2]) * 0.5);
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
    }).catch((err) => {reject(err)});
  })
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