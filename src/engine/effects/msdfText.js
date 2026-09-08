import {MSDFFRAG} from "../../shaders/msdf/msdf.fragment.js"

import {mat4} from "wgpu-matrix";

export class MSDFTextEffect {
  constructor(
    device,
    format,
    msdfTexture,
    sampler,
    cameraBuffer,
    font
  ) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.msdfTexture = msdfTexture;
    this.sampler = sampler;
    this.font = font;

    this.glyphs = [];
    this.glyphCount = 0;
    this.enabled = true;

    this.floatsPerInstance = 20;
    this.instanceData =
      new Float32Array(256 * this.floatsPerInstance);

    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();

    this._init();
  }

  _init() {
    const vertexData = new Float32Array([
      -0.5, 0.5,
      0.5, 0.5,
      -0.5, -0.5,
      0.5, -0.5,
    ]);

    const uvData = new Float32Array([
      0, 1, 1, 1, 0, 0, 1, 0
    ]);

    const indexData = new Uint16Array([
      0, 2, 1, 1, 2, 3
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
    this.vertexBuffer.unmap();

    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.uvBuffer.getMappedRange()).set(uvData);
    this.uvBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indexData);
    this.indexBuffer.unmap();
    this.indexCount = indexData.length;

    this.glyphBuffer = this.device.createBuffer({
      size: 256 * this.floatsPerInstance * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: "read-only-storage"}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.glyphBuffer}},
        {binding: 2, resource: this.msdfTexture.createView()},
        {binding: 3, resource: this.sampler},
      ]
    });

    const shaderModule = this.device.createShaderModule({
      code: MSDFFRAG
    });

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
            attributes: [{
              shaderLocation: 0,
              format: "float32x2",
              offset: 0
            }]
          },
          {
            arrayStride: 8,
            attributes: [{
              shaderLocation: 1,
              format: "float32x2",
              offset: 0
            }]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [
          {format: this.format},
          {format: 'rgba16float'},
          {format: 'rgba16float'}
        ]
      },
      primitive: {
        topology: "triangle-list",
        cullMode: 'none'
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less'
      }
    });
  }

  setText(text) {
    this.text = text;
    this._updateGlyphs(text);
  }


  _updateGlyphs(text) {
    this.glyphs = [];

    const font = this.font;

    if(!font) {
      console.error('MSDFTextEffect: BMFontParser not supplied');
      return;
    }

    const atlasW = font.common.scaleW;
    const atlasH = font.common.scaleH;

    // How large one font pixel should be in your world.
    const scale = 0.0015;

    let cursorX = 0;

    for(let i = 0;i < text.length;i++) {
      const charCode = text.charCodeAt(i);

      const metrics = font.getCharMetrics(charCode);

      if(!metrics) {
        continue;
      }

      const glyphWidth = metrics.width * scale;
      const glyphHeight = metrics.height * scale;

      const xOffset = metrics.xoffset * scale;
      const yOffset = metrics.yoffset * scale;

      this.glyphs.push({
        position: [
          cursorX + xOffset + glyphWidth * 0.5,
          -yOffset - glyphHeight * 0.5,
          0
        ],

        scale: [
          glyphWidth,
          glyphHeight,
          1
        ],

        uvOffset: metrics.uvOffset,
        uvScale: metrics.uvScale,

        color: [1, 1, 1, 1]
      });

      cursorX += metrics.xadvance * scale;
    }

    this.glyphCount = this.glyphs.length;
  }

  // MAIN LOOP CALLS THIS - Calculate final matrix WITH parent
  updateInstanceData = (baseModelMatrix) => {
    const count = Math.min(this.glyphs.length, 256);

    for(let i = 0;i < count;i++) {
      const g = this.glyphs[i];

      // LIKE FlameEmitter - create local matrix
      const local = this._localMatrix;
      mat4.identity(local);
      mat4.translate(local, g.position, local);
      mat4.scale(local, g.scale, local);

      // LIKE FlameEmitter - multiply with parent
      mat4.identity(this._finalMatrix);
      mat4.multiply(baseModelMatrix, local, this._finalMatrix);

      // Store final matrix
      const offset = i * this.floatsPerInstance;
      this.instanceData.set(this._finalMatrix, offset);

      // Store UV data after matrix
      this.instanceData[offset + 16] = g.uvOffset[0];
      this.instanceData[offset + 17] = g.uvOffset[1];
      this.instanceData[offset + 18] = g.uvScale[0];
      this.instanceData[offset + 19] = g.uvScale[1];
      // Color can go in next batch if needed
    }

    this.device.queue.writeBuffer(this.glyphBuffer, 0, this.instanceData.subarray(0, count * this.floatsPerInstance));
  }

  render(pass, mesh, viewProjMatrix) {
    if(this.glyphCount === 0) return;

    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");

    pass.drawIndexed(this.indexCount, this.glyphCount);
  }
}

// BMFont XML Parser
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

    // Parse info
    const infoEl = doc.querySelector('info');
    this.info = {
      face: infoEl.getAttribute('face'),
      size: parseInt(infoEl.getAttribute('size')),
    };

    // Parse common
    const commonEl = doc.querySelector('common');
    this.common = {
      lineHeight: parseInt(commonEl.getAttribute('lineHeight')),
      base: parseInt(commonEl.getAttribute('base')),
      scaleW: parseInt(commonEl.getAttribute('scaleW')),
      scaleH: parseInt(commonEl.getAttribute('scaleH')),
    };

    // Parse characters
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

    console.log('BMFont parsed:', {
      face: this.info.face,
      atlasSize: `${this.common.scaleW}x${this.common.scaleH}`,
      charCount: Object.keys(this.chars).length,
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


export async function loadAtlasFONT(PATH = './res/3d-fonts/stormfaze.fnt') {

  const fontResponse = await fetch(PATH);

  if(!fontResponse.ok) {
    throw new Error(
      `Failed to load BMFont file: ${fontResponse.status} ${fontResponse.statusText}`
    );
  }

  const fontXml = await fontResponse.text();

  // Parse BMFont XML
  const font = new BMFontParser(fontXml);

  console.log('Font loaded:', font.info.face);
  console.log('Atlas:', font.getAtlasDimensions());


  // ------------------------------------------------------------
  // LOAD MSDF ATLAS
  // ------------------------------------------------------------

  const response = await fetch('./res/3d-fonts/atlas.png');

  if(!response.ok) {
    throw new Error(
      `Failed to load MSDF atlas: ${response.status} ${response.statusText}`
    );
  }

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);


  // ------------------------------------------------------------
  // CREATE GPU TEXTURE
  // ------------------------------------------------------------

  const device = loadFace.device;

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


  // ------------------------------------------------------------
  // UPLOAD ATLAS TO GPU
  // ------------------------------------------------------------

  const canvas = new OffscreenCanvas(
    bitmap.width,
    bitmap.height
  );

  const ctx = canvas.getContext('2d');

  ctx.drawImage(bitmap, 0, 0);

  const imageData = ctx.getImageData(
    0,
    0,
    bitmap.width,
    bitmap.height
  );

  device.queue.writeTexture(
    {
      texture: msdfTexture
    },

    imageData.data,

    {
      bytesPerRow: bitmap.width * 4,
      rowsPerImage: bitmap.height
    },

    {
      width: bitmap.width,
      height: bitmap.height,
      depthOrArrayLayers: 1
    }
  );

}