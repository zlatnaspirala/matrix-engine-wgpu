import {gizmoEffect} from "../../shaders/gizmo/gimzoShader";
import {byId} from "../utils";

export class GizmoEffect {
  constructor(device, format) {
    this.device = device;
    this.format = format;
    this.enabled = true;
    this.mode = 0;
    this.size = 3;
    this.selectedAxis = 0;
    this.movementScale = 0.035;
    this.isDragging = false;
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
    this.initialPositionCache = { x: 0, y: 0, z: 0 };
    
    // Flattened caches for tracking vectors without allocations
    this._axisScreenDirCache = { x: 0, y: 0 };
    this._p2Cache = { x: 0, y: 0, z: 0 };
    this._rayIntersectsCache = {
      ro: new Float32Array(3),
      rd: new Float32Array(3),
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
    this._createTranslateGizmo();
    this.cameraBuffer = this.device.createBuffer({size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.modelBuffer = this.device.createBuffer({size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.gizmoSettingsBuffer = this.device.createBuffer({size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this._updateGizmoSettings();
    
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}},
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: {buffer: this.gizmoSettingsBuffer}},
      ]
    });
    const shaderModule = this.device.createShaderModule({code: gizmoEffect});
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });
    this.pipeline = this.device.createRenderPipeline({
      label: 'gizmo Pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}] },
          { arrayStride: 3 * 4, attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}] }
        ]
      },
      fragment: {
        module: shaderModule,
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
  }

  _createTranslateGizmo() {
    const axisLength = 2.0;
    const arrowSize = 0.15;
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
    app.canvas.addEventListener("ray.hit.mousedown", (e) => {
      const detail = e.detail;
      if(detail.hitObject === this.parentMesh && detail.hitObject.name === this.parentMesh.name) {
        console.log('test _handleRayHit ')
        this._handleRayHit(detail);
      } else {
        e.detail.hitObject.effects.gizmoEffect = this;
        if (this.parentMesh && this.parentMesh.effects) {
          this.parentMesh.effects.gizmoEffect = null;
        }
        this.parentMesh = e.detail.hitObject;
        app.editor.editorHud.updateSceneObjPropertiesFromGizmo(this.parentMesh.name);
      }
    });

    app.canvas.addEventListener("mousemove", (e) => {
      if(this.isDragging && e.buttons === 1) {
        this._handleDrag(e);
        // if(app.cameras.WASD) app.cameras.WASD.suspendDrag = true;
      } else if(this.isDragging && e.buttons === 0) {
        this.isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
      } else {
        // if(app.cameras.WASD) app.cameras.WASD.suspendDrag = false;
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
        console.log('this.isDragging = false;')
        this.isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
      }
    });
  }

  _handleRayHit(detail) {
    const {rayOrigin, rayDirection, hitPoint} = detail;
    const axis = this._raycastAxis(rayOrigin, rayDirection, detail.hitObject);
    if(axis > 0) {
      this.selectedAxis = axis;
      
      // Zero allocations write to tracking buffers
      this.dragStartPointCache[0] = hitPoint[0];
      this.dragStartPointCache[1] = hitPoint[1];
      this.dragStartPointCache[2] = hitPoint[2];

      this.initialPositionCache.x = this.parentMesh.position.x;
      this.initialPositionCache.y = this.parentMesh.position.y;
      this.initialPositionCache.z = this.parentMesh.position.z;

      this.dragAxis = axis;
      this._updateGizmoSettings();
      console.log('this.isDragging = true;')
      this.isDragging = true;
    }
  }

  _getAxisScreenDirection(axisIndex) {
    // Perform manual mapping instead of initializing structural inner lists
    let xDir = 0, yDir = 0, zDir = 0;
    if (axisIndex === 0) xDir = 1;
    else if (axisIndex === 1) yDir = 1;
    else if (axisIndex === 2) zDir = 1;

    const viewMatrix = app.getCamera().view;
    const projMatrix = app.getCamera().projectionMatrix;
    const p1 = this.parentMesh.position;
    
    // Write directly to reusable object memory
    this._p2Cache.x = p1.x + xDir;
    this._p2Cache.y = p1.y + yDir;
    this._p2Cache.z = p1.z + zDir;

    const screen1 = this._worldToScreen(p1, viewMatrix, projMatrix);
    const s1X = screen1.x, s1Y = screen1.y; // Copy out primitive fields
    
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

    // Use a single returned local mutable coordinate representation to avoid heap footprint
    this._p2Cache.x = (ndcX + 1) * 0.5 * app.canvas.width;
    this._p2Cache.y = (1 - ndcY) * 0.5 * app.canvas.height;
    return this._p2Cache;
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

  _handleDrag(mouseEvent) {
    if(!this.parentMesh || !this.isDragging) return;
    if(this.parentMesh.dontDrag && byId('graph-status').innerText === "🔴") return;
    const deltaX = mouseEvent.movementX;
    const deltaY = mouseEvent.movementY;
    const direction = deltaX > Math.abs(deltaY) ? deltaX : -deltaY;
    switch(this.mode) {
      case 0:
        switch(this.dragAxis) {
          case 1: this.parentMesh.position.x += deltaX * this.movementScale; break;
          case 2: this.parentMesh.position.y -= deltaY * this.movementScale; break;
          case 3:
            const zAxisScreenDir = this._getAxisScreenDirection(2);
            const movement = (deltaX * zAxisScreenDir.x + (-deltaY) * zAxisScreenDir.y);
            this.parentMesh.position.z += movement * this.movementScale;
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

    // Direct initialization into primitive values instead of wrapper tracking structures
    const start = this._rayIntersectsCache.ro; // reuse array pointers
    start[0] = mX; start[1] = mY; start[2] = mZ;

    const end = this._rayIntersectsCache.rd;
    
    // X Axis check
    end[0] = mX + ext; end[1] = mY; end[2] = mZ;
    if(this._rayIntersectsLine(rayOrigin, rayDirection, start, end, threshold)) return 1;

    // Y Axis check
    end[0] = mX; end[1] = mY + ext; end[2] = mZ;
    if(this._rayIntersectsLine(rayOrigin, rayDirection, start, end, threshold)) return 2;

    // Z Axis check
    end[0] = mX; end[1] = mY; end[2] = mZ + ext;
    if(this._rayIntersectsLine(rayOrigin, rayDirection, start, end, threshold)) return 3;

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
    if(Math.abs(denom) < 0.0001) return false;

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

  // Lifecycle cleanup method to completely eliminate global memory retention loops
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

  // ... rest of structural binding configurations unchanged ...
  updateInstanceData(baseModelMatrix) {
    this.device.queue.writeBuffer(this.modelBuffer, 0, baseModelMatrix);
  }

  draw(pass, cameraMatrix) {
    if(!this.enabled) return;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.colorBuffer);
    pass.draw(this.vertexCount);
  }

  render(pass, mesh, viewProjMatrix) {
    this.parentMesh = mesh;
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