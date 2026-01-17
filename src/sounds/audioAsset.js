export class AudioAssetManager {
  constructor() {
    this.assets = new Map();
    this.loading = new Map();
  }

  load(path, options = {}) {
    if(this.assets.has(path)) {
      return Promise.resolve(this.assets.get(path));
    }

    if(this.loading.has(path)) {
      return this.loading.get(path);
    }

    const asset = new MatrixMusicAsset({path, ...options});
    const promise = asset.init().then(a => {
      this.assets.set(path, a);
      this.loading.delete(path);
      return a;
    });
    this.loading.set(path, promise);
    return promise;
  }
}

export class MatrixMusicAsset {
  constructor({path, autoplay = true, containerId = null}) {
    this.path = path;
    this.autoplay = autoplay;
    this.containerId = containerId;
    this.audio = null;
    this.ctx = null;
    this.source = null;
    this.gain = null;
    this.filter = null;
    this.analyser = null;
    this.frequencyData = null;
    this.ready = false;
  }

  async init() {
    this.audio = document.createElement("audio");
    this.audio.id=this.path;
    this.audio.src = `res/audios/${this.path}`;
    this.audio.autoplay = this.autoplay;
    this.audio.playsInline = true;
    this.audio.controls = true;
    (this.containerId
      ? document.getElementById(this.containerId)
      : document.body
    )?.appendChild(this.audio);

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    if(this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.source = this.ctx.createMediaElementSource(this.audio);
    this.gain = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();
    this.analyser = this.ctx.createAnalyser();
    this.filter.frequency.value = 5000;
    this.analyser.fftSize = 2048;
    this.source.connect(this.gain)
      .connect(this.filter)
      .connect(this.ctx.destination);

    this.source.connect(this.analyser);
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    try {
      await this.audio.play();
    } catch {}
    this.ready = true;
    return this;
  }

  updateFFT() {
    if(!this.ready) return null;
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }
}
