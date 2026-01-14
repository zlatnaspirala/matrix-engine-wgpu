export class MatrixMusicAsset {
  static registry = new Map();

  constructor({path, containerId = null, autoplay = true}) {
    this.path = path;
    this.containerId = containerId;
    this.autoplay = autoplay;

    this.audioElement = null;
    this.audioContext = null;
    this.gainNode = null;
    this.filterNode = null;
    this.sourceNode = null;
  }

  /**
   * @description 
   * @Factory_Method — reuses existing asset if same path exists
   */
  static async load({path, containerId = null, autoplay = true}) {
    if(MatrixMusicAsset.registry.has(path)) {
      console.info(`🎵 MatrixMusicAsset: Reusing existing asset for ${path}`);
      return MatrixMusicAsset.registry.get(path);
    }

    const asset = new MatrixMusicAsset({path, containerId, autoplay});
    await asset.init();

    MatrixMusicAsset.registry.set(path, asset);
    return asset;
  }

  async init() {
    console.log('TEST ONCE AUDIO REACTIVE!!!!!!');
    this._createAudioElement();
    this._createAudioContext();
    this._createNodes();
    await this._tryAutoplay();
    return this;
  }

  _createNodes() {
    this.sourceNode =
      this.audioContext.createMediaElementSource(this.audioElement);

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;

    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.frequency.value = 5040;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    // main audio path
    this.sourceNode
      .connect(this.gainNode)
      .connect(this.filterNode)
      .connect(this.audioContext.destination);

    // analyser tap (parallel)
    this.sourceNode.connect(this.analyser);

    this.frequencyData =
      new Uint8Array(this.analyser.frequencyBinCount);
  }

  _createAudioElement() {
    this.audioElement = document.createElement('audio');
    this.audioElement.controls = true;
    this.audioElement.autoplay = this.autoplay;
    this.audioElement.playsInline = true;
    this.audioElement.src = `res/audios/${this.path}`;

    let container;
    if(this.containerId == null) container = document.body;
    if(this.containerId != null) container = document.getElementById(this.containerId);
    if(container) container.appendChild(this.audioElement);
  }

  _createAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioCtx();
  }

  _createNodes() {
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;

    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.frequency.value = 5040;

    this.sourceNode =
      this.audioContext.createMediaElementSource(this.audioElement);

    this.sourceNode
      .connect(this.filterNode)
      .connect(this.gainNode)
      .connect(this.audioContext.destination);
  }

  async _tryAutoplay() {
    try {
      await this.audioElement.play();
      console.info(`🎵 Music autoplay started: ${this.path}`);
    } catch(e) {
      console.warn('Autoplay blocked', e);
    }
  }

  play() {
    return this.audioElement.play();
  }

  pause() {
    this.audioElement.pause();
  }

  setVolume(v) {
    this.gainNode.gain.value = v;
  }

  setFilter(freq) {
    this.filterNode.frequency.value = freq;
  }
}
