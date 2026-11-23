/** Caches the view for the current swap-chain texture and invalidates on change. */
export class CanvasTextureViewCache {
  constructor(context) {
    this.context = context;
    this.texture = null;
    this.view = null;
  }
  getView() {
    const texture = this.context.getCurrentTexture();
    if (texture !== this.texture) {
      this.texture = texture;
      this.view = texture.createView();
    }
    return this.view;
  }
  reset() {
    this.texture = null;
    this.view = null;
  }
}
