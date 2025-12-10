import {downloadMeshes} from "../../engine/loader-obj";
import {uploadGLBModel} from "../../engine/loaders/webgpu-gltf";

/**
 * @description
 * For now it is posible for editor to work on fly
 * with no memory/saves.
 */

export default class EditorProvider {
  constructor(core) {
    this.core = core;
    this.addEditorEvents();
  }

  getNameFromPath(p) {
    return p.split(/[/\\]/).pop().replace(/\.[^/.]+$/, "") + (this.core.mainRenderBundle.length);
  }

  addEditorEvents() {
    document.addEventListener('web.editor.input', (e) => {
      console.log("[EDITOR] sceneObj: ", e.detail.inputFor);
      // InFly Method
      let sceneObj = this.core.getSceneObjectByName(e.detail.inputFor);
      if(sceneObj) {
        sceneObj[e.detail.propertyId][e.detail.property] = e.detail.value;
      } else {
        console.warn("EditorProvider input error");
        return;
      }
    });

    document.addEventListener('web.editor.addCube', (e) => {
      // console.log("[web.editor.addCube]: ", e.detail);
      // THIS MUST BE SAME LIKE SERVER VERSION OF ADD CUBE
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
        const texturesPaths = './res/meshes/blender/cube.png';
        this.core.addMeshObj({
          position: {x: 0, y: 0, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          // useUVShema4x2: true,
          name: 'Cube_' + app.mainRenderBundle.length,
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {
            enabled: e.detail.physics,
            geometry: "Cube"
          }
        })
      }, {scale: [1, 1, 1]});
    });

    document.addEventListener('web.editor.addGlb', async (e) => {
      console.log("[web.editor.addGlb]: ", e.detail.path);
      e.detail.path = e.detail.path.replace('\\res', 'res');
      // THIS MUST BE SAME LIKE SERVER VERSION OF ADD GLB
      var glbFile01 = await fetch(e.detail.path).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObj({
        material: {type: 'power', useTextureFromGlb: true},
        scale: [2, 2, 2],
        position: {x: 0, y: 0, z: -50},
        name: this.getNameFromPath(e.detail.path),
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile01);
    });

    document.addEventListener('web.editor.addObj', (e) => {
      console.log("[web.editor.addObj]: ", e.detail);
      e.detail.path = e.detail.path.replace('\\res', 'res');
      e.detail.path = e.detail.path.replace(/\\/g, '/');
      // THIS MUST BE SAME LIKE SERVER VERSION OF ADD CUBE
      downloadMeshes({objMesh: `'${e.detail.path}'`}, (m) => {
        const texturesPaths = './res/meshes/blender/cube.png';
        this.core.addMeshObj({
          position: {x: 0, y: 0, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          // useUVShema4x2: true,
          name: 'objmesh_' + app.mainRenderBundle.length,
          mesh: m.objMesh,
          raycast: {enabled: true, radius: 2},
          physics: {
            enabled: e.detail.physics,
            geometry: "Cube"
          }
        })
      }, {scale: [1, 1, 1]});
    });

    // delete
    document.addEventListener('web.editor.delete', (e) => {
      console.log("[web.editor.delete]: ", e.detail);
      // e.detail.path = e.detail.path.replace('\\res', 'res');
      // e.detail.path = e.detail.path.replace(/\\/g, '/');
      // THIS MUST BE SAME LIKE SERVER VERSION OF ADD CUBE
      this.core.removeSceneObjectByName(e.detail);
    });
  }
}