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
    this._ev = {
      updatePos:      new CustomEvent('web.editor.update.pos',      { detail: {} }),
      updateRot:      new CustomEvent('web.editor.update.rot',      { detail: {} }),
      updateScale:    new CustomEvent('web.editor.update.scale',    { detail: {} }),
      updateUseScale: new CustomEvent('web.editor.update.useScale', { detail: {} }),
    };
    this.addEditorEvents();
  }

  getNameFromPath(p) {
    return p.split(/[/\\]/).pop().replace(/\.[^/.]+$/, "");
  }

  addEditorEvents() {
    document.addEventListener('web.editor.input', (e) => {
      console.log("[EDITOR-input]: ", e.detail);

      switch(e.detail.propertyId) {
        case 'position':
          {
            console.log('change signal for pos', e.detail);
            if(e.detail.property == 'x' ||
              e.detail.property == 'y' ||
              e.detail.property == 'z'
            ) {
              this._ev.updatePos.detail.inputFor   = e.detail.inputFor;
              this._ev.updatePos.detail.property   = e.detail.property;
              this._ev.updatePos.detail.propertyId = e.detail.propertyId;
              this._ev.updatePos.detail.value      = e.detail.value;
              document.dispatchEvent(this._ev.updatePos);
            }
            break;
          }
        case 'rotation':
          {
            console.log('[signal][rot]');
            if(e.detail.property == 'x' ||
              e.detail.property == 'y' ||
              e.detail.property == 'z'
            ) {
              this._ev.updateRot.detail.inputFor   = e.detail.inputFor;
              this._ev.updateRot.detail.property   = e.detail.property;
              this._ev.updateRot.detail.propertyId = e.detail.propertyId;
              this._ev.updateRot.detail.value      = e.detail.value;
              document.dispatchEvent(this._ev.updateRot);
            }
            break;
          }
        case 'scale':
          {
            console.log('[signal][scale]');
            if(e.detail.property == '0' ||
              e.detail.property == '1' ||
              e.detail.property == '2'
            ) {
              this._ev.updateScale.detail.inputFor   = e.detail.inputFor;
              this._ev.updateScale.detail.property   = e.detail.property;
              this._ev.updateScale.detail.propertyId = e.detail.propertyId;
              this._ev.updateScale.detail.value      = e.detail.value;
              document.dispatchEvent(this._ev.updateScale);
            }
            break;
          }
        default:
          console.log('changes not saved.')
      }

      let sceneObj = this.core.getSceneObjectByName(e.detail.inputFor);

      if(e.detail.property == "no info") {
        sceneObj[e.detail.propertyId] = e.detail.value;
        if(e.detail.propertyId === "useScale") {
          this._ev.updateUseScale.detail.inputFor   = e.detail.inputFor;
          this._ev.updateUseScale.detail.property   = e.detail.property;
          this._ev.updateUseScale.detail.propertyId = e.detail.propertyId;
          this._ev.updateUseScale.detail.value      = e.detail.value;
          document.dispatchEvent(this._ev.updateUseScale);
        }
        return;
      }

      if(sceneObj) {
        sceneObj[e.detail.propertyId][e.detail.property] = parseFloat(e.detail.value);
      } else {
        console.warn("EditorProvider input error");
        return;
      }
    });

    document.addEventListener('web.editor.addCube', (e) => {
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
        const texturesPaths = './res/textures/cube-g1-extra_low.png';
        this.core.addMeshObj({
          position: {x: 0, y: 0, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: "" + e.detail.index,
          mesh: m.cube,
          raycast: {enabled: true, radius: 1},
          physics: {
            enabled: e.detail.physics,
            geometry: "Cube"
          }
        })
      }, {scale: [1, 1, 1]});
    });

    document.addEventListener('web.editor.addSphere', (e) => {
      downloadMeshes({mesh: "./res/meshes/shapes/sphere.obj"}, (m) => {
        const texturesPaths = './res/textures/cube-g1-extra_low.png';
        this.core.addMeshObj({
          position: {x: 0, y: 0, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: e.detail.index,
          mesh: m.mesh,
          raycast: {enabled: true, radius: 1},
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
      var glbFile01 = await fetch(e.detail.path).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObj({
        material: {type: 'power', useTextureFromGlb: true},
        scale: [2, 2, 2],
        position: {x: 0, y: 0, z: -20},
        name: this.getNameFromPath(e.detail.path),
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      }, null, glbFile01);
    });

    document.addEventListener('web.editor.addObj', (e) => {
      console.log("[web.editor.addObj]: ", e.detail);
      e.detail.path = e.detail.path.replace('\\res', 'res');
      e.detail.path = e.detail.path.replace(/\\/g, '/');
      downloadMeshes({objMesh: `${e.detail.path}`}, (m) => {
        const texturesPaths = './res/textures/cube-g1-extra_low.png';
        this.core.addMeshObj({
          position: {x: 0, y: 0, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: e.detail.index,
          mesh: m.objMesh,
          raycast: {enabled: true, radius: 1},
          physics: {
            enabled: e.detail.physics,
            geometry: "Cube"
          }
        })
      }, {scale: [1, 1, 1]});
    });

    document.addEventListener('web.editor.delete', (e) => {
      console.log("[web.editor.delete]: ", e.detail.fullName);
      this.core.removeSceneObjectByName(e.detail.fullName);
    });
  }
}