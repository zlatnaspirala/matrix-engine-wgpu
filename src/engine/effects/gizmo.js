import {gizmoEffect} from "../../shaders/gizmo/gimzoShader";
import {byId} from "../utils";

export class GizmoEffect {
  static _pipelineCache = new WeakMap();
  constructor(device, format, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.enabled = true;
    this.mode = 0;
    this.size = 3;
    this.selectedAxis = 0;
    this.movementScale = 0.035;
    this.isDragging = false;
    window.__isDragging = false;
    this.dragAxis = 0;
    this.parentMesh = null;

    // --- Cached Event Payloads ---
    this.editorUpdatePosEvent = new CustomEvent('web.editor.update.pos', {
      detail: {inputFor: "", propertyId: "position", property: "x", value: 0}
    });
    this.editorUpdateRotEvent = new CustomEvent('web.editor.update.rot', {
      detail: {inputFor: "", propertyId: "rotation", property: "y", value: 0}
    });
    this.editorUpdateScaleEvent = new CustomEvent('web.editor.update.scale', {
      detail: {inputFor: "", propertyId: "scale", property: "1", value: 0}
    });

    // --- Zero-Allocation Numerical Caches ---
    this.gizmoSettingsCache = new Float32Array(4);
    this.matrixResultCache = new Float32Array(16);
    this.dragStartPointCache = new Float32Array(3);
    this.initialPositionCache = {x: 0, y: 0, z: 0};

    // Flattened caches for tracking vectors without allocations
    this._axisScreenDirCache = {x: 0, y: 0};
    this._p2Cache = {x: 0, y: 0, z: 0};
    this._rayIntersectsCache = {
      ro: new Float32Array(3),
      rd: new Float32Array(3),
      lineStart: new Float32Array(3),
      lineEnd: new Float32Array(3),
      line: new Float32Array(3),
      w: new Float32Array(3),
      closestOnRay: new Float32Array(3),
      closestOnLine: new Float32Array(3)
    };

    this._initPipeline();
    this._setupEventListeners();

    // Bound reference avoids retaining memory loops on the global object
    this._onGizmoModeChange = (e) => {
      this.setMode(e.detail.mode);
    };
    addEventListener("editor-set-gizmo-mode", this._onGizmoModeChange);
  }

  _initPipeline() {
    const device = this.device;
    if(GizmoEffect._pipelineCache.has(device)) {
      const cached = GizmoEffect._pipelineCache.get(device);
      this.pipeline = cached.pipeline;
      this.bindGroupLayout = cached.bindGroupLayout;
      this.pipelineLayout = cached.pipelineLayout;
      this.shaderModule = cached.shaderModule;
    } else {
      this.bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
          {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {}},
          {binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}},
        ]
      });

      this.shaderModule = device.createShaderModule({code: gizmoEffect});
      this.pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout]
      });

      this.pipeline = device.createRenderPipeline({
        label: 'gizmo',
        layout: this.pipelineLayout,
        vertex: {
          module: this.shaderModule,
          entryPoint: "vsMain",
          buffers: [
            {arrayStride: 3 * 4, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]},
            {arrayStride: 3 * 4, attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}]}
          ]
        },
        fragment: {
          module: this.shaderModule,
          entryPoint: "fsMain",
          targets: [
            {
              format: this.format,
              blend: {
                color: {srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add"},
                alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
              }
            },
            {format: 'rgba16float'},
            {format: 'rgba16float'}
          ]
        },
        primitive: {topology: "line-list"},
        depthStencil: {
          depthWriteEnabled: false,
          depthCompare: "always",
          format: "depth24plus"
        }
      });

      GizmoEffect._pipelineCache.set(device, {
        pipeline: this.pipeline,
        bindGroupLayout: this.bindGroupLayout,
        pipelineLayout: this.pipelineLayout,
        shaderModule: this.shaderModule
      });
    }

    this._createTranslateGizmo();

    this.modelBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.gizmoSettingsBuffer = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this._updateGizmoSettings();

    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: {buffer: this.gizmoSettingsBuffer}}
      ]
    });

    setTimeout(() => {dispatchEvent(new CustomEvent('update-effects', {}))}, 200)
  }

  _createTranslateGizmo() {
    const axisLength = 1.0;
    const arrowSize = 0.05;
    const positions = new Float32Array([
      0, 0, 0, axisLength, 0, 0,
      axisLength, 0, 0, axisLength - arrowSize, arrowSize, 0,
      axisLength, 0, 0, axisLength - arrowSize, -arrowSize, 0,
      axisLength, 0, 0, axisLength - arrowSize, 0, arrowSize,
      axisLength, 0, 0, axisLength - arrowSize, 0, -arrowSize,
      0, 0, 0, 0, axisLength, 0,
      0, axisLength, 0, arrowSize, axisLength - arrowSize, 0,
      0, axisLength, 0, -arrowSize, axisLength - arrowSize, 0,
      0, axisLength, 0, 0, axisLength - arrowSize, arrowSize,
      0, axisLength, 0, 0, axisLength - arrowSize, -arrowSize,
      0, 0, 0, 0, 0, axisLength,
      0, 0, axisLength, arrowSize, 0, axisLength - arrowSize,
      0, 0, axisLength, -arrowSize, 0, axisLength - arrowSize,
      0, 0, axisLength, 0, arrowSize, axisLength - arrowSize,
      0, 0, axisLength, 0, -arrowSize, axisLength - arrowSize,
    ]);

    const colors = new Float32Array([
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    ]);

    this.vertexBuffer = this.device.createBuffer({size: positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.vertexBuffer, 0, positions);
    this.colorBuffer = this.device.createBuffer({size: colors.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.colorBuffer, 0, colors);
    this.vertexCount = positions.length / 3;
  }

  _setupEventListeners() {
    // --- STANDALONE GIZMO SCREEN-SPACE HIT TEST ON MOUSDOWN ---
    app.canvas.addEventListener("mousedown", (e) => {
      if (!this.enabled || !this.parentMesh) return;

      // Check if mouse click hits the gizmo in 2D screen space (tolerance box/rect around handles)
      const clickedAxis = this._checkScreenSpaceGizmoHit(e);
      if (clickedAxis > 0) {
        // Stop event from propagating to the scene raycaster so it doesn't switch objects!
        e.stopImmediatePropagation();
        e.preventDefault();

        this.selectedAxis = clickedAxis;
        this.dragAxis = clickedAxis;
        this.initialPositionCache.x = this.parentMesh.position.x;
        this.initialPositionCache.y = this.parentMesh.position.y;
        this.initialPositionCache.z = this.parentMesh.position.z;

        this._updateGizmoSettings();
        this.isDragging = true;
        window.__isDragging = true;
         setTimeout(() => {dispatchEvent(new CustomEvent('update-effects', {})) }, 10)
        console.log('Gizmo standalone screen-space hit! Axis:', clickedAxis);
      }
    }, true); // Use capture phase to intercept before scene raycaster

    app.canvas.addEventListener("ray.hit.mousedown", (e) => {
      const detail = e.detail;
      if(detail.hitObject === this.parentMesh && detail.hitObject.name === this.parentMesh.name) {
        console.log('test _handleRayHit ')
        this._handleRayHit(detail);
      } else {
        e.detail.hitObject.effects.gizmoEffect = this;
        if(this.parentMesh && this.parentMesh.effects) {
          this.parentMesh.effects.gizmoEffect = null;
        }
        this.parentMesh = e.detail.hitObject;
        app.editor.editorHud.updateSceneObjPropertiesFromGizmo(this.parentMesh.name);
      }
    });

    app.canvas.addEventListener("mousemove", (e) => {
      if(this.isDragging && e.buttons === 1) {
        this._handleDrag(e);
      } else if(this.isDragging && e.buttons === 0) {
        this.isDragging = false;
        window.__isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
      }
    });

    app.canvas.addEventListener("mouseup", () => {
      if(this.isDragging) {
        if(this.parentMesh._GRAPH_CACHE) return;
        if(this.mode == 0) {
          this.editorUpdatePosEvent.detail.inputFor = this.parentMesh.name;
          this.editorUpdatePosEvent.detail.propertyId = "position";
          this.editorUpdatePosEvent.detail.property = this.selectedAxis == 1 ? "x" : this.selectedAxis == 2 ? "y" : "z";
          this.editorUpdatePosEvent.detail.value = this.selectedAxis == 1 ? this.parentMesh.position.x : this.selectedAxis == 2 ? this.parentMesh.position.y : this.parentMesh.position.z;
          document.dispatchEvent(this.editorUpdatePosEvent);
        } else if(this.mode == 1) {
          this.editorUpdateRotEvent.detail.inputFor = this.parentMesh.name;
          this.editorUpdateRotEvent.detail.propertyId = "rotation";
          this.editorUpdateRotEvent.detail.property = this.selectedAxis == 1 ? "x" : this.selectedAxis == 2 ? "y" : "z";
          this.editorUpdateRotEvent.detail.value = this.selectedAxis == 1 ? this.parentMesh.rotation.x : this.selectedAxis == 2 ? this.parentMesh.rotation.y : this.parentMesh.rotation.z;
          document.dispatchEvent(this.editorUpdateRotEvent);
        } else if(this.mode == 2) {
          this.editorUpdateScaleEvent.detail.inputFor = this.parentMesh.name;
          this.editorUpdateScaleEvent.detail.propertyId = "scale";
          this.editorUpdateScaleEvent.detail.property = this.selectedAxis == 1 ? "0" : this.selectedAxis == 2 ? "1" : "2";
          this.editorUpdateScaleEvent.detail.value = this.selectedAxis == 1 ? this.parentMesh.rotation.x : this.selectedAxis == 2 ? this.parentMesh.rotation.y : this.parentMesh.rotation.z;
          document.dispatchEvent(this.editorUpdateScaleEvent);
        }
        this.isDragging = false;
        window.__isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
      }
    });
  }

  // --- Screen-Space Hit Rect Check (Like Professional Engines) ---
  _checkScreenSpaceGizmoHit(mouseEvent) {
    if (!app.getCamera() || !this.parentMesh) return 0;

    const rect = app.canvas.getBoundingClientRect();
    const mouseX = mouseEvent.clientX - rect.left;
    const mouseY = mouseEvent.clientY - rect.top;

    const viewMatrix = app.getCamera().view;
    const projMatrix = app.getCamera().projectionMatrix;
    const origin3D = this.parentMesh.position;

    // Project gizmo center (origin) to screen
    const screenOrigin = this._worldToScreen(origin3D, viewMatrix, projMatrix);
    const axisLengthWorld = 1.0 * (this.size * 0.3); // Scale with gizmo size

    // Check each axis (1: X-Axis, 2: Y-Axis, 3: Z-Axis)
    for (let i = 1; i <= 3; i++) {
      let end3D = {
        x: origin3D.x + (i === 1 ? axisLengthWorld : 0),
        y: origin3D.y + (i === 2 ? axisLengthWorld : 0),
        z: origin3D.z + (i === 3 ? axisLengthWorld : 0)
      };

      const screenEnd = this._worldToScreen(end3D, viewMatrix, projMatrix);

      // Distance from mouse point to the line segment (screen space) with a 15-pixel hit threshold rect/area
      const dist = this._pointToSegmentDistance(mouseX, mouseY, screenOrigin.x, screenOrigin.y, screenEnd.x, screenEnd.y);
      
      // 15 pixels tolerance rectangle area around the gizmo handle line
      if (dist < 15.0) {
        return i;
      }
    }

    return 0;
  }

  _pointToSegmentDistance(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _handleRayHit(detail) {
    const {rayOrigin, rayDirection, hitPoint} = detail;
    const axis = this._raycastAxis(rayOrigin, rayDirection, detail.hitObject);
    if(axis > 0) {
      this.selectedAxis = axis;
      this.dragStartPointCache[0] = hitPoint[0];
      this.dragStartPointCache[1] = hitPoint[1];
      this.dragStartPointCache[2] = hitPoint[2];

      this.initialPositionCache.x = this.parentMesh.position.x;
      this.initialPositionCache.y = this.parentMesh.position.y;
      this.initialPositionCache.z = this.parentMesh.position.z;

      this.dragAxis = axis;
      this._updateGizmoSettings();
      this.isDragging = true;
      setTimeout(() => {dispatchEvent(new CustomEvent('update-effects', {})) }, 10)
      window.__isDragging = true;
    }
  }

  _getAxisScreenDirection(axisIndex) {
    let xDir = 0, yDir = 0, zDir = 0;
    if(axisIndex === 0) xDir = 1;
    else if(axisIndex === 1) yDir = 1;
    else if(axisIndex === 2) zDir = 1;

    const viewMatrix = app.getCamera().view;
    const projMatrix = app.getCamera().projectionMatrix;
    const p1 = this.parentMesh.position;

    this._p2Cache.x = p1.x + xDir;
    this._p2Cache.y = p1.y + yDir;
    this._p2Cache.z = p1.z + zDir;

    const screen1 = this._worldToScreen(p1, viewMatrix, projMatrix);
    const s1X = screen1.x, s1Y = screen1.y;

    const screen2 = this._worldToScreen(this._p2Cache, viewMatrix, projMatrix);

    const dx = screen2.x - s1X;
    const dy = screen2.y - s1Y;
    const length = Math.sqrt(dx * dx + dy * dy);

    this._axisScreenDirCache.x = length > 0.001 ? dx / length : 0;
    this._axisScreenDirCache.y = length > 0.001 ? dy / length : 0;

    return this._axisScreenDirCache;
  }

  _worldToScreen(worldPos, viewMatrix, projMatrix) {
    const clipPos = this._transformPoint(worldPos, viewMatrix, projMatrix);
    const ndcX = clipPos.x / clipPos.w;
    const ndcY = clipPos.y / clipPos.w;

    return {
      x: (ndcX + 1) * 0.5 * app.canvas.width,
      y: (1 - ndcY) * 0.5 * app.canvas.height
    };
  }

  _transformPoint(point, viewMatrix, projMatrix) {
    const vp = this._multiplyMatrices(projMatrix, viewMatrix);
    const x = vp[0] * point.x + vp[4] * point.y + vp[8] * point.z + vp[12];
    const y = vp[1] * point.x + vp[5] * point.y + vp[9] * point.z + vp[13];
    const z = vp[2] * point.x + vp[6] * point.y + vp[10] * point.z + vp[14];
    const w = vp[3] * point.x + vp[7] * point.y + vp[11] * point.z + vp[15];

    this._p2Cache.x = x;
    this._p2Cache.y = y;
    this._p2Cache.z = z;
    this._p2Cache.w = w;
    return this._p2Cache;
  }

  _multiplyMatrices(a, b) {
    let out = this.matrixResultCache;
    let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    let b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    let b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    let b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    return out;
  }

  _handleDrag(mouseEvent) {
    if(!this.parentMesh || !this.isDragging) return;
    const deltaX = mouseEvent.movementX;
    const deltaY = mouseEvent.movementY;
    const direction = deltaX > Math.abs(deltaY) ? deltaX : -deltaY;
    switch(this.mode) {
      case 0:
        switch(this.dragAxis) {
          case 1: this.parentMesh.position.x += deltaX * this.movementScale; break;
          case 2: this.parentMesh.position.y -= deltaY * this.movementScale; break;
          case 3: this.parentMesh.position.z -= (deltaX - deltaY) * this.movementScale; break;
        }
        break;
      case 1:
        const rotSpeed = 0.1;
        switch(this.dragAxis) {
          case 1: this.parentMesh.rotation.x += deltaY * rotSpeed; break;
          case 2: this.parentMesh.rotation.y += deltaX * rotSpeed; break;
          case 3: this.parentMesh.rotation.z += direction * rotSpeed; break;
        }
        break;
      case 2:
        const scaleSpeed = 0.01;
        switch(this.dragAxis) {
          case 1: this.parentMesh.scale[0] += deltaX * scaleSpeed; break;
          case 2: this.parentMesh.scale[1] += -deltaY * scaleSpeed; break;
          case 3: this.parentMesh.scale[2] += -direction * scaleSpeed; break;
        }
        break;
    }
  }

  _raycastAxis(rayOrigin, rayDirection, mesh) {
    const mX = mesh.position.x, mY = mesh.position.y, mZ = mesh.position.z;
    const threshold = 0.1 * this.size;
    const ext = 2 * this.size;

    const start = this._rayIntersectsCache.lineStart;
    start[0] = mX; start[1] = mY; start[2] = mZ;

    const end = this._rayIntersectsCache.lineEnd;

    end[0] = mX + ext; end[1] = mY; end[2] = mZ;
    if(this._rayIntersectsLine(rayOrigin, rayDirection, start, end, threshold)) return 1;

    end[0] = mX; end[1] = mY + ext; end[2] = mZ;
    if(this._rayIntersectsLine(rayOrigin, rayDirection, start, end, threshold)) return 2;

    end[0] = mX; end[1] = mY; end[2] = mZ + ext;
    if(this._rayIntersectsLine(rayOrigin, rayDirection, start, end, threshold * 2)) return 3;

    return 0;
  }

  _rayIntersectsLine(rayOrigin, rayDir, lineStart, lineEnd, threshold) {
    const cache = this._rayIntersectsCache;

    cache.ro[0] = rayOrigin[0]; cache.ro[1] = rayOrigin[1]; cache.ro[2] = rayOrigin[2];

    const rd0 = rayDir[0], rd1 = rayDir[1], rd2 = rayDir[2];
    const rdLen = Math.sqrt(rd0 * rd0 + rd1 * rd1 + rd2 * rd2);

    cache.rd[0] = rd0 / rdLen;
    cache.rd[1] = rd1 / rdLen;
    cache.rd[2] = rd2 / rdLen;

    cache.line[0] = lineEnd[0] - lineStart[0];
    cache.line[1] = lineEnd[1] - lineStart[1];
    cache.line[2] = lineEnd[2] - lineStart[2];

    cache.w[0] = cache.ro[0] - lineStart[0];
    cache.w[1] = cache.ro[1] - lineStart[1];
    cache.w[2] = cache.ro[2] - lineStart[2];

    const a = cache.rd[0] * cache.rd[0] + cache.rd[1] * cache.rd[1] + cache.rd[2] * cache.rd[2];
    const b = cache.rd[0] * cache.line[0] + cache.rd[1] * cache.line[1] + cache.rd[2] * cache.line[2];
    const c = cache.line[0] * cache.line[0] + cache.line[1] * cache.line[1] + cache.line[2] * cache.line[2];
    const d = cache.rd[0] * cache.w[0] + cache.rd[1] * cache.w[1] + cache.rd[2] * cache.w[2];
    const e = cache.line[0] * cache.w[0] + cache.line[1] * cache.w[1] + cache.line[2] * cache.w[2];

    const denom = a * c - b * b;
    if(Math.abs(denom) < 0.0000001) return false;

    const sc = (b * e - c * d) / denom;
    const tc = (a * e - b * d) / denom;
    if(tc < 0 || tc > 1) return false;

    cache.closestOnRay[0] = cache.ro[0] + sc * cache.rd[0];
    cache.closestOnRay[1] = cache.ro[1] + sc * cache.rd[1];
    cache.closestOnRay[2] = cache.ro[2] + sc * cache.rd[2];

    cache.closestOnLine[0] = lineStart[0] + tc * cache.line[0];
    cache.closestOnLine[1] = lineStart[1] + tc * cache.line[1];
    cache.closestOnLine[2] = lineStart[2] + tc * cache.line[2];

    const dX = cache.closestOnRay[0] - cache.closestOnLine[0];
    const dY = cache.closestOnRay[1] - cache.closestOnLine[1];
    const dZ = cache.closestOnRay[2] - cache.closestOnLine[2];
    const dist = Math.sqrt(dX * dX + dY * dY + dZ * dZ);

    return dist < threshold;
  }

  destroy() {
    removeEventListener("editor-set-gizmo-mode", this._onGizmoModeChange);
  }

  _updateGizmoSettings() {
    this.gizmoSettingsCache[0] = this.mode;
    this.gizmoSettingsCache[1] = this.size;
    this.gizmoSettingsCache[2] = this.selectedAxis;
    this.gizmoSettingsCache[3] = 1.0;
    this.device.queue.writeBuffer(this.gizmoSettingsBuffer, 0, this.gizmoSettingsCache);
  }

  updateInstanceData(baseModelMatrix) {
    this.device.queue.writeBuffer(this.modelBuffer, 0, baseModelMatrix);
  }

  draw(pass, cameraMatrix) {
    if(!this.enabled) return;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.colorBuffer);
    pass.draw(this.vertexCount);
  }

  render(pass, mesh, viewProjMatrix) {
    if(mesh !== this.parentMesh) return;
    this.draw(pass, viewProjMatrix);
  }

  setMode(mode) {
    this.mode = mode;
    this._updateGizmoSettings();
  }

  setSize(size) {
    this.size = size;
    this._updateGizmoSettings();
  }

  setSelectedAxis(axis) {
    this.selectedAxis = axis;
    this._updateGizmoSettings();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}