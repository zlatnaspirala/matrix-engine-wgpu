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
    return p.split(/[/\\]/).pop().replace(/\.[^/.]+$/, ""); // + (this.core.mainRenderBundle.length);
  }

  addEditorEvents() {
    document.addEventListener('web.editor.input', (e) => {
      console.log("[EDITOR-input]: ", e.detail);
      // Saves methods
      switch(e.detail.propertyId) {
        case 'position':
          {
            console.log('change signal for pos');
            if(e.detail.property == 'x' ||
              e.detail.property == 'y' ||
              e.detail.property == 'z'
            ) document.dispatchEvent(new CustomEvent('web.editor.update.pos', {
              detail: e.detail
            }));
            break;
          }
        case 'rotation':
          {
            console.log('change signal for rot');
            if(e.detail.property == 'x' ||
              e.detail.property == 'y' ||
              e.detail.property == 'z'
            ) document.dispatchEvent(new CustomEvent('web.editor.update.rot', {
              detail: e.detail
            }));
            break;
          }
        case 'scale':
          {
            console.log('change signal for scale');
            if(e.detail.property == '0') {
              document.dispatchEvent(new CustomEvent('web.editor.update.scale', {
                detail: e.detail
              }));
            } else if(e.detail.property == '1') {
              document.dispatchEvent(new CustomEvent('web.editor.update.scale', {
                detail: e.detail
              }));
            } else if(e.detail.property == '2') {
              document.dispatchEvent(new CustomEvent('web.editor.update.scale', {
                detail: e.detail
              }));
            }
            break;
          }
        default:
          console.log('changes not saved.')
      }
      // inputFor: "Cube_0" property: "x" propertyId: "position" value: "1"
      // InFly Method
      let sceneObj = this.core.getSceneObjectByName(e.detail.inputFor);
      if(sceneObj) {
        sceneObj[e.detail.propertyId][e.detail.property] = parseFloat(e.detail.value);
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
          name: "" + e.detail.index,
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {
            enabled: e.detail.physics,
            geometry: "Cube"
          }
        })
      }, {scale: [1, 1, 1]});
    });

    document.addEventListener('web.editor.addSphere', (e) => {
      // console.log("[web.editor.addCube]: ", e.detail);
      downloadMeshes({mesh: "./res/meshes/shapes/sphere.obj"}, (m) => {
        const texturesPaths = './res/meshes/blender/cube.png';
        this.core.addMeshObj({
          position: {x: 0, y: 0, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          // useUVShema4x2: true,
          name: e.detail.index,
          mesh: m.mesh,
          raycast: {enabled: true, radius: 2},
          physics: {
            enabled: e.detail.physics,
            geometry: "Sphere"
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
        position: {x: 0, y: 0, z: -20},
        name: this.getNameFromPath(e.detail.path),
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile01);
    });

    document.addEventListener('web.editor.addObj', (e) => {
      console.log("[web.editor.addObj]: ", e.detail);
      e.detail.path = e.detail.path.replace('\\res', 'res');
      e.detail.path = e.detail.path.replace(/\\/g, '/');
      // THIS MUST BE SAME LIKE SERVER VERSION OF ADD CUBE
      downloadMeshes({objMesh: `${e.detail.path}`}, (m) => {
        const texturesPaths = './res/meshes/blender/cube.png';
        this.core.addMeshObj({
          position: {x: 0, y: 0, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          // useUVShema4x2: true,
          name: e.detail.index,
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
      console.log("[web.editor.delete]: ", e.detail.fullName);

      this.core.removeSceneObjectByName(e.detail.fullName);
    });

    // update procedure

  }
}