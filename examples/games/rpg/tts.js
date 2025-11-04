
/**
 * For audio voice Best way is 
 * to use browser buildin TTS speech API
 */
export class MatrixTTS {

  constructor() {
    // this.loadVoices()
  }

  loadVoices = () => {
    return new Promise(resolve => {
      let voices = speechSynthesis.getVoices();
      if(voices.length) return resolve(voices);
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        resolve(voices);
      };
      setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
    });
  }

  chooseVoice(voices, lang = 'en-US') {
    const preferPatterns = [/google/i, /neural/i, /wave/i, /azure/i, /microsoft/i];
    for(const p of preferPatterns) {
      const found = voices.find(v => v.lang === lang && p.test(v.name));
      if(found) return found;
    }
    let v = voices.find(v => v.lang === lang);
    if(v) return v;
    v = voices.find(v => preferPatterns.some(p => p.test(v.name)));
    if(v) return v;
    return voices[0] || null;
  }

  splitIntoChunks(text) {
    const parts = text
      .split(/([.!?]+(?:\s|$))/)
      .map(s => s.trim())
      .filter(Boolean);
    const chunks = [];
    for(const p of parts) {
      if(p.length > 120 && p.includes(',')) {
        p.split(',').map(s => s.trim()).filter(Boolean).forEach(s => chunks.push(s + ','));
      } else {
        chunks.push(p);
      }
    }
    return chunks;
  }

  async speakNatural(text, opts = {}) {
    const {
      lang = 'en-US',
      rate = 0.95,
      pitch = 1.0,
      volume = 1.0,
      onstart, onend, onerror
    } = opts;

    if(!('speechSynthesis' in window)) {
      throw new Error('Web Speech API not supported in this browser.');
    }
    const voices = await this.loadVoices();
    const voice = this.chooseVoice(voices, lang);
    const chunks = this.splitIntoChunks(text);
    return new Promise((resolve, reject) => {
      let index = 0;
      function speakNext() {
        if(index >= chunks.length) {
          if(onend) onend();
          return resolve();
        }
        const chunk = chunks[index++];
        const u = new SpeechSynthesisUtterance(chunk);
        if(voice) u.voice = voice;
        u.lang = lang;
        u.rate = rate;
        u.pitch = pitch;
        u.volume = volume;

        if(chunk.length > 80) {
          u.rate = rate * (0.95 + Math.random() * 0.1);
          u.pitch = pitch * (0.97 + Math.random() * 0.06);
        }

        u.onstart = () => {
          if(index === 1 && onstart) onstart();
        };
        u.onend = () => {
          setTimeout(speakNext, 60); // 60ms pause
        };
        u.onerror = (e) => {
          if(onerror) onerror(e);
          reject(e);
        };
        speechSynthesis.speak(u);
      }
      if(speechSynthesis.speaking) speechSynthesis.cancel();
      speakNext();
    });
  }

  async speak(text) {
    return new Promise(async(resolve, reject) => {
      try {
        await this.speakNatural(text, {lang: 'en-US', rate: 0.95, pitch: 1.02});
        resolve('Finished speaking');
      } catch(e) {
        reject('TTS error');
        console.error('TTS error', e);
      }
    })
  }
}