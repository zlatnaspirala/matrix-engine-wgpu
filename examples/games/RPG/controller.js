import {computeWorldVertsAndAABB, touchCoordinate, rayIntersectsAABB, rayIntersectsSphere, getRayFromMouse2, getRayFromMouse, addRaycastsListener} from "../../../src/engine/raycast.js";
import {mat4, vec4} from "wgpu-matrix";
import {byId} from "../../../src/engine/utils.js";
import {followPath} from "./nav-mesh.js";

export class Controller {

  ignoreList = ['ground', 'mouseTarget_Circle'];
  selected = [];

  nav = null;
  // ONLY LOCAL
  heroe_bodies = null;

  distanceForAction = 36;

  constructor(core) {
    this.core = core;
    this.canvas = this.core.canvas;

    this.dragStart = null;
    this.dragEnd = null;
    this.selecting = false;

    this.canvas.addEventListener('mousedown', (e) => {
      if(e.button === 2) { // right m
        this.selecting = true;
        this.dragStart = {x: e.clientX, y: e.clientY};
        this.dragEnd = {x: e.clientX, y: e.clientY};
      }  // else if(e.button === 0) { }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if(this.selecting) {
        this.dragEnd = {x: e.clientX, y: e.clientY};
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if(this.selecting) {
        this.selecting = false;
        this.selectCharactersInRect(this.dragStart, this.dragEnd);
        this.dragStart = this.dragEnd = null;
        setTimeout(() => {
          if(this.ctx) this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        }, 100);
      }
    });

    addRaycastsListener(undefined, 'click');
    // addRaycastsListener(undefined, 'mousemove');

    //

    // for now - performance problem
    // this.canvas.addEventListener("ray.hit.event.mm", (e) => {
    //   // console.log('ray.hit.event detected', e);
    //   const {hitObject, hitPoint, button, eventName} = e.detail;
    //   if(!hitObject || !hitPoint) {
    //     console.warn('No valid hit detected.');
    //     return;
    //   }
    //   // console.log("Hit object eventName :", eventName, "Button:", button);
    // })

    this.canvas.addEventListener("ray.hit.event", (e) => {
      // console.log('ray.hit.event detected', e);
      const {hitObject, hitPoint, button, eventName} = e.detail;
      if(e.detail.hitObject.name == 'ground') {
        console.warn('ground detected.');
        dispatchEvent(new CustomEvent(`onMouseTarget`, {
          detail: {
            type: 'normal',
            x: hitPoint[0],
            y: hitPoint[1],
            z: hitPoint[2]
          }
        }));
        this.core.localHero.heroFocusAttackOn = null;
      } else if(this.core.enemies.isEnemy(e.detail.hitObject.name)) {
        dispatchEvent(new CustomEvent(`onMouseTarget`, {
          detail: {
            type: 'attach',
            x: e.detail.hitObject.position.x,// hitPoint[0], blocked by colision observer
            y: e.detail.hitObject.position.y,
            z: e.detail.hitObject.position.z
          }
        }));
      }

      if(button == 0 && e.detail.hitObject.name != 'ground' &&
        e.detail.hitObject.name !== this.heroe_bodies[0].name //&& 
        // e.detail.hitObject.name !== this.heroe_bodies[1].name
      ) {

        if(this.heroe_bodies.length == 2) {
          if(e.detail.hitObject.name == this.heroe_bodies[1].name) {
            return;
          }
        }
        // console.log("Hit object:", e.detail.hitObject.name);
        // console.log("[R CLICK MOUS ]Moment for attact event but walk to the distanve and attach object:",
        // this.core.localHero.heroe_bodies[0]);
        // FOr now without check is it enemiy 
        // fro any LH vs other entity need to exist check distance
        const LH = this.core.localHero.heroe_bodies[0];
        console.log("Hit object VS LH DISTANCE : ", this.distance3D(LH.position, e.detail.hitObject.position))
        // after all check is it eneimy
        this.core.localHero.heroFocusAttackOn = e.detail.hitObject;

        let testDistance = this.distance3D(LH.position, e.detail.hitObject.position);
        // 37 LIMIT FOR ATTACH
        if(testDistance < this.distanceForAction) {
          console.log("this.core.localHero.setAttack [e.detail.hitObject]")
          this.core.localHero.setAttack(e.detail.hitObject);
          return;
        }
      }
      // Only react to LEFT CLICK
      if(button !== 0 || this.heroe_bodies === null ||
        !this.selected.includes(this.heroe_bodies[0])) {
        console.log(" no local here ")
        // not hero but maybe other creaps . based on selected....
        return;
      }
      // Define start (hero position) and end (clicked point)
      const hero = this.heroe_bodies[0];
      let heroSword = null;
      if(this.heroe_bodies.length == 2) {
        heroSword = this.heroe_bodies[1];
      }

      dispatchEvent(new CustomEvent('set-walk'));
      const start = [hero.position.x, hero.position.y, hero.position.z];
      const end = [hitPoint[0], hitPoint[1], hitPoint[2]];
      const path = this.nav.findPath(start, end);
      if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
      followPath(hero, path, this.core);
      followPath(heroSword, path, this.core);
    });

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    this.activateVisualRect()
  }

  projectToScreen(worldPos, viewMatrix, projectionMatrix, canvas) {
    // Convert world position to clip space
    const world = [worldPos[0], worldPos[1], worldPos[2], 1.0];

    // Multiply in correct order: clip = projection * view * world
    const viewProj = mat4.multiply(projectionMatrix, viewMatrix);
    const clip = vec4.transformMat4(world, viewProj);

    // Perform perspective divide
    const ndcX = clip[0] / clip[3];
    const ndcY = clip[1] / clip[3];

    // Convert NDC (-1..1) to screen pixels
    const screenX = (ndcX * 0.5 + 0.5) * canvas.width;
    const screenY = (1 - (ndcY * 0.5 + 0.5)) * canvas.height;

    return {x: screenX, y: screenY};
  }

  selectCharactersInRect(start, end) {
    const xMin = Math.min(start.x, end.x);
    const xMax = Math.max(start.x, end.x);
    const yMin = Math.min(start.y, end.y);
    const yMax = Math.max(start.y, end.y);

    // const camera = app.cameras.WASD;
    const camera = app.cameras.RPG;

    for(const object of app.mainRenderBundle) {
      if(!object.position) continue;
      const screen = this.projectToScreen(
        [object.position.x, object.position.y, object.position.z, 1.0],
        camera.view,
        camera.projectionMatrix,
        this.canvas
      );
      if(screen.x >= xMin && screen.x <= xMax && screen.y >= yMin && screen.y <= yMax) {
        if(this.ignoreList.some(str => object.name.includes(str))) continue;
        if(this.selected.includes(object)) continue;
        object.setSelectedEffect(true);
        this.selected.push(object);
        byId('hud-menu').dispatchEvent(new CustomEvent("onSelectCharacter", {detail: object.name}))
      } else {
        if(this.selected.indexOf(object) !== -1) {
          this.selected.splice(this.selected.indexOf(object), 1)
          // byId('hud-menu').dispatchEvent(new CustomEvent("onSelectCharacter", {detail: object.name} ))
        }
        object.setSelectedEffect(false);
      }
    }
    console.log("Selected:", this.selected.map(o => o.name));
  }

  activateVisualRect() {
    const overlay = document.createElement("canvas");
    overlay.width = this.canvas.width;
    overlay.height = this.canvas.height;
    overlay.style.position = "absolute";
    overlay.style.left = this.canvas.offsetLeft + "px";
    overlay.style.top = this.canvas.offsetTop + "px";
    this.canvas.parentNode.appendChild(overlay);
    this.ctx = overlay.getContext("2d");
    overlay.style.pointerEvents = "none";
    this.overlay = overlay;

    this.canvas.addEventListener("mousemove", (e) => {
      if(this.selecting) {
        this.dragEnd = {x: e.clientX, y: e.clientY};
        this.ctx.clearRect(0, 0, overlay.width, overlay.height);
        this.ctx.strokeStyle = "rgba(0,255,0,0.8)";
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeRect(
          this.dragStart.x,
          this.dragStart.y,
          this.dragEnd.x - this.dragStart.x,
          this.dragEnd.y - this.dragStart.y
        );
      }
    });
  }

  distance3D(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

}