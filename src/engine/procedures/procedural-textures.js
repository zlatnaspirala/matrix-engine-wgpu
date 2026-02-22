export function createGroundTexture(device, size = 512) {
  const data = new Uint8Array(size * size * 4);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Grid pattern
      const gridX = (x % 64) < 4;
      const gridY = (y % 64) < 4;
      const isLine = gridX || gridY;
      
      // Dark gray tiles with lighter grout lines
      const val = isLine ? 100 : 60;
      
      data[i] = val;     // R
      data[i+1] = val;   // G
      data[i+2] = val;   // B
      data[i+3] = 255;   // A
    }
  }
  
  const texture = device.createTexture({
    size: [size, size],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  
  device.queue.writeTexture({ texture }, data, 
    { bytesPerRow: size * 4 }, [size, size]);
  
  return texture;
}