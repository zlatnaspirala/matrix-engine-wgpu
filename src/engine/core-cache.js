const BC_INFO = {
  BC1: {wgpu: 'bc1-rgba-unorm', block: 8},
  BC3: {wgpu: 'bc3-rgba-unorm', block: 16},
  BC4: {wgpu: 'bc4-r-unorm', block: 8},
  BC5: {wgpu: 'bc5-rg-unorm', block: 16},
  BC7: {wgpu: 'bc7-rgba-unorm', block: 16},
};
const DXGI_TO_BC = {71: 'BC1', 72: 'BC1', 77: 'BC3', 78: 'BC3', 80: 'BC4', 83: 'BC5', 98: 'BC7', 99: 'BC7'};

export class TextureCache {
  constructor(device) {
    this.device = device;
    this.cache = new Map();
  }
  async get(path, format, isEnvMap = false, useBC = false) {
    const key = useBC ? `bc:${path}` : path;
    if(this.cache.has(key)) {
      return this.cache.get(key);
    }
    let promise;
    if(isEnvMap == true) {
      promise = this.#loadEnvMap(path, format);
    } else if(useBC == true) {
      promise = this.#loadBC(path);
    } else {
      promise = this.#load(path, format);
    }
    this.cache.set(key, promise);
    return promise;
  }

  async #loadBC(path) {
    const ddsPath = path.replace(/\.(png|jpe?g)$/i, '.dds');
    const buf = await (await fetch(ddsPath)).arrayBuffer();
    const dv = new DataView(buf);
    if(dv.getUint32(0, true) !== 0x20534444) throw new Error('not a DDS: ' + ddsPath);

    const height = dv.getUint32(12, true);
    const width = dv.getUint32(16, true);
    const mipCount = Math.max(1, dv.getUint32(28, true));
    const fourCC = String.fromCharCode(dv.getUint8(84), dv.getUint8(85), dv.getUint8(86), dv.getUint8(87));

    let dataOffset = 128;
    let bcType;
    if(fourCC === 'DX10') {
      bcType = DXGI_TO_BC[dv.getUint32(128, true)];
      dataOffset = 148;
    } else {
      bcType = {DXT1: 'BC1', DXT5: 'BC3'}[fourCC];
    }
    if(!bcType) throw new Error('unsupported DDS format in ' + ddsPath);

    const {wgpu: format, block: blockBytes} = BC_INFO[bcType];

    const texture = this.device.createTexture({
      label: `BC: ${ddsPath}`,
      size: [width, height, 1],
      format,
      mipLevelCount: mipCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    let offset = dataOffset;
    for(let mip = 0;mip < mipCount;mip++) {
      const mipW = Math.max(1, width >> mip);
      const mipH = Math.max(1, height >> mip);
      const blocksPerRow = Math.max(1, Math.ceil(mipW / 4));
      const blockRows = Math.max(1, Math.ceil(mipH / 4));
      const bytesPerRow = blocksPerRow * blockBytes;
      const mipBytes = bytesPerRow * blockRows;

      this.device.queue.writeTexture(
        {texture, mipLevel: mip},
        new Uint8Array(buf, offset, mipBytes),
        {bytesPerRow, rowsPerImage: blockRows},
        {width: mipW, height: mipH, depthOrArrayLayers: 1}
      );
      offset += mipBytes;
    }

    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: mipCount > 1 ? 'linear' : undefined,
      addressModeU: "repeat",
      addressModeV: "repeat",
      addressModeW: "repeat",
    });

    return {texture, sampler};
  }

  async loadEnvMap(path) {
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
    const mipLevelCount = 1;

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
      mipmapFilter: 'linear',        // ✅ Smooth between mip levels
      addressModeU: 'repeat',        // ✅ Wrap horizontally (360°)
      addressModeV: 'clamp-to-edge', // ✅ Clamp at poles (top/bottom)
    });
    return {texture, sampler};
  }
}