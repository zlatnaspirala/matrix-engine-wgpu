import {DEPTH_BLIT_WGSL, HZB_BUILD_WGSL, SSR_PASS_WGSL} from "../../shaders/hzb/hzb.wgsl";

export class SSRPass {
  constructor(device, width, height, globalSceneUniformBuffer) {
    this.device = device;
    this.width = width;
    this.height = height;
    this.mipCount = Math.floor(Math.log2(Math.min(width, height)));
    this.enabled = true;

    this._globalSceneUniformBuffer = globalSceneUniformBuffer;

    this.ssrOutputTexture = device.createTexture({
      label: 'SSR output',
      size: [width, height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.ssrOutputView = this.ssrOutputTexture.createView();

    this._createHZB();
    this._createSSRConfig();
    this._createPipelines();
  }

  _createHZB() {
    this.hzbTexture = this.device.createTexture({
      label: 'HZB',
      size: [this.width, this.height],
      mipLevelCount: this.mipCount,
      format: 'r32float',
      viewFormats: ['r32float'],
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Per-mip write views for compute
    this.hzbMipWriteViews = Array.from({length: this.mipCount}, (_, i) =>
      this.hzbTexture.createView({baseMipLevel: i, mipLevelCount: 1})
    );
    // Per-mip read views for compute src
    this.hzbMipReadViews = Array.from({length: this.mipCount}, (_, i) =>
      this.hzbTexture.createView({baseMipLevel: i, mipLevelCount: 1})
    );
    // Full pyramid view for SSR sampler
    this.hzbFullView = this.hzbTexture.createView();

    this.hzbUniformBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  _createSSRConfig() {
    // SSRConfig uniform: invProj(64) + proj(64) + resolution(8) + maxMip(4) + thickness(4) = 144 → pad 160
    this.ssrConfigBuffer = this.device.createBuffer({
      label: 'SSR config',
      size: 160,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  // Call once after you have your camera matrices
  updateConfig(invProjMatrix, projMatrix) {
    const data = new Float32Array(40);
    data.set(invProjMatrix, 0);   // mat4 invProj
    data.set(projMatrix, 16);     // mat4 proj
    data[32] = this.width;
    data[33] = this.height;
    data[34] = this.mipCount - 1; // maxMip
    data[35] = 0.001;             // thickness — tune this (0.001–0.01)
    this.device.queue.writeBuffer(this.ssrConfigBuffer, 0, data);
  }

  _createPipelines() {
    // HZB build compute pipeline
    const hzbModule = this.device.createShaderModule({
      label: 'HZB build',
      code: HZB_BUILD_WGSL,
    });
    this.hzbPipeline = this.device.createComputePipeline({
      label: 'HZB build',
      layout: 'auto',
      compute: {module: hzbModule, entryPoint: 'main'},
    });

    // Depth blit pipeline (depth → r32float mip0)
    const blitModule = this.device.createShaderModule({
      label: 'Depth blit',
      code: DEPTH_BLIT_WGSL,
    });
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

    // SSR pass pipeline
    const ssrModule = this.device.createShaderModule({
      label: 'SSR',
      code: SSR_PASS_WGSL,
    });
    this.ssrPipeline = this.device.createRenderPipeline({
      label: 'SSR',
      layout: 'auto',
      vertex: {module: ssrModule, entryPoint: 'vs'},
      fragment: {
        module: ssrModule, entryPoint: 'fs',
        targets: [{
          format: 'rgba16float',
          // Additive blend — SSR layer adds on top of sceneTexture
          blend: {
            color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
            alpha: {srcFactor: 'one', dstFactor: 'zero', operation: 'add'},
          },
        }],
      },
      primitive: {topology: 'triangle-list'},
    });

    this.linearSampler = this.device.createSampler({
      magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear',
    });
    this.pointSampler = this.device.createSampler({
      magFilter: 'nearest', minFilter: 'nearest',
    });
  }

  // ── render ─────────────────────────────────────────────────
  // Call from your frame loop after main pass, before volumetric
  //
  //   ssrPass.render(commandEncoder, {
  //       sceneTextureView,   // this.sceneTextureView
  //       normalTextureView,  // new — from patchMainRenderPassDesc
  //       mainDepthView,      // this.mainDepthView (texture_depth_2d)
  //       mainDepthTexture,   // this.mainDepthTexture (the actual GPUTexture)
  //   });

  render(commandEncoder, {sceneTextureView, normalTextureView, mainDepthView, mainDepthTexture}) {
    // 1. Blit depth → HZB mip 0
    this._blitDepth(commandEncoder, mainDepthTexture, mainDepthView);

    // 2. Build HZB pyramid
    this._buildHZB(commandEncoder);

    // 3. SSR pass → writes additively into sceneTextureView
    this._renderSSR(commandEncoder, sceneTextureView, normalTextureView);
  }

  _blitDepth(commandEncoder, depthTexture, depthView) {
    const bg = this.device.createBindGroup({
      layout: this.blitPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: depthView},
        {binding: 1, resource: this.pointSampler},
      ],
    });

    const pass = commandEncoder.beginRenderPass({
      label: 'Depth blit',
      colorAttachments: [{
        view: this.hzbMipWriteViews[0],
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [1, 0, 0, 1],
      }],
    });
    pass.setPipeline(this.blitPipeline);
    pass.setBindGroup(0, bg);
    pass.draw(3);
    pass.end();
  }

  _buildHZB(commandEncoder) {
    const pass = commandEncoder.beginComputePass({label: 'HZB build'});
    pass.setPipeline(this.hzbPipeline);

    for(let mip = 1;mip < this.mipCount;mip++) {
      const dstW = Math.max(1, this.width >> mip);
      const dstH = Math.max(1, this.height >> mip);

      this.device.queue.writeBuffer(
        this.hzbUniformBuffer, 0,
        new Uint32Array([dstW, dstH, 0, 0])
      );

      const bg = this.device.createBindGroup({
        layout: this.hzbPipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer: this.hzbUniformBuffer}},
          {binding: 1, resource: this.hzbMipReadViews[mip - 1]},
          {binding: 2, resource: this.hzbMipWriteViews[mip]},
        ],
      });

      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(
        Math.ceil(dstW / 8),
        Math.ceil(dstH / 8),
      );
    }
    pass.end();
  }

  _renderSSR(commandEncoder, sceneTextureView, normalTextureView) {
    const bg = this.device.createBindGroup({
      layout: this.ssrPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this._globalSceneUniformBuffer}},
        {binding: 1, resource: {buffer: this.ssrConfigBuffer}},
        {binding: 2, resource: sceneTextureView},
        {binding: 3, resource: normalTextureView},
        {binding: 4, resource: this.hzbFullView},
        {binding: 5, resource: this.pointSampler},
      ],
    });

    const pass = commandEncoder.beginRenderPass({
      label: 'SSR',
      colorAttachments: [{
        // view: sceneTextureView,  // write directly back into scene
        view:  this.ssrOutputView,
        loadOp: 'load',            // keep existing scene color
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.ssrPipeline);
    pass.setBindGroup(0, bg);
    pass.draw(3);
    pass.end();
  }
}

export function patchMainRenderPassDesc(device, width, height, existingDesc) {
  // Create normal texture — rgba16float, same size as your color buffer
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

  // Also need r32float linear depth for HZB
  // (WebGPU depth textures can't be bound as texture_2d<f32>)
  // Easiest: write linear depth as a second color output from your depth prepass
  // OR use this standalone r32float texture + a blit (see HZBPass below)
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