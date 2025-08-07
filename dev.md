Differences from image:
You don’t need createImageBitmap.

You don’t create a texture manually via device.createTexture.

You use device.importExternalTexture() every frame.

You’ll store the externalTexture in a property and update it every frame.







https://maierfelix.github.io/2020-01-13-webgpu-ray-tracing/?utm_source=chatgpt.com


Felix Maier
About Me
Real-Time Ray-Tracing in WebGPU
Posted on January 13, 2020
Intro
By the end of 2018, NVIDIA released the new GPU series Turing, best known for its ability of accelerated ray tracing.

Ray tracing is the process of simulating light paths from reality. In reality, billions of rays get shot around you and at some point, hit your eyes. Up to today, simulating this process is one of the most expensive tasks in computer science and an ongoing research area.

Previously, if you were interested in modern ray tracing, then you had a giant chunk of learning material in front of you. Modern graphics APIs became a lot more complicated to work with and ray tracing was only available for these APIs. You had to spend a lot time learning about them, before you could even start about the ray tracing topic itself.

Note: If you’re not the owner of a RTX card, but have a GTX 1060+ around, then you are one of the lucky guys who can test ray tracing without the need to buy one of those more expensive cards.

Luckily, there is WebGPU
WebGPU is the successor to WebGL and combines multiple graphics APIs into one, standardized API. It is said, that WebGPU’s API is a mixture of Apple’s Metal API and parts of the Vulkan API, but a lot more straightforward to work with.

Some WebGPU implementations come with multiple rendering backends, such as D3D12, Vulkan, Metal and OpenGL. Depending on the user’s setup, one of these backends get used, preferably the fastest one with the most reliability for the platform. The commands sent to WebGPU then get translated into one of these backends.

Preview
Here is an example project using WebGPU Ray tracing:


Source code: Link

There is also a custom Chromium build with ray tracing capabilities and an online demo, which you can find here.

Upfront
Note that ray tracing is not available officially for WebGPU (yet?) and is only available for the Node bindings for WebGPU. Recently I began adapting an unofficial ray tracing extension for Dawn, which is the WebGPU implementation for Chromium. The ray tracing extension is implemented into the Vulkan backend (using VK_KHR_ray_tracing) and the D3D12 backend (using DXR). You can find my Dawn fork with ray tracing capabilities here.

The specification of the ray tracing extension can be found here.

Now let me introduce you to the ideas and concepts of this new extension. Note that from now on, I will use RT when referring to ray tracing or RTX.

Bounding Volume Hierarchies
When dealing with RT, you often end up having to work with Bounding Volume Hierarchies (short: “BVH”). BVHs are used to encapsulate arbitrary geometry for faster ray-triangle intersection. BVHs are very important in RT, since without them, for each ray, you’d have to check all triangles in a scene for intersection with the ray and this process quickly becomes expensive.

Previously, for RT projects, you had to implement your own BVH system. Today you no longer have to do that, since the driver is generating the BVHs for you (either on CPU or GPU).

Ray tracing Shaders
Previously, you only had vertex, fragment and compute shaders. The RT extension exposes 5 new shader stages:

Ray-Generation (.rgen)
Ray-Closest-Hit (.rchit)
Ray-Any-Hit (.rahit)
Ray-Miss (.rmiss)
Ray-Intersection (.rint)
Ray-Generation:
For each pixel on the screen, we want to shoot rays into a scene. This shader allows to generate and trace rays into an acceleration container.

Ray-Closest-Hit:
A ray can hit multiple surfaces (e.g. a triangle), but often, we’re only interested in the surface that is the closest to the ray’s origin. This shader gets invoked for the “closest surface” that got intersected with and also contains arbitary hit information.

Ray-Any-Hit:
This shader is identical to the closest-hit shader, but can get invoked multiple times.

Ray-Miss:
This shader gets invoked, whenever a ray didn’t hit anything (i.e. “hit the sky”).

Ray-Intersection:
When dealing with procedural geometry, a custom intersection shader can be defined to determine what happens when a ray hits a bounding box. The default ray-intersection shader is for triangles only, but a ray-intersection shader allows to add any kind of new geometry (e.g. voxels, spheres etc.).

Shader Binding Table
The most common approach about shaders is to bind them, depending on how you want an object to look like on the screen. In RT however, it’s often impossible to known upfront which shaders to bind, and which shaders should get invoked in which order. To fix this, a new concept was introduced called the shader binding table (or short “SBT”).

The SBT’s purpose is to batch shaders together into groups, and later, dynamically invoke them from the RT shaders, based on a ray’s tracing result (i.e. hit or miss a surface).

Acceleration Containers
Acceleration containers probably seem to be the most complicated thing at first, but they are actually quite simple in their concept.

There are two different kinds of acceleration containers:

Bottom-level: The container stores references to geometry (short “BLAC”)
Top-level: The container stores instances with references to a bottom-level container, each with an arbitrary transform “TLAC”
Generally said, a bottom-level container contains just the meshes, while a top-level containers describes, where to place these meshes in a virtual world. In fact, this process is similar to Geometry Instancing, a common approach in graphics programming, which is about effectively reusing geometry across a scene to reduce memory usage and improve performance.

Coding Time
You can find a code reference here.

After this tutorial, you will be able to render this beautiful triangle, fully ray traced with hardware acceleration:



Create Geometry
At first, you need some kind of geometry that you want to ray trace and draw to the screen.

We’ll just use a simple triangle at first. Notice that for all buffers which will be used in acceleration containers later, the GPUBufferUsage.RAY_TRACING must be set.

let triangleVertices = new Float32Array([
   1.0,  1.0, 0.0,
  -1.0,  1.0, 0.0,
   0.0, -1.0, 0.0
]);
// create a GPU local buffer containing the vertices
let triangleVertexBuffer = device.createBuffer({
  size: triangleVertices.byteLength,
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.RAY_TRACING
});
// upload the vertices to the GPU buffer
triangleVertexBuffer.setSubData(0, triangleVertices);
Since you probably end up using an index buffer later anyway, let’s create one:

let triangleIndices = new Uint32Array([
  0, 1, 2
]);
// create a GPU local buffer containing the indices
let triangleIndexBuffer = device.createBuffer({
  size: triangleIndices.byteLength,
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.RAY_TRACING
});
// upload the indices to the GPU buffer
triangleIndexBuffer.setSubData(0, triangleIndices);
Create Bottom-Level Acceleration Container
Now we will create our first acceleration container, which stores a reference to the geometry we have just created:

let geometryContainer = device.createRayTracingAccelerationContainer({
  level: "bottom",
  flags: GPURayTracingAccelerationContainerFlag.PREFER_FAST_TRACE,
  geometries: [
    {
      type: "triangles", // the geometry kind of the vertices (triangles or aabbs)
      vertex: {
        buffer: triangleVertexBuffer, // our GPU buffer containing the vertices
        format: "float3", // one vertex is made up of 3 floats
        stride: 3 * Float32Array.BYTES_PER_ELEMENT, // the byte stride between each vertex
        count: triangleVertices.length, // the total amount of vertices
      },
      index: {
        buffer: triangleIndexBuffer, // (optional) the index buffer to use
        format: "uint32", // (optional) the format of the index buffer (Uint32Array)
        count: triangleIndices.length // the total amount of indices
      }
    }
  ]
});
Create Top-Level Acceleration Container
This container will hold an instance with a reference to our triangle geometry. This instance defines how the geometry gets positioned in our world using the transform property. The property geometryContainer is used to assign geometry to the instance:

let instanceContainer = device.createRayTracingAccelerationContainer({
  level: "top",
  flags: GPURayTracingAccelerationContainerFlag.PREFER_FAST_TRACE,
  instances: [
    {
      flags: GPURayTracingAccelerationInstanceFlag.TRIANGLE_CULL_DISABLE, // disable back-face culling
      mask: 0xFF, // in the shader, you can cull objects based on their mask
      instanceId: 0, // a custom Id which you can use to identify an object in the shaders
      instanceOffset: 0x0, // unused
      transform: { // defines how to position the instance in the world
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      geometryContainer: geometryContainer // reference to a geometry container
    }
  ]
});
Building Acceleration Containers
To let the driver build the BVHs and everything else for our acceleration containers, we use the command buildRayTracingAccelerationContainer. There are 2 important things to keep in mind when building acceleration containers. First, BLAC which get referenced in a TLAC must be built before the TLAC. Second, BLAC and TLAC must not be built in the same pass, use different passes instead.

In terms of code this means:

let commandEncoder = device.createCommandEncoder({});
commandEncoder.buildRayTracingAccelerationContainer(geometryContainer);
queue.submit([ commandEncoder.finish() ]);
let commandEncoder = device.createCommandEncoder({});
// instanceContainer can now be built, since geometryContainer was built before
commandEncoder.buildRayTracingAccelerationContainer(instanceContainer);
queue.submit([ commandEncoder.finish() ]);
Pixel Buffer
RT shaders run similar as a compute shader and we somehow have to get our ray traced pixels to the screen. To do so, we create a pixel buffer, which we will write our pixels into, and then copy these pixels to the screen.

let pixelBufferSize = window.width * window.height * 4 * Float32Array.BYTES_PER_ELEMENT;
let pixelBuffer = device.createBuffer({
  size: pixelBufferSize,
  usage: GPUBufferUsage.STORAGE
});
Bind Group Layout
There is a new type for bind group layouts, which allows us to assign a TLAC:

let rtBindGroupLayout = device.createBindGroupLayout({
  bindings: [
    // the first binding will be the acceleration container
    {
      binding: 0,
      visibility: GPUShaderStage.RAY_GENERATION,
      type: "acceleration-container"
    },
    // the second binding will be the pixel buffer
    {
      binding: 1,
      visibility: GPUShaderStage.RAY_GENERATION,
      type: "storage-buffer"
    }
  ]
});
Bind Group
When creating our bind group, we simply set the acceleration container and the pixel buffer.

let rtBindGroup = device.createBindGroup({
  layout: rtBindGroupLayout,
  bindings: [
    {
      binding: 0,
      accelerationContainer: instanceContainer,
      offset: 0,
      size: 0
    },
    {
      binding: 1,
      buffer: pixelBuffer,
      offset: 0,
      size: pixelBufferSize
    }
  ]
});
Ray-Generation Shader
RT shaders are similar to compute shaders, but when requiring the GL_EXT_ray_tracing extension, things change quite a lot. I’ll only describe the most important bits:

rayPayloadEXT: This payload is used to communicate between shader stages. For example, when the hit shader is called, we can write a result into the payload, and read it back in the ray generation shader. Note that in other shaders, the payload is called rayPayloadInEXT.
uniform accelerationStructureEXT: The TLAC that we’ve binded in our bind group.
gl_LaunchIDEXT: Is the relative pixel position, based on our traceRays call dimension.
gl_LaunchSizeEXT: Is the dimension, specified in our traceRays call.
traceRayEXT: Traces rays into a TLAC
#version 460
#extension GL_EXT_ray_tracing : enable
#pragma shader_stage(raygen)

struct RayPayload { vec3 color; };
layout(location = 0) rayPayloadEXT RayPayload payload;

layout(set = 0, binding = 0) uniform accelerationStructureEXT acc;
layout(set = 0, binding = 1, std140) buffer PixelBuffer {
  vec4 pixels[];
} pixelBuffer;

void main() {
  ivec2 ipos = ivec2(gl_LaunchIDEXT.xy);
  const ivec2 resolution = ivec2(gl_LaunchSizeEXT.xy);

  vec2 pixelCenter = vec2(gl_LaunchIDEXT.xy) + vec2(0.5);

  vec2 d = (pixelCenter / vec2(gl_LaunchSizeEXT.xy)) * 2.0 - 1.0;
  float aspectRatio = float(gl_LaunchSizeEXT.x) / float(gl_LaunchSizeEXT.y);

  vec3 rayOrigin = vec3(0, 0, -1.5);
  vec3 rayDir = normalize(vec3(d.x * aspectRatio, -d.y, 1));

  uint sbtOffset = 0;
  uint sbtStride = 0;
  uint missIndex = 0;
  payload.color = vec3(0);
  traceRayEXT(
    acc, gl_RayFlagsOpaqueEXT, 0xff,
    sbtOffset, sbtStride, missIndex,
    rayOrigin, 0.001, rayDir, 100.0,
    0
  );

  const uint pixelIndex = ipos.y * resolution.x + ipos.x;
  pixelBuffer.pixels[pixelIndex] = vec4(payload.color, 1.0);
}
Ray-Closest-Hit Shader
Gets executed for the closest intersection, relative to the ray.

rayPayloadInEXT: The payload shared between this shader and the ray generation shader.
hitAttributeEXT: Intersection point defined in the barycentric coordinate space.
Not used in this example, but important properties are also:

gl_InstanceCustomIndexEXT: Returns us the Id of the instance we have intersected with - We can define the instance id, when creating a TLAC.
gl_WorldRayDirectionEXT: Returns the ray’s direction in world-space and is normalized.
gl_WorldToObjectEXT and gl_ObjectToWorldEXT: Can be used, to convert between world-space and object-space. Note that both are 3x4 matrices.
gl_HitTEXT: The traveled distance of the ray.
Note that hit and miss shaders mostly have the same properties available (most importantly miss shaders have no hit information). You can find a list of all available properties here.

#version 460
#extension GL_EXT_ray_tracing : enable
#pragma shader_stage(closest)

struct RayPayload { vec3 color; };
layout(location = 0) rayPayloadInEXT RayPayload payload;

struct HitAttributeData { vec2 bary; };
hitAttributeEXT HitAttributeData attribs;

void main() {
  vec3 bary = vec3(1.0 - attribs.bary.x - attribs.bary.y, attribs.bary.x, attribs.bary.y);
  payload.color = bary;
}
Ray-Miss Shader
Gets executed whenever a ray hit nothing at all. We simply return a gray color here.

#version 460
#extension GL_EXT_ray_tracing : enable
#pragma shader_stage(miss)

struct RayPayload { vec3 color; };
layout(location = 0) rayPayloadInEXT RayPayload payload;

void main() {
  payload.color = vec3(0.3);
}
Shader Binding Table
The SBT allows to group shaders together into groups, to dynamically invoke them later.

The following shaders are supported:

GPUShaderStage.RAY_GENERATION
GPUShaderStage.RAY_ANY_HIT
GPUShaderStage.RAY_CLOSEST_HIT
GPUShaderStage.RAY_MISS
GPUShaderStage.RAY_INTERSECTION
In stages, you add all the shaders you want to use. In groups, you then index the shaders defined in stages and also define how each shader will be used then.

If the index in a group is -1, it means that there is no associated stage. You can also combine multiple stages into one group together, which is done e.g. for procedural hit shaders, where a hit shader is used along an intersection shader.

Note that the generalIndex is used for ray generation and ray miss shaders.

let shaderBindingTable = device.createRayTracingShaderBindingTable({
  stages: [
    {
      module: rayGenShaderModule,
      stage: GPUShaderStage.RAY_GENERATION
    },
    {
      module: rayCHitShaderModule,
      stage: GPUShaderStage.RAY_CLOSEST_HIT
    },
    {
      module: rayMissShaderModule,
      stage: GPUShaderStage.RAY_MISS
    }
  ],
  groups: [
    {
      type: "general",
      generalIndex: 0,
      anyHitIndex: -1,
      closestHitIndex: -1,
      intersectionIndex: -1
    },
    {
      type: "triangles-hit-group",
      generalIndex: -1,
      anyHitIndex: -1,
      closestHitIndex: 1,
      intersectionIndex: -1
    },
    {
      type: "general",
      generalIndex: 2,
      anyHitIndex: -1,
      closestHitIndex: -1,
      intersectionIndex: -1
    }
  ]
});
Ray tracing Pipeline
Creating the RT pipeline is straightforward. The only important property here is maxRecursionDepth, which we can use to specify upfront how many shader recursions we want to allow. Note that GPUs are bad at performing recursion, and when possible, recursive calls should be flattened into a loop. We will leave this value to 1, so we can shoot our rays in the ray generation shader.

let rtPipeline = device.createRayTracingPipeline({
  layout: device.createPipelineLayout({
    bindGroupLayouts: [rtBindGroupLayout]
  }),
  rayTracingState: {
    shaderBindingTable,
    maxRecursionDepth: 1
  }
});
Tracing Rays
The RT Pass’s only difference to other passes is, that we have the command traceRays, which allows us to shoot rays with a given dimension. You might find it useful to kind of think of traceRays as the dispatch command in a compute pass.

let commandEncoder = device.createCommandEncoder({});
let passEncoder = commandEncoder.beginRayTracingPass({});
passEncoder.setPipeline(rtPipeline);
passEncoder.setBindGroup(0, rtBindGroup);
passEncoder.traceRays(
  0, // sbt ray-generation index
  1, // sbt ray-hit index
  2, // sbt ray-miss index
  window.width,  // query width
  window.height, // query height
  1              // query depth
);
passEncoder.endPass();
queue.submit([ commandEncoder.finish() ]);
Blit to Screen
I left the part of setting up the rasterization pipeline, as it should be straightforward and only the blit shaders should be interesting.

The blit vertex shader is created like this and defines a fullscreen quad:

#version 450
#pragma shader_stage(vertex)

layout (location = 0) out vec2 uv;

void main() {
  vec2 pos = vec2((gl_VertexIndex << 1) & 2, gl_VertexIndex & 2);
  gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
  uv = pos;
}
Note that you have to draw with a vertex count 3 to successfully run this shader. Also, make sure that your blit pass has a color attachment with the swapchain image as input.

#version 450
#pragma shader_stage(fragment)

layout (location = 0) in vec2 uv;
layout (location = 0) out vec4 outColor;

layout(std140, set = 0, binding = 0) buffer PixelBuffer {
  vec4 pixels[];
} pixelBuffer;

layout(set = 0, binding = 1) uniform ScreenDimension {
  vec2 resolution;
};

void main() {
  const ivec2 bufferCoord = ivec2(floor(uv * resolution));
  const vec2 fragCoord = (uv * resolution);
  const uint pixelIndex = bufferCoord.y * uint(resolution.x) + bufferCoord.x;

  vec4 pixelColor = pixelBuffer.pixels[pixelIndex];
  outColor = pixelColor;
}
The fragment shader is just copying the pixels of the pixel buffer into the color attachment.

Tada
Even though it’s just a simple triangle, you can do quite a lot things with them. In this tutorial, I didn’t cover the entire extension, but let me show you 3 further features, which can be quite handy:

Procedural geometry
Instead of triangles, using ray intersection shaders and AABB geometry, it’s possible to efficiently render millions of objects.


Procedural geometry (Voxels) with ray tracing

On a GTX 1080, I could smoothly render about 25.000.000 Voxels.

updateRayTracingAccelerationContainer
This method updates an acceleration container and can be used for BLAC and TLAC. If it’s a BLAC, then you might have updated the vertex buffer before (e.g. skeletal animation). Or in case of a TLAC, you might want to update its instances. Note that to efficiently update the instances of a TLAC, GPURayTracingAccelerationContainerDescriptor.instanceBuffer should be used.


GLTF skeletal animation with RT

This image is showing a quick implementation for skeletal animation, where the acceleration containers get updated each frame, and the vertex skinning is done in a compute shader. The model and the animation is taken from Unreal Engine 4.

copyRayTracingAccelerationContainer
This method allows to copy the state of an acceleration container into another container and works for both BLAC and TLAC.

Tags: WebGPU Ray Tracing
RSSEmail meGitHubTwitter
Felix Maier  •  2022  •  maierfelix.github.io

Theme by beautiful-jekyll


https://maierfelix.github.io/2020-01-13-webgpu-ray-tracing/?utm_source=chatgpt.com
