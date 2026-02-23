export class TextureCache {
  constructor(device) {
    this.device = device;
    this.cache = new Map();        // path -> Promise<TextureEntry>
  }

  async get(path, format, isEnvMap = false) {
    if(this.cache.has(path)) {
      return this.cache.get(path); // reuse promise
    }
    let promise;
    if(isEnvMap == true) {
      promise = this.#loadEnvMap(path, format);
      this.cache.set(path, promise);
    } else {
      promise = this.#load(path, format);
      this.cache.set(path, promise);
    }
    return promise;
  }

  async loadEnvMap(path) {
    // Use a special cache key for env maps
    const envKey = `env:${path}`;

    if(this.cache.has(envKey)) {
      return this.cache.get(envKey);
    }

    const promise = this.#loadEnvMap(path);
    this.cache.set(envKey, promise);
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
      {source: imageBitmap},
      {texture},
      [imageBitmap.width, imageBitmap.height]
    );

    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: "repeat",
      addressModeV: "repeat",
      addressModeW: "repeat",
    });

    return {texture, sampler};
  }

  async #loadEnvMap(path) {
    const response = await fetch(path);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    const width = imageBitmap.width;
    const height = imageBitmap.height;
    // Calculate mip levels for better quality
    // const mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1;
    const mipLevelCount  = 1;

    const texture = this.device.createTexture({
      label: `EnvMap: ${path}`,
      size: [width, height],
      format: 'rgba16float',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
      mipLevelCount,  // ✅ Enable mipmaps for smooth sampling
    });

    this.device.queue.copyExternalImageToTexture(
      {source: imageBitmap},
      {texture},
      [width, height]
    );

    // TODO: Generate mipmaps here if you have a mipmap generator
    // For now, base level (level 0) will work fine

    // Sampler optimized for environment maps
    const sampler = this.device.createSampler({
      label: 'EnvMap Sampler',
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',     // ✅ Smooth between mip levels
      addressModeU: 'repeat',     // ✅ Wrap horizontally (360°)
      addressModeV: 'clamp-to-edge', // ✅ Clamp at poles (top/bottom)
    });

    return {texture, sampler};
  }
}