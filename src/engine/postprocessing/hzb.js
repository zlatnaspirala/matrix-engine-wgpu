import {DEPTH_BLIT_WGSL, HZB_BUILD_WGSL, SSR_PASS_WGSL} from "../../shaders/hzb/hzb.wgsl";

export class SSRPass {
  constructor(device, width, height, globalSceneUniformBuffer) {
    this.device = device;
    this.width = width;
    this.height = height;
    // Cap mip count to prevent texture sizes dropping below 1x1 pixels
    this.mipCount = Math.floor(Math.log2(Math.max(width, height)));
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
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.STORAGE_BINDING |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // Write views: Only 1 mip level thick
  this.hzbMipWriteViews = Array.from({length: this.mipCount}, (_, i) =>
    this.hzbTexture.createView({label: `HZB Write Mip ${i}`, baseMipLevel: i, mipLevelCount: 1})
  );
  
  // FIX: Force read views to be exactly 1 mip level thick as well!
  // This guarantees to WebGPU that Read Mip (N) and Write Mip (N+1) have zero overlapping memory.
  this.hzbMipReadViews = Array.from({length: this.mipCount}, (_, i) =>
    this.hzbTexture.createView({label: `HZB Read Mip ${i}`, baseMipLevel: i, mipLevelCount: 1})
  );

  // Full pyramid view for SSR pass sampling
  this.hzbFullView = this.hzbTexture.createView();

  this.hzbUniformBuffer = this.device.createBuffer({
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
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
    const data = new Float32Array(40);
    data.set(invProjMatrix, 0);   // mat4 invProj
    data.set(projMatrix, 16);     // mat4 proj
    data[32] = this.width;
    data[33] = this.height;
    data[34] = this.mipCount - 1; // maxMip
    data[35] = 0.04;              // thickness - matching our structural test recommendations
    this.device.queue.writeBuffer(this.ssrConfigBuffer, 0, data);
  }

  _createPipelines() {
    const hzbModule = this.device.createShaderModule({
      label: 'HZB build',
      code: HZB_BUILD_WGSL,
    });

    this.hzbPipeline = this.device.createComputePipeline({
      label: 'HZB build',
      layout: 'auto',
      compute: {module: hzbModule, entryPoint: 'main'},
    });

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

    const ssrModule = this.device.createShaderModule({
      label: 'SSR',
      code: SSR_PASS_WGSL,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: "SSR LAYOUT GROUP",
      entries: [
        {binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: {}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {
          binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: {
            sampleType: "unfilterable-float",
            viewDimension: "2d"
          }
        },
    //     { 
    //   binding: 4, 
    //   visibility: GPUShaderStage.FRAGMENT, 
    //   texture: { 
    //     sampleType: 'depth',          // <-- CHANGE THIS FROM 'unfilterable-float' TO 'depth'
    //     viewDimension: '2d' 
    //   } 
    // },
        {binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 6, visibility: GPUShaderStage.FRAGMENT, texture: {}},
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
    const bg = this.device.createBindGroup({
      layout: this.blitPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: depthView},
        {binding: 1, resource: this.pointSampler},
      ],
    });

    const pass = commandEncoder.beginRenderPass({
      label: 'Depth blit Pass',
      colorAttachments: [{
        view: this.hzbMipWriteViews[0],
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [1, 0, 0, 1], // Clear with maximum depth standard configuration
      }],
    });
    pass.setPipeline(this.blitPipeline);
    pass.setBindGroup(0, bg);
    pass.draw(3);
    pass.end();
  }

  _buildHZB(commandEncoder) {
    // Loop through each mip level starting from 1 down to the smallest mip
    for(let mip = 1;mip < this.mipCount;mip++) {
      const dstW = Math.max(1, this.width >> mip);
      const dstH = Math.max(1, this.height >> mip);

      // 1. Create a tiny local scratch buffer for this loop iteration's dimensions
      const hzbUpdateBuffer = this.device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM,
        mappedAtCreation: true
      });
      new Uint32Array(hzbUpdateBuffer.getMappedRange()).set([dstW, dstH, 0, 0]);
      hzbUpdateBuffer.unmap();

      // 2. Build a localized bind group targeting only the isolated mip views
      const bg = this.device.createBindGroup({
        label: `HZB Build Bind Group Mip ${mip}`,
        layout: this.hzbPipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer: hzbUpdateBuffer}},
          {binding: 1, resource: this.hzbMipReadViews[mip - 1]}, // Reading from previous stable mip
          {binding: 2, resource: this.hzbMipWriteViews[mip]},    // Writing safely to current target mip
        ],
      });

      // 3. FIX: Open an independent compute pass scope for ONLY this single mip tier.
      // This tells the WebGPU scheduler that the read pass on (mip - 1) is completely 
      // separate from any writes occurring on other levels!
      const pass = commandEncoder.beginComputePass({
        label: `HZB compute level ${mip}`
      });

      pass.setPipeline(this.hzbPipeline);
      pass.setBindGroup(0, bg);
      pass.dispatchWorkgroups(
        Math.ceil(dstW / 8),
        Math.ceil(dstH / 8)
      );

      // 4. Close the scope immediately. This creates a clean synchronization boundary.
      pass.end();
    }
  }

  _renderSSR(commandEncoder, sceneTextureView, normalTextureView, worldPosTextureView, mainDepthView) {
    const bg = this.device.createBindGroup({
      layout: this.ssrPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this._globalSceneUniformBuffer}},
        {binding: 1, resource: {buffer: this.ssrConfigBuffer}},
        {binding: 2, resource: sceneTextureView},
        {binding: 3, resource: normalTextureView},
        {binding: 4, resource: this.hzbFullView}, // Samples complete structural HZB map cleanly
        {binding: 5, resource: this.pointSampler},
        {binding: 6, resource: worldPosTextureView},
      ],
    });

    const pass = commandEncoder.beginRenderPass({
      label: 'SSR Composite Pass',
      colorAttachments: [{
        view: this.ssrOutputView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [0, 0, 0, 0]
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