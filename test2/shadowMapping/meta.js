export default {
  name: 'Shadow Mapping',
  description:
    'This example shows how to sample from a depth texture to render shadows.',
  filename: __DIRNAME__,
  sources: [
    { path: 'main2.js' },
    { path: 'vertexShadow.wgsl' },
    { path: 'vertex.wgsl' },
    { path: 'fragment.wgsl' },
  ],
};