import {uploadGLBModel} from "../loaders/webgpu-gltf";

export class FireballSystem {

  static CONFIG = {
    speed: 2.3,
    homingStrength: 0.08,
    hitRadius: 1.5,
    damage: 50,
    lifetime: 4000,
    maxActive: 2,
  };

  loadBallAnim = async (p) => {
    var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
    this.core.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [12, 12, 12],
      position: {
        x: this.parent.position.x,
        y: this.parent.position.y,
        z: this.parent.position.z
      },
      name: "FIRE", // this.parent.name + "-fireball",
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      raycast: {enabled: true, radius: 1.5},
      pointerEffect: {
        enabled: true,
        pointer: true,
        flameEffect: false,
        flameEmitter: true,
        circlePlane: false,
        circlePlaneTex: true,
        circlePlaneTexPath: './res/textures/star1.png',
      }
    }, null, glbFile01);
    setTimeout(() => this.fireballMesh = app.getSceneObjectByName('FIRE_Circle'), 300);
  }

  constructor(parent, core) {
    this.core = core;
    this.parent = parent;
    this.loadBallAnim('./res/meshes/glb/ring1.glb');
    this.projectiles = [];
  }

  // Spawn a new fireball scene object
  async spawn(fromPosition, target) {
    if(this.projectiles.length >= FireballSystem.CONFIG.maxActive) return;
    // Create new MeshObjInstanced for this fireball
    // position: new Position(fromPosition.x, fromPosition.y, fromPosition.z),
    // let fireballMesh = app.getSceneObjectByName('FIRE_Circle');
    this.fireballMesh.position.x = fromPosition.x;
    this.fireballMesh.position.y = fromPosition.y;
    this.fireballMesh.position.z = fromPosition.z;
    this.fireballMesh.position.setSpeed(FireballSystem.CONFIG.speed);
    this.projectiles.push({
      mesh: this.fireballMesh,
      target: target,
      spawnTime: performance.now(),
      alive: true,
    });
  }

  update(deltaTime) {
    const cfg = FireballSystem.CONFIG;
    const toRemove = [];
    for(let i = 0;i < this.projectiles.length;i++) {
      const p = this.projectiles[i];
      if(!p.alive) {toRemove.push(i); continue;}
      // Expire / target dead checks
      if(performance.now() - p.spawnTime > cfg.lifetime ||
        !p.target || p.target.hp <= 0) {
        this._kill(p);
        toRemove.push(i);
        continue;
      }
      // Homing hardcoded for MOBA !
      let dx = 0;
      let dy = 0;
      let dz = 0;

      if(p.target.heroe_bodies) {
        p.mesh.position.translateByXZ(p.target.heroe_bodies[0].position.x, p.target.heroe_bodies[0].position.z);
        p.mesh.position.translateByY(p.target.heroe_bodies[0].position.y);
        // Hit check
        dx = p.mesh.position.x - p.target.heroe_bodies[0].position.x;
        dy = p.mesh.position.y - p.target.heroe_bodies[0].position.y;
        dz = p.mesh.position.z - p.target.heroe_bodies[0].position.z;
      } else {
        p.mesh.position.translateByXZ(p.target.position.x, p.target.position.z);
        p.mesh.position.translateByY(p.target.position.y);
        // Hit check
        dx = p.mesh.position.x - p.target.position.x;
        dy = p.mesh.position.y - p.target.position.y;
        dz = p.mesh.position.z - p.target.position.z;
      }

      if(Math.sqrt(dx * dx + dy * dy + dz * dz) < cfg.hitRadius) {
        this._onHit(p);
        toRemove.push(i);
      }
    }
    for(let i = toRemove.length - 1;i >= 0;i--) {
      this.projectiles.splice(toRemove[i], 1);
    }
  }

  _onHit(p) {
    p.target.hp -= FireballSystem.CONFIG.damage;
    dispatchEvent(new CustomEvent('fireball-hit', {
      detail: {target: p.target, damage: FireballSystem.CONFIG.damage}
    }));
    this._kill(p);
  }

  _kill(p) {

    p.mesh.position.setPosition(this.parent.position.x, this.parent.position.y, this.parent.position.z)
    // p.alive = false;
    // // Remove from scene
    // const idx = app.mainRenderBundle.indexOf(p.mesh);
    // if(idx !== -1) app.mainRenderBundle.splice(idx, 1);

    // // Cleanup GPU resources if needed
    // p.mesh.destroy?.();
  }
}