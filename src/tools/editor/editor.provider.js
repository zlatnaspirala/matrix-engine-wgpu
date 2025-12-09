import {downloadMeshes} from "../../engine/loader-obj";

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
        const texturesPaths = ['./res/meshes/blender/cube.png'];
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
  }
}