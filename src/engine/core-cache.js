// TextureCache.js
export class TextureCache {
  constructor(device) {
    this.device = device;
    this.cache = new Map();        // path -> Promise<TextureEntry>
  }

  async get(path, format) {
    if (this.cache.has(path)) {
      return this.cache.get(path); // reuse promise
    }

    const promise = this.#load(path, format);
    this.cache.set(path, promise);
    return promise;
  }

  async #load(path, format) {
    const response = await fetch(path);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);

    const texture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format,
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture },
      [imageBitmap.width, imageBitmap.height]
    );

    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    return { texture, sampler };
  }
}
