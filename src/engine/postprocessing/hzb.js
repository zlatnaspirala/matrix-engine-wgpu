import {DEPTH_BLIT_WGSL, HZB_BUILD_WGSL, SSR_PASS_WGSL} from "../../shaders/hzb/hzb.wgsl";

export class SSRPass {
  constructor(device, width, height, globalSceneUniformBuffer, mainDepthView) {
    this.device = device;
    this.width = width;
    this.height = height;
    // Cap mip count to prevent texture sizes dropping below 1x1 pixels
    this.mipCount = Math.floor(Math.log2(Math.max(width, height)));
    this.enabled = true;
    this._globalSceneUniformBuffer = globalSceneUniformBuffer;
    this.ssrOutputTexture = device.createTexture({
      label: 'SSR out-tex',
      size: [width, height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.ssrOutputView = this.ssrOutputTexture.createView();
    this.depthBlitBindGroup = null;
    this.data = new Float32Array(40);
    this._computeHZBMipParams();
    this._createHZB();
    this._createSSRConfig();
    this._createPipelines();
    this._createHZBResources();
    this._createDepthBlitBindGroup(mainDepthView);
  }

  _createDepthBlitBindGroup(depthView) {
    this.depthBlitBindGroup =
      this.device.createBindGroup({
        layout: this.blitPipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: depthView},
          {binding: 1, resource: this.pointSampler}]
      });
  }

  _createHZB() {
    this.hzbTexture = this.device.createTexture({
      label: 'HZB',
      size: [this.width, this.height],
      mipLevelCount: this.mipCount,
      format: 'r32float',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.hzbMipWriteViews = Array.from({length: this.mipCount}, (_, i) =>
      this.hzbTexture.createView({
        label: `HZB Mip ${i}`,
        baseMipLevel: i,
        mipLevelCount: 1
      })
    );
    this.hzbMipReadViews = Array.from({length: this.mipCount}, (_, i) =>
      this.hzbTexture.createView({
        label: `HZB Read Mip ${i}`,
        baseMipLevel: i,
        mipLevelCount: 1
      })
    );
    this.hzbFullView = this.hzbTexture.createView();
    this.hzbMipBuffers = [];
    this.hzbMipBindGroups = [];
  }

  _createHZBResources() {
    for(let mip = 1;mip < this.mipCount;mip++) {
      const dstW = Math.max(1, this.width >> mip);
      const dstH = Math.max(1, this.height >> mip);
      const buffer = this.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      this.device.queue.writeBuffer(buffer, 0, new Uint32Array([dstW, dstH, 0, 0]));
      const bindGroup = this.device.createBindGroup({
        label: `HZB Build BG ${mip}`,
        layout: this.hzbPipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer}},
          {binding: 1, resource: this.hzbMipReadViews[mip - 1]},
          {binding: 2, resource: this.hzbMipWriteViews[mip]}
        ]
      });
      this.hzbMipBuffers.push(buffer);
      this.hzbMipBindGroups.push(bindGroup);
    }
  }

  _createSSRConfig() {
    // Layout Alignment Checklist: 
    // invProj(64) + proj(64) + resolution(8) + maxMip(4) + thickness(4) = 144 -> Aligned to 160
    this.ssrConfigBuffer = this.device.createBuffer({
      label: 'SSR config',
      size: 160,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  updateConfig(invProjMatrix, projMatrix) {
    this.data.set(invProjMatrix, 0);   // mat4 invProj
    this.data.set(projMatrix, 16);     // mat4 proj
    this.data[32] = this.width;
    this.data[33] = this.height;
    this.data[34] = this.mipCount - 1; // maxMip
    this.data[35] = 0.05;              // thickness - matching our structural test recommendations
    this.device.queue.writeBuffer(this.ssrConfigBuffer, 0, this.data);
  }

  _createPipelines() {
    const hzbModule = this.device.createShaderModule({label: 'HZB build', code: HZB_BUILD_WGSL, });
    this.hzbPipeline = this.device.createComputePipeline({
      label: 'HZB build',
      layout: 'auto',
      compute: {module: hzbModule, entryPoint: 'main'},
    });
    const blitModule = this.device.createShaderModule({label: 'Depth blit', code: DEPTH_BLIT_WGSL, });
    this.blitPipeline = this.device.createRenderPipeline({
      label: 'Depth blit',
      layout: 'auto',
      vertex: {module: blitModule, entryPoint: 'vs'},
      fragment: {
        module: blitModule, entryPoint: 'fs',
        targets: [{format: 'r32float'}]
      },
      primitive: {topology: 'triangle-list'},
    });
    this.linearSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });
    const ssrModule = this.device.createShaderModule({label: 'SSR', code: SSR_PASS_WGSL, });
    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: "SSR LAYOUT GROUP",
      entries: [
        {binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: {}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {
          binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: {
            sampleType: "unfilterable-float", viewDimension: "2d"
          }
        },
        {binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 6, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 7, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
      ]
    });

    this.ssrPipeline = this.device.createRenderPipeline({
      label: 'SSR',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout]
      }),
      vertex: {module: ssrModule, entryPoint: 'vs'},
      fragment: {
        module: ssrModule, entryPoint: 'fs',
        targets: [{
          format: 'rgba16float',
          blend: {
            color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
            alpha: {srcFactor: 'one', dstFactor: 'zero', operation: 'add'},
          },
        }],
      },
      primitive: {topology: 'triangle-list'},
    });
    this.pointSampler = this.device.createSampler({
      magFilter: 'nearest', minFilter: 'nearest',
    });
  }

  render(commandEncoder, {sceneTextureView, normalTextureView, mainDepthView, mainDepthTexture, worldPosTextureView}) {
    // 1. Blit hardware depth attachments -> HZB structural mip 0
    this._blitDepth(commandEncoder, mainDepthTexture, mainDepthView);
    // 2. Safely process downstream mip compute iterations
    this._buildHZB(commandEncoder);
    // 3. Render final processed SSR output colors
    this._renderSSR(commandEncoder, sceneTextureView, normalTextureView, worldPosTextureView, mainDepthView);
  }

  _blitDepth(commandEncoder, depthTexture, depthView) {
    const pass = commandEncoder.beginRenderPass({
      label: 'Depth blit Pass',
      colorAttachments: [{
        view: this.hzbMipWriteViews[0],
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [1, 0, 0, 1],
      }],
    });
    pass.setPipeline(this.blitPipeline);
    pass.setBindGroup(0, this.depthBlitBindGroup);
    pass.draw(3);
    pass.end();
  }

_computeHZBMipParams() {
  this._hzbMipParams = [];
  for (let mip = 1; mip < this.mipCount; mip++) {
    const dstW = Math.max(1, this.width >> mip);
    const dstH = Math.max(1, this.height >> mip);
    this._hzbMipParams.push({
      wgX: Math.ceil(dstW / 8),
      wgY: Math.ceil(dstH / 8),
    });
  }
}

_buildHZB(commandEncoder) {
  const pass = commandEncoder.beginComputePass({label: 'HZB build'});
  pass.setPipeline(this.hzbPipeline);
  for (let mip = 1; mip < this.mipCount; mip++) {
    const {wgX, wgY} = this._hzbMipParams[mip - 1];
    pass.setBindGroup(0, this.hzbMipBindGroups[mip - 1]);
    pass.dispatchWorkgroups(wgX, wgY);
  }
  pass.end();
}

  _renderSSR(commandEncoder, sceneTextureView, normalTextureView, worldPosTextureView, mainDepthView) {
    // Rebuild only if the resolve/aliasing target changed (e.g. resize, ping-pong swap)
    if(this._ssrBGDirty ||
      this._lastSceneView !== sceneTextureView ||
      this._lastNormalView !== normalTextureView ||
      this._lastWorldPosView !== worldPosTextureView) {

      this._ssrBindGroup = this.device.createBindGroup({
        layout: this.ssrPipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer: this._globalSceneUniformBuffer}},
          {binding: 1, resource: {buffer: this.ssrConfigBuffer}},
          {binding: 2, resource: sceneTextureView},
          {binding: 3, resource: normalTextureView},
          {binding: 4, resource: this.hzbFullView},
          {binding: 5, resource: this.pointSampler},
          {binding: 6, resource: worldPosTextureView},
          {binding: 7, resource: this.linearSampler},
        ],
      });

      this._lastSceneView = sceneTextureView;
      this._lastNormalView = normalTextureView;
      this._lastWorldPosView = worldPosTextureView;
      this._ssrBGDirty = false;
    }

    const pass = commandEncoder.beginRenderPass(this._ssrPassDesc ??= {
      label: 'SSR Composite Pass',
      colorAttachments: [{
        view: this.ssrOutputView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [0, 0, 0, 0]
      }],
    });
    pass.setPipeline(this.ssrPipeline);
    pass.setBindGroup(0, this._ssrBindGroup);
    pass.draw(3);
    pass.end();
  }
}

export function patchMainRenderPassDesc(device, width, height, existingDesc) {
  const normalTexture = device.createTexture({
    label: 'GBuffer normals',
    size: [width, height],
    format: 'rgba16float',
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING,
  });
  const normalTextureView = normalTexture.createView();

  // Add to your existing mainRenderPassDesc
  existingDesc.colorAttachments[1] = {
    view: normalTextureView,
    loadOp: 'clear',
    storeOp: 'store',
    clearValue: [0, 0, 0, 0],
  };

  const linearDepthTexture = device.createTexture({
    label: 'Linear depth',
    size: [width, height],
    format: 'r32float',
    usage:
      GPUTextureUsage.RENDER_ATTACHMENT |
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.STORAGE_BINDING,
  });
  return {normalTexture, normalTextureView, linearDepthTexture};
}