class AnimatedCursor {
  constructor(options = {}) {
    this.path = options.path || './res/icons/';
    this.frameCount = options.frameCount || 8; // number of PNGs
    this.speed = options.speed || 100; // ms per frame
    this.hotspot = options.hotspot || {x: 0, y: 0};
    this.loop = options.loop !== undefined ? options.loop : true;

    this._current = 0;
    this._timer = null;
    this._isPlaying = false;
  }

  _applyCursor(index) {
    const cursorUrl = `url('${this.path}${index}.png') ${this.hotspot.x} ${this.hotspot.y}, auto`;
    document.body.style.cursor = cursorUrl;
  }

  start() {
    if(this._isPlaying) return;
    this._isPlaying = true;

    this._applyCursor(this._current);
    this._timer = setInterval(() => {
      this._current++;
      if(this._current >= this.frameCount) {
        if(this.loop) this._current = 0;
        else return this.stop();
      }
      this._applyCursor(this._current);
    }, this.speed);
  }

  stop() {
    if(!this._isPlaying) return;
    clearInterval(this._timer);
    this._timer = null;
    this._isPlaying = false;
  }

  reset() {
    this._current = 0;
    this._applyCursor(this._current);
  }

  destroy() {
    this.stop();
    document.body.style.cursor = 'auto';
  }
}