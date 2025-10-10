import {computeWorldVertsAndAABB, touchCoordinate, rayIntersectsAABB, rayIntersectsSphere, getRayFromMouse2, getRayFromMouse, addRaycastsListener} from "../../../src/engine/raycast.js";
import {mat4, vec4} from "wgpu-matrix";
import {byId} from "../../../src/engine/utils.js";
import {followPath} from "./nav-mesh.js";

export class Controller {

  ignoreList = ['ground'];
  selected = [];

  nav = null;
  heroe_bodies = null;

  constructor(canvas) {
    this.canvas = canvas;
    this.dragStart = null;
    this.dragEnd = null;
    this.selecting = false;

    canvas.addEventListener('mousedown', (e) => {
      if(e.button === 2) { // right mouse
        this.selecting = true;
        this.dragStart = {x: e.clientX, y: e.clientY};
        this.dragEnd = {x: e.clientX, y: e.clientY};
      } else if(e.button === 0) {
        // console.log('it is right what is heroe_bodies ', this.heroe_bodies);
        // console.log('it is right what is nav ', this.nav);
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if(this.selecting) {
        this.dragEnd = {x: e.clientX, y: e.clientY};
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if(this.selecting) {
        this.selecting = false;
        this.selectCharactersInRect(this.dragStart, this.dragEnd);
        this.dragStart = this.dragEnd = null;
        setTimeout(() => {
          if(this.ctx) this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        }, 100);
      }
    });

    addRaycastsListener()

    canvas.addEventListener("ray.hit.event", (e) => {
      // console.log('ray.hit.event detected', e);
      const {hitObject, hitPoint, button} = e.detail;
      if(!hitObject || !hitPoint) {
        console.warn('No valid hit detected.');
        return;
      }
      // console.log("Hit object:", hitObject.name, "Button:", button);
      // Only react to LEFT CLICK
      if(button !== 0 || this.heroe_bodies === null) return;
      // Define start (hero position) and end (clicked point)

      const hero = this.heroe_bodies[0];
      const start = [hero.position.x, hero.position.y, hero.position.z];
      const end = [hitPoint[0], hitPoint[1], hitPoint[2]];

      // console.log("Start:", start, "End:", end);
      // --- find path on your navmesh ---
      const path = this.nav.findPath(start, end);
      if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
      // console.log("Path:", path);
      followPath(hero, path);
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
    const camera = app.cameras.WASD;
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

}