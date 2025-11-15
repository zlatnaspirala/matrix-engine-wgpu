import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";
import {LOG_MATRIX} from "../../../src/engine/utils";
import {Hero} from "./hero";
// import {followPath} from "./nav-mesh";
import {startUpPositions} from "./static";

export class FriendlyHero extends Hero {

  heroAnimationArrange = {
    dead: null,
    walk: null,
    salute: null,
    attack: null,
    idle: null
  }

  constructor(o, archetypes = ["Warrior"]) {
    super(o.name, archetypes);
    this.name = o.name;
    this.core = o.core;
    this.loadFriendlyHero(o);
    this.attachEvents();
    return this;
  }

  loadFriendlyHero = async (o) => {
    try {
      console.info(`%chero friendly path  ${o.path}`, LOG_MATRIX)
      var glbFile01 = await fetch(o.path).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: o.position,
        name: o.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.1},
        pointerEffect: {
          enabled: true,
          energyBar: true
        }
      }, null, glbFile01);
      // make small async - cooking glbs files
      setTimeout(() => {
        this.heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes(o.name)
        );
        this.heroe_bodies.forEach((subMesh, idx, array) => {
          subMesh.position.thrust = this.moveSpeed;
          subMesh.glb.animationIndex = 0;
          // adapt manual if blender is not setup
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            //  console.info(`%c ANimation: ${a.name} index ${index}`, LOG_MATRIX)
            if(a.name == 'dead') this.heroAnimationArrange.dead = index;
            if(a.name == 'walk') this.heroAnimationArrange.walk = index;
            if(a.name == 'salute') this.heroAnimationArrange.salute = index;
            if(a.name == 'attack') this.heroAnimationArrange.attack = index;
            if(a.name == 'idle') this.heroAnimationArrange.idle = index;
          });
          // adapt
          if(this.name == 'Slayzer') {
            subMesh.globalAmbient = [2, 2, 3, 1];
          }

          // this is optimisation very important - no emit per sub mesh - calc on client part.
          if(idx > 0) {
            array[idx].position = array[0].position;
            array[idx].rotation = array[0].rotation;
          }

          // maybe will help - remote net players no nedd to collide in other remote user gamaplay
          // this.core.collisionSystem.register((o.name + idx), subMesh.position, 15.0, 'enemies');
          // dont care for multi sub mesh now
          if(idx == 0) {
            subMesh.position.netObject = subMesh.name;
            // for now net view for rot is axis separated - cost is ok for orientaion remote pass
            subMesh.rotation.emitY = subMesh.name;
            this.core.collisionSystem.register((o.name), subMesh.position, 15.0, 'friendly');
          }
        });

        this.setStartUpPosition();
        for(var x = 0;x < this.heroe_bodies.length;x++) {
          if(x > 0) {
            this.heroe_bodies[x].position = this.heroe_bodies[0].position;
            this.heroe_bodies[x].rotation = this.heroe_bodies[0].rotation;
          }
        }
      }, 1600);
    } catch(err) {throw err;}
  }

  setWalk() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.walk;
      console.info(`%chero walk`, LOG_MATRIX)
    });
  }

  setSalute() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.salute;
      console.info(`%chero salute`, LOG_MATRIX)
    });
  }

  setDead() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.dead;
      console.info(`%chero dead`, LOG_MATRIX)
    });
  }

  setIdle() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.idle;
      console.info(`%chero idle`, LOG_MATRIX)
    });
  }

  setAttack() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.attack;
      console.info(`%chero attack`, LOG_MATRIX)
    });
  }

  setStartUpPosition() {
    this.heroe_bodies.forEach((subMesh) => {
      subMesh.position.setPosition(
        startUpPositions[app.player.data.team][0] + 50,
        startUpPositions[app.player.data.team][1],
        startUpPositions[app.player.data.team][2]
      )
    })
  }

  attachEvents() {
    addEventListener(`onDamage-${this.name}`, (e) => {
      console.info(`%c remote[enemy] hero damage ${e.detail}`, LOG_MATRIX)
      this.heroe_bodies[0].effects.energyBar.setProgress(e.detail.progress);
      this.core.net.sendOnlyData({
        type: "damage",
        defenderName: e.detail.defender,
        attackerName: e.detail.attacker,
        hp: e.detail.hp,
        progress: e.detail.progress
      });
      // if detail is 0
      if(e.detail.progress == 0) {
        this.setDead();
        console.info(`%c hero dead [${this.name}], attacker[${e.detail.attacker}]`, LOG_MATRIX)
        setTimeout(() => {
          this.setStartUpPosition();
        }, 1500);
      }
    });
  }
}