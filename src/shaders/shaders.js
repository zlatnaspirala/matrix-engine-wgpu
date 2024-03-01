
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
