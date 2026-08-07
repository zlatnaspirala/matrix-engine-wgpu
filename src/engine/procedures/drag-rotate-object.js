import {getRayFromMouse, rayIntersectsSphere2, rayIntersectsAABB, computeWorldVertsAndAABB} from "../raycast";

export class DragRotateController {
  constructor(mesh, canvas, camera, options = {}) {
    this.mesh = mesh;
    this.canvas = canvas;
    this.camera = camera;
    this.sensitivity = options.sensitivity ?? 0.005;
    this.inertia = options.inertia ?? 0.95;
    this.minVelocity = options.minVelocity ?? 0.0001;
    this.autoRotateSpeed = options.autoRotateSpeed ?? 0;

    this._dragging = false;
    this._lastX = 0;
    this._velocity = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._attach();
  }

  _attach() {
    this.canvas.addEventListener("pointerdown", this._onPointerDown);
    window.addEventListener("pointermove", this._onPointerMove);
    window.addEventListener("pointerup", this._onPointerUp);
  }

  _onPointerDown(e) {
    const {rayOrigin, rayDirection} = getRayFromMouse(e, this.canvas, this.camera);

    let hit = null;
    if(this.mesh.boundingSphere) {
      hit = rayIntersectsSphere2(
        rayOrigin, rayDirection,
        {x: this.mesh.boundingSphere.center[0], y: this.mesh.boundingSphere.center[1], z: this.mesh.boundingSphere.center[2]},
        this.mesh.boundingSphere.radius
        // this.mesh.raycast.radius
      );
    } else if(this.mesh.raycast?.radius) {
      // fallback for meshes without a precomputed bounding sphere
      hit = rayIntersectsSphere2(rayOrigin, rayDirection, this.mesh.position, this.mesh.raycast.radius);
    }

    this._dragging = !!hit;
    if(this._dragging) {
      this.camera.disableLook();
      this._lastX = e.clientX;
      this._velocity = 0;
    }
  }

  _onPointerMove(e) {
    if(!this._dragging) return;
    const dx = e.clientX - this._lastX;
    this._lastX = e.clientX;
    const delta = dx * this.sensitivity;
    this.mesh.rotation.y += delta;
    this._velocity = delta;
  }

  _onPointerUp() {
    // unconditional — this is the safety net that prevents a stuck-disabled camera
    // no matter what state _dragging was left in
    this.camera.enableLook();
    this._dragging = false;
  }

  update() {
    if(this._dragging) return;
    if(Math.abs(this._velocity) > this.minVelocity) {
      this.mesh.rotation.y += this._velocity;
      this._velocity *= this.inertia;
    } else if(this.autoRotateSpeed !== 0) {
      this.mesh.rotation.y += this.autoRotateSpeed;
    }
  }

  destroy() {
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerup", this._onPointerUp);
  }
}