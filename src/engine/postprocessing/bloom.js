/**
 * @description 
 * Bloom class for matrix-engine-wgpu
 * @public 
 * 
 * @setKnee
 * @setIntensity
 * @setThreshold
 * @setBlurRadius
 */

export class BloomPass {
  constructor(width, height, device, intensity = 1.5) {
    this.enabled = false;
    this.device = device;
    this.width = width;
    this.height = height;

    this.brightTex = this._createTexture();
    this.blurTexA = this._createTexture();
    this.blurTexB = this._createTexture();

    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });

    this.intensityBuffer = this._createUniformBuffer([intensity]);
    this.blurDirX = this._createUniformBuffer([1, 0]);
    this.blurDirY = this._createUniformBuffer([0, 1]);

    this.params = {
      intensity: intensity,
      threshold: 0.6,
      knee: 0.5,
      blurRadius: 6.0
    };

    this.paramBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._updateParams();

    this.brightPipeline = this._createPipeline(
      brightPassWGSL(),
      [{binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
      {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}]
    );

    this.blurPipeline = this._createPipeline(
      blurPassWGSL(),
      [{binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
      {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
      {binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}]
    );

    this.combinePipeline = this._createPipeline(
      combinePassWGSL(),
      [{binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}},
      {binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float'}},
      {binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
      {binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}]
    );
  }

  _createTexture() {
    return this.device.createTexture({
      size: [this.width, this.height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  _createPipeline(fragmentWGSL, bindGroupLayoutEntries) {
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: bindGroupLayoutEntries
    });

    return this.device.createRenderPipeline({
      label: 'bloom pipeline',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      vertex: {
        module: this.device.createShaderModule({code: fullscreenQuadWGSL()}),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({code: fragmentWGSL}),
        entryPoint: 'main',
        targets: [{format: 'rgba16float'}]
      },
      primitive: {topology: 'triangle-list'}
    });
  }

  _updateParams() {
    this.device.queue.writeBuffer(this.paramBuffer, 0,
      new Float32Array([
        this.params.intensity,
        this.params.threshold,
        this.params.knee,
        this.params.blurRadius,
      ])
    );
  }

  setIntensity = (v) => {
    this.params.intensity = v;
    this._updateParams();
  }

  setThreshold = (v) => {
    this.params.threshold = v;
    this._updateParams();
  }

  setKnee = (v) => {
    this.params.knee = v;
    this._updateParams();
  }

  setBlurRadius = (v) => {
    this.params.blurRadius = v;
    this._updateParams();
  }

  _createUniformBuffer(data) {
    const buffer = this.device.createBuffer({
      size: 16, // std140 safe
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(buffer, 0, new Float32Array(data));
    return buffer;
  }

  _brightBindGroup(view) {
    return this.device.createBindGroup({
      layout: this.brightPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: view},
        {binding: 1, resource: this.sampler},
        {binding: 2, resource: {buffer: this.paramBuffer}},
      ]
    });
  }

  _blurBindGroup(view, dirBuffer) {
    return this.device.createBindGroup({
      layout: this.blurPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: view},
        {binding: 1, resource: this.sampler},
        {binding: 2, resource: {buffer: dirBuffer}},
        {binding: 3, resource: {buffer: this.paramBuffer}},
      ]
    });
  }

  _combineBindGroup(sceneView, bloomView) {
    return this.device.createBindGroup({
      layout: this.combinePipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: sceneView},
        {binding: 1, resource: bloomView},
        {binding: 2, resource: this.sampler},
        {binding: 3, resource: {buffer: this.paramBuffer}},
      ]
    });
  }

  _beginFullscreenPass(encoder, targetView) {
    return encoder.beginRenderPass({
      colorAttachments: [{
        view: targetView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: {r: 0, g: 0, b: 0, a: 1}
      }]
    });
  }

  render(encoder, sceneView, finalTargetView) {
    // ----- Bright pass -----
    {
      const pass = this._beginFullscreenPass(encoder, this.brightTex.createView());
      pass.setPipeline(this.brightPipeline);
      pass.setBindGroup(0, this._brightBindGroup(sceneView));
      pass.draw(6);
      pass.end();
    }
    // ----- Blur X -----
    {
      const pass = this._beginFullscreenPass(encoder, this.blurTexA.createView());
      pass.setPipeline(this.blurPipeline);
      pass.setBindGroup(0, this._blurBindGroup(this.brightTex.createView(), this.blurDirX));
      pass.draw(6);
      pass.end();
    }
    // ----- Blur Y -----
    {
      const pass = this._beginFullscreenPass(encoder, this.blurTexB.createView());
      pass.setPipeline(this.blurPipeline);
      pass.setBindGroup(0, this._blurBindGroup(this.blurTexA.createView(), this.blurDirY));
      pass.draw(6);
      pass.end();
    }
    // ----- Combine -----
    {
      const pass = this._beginFullscreenPass(encoder, finalTargetView);
      pass.setPipeline(this.combinePipeline);
      pass.setBindGroup(0, this._combineBindGroup(sceneView, this.blurTexB.createView())
      );
      pass.draw(6);
      pass.end();
    }
  }
}

export function fullscreenQuadWGSL() {
  return `
    @vertex
    fn vert(@builtin(vertex_index) i : u32) -> @builtin(position) vec4<f32> {
      var pos = array<vec2<f32>, 6>(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
        vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
      );
      return vec4(pos[i], 0.0, 1.0);
    }
  `;
}

function brightPassWGSL() {
  return `
    struct BloomParams {
    intensity: f32,
    threshold: f32,
    knee: f32,
    radius: f32,
  };
    @group(0) @binding(0) var tex: texture_2d<f32>;
    @group(0) @binding(1) var samp: sampler;
    @group(0) @binding(2) var<uniform> bloom: BloomParams;
    @fragment
    fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
      let size = vec2<f32>(textureDimensions(tex));
      let uv = p.xy / size;
      let c = textureSample(tex, samp, uv).rgb;
      let lum = dot(c, vec3<f32>(0.2126,0.7152,0.0722));
      let x = max(lum - bloom.threshold, 0.0);
      let w = x * x / (x + bloom.knee);
      return vec4(c * w, 1.0);
    }
  `;
}

function blurPassWGSL() {
  return `
   struct BloomParams {
    intensity: f32,
    threshold: f32,
    knee: f32,
    radius: f32,
  };

  @group(0) @binding(0) var tex: texture_2d<f32>;
  @group(0) @binding(1) var samp: sampler;
  @group(0) @binding(2) var<uniform> dir: vec2<f32>;
  @group(0) @binding(3) var<uniform> bloom: BloomParams;

  @fragment
  fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let size = vec2<f32>(textureDimensions(tex));
    let uv = p.xy / size;
    let r = bloom.radius;
    let o = array<f32,5>(-r, -r*0.5, 0.0, r*0.5, r);
    let w = array<f32,5>(0.1,0.2,0.4,0.2,0.1);
    var col = vec3(0.0);
    for(var i=0;i<5;i++){
      col += textureSample(tex, samp, uv + o[i]*dir/size).rgb * w[i];
    }
    return vec4(col,1.0);
  }
`;
}

function combinePassWGSL() {
  return `
  struct BloomParams {
    intensity: f32,
    threshold: f32,
    knee: f32,
    radius: f32,
  };
  @group(0) @binding(0) var origTex: texture_2d<f32>;
  @group(0) @binding(1) var bloomTex: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;
  @group(0) @binding(3) var<uniform> bloom: BloomParams;

  @fragment
  fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let size = vec2<f32>(textureDimensions(origTex));
    let uv = p.xy / size;

    let origColor = textureSample(origTex, samp, uv).rgb;
    let bloomColor = textureSample(bloomTex, samp, uv).rgb;

    // additive bloom
    let color = origColor + bloomColor * bloom.intensity;

    return vec4(color, 1.0);
  }
`;
}