import {mat4} from "wgpu-matrix";

export class SpritesPack2D {
  constructor(device, format, colorFormat, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.colorFormat = colorFormat ?? format;
    this.cameraBuffer = cameraBuffer;
    this.sprites = new Map();
    this.spriteSheets = new Map();
    this.enabled = true;
    this.shared = null;
    this._initSharedResources();
  }

  _initSharedResources() {
    if(this.shared) return;
    const shaderModule = this.device.createShaderModule({code: SpriteInstance._getShaderCode()});
    // QUAD GEOMETRY
    const positions = new Float32Array([
      -1, -1, 0,
      1, -1, 0,
      1, 1, 0,
      -1, 1, 0,
    ]);

    const uvs = new Float32Array([
      0, 1,
      1, 1,
      1, 0,
      0, 0
    ]);

    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3
    ]);

    const vertexBuffer =
      this.device.createBuffer({
        size: positions.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
    new Float32Array(vertexBuffer.getMappedRange()).set(positions);
    vertexBuffer.unmap();

    const uvBuffer = this.device.createBuffer({
      size: uvs.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(uvBuffer.getMappedRange()).set(uvs);
    uvBuffer.unmap();

    const indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Uint16Array(indexBuffer.getMappedRange()).set(indices);
    indexBuffer.unmap();

    // LAYOUTS
    const cameraBindGroupLayout =
      this.device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: "uniform"}, },
          {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "uniform"}, }
        ],
      });

    const spriteBindGroupLayout =
      this.device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: "float"}, },
          {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: "filtering"}, },
        ],
      });

    const pipeline =
      this.device.createRenderPipeline({
        layout:
          this.device.createPipelineLayout({
            bindGroupLayouts: [
              cameraBindGroupLayout,
              spriteBindGroupLayout
            ]
          }),
        vertex: {
          module: shaderModule,
          entryPoint: "vsMain",
          buffers: [
            {
              arrayStride: 12,
              attributes: [
                {shaderLocation: 0, offset: 0, format: "float32x3"}
              ]
            },
            {
              arrayStride: 8,
              attributes: [
                {shaderLocation: 1, offset: 0, format: "float32x2"}
              ]
            }
          ]
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fsMain",
          targets: [
            {
              format: this.colorFormat,
              blend: {
                color: {
                  srcFactor: 'one', //"src-alpha",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add"
                },
                alpha: {
                  srcFactor: "one",
                  dstFactor: "one-minus-src-alpha",
                  operation: "add"
                }
              }
            },
            {format: "rgba16float"},
            {format: "rgba16float"}
          ]
        },

        primitive: {
          topology: "triangle-list"
        },

        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: "less-equal",
          format: "depth24plus"
        }
      });

    this.shared = {
      pipeline,
      cameraBindGroupLayout,
      spriteBindGroupLayout,
      vertexBuffer,
      uvBuffer,
      indexBuffer,
      indexCount: 6
    };
  }

  /**
   * Register a spritesheet texture (can be shared across multiple sprites)
   */
  async registerSpritesheet(name, imageSource, gridCols, gridRows) {
    const texture = await this._loadTexture(imageSource);
    const sampler = this.device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
    });

    this.spriteSheets.set(name, {
      texture,
      textureView: texture.createView(),
      sampler,
      gridCols,
      gridRows,
      totalFrames: gridCols * gridRows,
    });

    return this.spriteSheets.get(name);
  }

  /**
   * Create a new sprite using registered spritesheet
   */
  createSprite(spriteName, spritesheetName, config = {}) {
    const sheet = this.spriteSheets.get(spritesheetName);
    if(!sheet) throw new Error(`Spritesheet "${spritesheetName}" not found`);

    const sprite = new SpriteInstance(
      this.device,
      this.format,
      this.colorFormat,
      this.cameraBuffer,
      sheet,
      spritesheetName,
      config,
      this.shared
    );

    this.sprites.set(spriteName, sprite);
    return sprite;
  }

  /**
   * Get sprite by name (for state manipulation)
   */
  getSprite(spriteName) {
    return this.sprites.get(spriteName);
  }

  /**
   * Remove sprite
   */
  removeSprite(spriteName) {
    this.sprites.delete(spriteName);
  }

  _getDistance(sprite, cameraPosition) {
    // Extract the sprite's world position from its local matrix 
    // or store an explicit worldPosition property on the sprite.
    // Since you use localOffset in the sprite, we can use that:
    const spritePos = sprite.localOffset;

    const dx = spritePos[0] - cameraPosition[0];
    const dy = spritePos[1] - cameraPosition[1];
    const dz = spritePos[2] - cameraPosition[2];

    return dx * dx + dy * dy + dz * dz; // Squared distance is faster (no Math.sqrt)
  }

  render(pass, mesh, viewProjMatrix) {
    if(!this.enabled) return;

    let baseModelMatrix = mesh._modelMatrix;

    // Update all sprites
    for(const [, sprite] of this.sprites) {
      sprite.updateInstanceData(baseModelMatrix);
    }


    // 1. Convert Map to Array
    const spriteArray = Array.from(this.sprites.values());

    // 2. Sort sprites by distance from camera 
    // (You need to calculate distance based on camera position)
    const cameraPosition = app.getCamera().position;
spriteArray.sort((a, b) => {
    const distA = this._getDistance(a, cameraPosition);
    const distB = this._getDistance(b, cameraPosition);
    return distB - distA; 
  });
    // 3. Draw in sorted order
    for(const sprite of spriteArray) {
      const sheet = this.spriteSheets.get(sprite.spritesheetName);
      if(!sheet) continue;
      sprite.draw(pass, viewProjMatrix, sheet);
    }

    // // Draw all sprites
    // for(const [, sprite] of this.sprites) {
    //   const sheet = this.spriteSheets.get(sprite.spritesheetName);
    //   if(!sheet) continue;
    //   sprite.draw(pass, viewProjMatrix, sheet);
    // }
  }

  /**
   * Cleanup
   */
  destroy() {
    for(const [, sprite] of this.sprites) {
      sprite.destroy();
    }
    for(const [, sheet] of this.spriteSheets) {
      sheet.texture.destroy();
    }
    this.sprites.clear();
    this.spriteSheets.clear();
  }

  /**
   * Helper: Load image to texture
   */
  async _loadTexture(imageSource) {
    let bitmap;

    if(typeof imageSource === "string") {
      const response = await fetch(imageSource);
      const blob = await response.blob();
      bitmap = await createImageBitmap(blob);
    } else if(imageSource instanceof Blob) {
      bitmap = await createImageBitmap(imageSource);
    } else if(imageSource instanceof ImageBitmap) {
      bitmap = imageSource;
    }

    const texture = this.device.createTexture({
      size: [bitmap.width, bitmap.height, 1],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture(
      {source: bitmap},
      {texture},
      [bitmap.width, bitmap.height]
    );

    return texture;
  }

  destroy() {
    for(const [, sprite] of this.sprites) {
      sprite.destroy();
    }
    for(const [, sheet] of this.spriteSheets) {
      sheet.texture.destroy();
    }
    this.sprites.clear();
    this.spriteSheets.clear();
  }
}

/**
 * SpriteInstance - Individual sprite with shared pipeline/texture
 */
class SpriteInstance {
  constructor(device, format, colorFormat, cameraBuffer, sheet, spritesheetName, config = {}, shared) {
    this.device = device;
    this.format = format;
    this.colorFormat = colorFormat;
    this.cameraBuffer = cameraBuffer;
    this.sheet = sheet;
    this.spritesheetName = spritesheetName;
    this.shared = shared;
    // State
    this.currentFrame = config.currentFrame ?? 0;
    this.playbackSpeed = config.playbackSpeed ?? 1.0;
    this.timeAccumulator = 0;
    this.loopMode = config.loop ?? true;
    this.isPlaying = config.autoPlay ?? false;
    // Transform
    this.localOffset = config.localOffset ?? [0, 0, 0];
    this.localRotation = config.localRotation ?? [0, 0, 0];
    this.scale = config.scale ?? 1.0;
    this._scaleVec = new Float32Array([1, 1, 1]);
    this.rotationSpeed = config.rotationSpeed ?? [0, 0, 0];
    this._targetRotation = new Float32Array(3);
    this._lerpSpeed = config.lerpSpeed ?? 0.05;
    // Tint
    this.tint = config.tint ?? [1, 1, 1];
    this.tintStrength = config.tintStrength ?? 0.0;
    // Buffers
    this._spriteDataBuffer = this.device.createBuffer({
      size: 112,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this._initBindGroups()
    this._localMatrix = new Float32Array(16);
    this._finalMatrix = new Float32Array(16);
    this._uniformData = new Float32Array(28);
    this.spinning = config.spinning ?? false;
    this._spinSpeed = new Float32Array([
      config.spinSpeed?.[0] ?? 0,
      config.spinSpeed?.[1] ?? 0,
      config.spinSpeed?.[2] ?? 0,
    ]);
    this.DEG2RAD = Math.PI / 180;
  }

  play(speed = 1.0, loop = true) {
    this.isPlaying = true;
    this.playbackSpeed = speed;
    this.loopMode = loop;
    this.timeAccumulator = 0;
    this.currentFrame = 0;
  }

  pause() {this.isPlaying = false;}

  resume() {this.isPlaying = true;}

  goToFrame(frameIdx) {
    this.currentFrame = Math.max(
      0,
      Math.min(frameIdx, this.sheet.totalFrames - 1)
    );
  }

  reset() {
    this.currentFrame = 0;
    this.timeAccumulator = 0;
  }

  _initBindGroups() {
    this.cameraBindGroup =
      this.device.createBindGroup({
        layout: this.shared.cameraBindGroupLayout,
        entries: [
          {binding: 0, resource: {buffer: this.cameraBuffer}},
          {binding: 1, resource: {buffer: this._spriteDataBuffer}}
        ]
      });
    this.spriteBindGroup =
      this.device.createBindGroup({
        layout: this.shared.pipeline.getBindGroupLayout(1),
        entries: [
          {binding: 0, resource: this.sheet.texture.createView()},
          {binding: 1, resource: this.sheet.sampler}
        ]
      });
  }

  updateInstanceData(baseModelMatrix) {
    // Frame update unchanged...
    if(this.isPlaying) {
      this.timeAccumulator += 0.016;
      const frameProgress = this.timeAccumulator * this.playbackSpeed;
      let nextFrame = Math.floor(frameProgress);
      if(this.loopMode) {
        nextFrame = nextFrame % this.sheet.totalFrames;
      } else {
        if(nextFrame >= this.sheet.totalFrames) {
          nextFrame = this.sheet.totalFrames - 1;
          this.isPlaying = false;
        }
      }
      this.currentFrame = nextFrame;
    }

    if(this.spinning) {
      this.localRotation[0] += this._spinSpeed[0];
      this.localRotation[1] += this._spinSpeed[1];
      this.localRotation[2] += this._spinSpeed[2];
    } else {
      // existing rotationSpeed + lerp logic
      this.localRotation[0] += this.rotationSpeed[0];
      this.localRotation[1] += this.rotationSpeed[1];
      this.localRotation[2] += this.rotationSpeed[2];
      this.localRotation[0] += (this._targetRotation[0] - this.localRotation[0]) * this._lerpSpeed;
      this.localRotation[1] += (this._targetRotation[1] - this.localRotation[1]) * this._lerpSpeed;
      this.localRotation[2] += (this._targetRotation[2] - this.localRotation[2]) * this._lerpSpeed;
    }

    mat4.identity(this._localMatrix);
    mat4.translate(this._localMatrix, this.localOffset, this._localMatrix);
    mat4.rotateX(this._localMatrix, this.localRotation[0], this._localMatrix);
    mat4.rotateY(this._localMatrix, this.localRotation[1], this._localMatrix);
    mat4.rotateZ(this._localMatrix, this.localRotation[2], this._localMatrix);
    this._scaleVec[0] = this.scale;
    this._scaleVec[1] = this.scale;
    mat4.scale(this._localMatrix, this._scaleVec, this._localMatrix);
    mat4.multiply(baseModelMatrix, this._localMatrix, this._finalMatrix);

    this._uniformData.set(this._finalMatrix, 0);
    this._uniformData[16] = this.currentFrame;
    this._uniformData[17] = this.playbackSpeed;
    this._uniformData[18] = this.timeAccumulator;
    this._uniformData[19] = this.loopMode ? 1 : 0;
    this._uniformData[20] = this.sheet.totalFrames;
    this._uniformData[21] = this.sheet.gridCols;
    this._uniformData[22] = this.sheet.gridRows;
    this._uniformData[23] = 0;
    this._uniformData[24] = this.tint[0];
    this._uniformData[25] = this.tint[1];
    this._uniformData[26] = this.tint[2];
    this._uniformData[27] = this.tintStrength;
    this.device.queue.writeBuffer(this._spriteDataBuffer, 0, this._uniformData);
  }

  startSpin(x, y, z) {
    this._spinSpeed[0] = x;
    this._spinSpeed[1] = y;
    this._spinSpeed[2] = z;
    this.spinning = true;
  }

  stopSpin() {
    this.spinning = false;
  }

  draw(pass) {
    pass.setPipeline(this.shared.pipeline);
    pass.setBindGroup(0, this.cameraBindGroup);
    pass.setBindGroup(1, this.spriteBindGroup);
    pass.setVertexBuffer(0, this.shared.vertexBuffer);
    pass.setVertexBuffer(1, this.shared.uvBuffer);
    pass.setIndexBuffer(this.shared.indexBuffer, "uint16");
    pass.drawIndexed(this.shared.indexCount);
  }

  destroy() {
    this.vertexBuffer?.destroy();
    this.uvBuffer?.destroy();
    this.indexBuffer?.destroy();
    this._spriteDataBuffer?.destroy();
  }

  setTargetRotation(x, y, z) {
    this._targetRotation[0] = x * this.DEG2RAD;
    this._targetRotation[1] = y * this.DEG2RAD;
    this._targetRotation[2] = z * this.DEG2RAD;
  }

  setRotationSpeed(x, y, z) {
    this.rotationSpeed[0] = x * this.DEG2RAD;
    this.rotationSpeed[1] = y * this.DEG2RAD;
    this.rotationSpeed[2] = z * this.DEG2RAD;
  }

  static _getShaderCode = () => {
    return `
struct Camera {
  viewProj: mat4x4f,
};

struct SpriteInstanceData {
  modelMatrix: mat4x4f,
  frameControl: vec4f,
  gridInfo: vec4f,
  tint: vec4f,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> spriteData: SpriteInstanceData;
@group(1) @binding(0) var spriteTexture: texture_2d<f32>;
@group(1) @binding(1) var spriteSampler: sampler;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) uv: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) @interpolate(flat) frame: u32,
  @location(2) fragPos: vec3f,
};

struct FragOut {
  @location(0) color: vec4f,
  @location(1) normal: vec4f,
  @location(2) worldPos: vec4f,
};

@vertex
fn vsMain(input: VertexInput) -> VertexOutput {
  let worldPos = (spriteData.modelMatrix * vec4f(input.position, 1.0)).xyz;
  let clipPos = camera.viewProj * vec4f(worldPos, 1.0);
  
  var output: VertexOutput;
  output.position = clipPos;
  output.uv = input.uv;
  output.frame = u32(spriteData.frameControl.x);
  output.fragPos = worldPos;
  
  return output;
}

@fragment
fn fsMain(input: VertexOutput) -> FragOut {
  let cols = u32(spriteData.gridInfo.y);
  let rows = u32(spriteData.gridInfo.z);
  
  let frameIdx = input.frame % u32(spriteData.gridInfo.x);
  let col = frameIdx % cols;
  let row = frameIdx / cols;
  
  let cellWidth = 1.0 / f32(cols);
  let cellHeight = 1.0 / f32(rows);
  let cellUvX = input.uv.x * cellWidth + f32(col) * cellWidth;
  let cellUvY = input.uv.y * cellHeight + f32(row) * cellHeight;
  
  let sampledColor = textureSample(spriteTexture, spriteSampler, vec2f(cellUvX, cellUvY));
  
  let tintStrength = spriteData.tint.w;
  let tinted = mix(
    sampledColor.rgb,
    sampledColor.rgb * spriteData.tint.rgb,
    tintStrength
  );
  
  let N = normalize(input.fragPos);
  
  return FragOut(
    vec4f(tinted, sampledColor.a),
    vec4f(N, 0.0),
    vec4f(input.fragPos, 1.0)
  );
}
    `;
  }
}



// Top level
/**
 * Sprite Presets System - Top-level API
 * 
 * Similar to FlamePresets pattern:
 * - Define variations upfront
 * - Create multiple instances with different configs
 * - All controlled from high level
 */
/**
 * Sprite Presets System - Top-level API
 * 
 * Similar to FlamePresets pattern:
 * - Define variations upfront
 * - Create multiple instances with different configs
 * - All controlled from high level
 */

export const SpritePresets = {
  // Reel animations (slot machine)
  reelSlow: {
    gridCols: 4,
    gridRows: 4,
    playbackSpeed: 0.5,
    loop: true,
    scale: 1.0,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
  },
  reelFast: {
    gridCols: 4,
    gridRows: 4,
    playbackSpeed: 2.0,
    loop: true,
    scale: 1.0,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
  },

  // Dynamic tinted variants
  reelGlow: {
    gridCols: 4,
    gridRows: 4,
    playbackSpeed: 1.2,
    loop: true,
    scale: 1.2,
    tint: [0.8, 0.9, 1.0],      // Cyan tint
    tintStrength: 0.6,
  },
  reelHot: {
    gridCols: 4,
    gridRows: 4,
    playbackSpeed: 1.5,
    loop: true,
    scale: 1.1,
    tint: [1.0, 0.6, 0.2],       // Orange tint
    tintStrength: 0.7,
  },
  reelCold: {
    gridCols: 4,
    gridRows: 4,
    playbackSpeed: 0.8,
    loop: true,
    scale: 0.9,
    tint: [0.3, 0.6, 1.0],       // Blue tint
    tintStrength: 0.5,
  },

  // Energetic variants
  reelWild: {
    gridCols: 4,
    gridRows: 4,
    playbackSpeed: 3.0,
    loop: true,
    scale: 1.3,
    tint: [1.0, 0.2, 0.8],       // Magenta tint
    tintStrength: 0.9,
  },
};

/**
 * Create multiple sprite instances across screen
 */
export function createSpriteMatrix(batch, spritesheetName, rows = 3, cols = 3, presetVariations = []) {
  const sprites = [];
  const spacing = 6;
  let presetIdx = 0;
  for(let y = 0;y < rows;y++) {
    for(let x = 0;x < cols;x++) {
      const preset = presetVariations[presetIdx % presetVariations.length];
      presetIdx++;

      const sprite = batch.createSprite(
        `sprite-${y}-${x}`,
        spritesheetName,
        {
          ...preset,
          localOffset: [
            (x - cols / 2) * spacing,
            (y - rows / 2) * spacing,
            0,
          ],
        }
      );

      sprite.play(preset.playbackSpeed, preset.loop);
      sprites.push(sprite);
    }
  }

  return sprites;
}

/**
 * Create animated sprite grid with pulsing tint
 */
export function createPulsingGrid(batch, spritesheetName, rows = 2, cols = 3, spacing = 4.5) {
  const sprites = [];
  const colors = [
    {tint: [1.0, 0.2, 0.2], strength: 1.7}, // Red
    {tint: [0.2, 1.0, 0.2], strength: 0.7}, // Green
    {tint: [0.2, 0.2, 1.0], strength: 1.7}, // Blue
    {tint: [1.0, 1.0, 0.2], strength: 0.7}, // Yellow
    {tint: [1.0, 0.2, 1.0], strength: 1.7}, // Magenta
    {tint: [0.2, 1.0, 1.0], strength: 0.7}, // Cyan
  ];

  let colorIdx = 0;

  for(let y = 0;y < rows;y++) {
    for(let x = 0;x < cols;x++) {
      const color = colors[colorIdx % colors.length];
      colorIdx++;

      const sprite = batch.createSprite(
        `pulse-${y}-${x}`,
        spritesheetName,
        {
          scale: 1.0 + (x * 0.1),
          playbackSpeed: 0.8 + (y * 0.3),
          loop: true,
          tint: color.tint,
          tintStrength: color.strength,
          localOffset: [
            (x - cols / 2) * spacing,
            (y - rows / 2) * spacing,
            0,
          ],
        }
      );

      sprite.play(sprite.playbackSpeed, true);
      sprites.push(sprite);
    }
  }

  return sprites;
}

/**
 * Create diagonal flowing sprites
 */
export function createDiagonalFlow(batch, spritesheetName, count = 5, spacing = 1.5) {
  const sprites = [];

  const speeds = [0.5, 0.8, 1.0, 1.2, 1.5];
  const tints = [
    [1.0, 0.5, 0.2],  // Orange
    [1.0, 0.2, 0.8],  // Magenta
    [0.2, 0.8, 1.0],  // Cyan
    [0.8, 1.0, 0.2],  // Yellow-green
    [1.0, 0.2, 0.2],  // Red
  ];

  for(let i = 0;i < count;i++) {
    const sprite = batch.createSprite(
      `flow-${i}`,
      spritesheetName,
      {
        scale: 0.8 + (i * 0.1),
        playbackSpeed: speeds[i],
        loop: true,
        tint: tints[i],
        tintStrength: 0.6 + (i * 0.08),
        localOffset: [
          (i - count / 2) * spacing,
          (i - count / 2) * spacing,
          0,
        ],
      }
    );

    sprite.play(speeds[i], true);
    sprites.push(sprite);
  }

  return sprites;
}

/**
 * Create circular arrangement of sprites
 */
export function createCircularArray(batch, spritesheetName, count = 16, radius = 10, play = false) {
  const sprites = [];
  for(let i = 0;i < count;i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const hue = i / count;
    const tint = hslToRgb(hue, 0.8, 0.6);

    const sprite = batch.createSprite(
      `circle-${i}`,
      spritesheetName,
      {
        scale: 1.0,
        playbackSpeed: 0.5 + (i * 0.2),
        loop: true,
        tint: tint,
        tintStrength: 0.8,
        localOffset: [x, y, 0],
      }
    );

    if (play === true) sprite.play(sprite.playbackSpeed, true);
    sprites.push(sprite);
  }

  return sprites;
}

/**
 * Create wave pattern (varying speeds)
 */
export function createWavePattern(batch, spritesheetName, count = 8) {
  const sprites = [];
  const baseY = 0;
  const spacing = 1.0;

  for(let i = 0;i < count;i++) {
    const waveOffset = Math.sin((i / count) * Math.PI * 2) * 1.5;

    const sprite = batch.createSprite(
      `wave-${i}`,
      spritesheetName,
      {
        scale: 0.9 + Math.sin((i / count) * Math.PI) * 0.3,
        playbackSpeed: 0.5 + (Math.sin((i / count) * Math.PI * 2) * 0.5),
        loop: true,
        tint: [
          0.5 + Math.sin((i / count) * Math.PI * 2) * 0.5,
          0.5 + Math.cos((i / count) * Math.PI * 2) * 0.5,
          0.7,
        ],
        tintStrength: 0.7,
        localOffset: [
          (i - count / 2) * spacing,
          baseY + waveOffset,
          0,
        ],
      }
    );

    sprite.play(sprite.playbackSpeed, true);
    sprites.push(sprite);
  }

  return sprites;
}

/**
 * Helper: HSL to RGB conversion
 */
function hslToRgb(h, s, l) {
  let r, g, b;

  if(s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1 / 6) return p + (q - p) * 6 * t;
      if(t < 1 / 2) return q;
      if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r, g, b];
}

/**
 * Update sprite animation parameters at runtime
 */
export function updateSpriteGroup(sprites, updates = {}) {
  for(const sprite of sprites) {
    if(updates.speed !== undefined) {
      sprite.playbackSpeed = updates.speed;
    }
    if(updates.tint !== undefined) {
      sprite.tint = updates.tint;
    }
    if(updates.tintStrength !== undefined) {
      sprite.tintStrength = updates.tintStrength;
    }
    if(updates.scale !== undefined) {
      sprite.scale = updates.scale;
    }
  }
}

export async function initializeSpritesForMesh(mesh, device, format, cameraBuffer, spritesheetPath, gridCols, gridRows, pattern = "pulsing",
  extraData = {waveCount: 50, radius: 10, count: 10, spacing: 5}) {
  const batch = new SpritesPack2D(
    device,
    format,
    format,
    cameraBuffer
  );

  await batch.registerSpritesheet("reel", spritesheetPath, gridCols, gridRows);

  // Create sprite pattern based on choice
  switch(pattern) {
    case "matrix":
      createSpriteMatrix(batch, "reel", 3, 3, [
        SpritePresets.reelSlow,
        SpritePresets.reelFast,
        SpritePresets.reelGlow,
        SpritePresets.reelHot,
        SpritePresets.reelCold,
        SpritePresets.reelWild,
      ]);
      break;
    case "pulsing":
      createPulsingGrid(batch, "reel", extraData.row, extraData.col, extraData.spacing);
      break;
    case "flow":
      createDiagonalFlow(batch, "reel", extraData.count);
      break;
    case "circle":
      createCircularArray(batch, "reel", extraData.count, extraData.radius);
      break;
    case "wave":
      createWavePattern(batch, "reel", extraData.waveCount);
      break;
    default:
      createPulsingGrid(batch, "reel", 2, 3);
  }

  if(!mesh.effects) mesh.effects = {};
  mesh.effects.spriteBatch = batch;
  return batch;
}
