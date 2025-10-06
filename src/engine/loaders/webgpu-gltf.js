/**
 * @author Nikola Lukic zlatnaspirala
 * @description
 * Importer is adapted for matrix-engine-wgpu.
 * Improved - Fix children empty array.
 * Access to json raw data.
 * @source
 * https://github.com/Twinklebear/webgpu-gltf/blob/main/src/glb_import.js
 */
import {mat4} from "gl-matrix";

const GLTFRenderMode = {
  POINTS: 0,
  LINE: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  // Note: fans are not supported in WebGPU, use should be
  // an error or converted into a list/strip
  TRIANGLE_FAN: 6,
};

const GLTFComponentType = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  INT: 5124,
  UNSIGNED_INT: 5125,
  FLOAT: 5126,
  DOUBLE: 5130,
};

const GLTFTextureFilter = {
  NEAREST: 9728,
  LINEAR: 9729,
  NEAREST_MIPMAP_NEAREST: 9984,
  LINEAR_MIPMAP_NEAREST: 9985,
  NEAREST_MIPMAP_LINEAR: 9986,
  LINEAR_MIPMAP_LINEAR: 9987,
};

const GLTFTextureWrap = {
  REPEAT: 10497,
  CLAMP_TO_EDGE: 33071,
  MIRRORED_REPEAT: 33648,
};

function alignTo(val, align) {
  return Math.floor((val + align - 1) / align) * align;
}

function gltfTypeNumComponents(type) {
  switch(type) {
    case 'SCALAR':
      return 1;
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    default:
      alert('Unhandled glTF Type ' + type);
      return null;
  }
}

function gltfTypeSize(componentType, type) {
  var typeSize = 0;
  switch(componentType) {
    case GLTFComponentType.BYTE:
      typeSize = 1;
      break;
    case GLTFComponentType.UNSIGNED_BYTE:
      typeSize = 1;
      break;
    case GLTFComponentType.SHORT:
      typeSize = 2;
      break;
    case GLTFComponentType.UNSIGNED_SHORT:
      typeSize = 2;
      break;
    case GLTFComponentType.INT:
      typeSize = 4;
      break;
    case GLTFComponentType.UNSIGNED_INT:
      typeSize = 4;
      break;
    case GLTFComponentType.FLOAT:
      typeSize = 4;
      break;
    case GLTFComponentType.DOUBLE:
      typeSize = 4;
      break;
    default:
      alert('Unrecognized GLTF Component Type?');
  }
  return gltfTypeNumComponents(type) * typeSize;
}

export class GLTFBuffer {
  constructor(buffer, size, offset) {
    this.arrayBuffer = buffer;
    this.size = size;
    this.byteOffset = offset;
  }
}

export class GLTFBufferView {
  constructor(buffer, view) {
    this.length = view['byteLength'];
    this.byteOffset = buffer.byteOffset;
    if(view['byteOffset'] !== undefined) {
      this.byteOffset += view['byteOffset'];
    }
    this.byteStride = 0;
    if(view['byteStride'] !== undefined) {
      this.byteStride = view['byteStride'];
    }
    this.buffer = new Uint8Array(buffer.arrayBuffer, this.byteOffset, this.length);

    this.needsUpload = false;
    this.gpuBuffer = null;
    this.usage = 0;
  }

  addUsage(usage) {
    this.usage = this.usage | usage;
  }

  upload(device) {
    // Note: must align to 4 byte size when mapped at creation is true
    var buf = device.createBuffer({
      size: alignTo(this.buffer.byteLength, 4),
      usage: this.usage,
      mappedAtCreation: true
    });
    new (this.buffer.constructor)(buf.getMappedRange()).set(this.buffer);
    buf.unmap();
    this.gpuBuffer = buf;
    this.needsUpload = false;
  }
}

export class GLTFAccessor {
  constructor(view, accessor, weightsAccessIndex) {
    this.count = accessor['count'];
    this.componentType = accessor['componentType'];
    this.gltfType = accessor['type'];
    this.numComponents = gltfTypeNumComponents(accessor['type']);
    this.numScalars = this.count * this.numComponents;
    this.view = view;
    this.byteOffset = 0;
    if(accessor['byteOffset'] !== undefined) {
      this.byteOffset = accessor['byteOffset'];
    }
    if (weightsAccessIndex) this.weightsAccessIndex = weightsAccessIndex;
  }

  get byteStride() {
    var elementSize = gltfTypeSize(this.componentType, this.gltfType);
    return Math.max(elementSize, this.view.byteStride);
  }
}

export class GLTFPrimitive {
  constructor(indices, positions, normals, texcoords, material, topology, weights, joints, tangents) {
    this.indices = indices;
    this.positions = positions;
    this.normals = normals;
    this.texcoords = texcoords;
    this.material = material;
    this.topology = topology;
    this.weights = weights;
    this.joints = joints;
    this.tangents = tangents;
  }
}

export class GLTFMesh {
  constructor(name, primitives) {
    this.name = name;
    this.primitives = primitives;
  }
}

export class GLTFNode {
  constructor(name, mesh, transform, n) {
    this.name = name;
    this.mesh = mesh;
    this.transform = transform;

    this.gpuUniforms = null;
    this.bindGroup = null;

    this.children = n.children || [];
  }

  upload(device) {
    var buf = device.createBuffer(
      {size: 4 * 4 * 4, usage: GPUBufferUsage.UNIFORM, mappedAtCreation: true});
    new Float32Array(buf.getMappedRange()).set(this.transform);
    buf.unmap();
    this.gpuUniforms = buf;
  }
}

function readNodeTransform(node) {
  if(node['matrix']) {
    var m = node['matrix'];
    // Both glTF and gl matrix are column major
    return mat4.fromValues(m[0],
      m[1],
      m[2],
      m[3],
      m[4],
      m[5],
      m[6],
      m[7],
      m[8],
      m[9],
      m[10],
      m[11],
      m[12],
      m[13],
      m[14],
      m[15]);
  } else {
    var scale = [1, 1, 1];
    var rotation = [0, 0, 0, 1];
    var translation = [0, 0, 0];
    if(node['scale']) {
      scale = node['scale'];
    }
    if(node['rotation']) {
      rotation = node['rotation'];
    }
    if(node['translation']) {
      translation = node['translation'];
    }
    var m = mat4.create();
    return mat4.fromRotationTranslationScale(m, rotation, translation, scale);
  }
}

// function flattenGLTFChildren(nodes, node, parent_transform) {
//   var tfm = readNodeTransform(node);
//   var tfm = mat4.mul(tfm, parent_transform, tfm);
//   node['matrix'] = tfm;
//   node['scale'] = undefined;
//   node['rotation'] = undefined;
//   node['translation'] = undefined;
//   if(node['children']) {
//     for(var i = 0;i < node['children'].length;++i) {
//       flattenGLTFChildren(nodes, nodes[node['children'][i]], tfm);
//     }
//     node['children'] = [];
//   }
// }

function flattenGLTFChildren(nodes, node, parent_transform) {
  var tfm = readNodeTransform(node);
  var tfm = mat4.mul(tfm, parent_transform, tfm);
  node['matrix'] = tfm;
  node['scale'] = undefined;
  node['rotation'] = undefined;
  node['translation'] = undefined;

  if(node['children']) {
    for(var i = 0;i < node['children'].length;++i) {
      flattenGLTFChildren(nodes, nodes[node['children'][i]], tfm);
    }
    // node['children'] = []; // REMOVE THIS LINE
  }
}


function makeGLTFSingleLevel(nodes) {
  var rootTfm = mat4.create();
  for(var i = 0;i < nodes.length;++i) {
    flattenGLTFChildren(nodes, nodes[i], rootTfm);
  }
  return nodes;
}

export class GLTFMaterial {
  constructor(material, textures) {
    this.baseColorFactor = [1, 1, 1, 1];
    this.baseColorTexture = null;
    // padded to float4
    this.emissiveFactor = [0, 0, 0, 1];
    this.metallicFactor = 1.0;
    this.roughnessFactor = 1.0;

    if(material['pbrMetallicRoughness'] !== undefined) {
      var pbr = material['pbrMetallicRoughness'];
      if(pbr['baseColorFactor'] !== undefined) {
        this.baseColorFactor = pbr['baseColorFactor'];
      }
      if(pbr['baseColorTexture'] !== undefined) {
        // TODO multiple texcoords
        this.baseColorTexture = textures[pbr['baseColorTexture']['index']];
      }
      if(pbr['metallicFactor'] !== undefined) {
        this.metallicFactor = pbr['metallicFactor'];
      }
      if(pbr['roughnessFactor'] !== undefined) {
        this.roughnessFactor = pbr['roughnessFactor'];
      }
    }
    if(material['emissiveFactor'] !== undefined) {
      this.emissiveFactor[0] = material['emissiveFactor'][0];
      this.emissiveFactor[1] = material['emissiveFactor'][1];
      this.emissiveFactor[2] = material['emissiveFactor'][2];
    }

    this.gpuBuffer = null;
    this.bindGroupLayout = null;
    this.bindGroup = null;
  }

  upload(device) {
    var buf = device.createBuffer(
      {size: 3 * 4 * 4, usage: GPUBufferUsage.UNIFORM, mappedAtCreation: true});
    var mappingView = new Float32Array(buf.getMappedRange());
    mappingView.set(this.baseColorFactor);
    mappingView.set(this.emissiveFactor, 4);
    mappingView.set([this.metallicFactor, this.roughnessFactor], 8);
    buf.unmap();
    this.gpuBuffer = buf;

    var layoutEntries =
      [{binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}];
    var bindGroupEntries = [{
      binding: 0,
      resource: {
        buffer: this.gpuBuffer,
      }
    }];

    if(this.baseColorTexture) {
      // Defaults for sampler and texture are fine, just make the objects
      // exist to pick them up
      layoutEntries.push({binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {}});
      layoutEntries.push({binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {}});

      bindGroupEntries.push({
        binding: 1,
        resource: this.baseColorTexture.sampler,
      });
      bindGroupEntries.push({
        binding: 2,
        resource: this.baseColorTexture.imageView,
      });
    }

    this.bindGroupLayout = device.createBindGroupLayout({entries: layoutEntries});

    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: bindGroupEntries,
    });
  }
}

export class GLTFSampler {
  constructor(sampler, device) {
    var magFilter = sampler['magFilter'] === undefined ||
      sampler['magFilter'] == GLTFTextureFilter.LINEAR
      ? 'linear'
      : 'nearest';
    var minFilter = sampler['minFilter'] === undefined ||
      sampler['minFilter'] == GLTFTextureFilter.LINEAR
      ? 'linear'
      : 'nearest';

    var wrapS = 'repeat';
    if(sampler['wrapS'] !== undefined) {
      if(sampler['wrapS'] == GLTFTextureFilter.REPEAT) {
        wrapS = 'repeat';
      } else if(sampler['wrapS'] == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapS = 'clamp-to-edge';
      } else {
        wrapS = 'mirror-repeat';
      }
    }

    var wrapT = 'repeat';
    if(sampler['wrapT'] !== undefined) {
      if(sampler['wrapT'] == GLTFTextureFilter.REPEAT) {
        wrapT = 'repeat';
      } else if(sampler['wrapT'] == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapT = 'clamp-to-edge';
      } else {
        wrapT = 'mirror-repeat';
      }
    }

    this.sampler = device.createSampler({
      magFilter: magFilter,
      minFilter: minFilter,
      addressModeU: wrapS,
      addressModeV: wrapT,
    });
  }
}

export class GLTFTexture {
  constructor(sampler, image) {
    this.gltfsampler = sampler;
    this.sampler = sampler.sampler;
    this.image = image;
    this.imageView = image.createView();
  }
}

export class GLBModel {
  constructor(nodes, skins, skinnedMeshNodes, glbJsonData, glbBinaryBuffer) {
    this.nodes = nodes;
    this.skins = skins;
    this.skinnedMeshNodes = skinnedMeshNodes;
    this.bvhToGLBMap = null;
    this.glbJsonData = glbJsonData;
    this.glbBinaryBuffer = glbBinaryBuffer;
  }
};

// function getComponentSize(componentType) {
//   switch(componentType) {
//     case 5126: return 4; // float32
//     case 5123: return 2; // uint16
//     case 5121: return 1; // uint8
//     default: throw new Error("Unknown componentType: " + componentType);
//   }
// }

// Upload a GLB model and return it
export async function uploadGLBModel(buffer, device) {
  // 1️⃣ Validate header
  const header = new Uint32Array(buffer, 0, 5);
  if(header[0] !== 0x46546C67) {
    alert('This does not appear to be a glb file?');
    return;
  }

  // 2️⃣ JSON chunk
  const glbJsonData = JSON.parse(
    new TextDecoder('utf-8').decode(new Uint8Array(buffer, 20, header[3]))
  );

  // 3️⃣ Binary chunk header + buffer
  const binaryHeader = new Uint32Array(buffer, 20 + header[3], 2);
  const glbBuffer = new GLTFBuffer(buffer, binaryHeader[0], 28 + header[3]);

  // 4️⃣ BufferViews
  const bufferViews = glbJsonData.bufferViews.map(
    v => new GLTFBufferView(glbBuffer, v)
  );

  const binaryOffset = 28 + header[3];
  const binaryLength = binaryHeader[0];

  // ✅ raw ArrayBuffer slice of the binary chunk:
  const glbBinaryBuffer = buffer.slice(binaryOffset, binaryOffset + binaryLength);

  // 5️⃣ Load images
  const images = [];
  if(glbJsonData.images) {
    for(const imgJson of glbJsonData.images) {
      const view = new GLTFBufferView(
        glbBuffer,
        glbJsonData.bufferViews[imgJson.bufferView]
      );
      const blob = new Blob([view.buffer], {type: imgJson['mime/type']});
      const img = await createImageBitmap(blob);
      const gpuImg = device.createTexture({
        size: [img.width, img.height, 1],
        format: 'rgba8unorm-srgb',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      device.queue.copyExternalImageToTexture(
        {source: img},
        {texture: gpuImg},
        [img.width, img.height, 1]
      );
      images.push(gpuImg);
    }
  }

  glbJsonData.glbTextures = images;
  // console.log('IMAGES FROM GLB: ', images)
  // 6️⃣ Samplers, Textures, Materials
  const defaultSampler = new GLTFSampler({}, device);
  const samplers = (glbJsonData.samplers || []).map(
    s => new GLTFSampler(s, device)
  );
  const textures = (glbJsonData.textures || []).map(tex => {
    const sampler =
      tex.sampler !== undefined ? samplers[tex.sampler] : defaultSampler;
    return new GLTFTexture(sampler, images[tex.source]);
  });

  const defaultMaterial = new GLTFMaterial({});
  const materials = (glbJsonData.materials || []).map(
    m => new GLTFMaterial(m, textures)
  );

  // 7️⃣ Meshes
  const meshes = (glbJsonData.meshes || []).map(mesh => {
    const primitives = mesh.primitives.map(prim => {
      const topology = prim.mode ?? GLTFRenderMode.TRIANGLES;
      // console.log('topology ', topology)
      // Indices
      let indices = null;
      if(prim.indices !== undefined) {
        const accessor = glbJsonData.accessors[prim.indices];
        const viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.INDEX);
        indices = new GLTFAccessor(bufferViews[viewID], accessor);
      }
      // Vertex attributes
      let positions = null,
        normals = null,
        tangents = null,
        texcoords = [];
      let weights = null;
      let joints = null;
      for(const attr in prim.attributes) {
        const accessor = glbJsonData.accessors[prim.attributes[attr]];
        const viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.VERTEX);
        if(attr === 'POSITION') {
          positions = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if(attr === 'NORMAL') {
          normals = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if(attr.startsWith('TEXCOORD')) {
          texcoords.push(new GLTFAccessor(bufferViews[viewID], accessor));
        } else if(attr === 'WEIGHTS_0') {
          weights = new GLTFAccessor(bufferViews[viewID], accessor, prim.attributes['WEIGHTS_0']);
        } else if(attr.startsWith('JOINTS')) {
          joints = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr === 'TANGENT') {
          tangents = new GLTFAccessor(bufferViews[viewID], accessor);
        } else {
          console.log('unknow-attr:', attr)
        }
      }

      const material = prim.material !== undefined ? materials[prim.material] : defaultMaterial;
      return new GLTFPrimitive(
        indices,
        positions,
        normals,
        texcoords,
        material,
        topology,
        weights,
        joints,
        tangents
      );
    });
    return new GLTFMesh(mesh.name, primitives);
  });

  // Upload buffers & materials
  for(const bv of bufferViews) if(bv.needsUpload) bv.upload(device);
  defaultMaterial.upload(device);
  for(const m of materials) m.upload(device);
  // 8️⃣ Skins (we only store the index of inverseBindMatrices here)
  const skins = (glbJsonData.skins || []).map(skin => ({
    name: skin.name,
    joints: skin.joints,
    inverseBindMatrices: skin.inverseBindMatrices, // accessor index
  }));
  // 9️⃣ Nodes
  const nodes = [];
  const gltfNodes = makeGLTFSingleLevel(glbJsonData.nodes);
  for(let i = 0;i < gltfNodes.length;i++) {
    const n = gltfNodes[i];
    const meshObj = n.mesh !== undefined ? meshes[n.mesh] : null;
    const node = new GLTFNode(n.name, meshObj, readNodeTransform(n), n);

    if(n.skin !== undefined) node.skin = n.skin; // skin index
    node.upload(device);
    nodes.push(node);
  }

  // 🟩 Build parent references:
  for(let i = 0;i < gltfNodes.length;i++) {
    const srcNode = gltfNodes[i];
    // srcNode.children is an array of indices
    if(srcNode.children) {
      for(const childIndex of srcNode.children) {
        nodes[childIndex].parent = i;   // add .parent to the child node
      }
    }
  }
  // Ensure nodes without parent are root nodes
  for(const node of nodes) {
    if(node.parent === undefined) node.parent = null;
  }
  const skinnedMeshNodes = nodes.filter(
    n => n.mesh && n.skin !== undefined
  );
  if(skinnedMeshNodes.length === 0) {
    console.warn('No skins found — mesh not bound to skeleton');
  } else {
    skinnedMeshNodes.forEach(n => {
      // console.log('Mesh', n.mesh.name, 'uses skin index', n.skin);
      // Per-mesh uniform buffer (example)
      n.sceneUniformBuffer = device.createBuffer({
        size: 44 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    });
  }
  let R = new GLBModel(nodes, skins, skinnedMeshNodes, glbJsonData, glbBinaryBuffer)
  return R;
}
