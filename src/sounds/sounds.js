export class MatrixSounds {

  constructor() {
    this.volume = 0.5;
    this.audios = {};
    this.enabled = true; // 🔇 global flag to mute/allow audio
  }

  muteAll() {
    this.enabled = false;
    Object.values(this.audios).forEach(audio => audio.pause());
  }

  unmuteAll() {
    this.enabled = true;
  }

  createClones(c, name, path) {
    for(let x = 1;x < c;x++) {
      const a = new Audio(path);
      a.id = name + x;
      a.volume = this.volume;
      this.audios[name + x] = a;
      document.body.append(a);
    }
  }

  createAudio(name, path, useClones) {
    const a = new Audio(path);
    a.id = name;
    a.volume = this.volume;
    this.audios[name] = a;
    document.body.append(a);
    if(typeof useClones !== 'undefined') {
      this.createClones(useClones, name, path);
    }
  }

  play(name) {
    if(!this.enabled) return; // 🔇 prevent playing if muted

    const audio = this.audios[name];
    if(!audio) return;

    if(audio.paused) {
      audio.play().catch((e) => {
        if(e.name !== 'NotAllowedError') console.warn("sounds error:", e);
      });
    } else {
      this.tryClone(name);
    }
  }

  tryClone(name) {
    if(!this.enabled) return; // 🔇 prevent playing clones

    let cc = 1;
    try {
      while(this.audios[name + cc] && this.audios[name + cc].paused === false) {
        cc++;
      }
      if(this.audios[name + cc]) {
        this.audios[name + cc].play();
      }
    } catch(err) {
      console.warn("Clone play failed:", err);
    }
  }
}