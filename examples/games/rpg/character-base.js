import {vec3, mat4} from "wgpu-matrix";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";
import {byId, LOG_MATRIX} from "../../../src/engine/utils";
import {Hero, HERO_PROFILES} from "./hero";

export class Character extends Hero {

  positionThrust = 0.85;

  heroAnimationArrange = {
    dead: null,
    walk: null,
    salute: null,
    attack: null,
    idle: null
  };

  constructor(mysticore, path, name = 'MariaSword', archetypes = ["Warrior", "Mage"]) {
    super(name, archetypes);
    // console.info(`%cLOADING hero name : ${name}`, LOG_MATRIX)
    this.name = name;
    this.core = mysticore;
    this.heroe_bodies = [];
    this.loadLocalHero(path);
    // async
    setTimeout(() => this.setupHUDForHero(name), 500)
  }

  setupHUDForHero(name) {
    console.info(`%cLOADING hero name : ${name}`, LOG_MATRIX)
    if(name == 'MariaSword') {
      byId('magic-slot-0').style.background = 'url("./res/textures/rpg/magics/maria-sword-1.png")';
      byId('magic-slot-0').style.backgroundRepeat = "round";
      byId('magic-slot-1').style.background = 'url("./res/textures/rpg/magics/maria-sword-2.png")';
      byId('magic-slot-1').style.backgroundRepeat = "round";
      byId('magic-slot-2').style.background = 'url("./res/textures/rpg/magics/maria-sword-3.png")';
      byId('magic-slot-2').style.backgroundRepeat = "round";
      byId('magic-slot-3').style.background = 'url("./res/textures/rpg/magics/maria-sword-4.png")';
      byId('magic-slot-3').style.backgroundRepeat = "round";
    }
  }

  async loadLocalHero(p) {
    try {
      var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -23, z: -220},
        name: this.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.5},
        pointerEffect: {
          enabled: true,
          pointer: true,
          energyBar: true,
          flameEffect: false,
          flameEmitter: true,
          circlePlane: true,
          circlePlaneTex: true,
          circlePlaneTexPath: './res/textures/rpg/symbols/star.png',
        }
      }, null, glbFile01);
      // make small async - cooking glbs files 
      setTimeout(() => {
        this.heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes(this.name)
        );
        this.core.RPG.heroe_bodies = this.heroe_bodies;
        this.core.RPG.heroe_bodies.forEach(subMesh => {
          subMesh.position.thrust = this.moveSpeed;
          subMesh.glb.animationIndex = 0;
          // adapt manual if blender is not setup
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            console.info(`%c ANimation: ${a.name} index ${index}`, LOG_MATRIX)
            if(a.name == 'dead') this.heroAnimationArrange.dead = index;
            if(a.name == 'walk') this.heroAnimationArrange.walk = index;
            if(a.name == 'salute') this.heroAnimationArrange.salute = index;
            if(a.name == 'attack') this.heroAnimationArrange.attack = index;
          })
        });

        app.localHero.heroe_bodies[0].effects.flameEmitter.recreateVertexDataRND(1)

        this.attachEvents()
      }, 1200)
    } catch(err) {throw err;}
  }

  setWalk() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.walk;
      console.info(`%chero walk`, LOG_MATRIX)
    });
  }

  setSalute() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.salute;
      console.info(`%chero salute`, LOG_MATRIX)
    });
  }

  setDead() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.dead;
      console.info(`%chero dead`, LOG_MATRIX)
    });
  }

  setIdle() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.idle;
      console.info(`%chero idle`, LOG_MATRIX)
    });
  }
  setAttack() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.attack;
      console.info(`%chero attack`, LOG_MATRIX)
    });
  }


  attachEvents() {
    addEventListener('attack-magic0', (e) => {
      console.log(e.detail);

      this.core.RPG.heroe_bodies.forEach(subMesh => {
        this.setSalute();
        // level0 have only one instance - more level more instance in visuals context
        console.info(`%cLOADING hero ghostPos`, LOG_MATRIX)
        const distance = 80.0;  // how far in front of hero
        const lift = 0.5;
        // --- rotation.y in degrees → radians
        const yawRad = (subMesh.rotation.y || 0) * Math.PI / 180;
        // --- local forward vector (relative to hero)
        const forward = vec3.normalize([
          Math.sin(yawRad),  // x
          0,                 // y
          Math.cos(yawRad)  // z (rig faces -Z)
        ]);

        // --- compute ghost local offset
        const ghostOffset = vec3.mulScalar(forward, distance);
        ghostOffset[1] += lift;

        // --- apply to local instance position
        subMesh.instanceTargets[1].position = ghostOffset;

        setTimeout(() => {
          subMesh.instanceTargets[1].position[0] = 0;
          subMesh.instanceTargets[1].position[2] = 0;

          console.log("?? ", this.setWalk)
          this.setWalk()
        }, 1300)
      });

    })

    // Events HERO MOVMENTS
    addEventListener('set-walk', () => {
      this.setWalk();
    })
    addEventListener('set-idle', () => {
      this.setIdle();
    })
    addEventListener('set-attach', () => {
      this.setAttach();
    })
    addEventListener('set-dead', () => {
      this.setDead();
    })
    addEventListener('set-salute', () => {
      this.setSalute();
    })
  }
}
