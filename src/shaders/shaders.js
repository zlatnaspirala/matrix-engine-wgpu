
/**
 * @description
 * For microdraw pixel cube texture
 */
export const shaderSrc = `struct VSUniforms {
  worldViewProjection: mat4x4f,
  worldInverseTranspose: mat4x4f,
};
@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct MyVSInput {
    @location(0) position: vec4f,
    @location(1) normal: vec3f,
    @location(2) texcoord: vec2f,
};

struct MyVSOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) texcoord: vec2f,
};

@vertex
fn myVSMain(v: MyVSInput) -> MyVSOutput {
  var vsOut: MyVSOutput;
  vsOut.position = vsUniforms.worldViewProjection * v.position;
  vsOut.normal = (vsUniforms.worldInverseTranspose * vec4f(v.normal, 0.0)).xyz;
  vsOut.texcoord = v.texcoord;
  return vsOut;
}

struct FSUniforms {
  lightDirection: vec3f,
};

@group(0) @binding(1) var<uniform> fsUniforms: FSUniforms;
@group(0) @binding(2) var diffuseSampler: sampler;
@group(0) @binding(3) var diffuseTexture: texture_2d<f32>;

@fragment
fn myFSMain(v: MyVSOutput) -> @location(0) vec4f {
  var diffuseColor = textureSample(diffuseTexture, diffuseSampler, v.texcoord);
  var a_normal = normalize(v.normal);
  var l = dot(a_normal, fsUniforms.lightDirection) * 0.5 + 0.5;
  return vec4f(diffuseColor.rgb * l, diffuseColor.a);
}
`;

/**
 * @description
 * For Cube with images
 */
export const cubeTexShader = `struct Uniforms {
      matrix: mat4x4f,
    };

    struct Vertex {
      @location(0) position: vec4f,
      @location(1) texcoord: vec2f,
    };

    struct VSOutput {
      @builtin(position) position: vec4f,
      @location(0) texcoord: vec2f,
    };

    @group(0) @binding(0) var<uniform> uni: Uniforms;
    @group(0) @binding(1) var ourSampler: sampler;
    @group(0) @binding(2) var ourTexture: texture_2d<f32>;

    @vertex fn vs(vert: Vertex) -> VSOutput {
      var vsOut: VSOutput;
      vsOut.position = uni.matrix * vert.position;
      vsOut.texcoord = vert.texcoord;
      return vsOut;
    }

    @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
      return textureSample(ourTexture, ourSampler, vsOut.texcoord);
    }
`;

export const basicVertWGSL = `struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
  @location(0) position : vec4<f32>,
  @location(1) uv : vec2<f32>
) -> VertexOutput {
  var output : VertexOutput;
  output.Position = uniforms.modelViewProjectionMatrix * position;
  output.fragUV = uv;
  output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
  return output;
}
`;

export const basicFragWGSL = `@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d<f32>;

@fragment
fn main(
  @location(0) fragUV: vec2<f32>,
  @location(1) fragPosition: vec4<f32>
) -> @location(0) vec4<f32> {
  return textureSample(myTexture, mySampler, fragUV) * fragPosition;
}
`;
export const vertexPositionColorWGSL = `@fragment
fn main(
  @location(0) fragUV: vec2<f32>,
  @location(1) fragPosition: vec4<f32>
) -> @location(0) vec4<f32> {
  return fragPosition;
}`

export const BALL_SHADER = `struct Uniforms {
  viewProjectionMatrix : mat4x4f
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;

struct VertexInput {
  @location(0) position : vec4f,
  @location(1) normal : vec3f,
  @location(2) uv : vec2f
}

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal: vec3f,
  @location(1) uv : vec2f,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = uniforms.viewProjectionMatrix * modelMatrix * input.position;
  output.normal = normalize((modelMatrix * vec4(input.normal, 0)).xyz);
  output.uv = input.uv;
  return output;
}

@group(1) @binding(1) var meshSampler: sampler;
@group(1) @binding(2) var meshTexture: texture_2d<f32>;

// Static directional lighting
const lightDir = vec3f(1, 1, 1);
const dirColor = vec3(1);
const ambientColor = vec3f(0.05);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let textureColor = textureSample(meshTexture, meshSampler, input.uv);

  // Very simplified lighting algorithm.
  let lightColor = saturate(ambientColor + max(dot(input.normal, lightDir), 0.0) * dirColor);

  return vec4f(textureColor.rgb * lightColor, textureColor.a);
}`;
