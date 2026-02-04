import {gizmoEffect} from "../../shaders/gizmo/gimzoShader";

export class GizmoEffect {
  constructor(device, format) {
    this.device = device;
    this.format = format;
    this.enabled = true;
    this.mode = 0; // 0=translate, 1=rotate, 2=scale
    this.size = 1.0;
    this.selectedAxis = 0; // 0=none, 1=X, 2=Y, 3=Z
    this.movementScale = 0.01;
    this.isDragging = false;
    this.dragStartPoint = null;
    this.dragAxis = 0;
    this.parentMesh = null;
    this.initialPosition = null;
    this._initPipeline();
    this._setupEventListeners();
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
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: 3 * 4,
            attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]
          },
          {
            arrayStride: 3 * 4,
            attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: {srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add"},
            alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
          }
        }]
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
      1, 0, 0, 1, 0, 0,
      1, 0, 0, 1, 0, 0,
      1, 0, 0, 1, 0, 0,
      1, 0, 0, 1, 0, 0,
      1, 0, 0, 1, 0, 0,
      // Y axis (green)
      0, 1, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 0,
      0, 1, 0, 0, 1, 0,
      // Z axis (blue)
      0, 0, 1, 0, 0, 1,
      0, 0, 1, 0, 0, 1,
      0, 0, 1, 0, 0, 1,
      0, 0, 1, 0, 0, 1,
      0, 0, 1, 0, 0, 1,
    ]);

    this.vertexBuffer = this.device.createBuffer({size: positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.vertexBuffer, 0, positions);
    this.colorBuffer = this.device.createBuffer({size: colors.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.colorBuffer, 0, colors);
    this.vertexCount = positions.length / 3;
  }

  _setupEventListeners() {
    app.canvas.addEventListener("ray.hit.mousedown", (e) => {
      if(!this.enabled || !this.parentMesh) return;
      const detail = e.detail;
      if(detail.hitObject === this.parentMesh || detail.hitObject.name === this.parentMesh.name) {
        this._handleRayHit(detail);
      }
    });
    app.canvas.addEventListener("mousemove", (e) => {
      if(this.isDragging && e.buttons === 1) {
        this._handleDrag(e);
        if(app.cameras.WASD) app.cameras.WASD.suspendDrag = true;
      } else if(this.isDragging && e.buttons === 0) {
        this.isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
      } else {
        if(app.cameras.WASD) app.cameras.WASD.suspendDrag = false;
      }
    });
    app.canvas.addEventListener("mouseup", () => {
      if(this.isDragging) {
        this.isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
        // console.log('Gizmo: Stopped dragging');
      }
    });
  }

  _handleRayHit(detail) {
    const {rayOrigin, rayDirection, hitPoint, button, eventName} = detail;
    const axis = this._raycastAxis(rayOrigin, rayDirection, detail.hitObject);
    if(axis > 0) {
      this.selectedAxis = axis;
      this.dragStartPoint = [...hitPoint];
      this.initialPosition = {
        x: this.parentMesh.position.x,
        y: this.parentMesh.position.y,
        z: this.parentMesh.position.z
      };
      this.dragAxis = axis;
      this._updateGizmoSettings();
      this.isDragging = true;
    }
  }

  _handleDrag(mouseEvent) {
    if(!this.parentMesh || !this.dragStartPoint || !this.isDragging) return;
    const deltaX = mouseEvent.movementX;
    const deltaY = mouseEvent.movementY;
    const direction = deltaX > Math.abs(deltaY) ? deltaX : -deltaY;
    switch(this.mode) {
      case 0:
        switch(this.dragAxis) {
          case 1: this.parentMesh.position.x += deltaX * this.movementScale; break;
          case 2: this.parentMesh.position.y -= deltaY * this.movementScale; break;
          case 3: this.parentMesh.position.z -= direction * this.movementScale; break;
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
    const gizmoPos = [
      mesh.position.x,
      mesh.position.y,
      mesh.position.z
    ];
    const threshold = 1.0 * this.size;
    const xEnd = [gizmoPos[0] + 2 * this.size, gizmoPos[1], gizmoPos[2]];
    const xHit = this._rayIntersectsLine(rayOrigin, rayDirection, gizmoPos, xEnd, threshold);
    if(xHit) return 1;
    const yEnd = [gizmoPos[0], gizmoPos[1] + 2 * this.size, gizmoPos[2]];
    const yHit = this._rayIntersectsLine(rayOrigin, rayDirection, gizmoPos, yEnd, threshold);
    if(yHit) return 2;
    const zEnd = [gizmoPos[0], gizmoPos[1], gizmoPos[2] + 2 * this.size];
    const zHit = this._rayIntersectsLine(rayOrigin, rayDirection, gizmoPos, zEnd, threshold);
    if(zHit) return 3;
    return 0;
  }

  _rayIntersectsLine(rayOrigin, rayDir, lineStart, lineEnd, threshold) {
    const ro = Array.isArray(rayOrigin) ? rayOrigin : [rayOrigin[0], rayOrigin[1], rayOrigin[2]];
    const rd = [rayDir[0], rayDir[1], rayDir[2]];
    const rdLen = Math.sqrt(rd[0] ** 2 + rd[1] ** 2 + rd[2] ** 2);
    const ray = [rd[0] / rdLen, rd[1] / rdLen, rd[2] / rdLen];
    const line = [
      lineEnd[0] - lineStart[0],
      lineEnd[1] - lineStart[1],
      lineEnd[2] - lineStart[2]
    ];
    const w = [
      ro[0] - lineStart[0],
      ro[1] - lineStart[1],
      ro[2] - lineStart[2]
    ];
    const a = ray[0] ** 2 + ray[1] ** 2 + ray[2] ** 2;
    const b = ray[0] * line[0] + ray[1] * line[1] + ray[2] * line[2];
    const c = line[0] ** 2 + line[1] ** 2 + line[2] ** 2;
    const d = ray[0] * w[0] + ray[1] * w[1] + ray[2] * w[2];
    const e = line[0] * w[0] + line[1] * w[1] + line[2] * w[2];
    const denom = a * c - b * b;
    if(Math.abs(denom) < 0.0001) return false;
    const sc = (b * e - c * d) / denom;
    const tc = (a * e - b * d) / denom;
    if(tc < 0 || tc > 1) return false;
    const closestOnRay = [
      ro[0] + sc * ray[0],
      ro[1] + sc * ray[1],
      ro[2] + sc * ray[2]
    ];
    const closestOnLine = [
      lineStart[0] + tc * line[0],
      lineStart[1] + tc * line[1],
      lineStart[2] + tc * line[2]
    ];
    const dist = Math.sqrt((closestOnRay[0] - closestOnLine[0]) ** 2 + (closestOnRay[1] - closestOnLine[1]) ** 2 + (closestOnRay[2] - closestOnLine[2]) ** 2);
    // console.log('Distance to line:', dist, 'threshold:', threshold);
    return dist < threshold;
  }

  _updateGizmoSettings() {
    const data = new Float32Array([this.mode, this.size, this.selectedAxis, 1.0]);
    this.device.queue.writeBuffer(this.gizmoSettingsBuffer, 0, data);
  }

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