import {mat4} from "wgpu-matrix";
import {MSDFFRAG} from "../../shaders/msdf/msdf.fragment.js";

export class MSDFTextEffect {
  constructor(device, format, msdfTexture, sampler, cameraBuffer, font, options = {}) {
    this.device = device;
    this.format = format;
    this.msdfTexture = msdfTexture;
    this.sampler = sampler;
    this.cameraBuffer = cameraBuffer;
    this.font = font;
    this.enabled = true;
    this.scale = options.scale ?? 0.0015;
    // this.typeText = "";
    this.glyphXOffsetFix = {
      "I": + 8,
      // "J": -3,
      // "T": -2
    };
    // 40 means every character occupies 40 font pixels
    // horizontally, regardless of xadvance.
    this.fixedAdvancePx = options.fixedAdvancePx ?? 40;
    this.trackingPx = options.trackingPx ?? 0;
    this.color = options.color ?? [1, 1, 1, 1];
    this.maxGlyphs = options.maxGlyphs ?? 256;
    this.text = "";
    this.glyphCount = 0;
    this.floatsPerGlyph = 8;
    this.instanceData = new Float32Array(this.maxGlyphs * this.floatsPerGlyph);
    this.parentMatrixBuffer = device.createBuffer({size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.colorBuffer =
      device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
    this.device.queue.writeBuffer(this.colorBuffer, 0, new Float32Array(this.color));
    this._identity = mat4.create();
    this._init();
  }

  // TYPING ANIMATION - character by character
  typeText(text, delayMs = 100, onComplete = null) {
    // Stop any existing animation
    if(this.isTyping) {
      clearInterval(this.typeInterval);
    }

    this.isTyping = true;
    // this.typeText = text;
    this.typeIndex = 0;
    this.onTypeComplete = onComplete;

    // Show first character immediately
    this.setText(text.substring(0, 1));

    // Then animate the rest
    this.typeInterval = setInterval(() => {
      this.typeIndex++;

      if(this.typeIndex >= text.length) {
        // Animation complete
        clearInterval(this.typeInterval);
        this.isTyping = false;
        if(this.onTypeComplete) {
          this.onTypeComplete();
        }
        return;
      }

      // Update text with characters up to current index
      this.setText(text.substring(0, this.typeIndex + 1));
    }, delayMs);
  }

  // Stop typing animation
  stopTyping() {
    if(this.typeInterval) {
      clearInterval(this.typeInterval);
      this.isTyping = false;
    }
  }

  _init() {
    const vertexData = new Float32Array([
      -0.5, 0.5,
      0.5, 0.5,
      -0.5, -0.5,
      0.5, -0.5
    ]);

    const uvData = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0
    ]);

    const indexData = new Uint16Array([
      0, 2, 1,
      1, 2, 3
    ]);

    this.vertexBuffer = this.device.createBuffer({
      label: "vb_msdf",
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
    this.vertexBuffer.unmap();

    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Float32Array(this.uvBuffer.getMappedRange()).set(uvData);
    this.uvBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Uint16Array(this.indexBuffer.getMappedRange()).set(indexData);
    this.indexBuffer.unmap();
    this.indexCount = indexData.length;
    this.glyphBuffer = this.device.createBuffer({
      size: this.maxGlyphs * this.floatsPerGlyph * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: "read-only-storage"}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 4, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: {}}
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.glyphBuffer}},
        {binding: 2, resource: this.msdfTexture.createView()},
        {binding: 3, resource: this.sampler},
        {binding: 4, resource: {buffer: this.parentMatrixBuffer}},
        {binding: 5, resource: {buffer: this.colorBuffer}}
      ]
    });

    const shaderModule = this.device.createShaderModule({code: MSDFFRAG});
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
            arrayStride: 8,
            attributes: [
              {
                shaderLocation: 0,
                format: "float32x2",
                offset: 0
              }
            ]
          },
          {
            arrayStride: 8,
            attributes: [
              {
                shaderLocation: 1,
                format: "float32x2",
                offset: 0
              }
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [
          {format: this.format},
          {format: "rgba16float"},
          {format: "rgba16float"}
        ]
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none"
      },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: false,
        depthCompare: "less"
      }
    });
  }

  setText(text) {
    this.text = text ?? "";
    this._updateGlyphs();
    this._uploadGlyphs();
  }

  _updateGlyphs() {
    const font = this.font;
    if(!font) {
      console.error("MSDFTextEffect: BMFontParser not supplied");
      this.glyphCount = 0;
      return;
    }
    const text = this.text;
    let cursorX = 0;
    let count = 0;
    for(let i = 0;i < text.length;i++) {
      if(count >= this.maxGlyphs)
        break;
      const charCode = text.charCodeAt(i);
      const metrics = font.getCharMetrics(charCode);
      if(!metrics) continue;
      const width = metrics.width * this.scale;
      const height = metrics.height * this.scale;
      const char = text[i];
      const xOffsetFix = this.glyphXOffsetFix[char] ?? 0;
      const x = cursorX + (metrics.xoffset + xOffsetFix) * this.scale + width * 0.5;
      const y = (font.common.base - metrics.yoffset - metrics.height * 0.5) * this.scale;
      const offset = count * this.floatsPerGlyph;
      this.instanceData[offset + 0] = x;
      this.instanceData[offset + 1] = y;
      this.instanceData[offset + 2] = width;
      this.instanceData[offset + 3] = height;
      // UV OFFSET
      this.instanceData[offset + 4] = metrics.uvOffset[0];
      this.instanceData[offset + 5] = metrics.uvOffset[1];
      // UV SCALE
      this.instanceData[offset + 6] = metrics.uvScale[0];
      this.instanceData[offset + 7] = metrics.uvScale[1];
      let advancePx;
      if(this.fixedAdvancePx !== null) {
        advancePx = this.fixedAdvancePx;
      } else {
        advancePx = metrics.xadvance;
      }
      cursorX += (advancePx + this.trackingPx) * this.scale;
      count++;
    }
    this.glyphCount = count;
  }

  _uploadGlyphs() {
    if(this.glyphCount === 0) return;
    const floatCount = this.glyphCount * this.floatsPerGlyph;
    this.device.queue.writeBuffer(this.glyphBuffer, 0, this.instanceData.buffer, 0, floatCount * 4);
  }

  updateInstanceData(baseModelMatrix) {
    this.device.queue.writeBuffer(
      this.parentMatrixBuffer,
      0,
      baseModelMatrix
    );
  }

  render(pass, mesh, viewProjMatrix) {
    if(!this.enabled || this.glyphCount === 0) {
      return;
    }
    // this.device.queue.writeBuffer(      this.cameraBuffer,      0,      viewProjMatrix    );
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount, this.glyphCount);
  }

  setColor(r, g, b, a = 1) {
    this.color[0] = r;
    this.color[1] = g;
    this.color[2] = b;
    this.color[3] = a;
    this.device.queue.writeBuffer(this.colorBuffer, 0, new Float32Array(this.color));
  }

  destroy() {
    this.vertexBuffer?.destroy();
    this.uvBuffer?.destroy();
    this.indexBuffer?.destroy();
    this.glyphBuffer?.destroy();
    this.parentMatrixBuffer?.destroy();
    this.colorBuffer?.destroy();
  }
}

export class BMFontParser {
  constructor(xmlText) {
    this.chars = {};
    this.info = {};
    this.common = {};
    this.parse(xmlText);
  }

  parse(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const infoEl = doc.querySelector('info');
    this.info = {
      face: infoEl.getAttribute('face'),
      size: parseInt(infoEl.getAttribute('size')),
    };
    const commonEl = doc.querySelector('common');
    this.common = {
      lineHeight: parseInt(commonEl.getAttribute('lineHeight')),
      base: parseInt(commonEl.getAttribute('base')),
      scaleW: parseInt(commonEl.getAttribute('scaleW')),
      scaleH: parseInt(commonEl.getAttribute('scaleH')),
    };
    const charEls = doc.querySelectorAll('char');
    charEls.forEach(el => {
      const id = parseInt(el.getAttribute('id'));
      const char = String.fromCharCode(id);
      this.chars[id] = {
        char,
        x: parseInt(el.getAttribute('x')),
        y: parseInt(el.getAttribute('y')),
        width: parseInt(el.getAttribute('width')),
        height: parseInt(el.getAttribute('height')),
        xoffset: parseInt(el.getAttribute('xoffset')),
        yoffset: parseInt(el.getAttribute('yoffset')),
        xadvance: parseInt(el.getAttribute('xadvance')),
      };
    });
  }

  getCharMetrics(charCode) {
    if(!this.chars[charCode]) {
      console.warn(`Character ${charCode} not found in font`);
      return null;
    }
    const char = this.chars[charCode];
    const atlasW = this.common.scaleW;
    const atlasH = this.common.scaleH;
    return {
      char: char.char,
      // UV coordinates (normalized 0-1)
      uvOffset: [char.x / atlasW, char.y / atlasH],
      uvScale: [char.width / atlasW, char.height / atlasH],
      // Dimensions in pixels
      width: char.width,
      height: char.height,
      xoffset: char.xoffset,
      yoffset: char.yoffset,
      xadvance: char.xadvance,
    };
  }

  getAtlasDimensions() {
    return {
      width: this.common.scaleW,
      height: this.common.scaleH,
    };
  }
}

export function loadAtlasFONT(device, PATH = './res/3d-fonts/stormfaze.fnt', ATLAS_PATH = './res/3d-fonts/atlas.png') {
  return new Promise(async (resolve) => {
    const fontResponse = await fetch(PATH);
    if(!fontResponse.ok) {
      throw new Error(`Failed to load BMFont file: ${fontResponse.status} ${fontResponse.statusText}`);
    }
    const fontXml = await fontResponse.text();
    const font = new BMFontParser(fontXml);
    const response = await fetch(ATLAS_PATH);
    if(!response.ok) {
      throw new Error(`Failed to load MSDF atlas: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const msdfTexture = device.createTexture({
      size: {
        width: bitmap.width,
        height: bitmap.height,
        depthOrArrayLayers: 1
      },
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST
    });
    // UPLOAD ATLAS TO GPU
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    device.queue.writeTexture({texture: msdfTexture},
      imageData.data,
      {bytesPerRow: bitmap.width * 4, rowsPerImage: bitmap.height},
      {width: bitmap.width, height: bitmap.height, depthOrArrayLayers: 1}
    );
    const OUTPUT = {msdfTexture: msdfTexture, font: font};
    resolve(OUTPUT)
  })
}