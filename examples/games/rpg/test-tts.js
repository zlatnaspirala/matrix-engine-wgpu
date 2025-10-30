// Wait for voices to load, return a promise that resolves to voices array
function loadVoices() {
  return new Promise(resolve => {
    let voices = speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    // voices not loaded yet — listen for event
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      resolve(voices);
    };
    // Fallback timeout
    setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
  });
}

// Choose a good voice by heuristics (language match + vendor hints)
function chooseVoice(voices, lang = 'en-US') {
  // prefer exact language match + vendor words
  const preferPatterns = [/google/i, /neural/i, /wave/i, /azure/i, /microsoft/i];
  // find exact lang & vendor
  for (const p of preferPatterns) {
    const found = voices.find(v => v.lang === lang && p.test(v.name));
    if (found) return found;
  }
  // fallback: any exact lang
  let v = voices.find(v => v.lang === lang);
  if (v) return v;
  // fallback: any vendor match
  v = voices.find(v => preferPatterns.some(p => p.test(v.name)));
  if (v) return v;
  // final fallback
  return voices[0] || null;
}

// A small helper to split text into more natural chunks (sentences + commas)
function splitIntoChunks(text) {
  // naive splitter — splits on sentence punctuation, keeps punctuation
  const parts = text
    .split(/([.!?]+(?:\s|$))/) // keep sentence-ending punctuation
    .map(s => s.trim())
    .filter(Boolean);

  // Further split long sentences at commas for better prosody
  const chunks = [];
  for (const p of parts) {
    if (p.length > 120 && p.includes(',')) {
      p.split(',').map(s => s.trim()).filter(Boolean).forEach(s=>chunks.push(s + ','));
    } else {
      chunks.push(p);
    }
  }
  return chunks;
}

// Main speak function
async function speakNatural(text, opts = {}) {
  const {
    lang = 'en-US',
    rate = 0.95,      // 0.9-1.05 recommended
    pitch = 1.0,      // 0.9-1.1 recommended
    volume = 1.0,
    onstart, onend, onerror
  } = opts;

  if (!('speechSynthesis' in window)) {
    throw new Error('Web Speech API not supported in this browser.');
  }

  const voices = await loadVoices();
  const voice = chooseVoice(voices, lang);

  // Split text into chunks for better prosody
  const chunks = splitIntoChunks(text);

  // Queue utterances sequentially
  return new Promise((resolve, reject) => {
    let index = 0;
    function speakNext() {
      if (index >= chunks.length) {
        if (onend) onend();
        return resolve();
      }
      const chunk = chunks[index++];
      const u = new SpeechSynthesisUtterance(chunk);
      if (voice) u.voice = voice;
      u.lang = lang;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = volume;

      // small improvement: slightly vary pitch/rate randomly for longer text
      if (chunk.length > 80) {
        u.rate = rate * (0.95 + Math.random() * 0.1);
        u.pitch = pitch * (0.97 + Math.random() * 0.06);
      }

      u.onstart = () => {
        if (index === 1 && onstart) onstart();
      };
      u.onend = () => {
        // add a tiny pause between utterances to improve flow
        setTimeout(speakNext, 60); // 60ms pause
      };
      u.onerror = (e) => {
        if (onerror) onerror(e);
        reject(e);
      };
      speechSynthesis.speak(u);
    }

    // If speech is currently speaking, cancel to start fresh (optional)
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    speakNext();
  });
}

// Usage example:
(async () => {
  const text = "Hi! This is a demo of a more natural-sounding voice. Try varying rate and pitch for different modes.";
  try {
    await speakNatural(text, { lang: 'en-US', rate: 0.95, pitch: 1.02 });
    console.log('Finished speaking');
  } catch (e) {
    console.error('TTS error', e);
  }
})();