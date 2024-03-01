export default class MatrixEngineGPUTextures {
  device = null;
  tex = null;

  constructor(device) {
    this.device = device;

    this.tex = device.createTexture({
      size: [2, 2],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    device.queue.writeTexture(
      {texture: this.tex},
      new Uint8Array([
        255, 255, 128, 255, 128, 255, 255, 255, 255, 128, 255, 255, 255, 128,
        128, 255,
      ]),
      {bytesPerRow: 8, rowsPerImage: 2},
      {width: 2, height: 2},
    );

    this.sampler = device.createSampler({
      magFilter: "nearest",
      minFilter: "nearest",
    });

    console.log("MeTexture constructed.");
  }
}
