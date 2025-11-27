/**
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 * @www maximumroulette.com
 * @description For audio voice Best way is 
 * to use browser buildin TTS speech API
 * It is so good like paid services on internet.
 */
export class MatrixTTS {
  constructor() {
    this.heroPresets = {
      mariasword: {gender: "female", pitch: 0.2, rate: 0.7},
      slayzer: {gender: "male", pitch: 0.35, rate: 0.85},
      steelborn: {gender: "male", pitch: 0.9, rate: 0.9},
      warrok: {gender: "male", pitch: 0.8, rate: 0.9},
      skeletonz: {gender: "male", pitch: 0.7, rate: 0.9},
      erika: {gender: "female", pitch: 0.5, rate: 1.0},
      arissa: {gender: "female", pitch: 0.35, rate: 1.05}
    };
  }

  getFemaleVoice(voices, lang = 'en-US') {
    const femPatterns = [/female/i, /woman/i, /girl/i, /eva/i, /zira/i, /amy/i, /susan/i, /sarah/i];
    return (
      voices.find(v => v.lang === lang && femPatterns.some(p => p.test(v.name))) ||
      voices.find(v => femPatterns.some(p => p.test(v.name))) ||
      voices.find(v => v.lang === lang) ||
      voices[0] ||
      null
    );
  }

  getMaleVoice(voices, lang = 'en-US') {
    const malePatterns = [/male/i, /man/i, /boy/i, /david/i, /mark/i, /john/i, /mike/i, /brian/i];
    return (
      voices.find(v => v.lang === lang && malePatterns.some(p => p.test(v.name))) ||
      voices.find(v => malePatterns.some(p => p.test(v.name))) ||
      voices.find(v => v.lang === lang) ||
      voices[0] ||
      null
    );
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

  chooseVoice2(voices, lang = 'en-US') {
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

  chooseVoice(voices, lang = 'en-US', gender = 'female') {
    if(gender === 'male') {
      return this.getMaleVoice(voices, lang);
    }
    return this.getFemaleVoice(voices, lang);
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
    if(speechSynthesis.speaking || speechSynthesis.pending) {return;}
    const {
      lang = 'en-US',
      rate = 0.95,
      pitch = 1.0,
      volume = 1.0,
      gender = 'female',
      onstart, onend, onerror
    } = opts;

    if(!('speechSynthesis' in window)) {
      throw new Error('Web Speech API not supported in this browser.');
    }
    const voices = await this.loadVoices();
    const voice = this.chooseVoice(voices, lang, gender);
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

  async speak(text, rate = 0.95, pitch = 1.0) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.speakNatural(text, {lang: 'en-US', rate: rate, pitch: pitch});
        resolve('Finished speaking');
      } catch(e) {
        reject('TTS error');
        console.error('TTS error', e);
      }
    })
  }

  async speakHero(hero, type, extra = {}) {
    const preset = this.heroPresets[hero] || {gender: "female", pitch: 1.0, rate: 1.0};
    let text = this.getSpeakHeroText(hero, type);
    return this.speakNatural(text, {
      lang: "en-US",
      gender: preset.gender,
      pitch: preset.pitch,
      rate: preset.rate,
      ...extra
    });
  }

  getSpeakHeroText(hero, type) {
    try {
      const arr = speakBot[hero][type];
      return arr[Math.floor(Math.random() * arr.length)];
    } catch(e) {
      return '[undefined speech]';
    }
  }
}

export const speakBot = {
  mariasword: {
    hello: [
      'Hello my friend',
      'Choose me for ever',
      'Ready for battle',
      'I fight for you',
      'Let us begin',
      'Your blade awaits',
      'At your command',
      'Strength and honor',
      'I stand with you',
      'We make legends'
    ],
    attack: [
      'Lets blood fly',
      'Kill em all',
      'Cut them down',
      'Strike fast',
      'Another one falls',
      'They are nothing',
      'End them now',
      'For glory!',
      'Slicing through',
      'Taste steel!'
    ],
    idle: [
      'Where are you',
      'Still here',
      'I wait your word',
      'Why silence',
      'I grow bored',
      'Are we done',
      'My blade sleeps',
      'Time passes',
      'Wake me up',
      'Command me soon'
    ],
    walk: [
      'Roger that',
      'Whatever you say',
      'Moving out',
      'On my way',
      'Let’s go',
      'Marching',
      'Step forward',
      'Following',
      'Close behind',
      'We travel'
    ],
    dead: [
      'damm it',
      'i will back',
      'This is not end',
      'I fall but rise',
      'My time fades',
      'Carry on',
      'The blade drops',
      'Darkness comes',
      'Remember me',
      'I return later'
    ]
  },

  slayzer: {
    hello: [
      'Slayzer online',
      'Greetings human',
      'Target detected',
      'Systems active',
      'I await orders',
      'Weapon ready',
      'Let’s synchronize',
      'Calibrated',
      'Combat mode here',
      'Hello commander'
    ],
    attack: [
      'Erasing target',
      'Neutralizing',
      'Terminate!',
      'Engaging enemy',
      'Lock and strike',
      'Target locked',
      'Maximum damage',
      'Destroy the threat',
      'Fire at will',
      'Executing kill'
    ],
    idle: [
      'Awaiting tasks',
      'Processing silence',
      'No movement',
      'Sensors calm',
      'Bored protocol active',
      'Ping me anytime',
      'Standing by',
      'Still online',
      'Low power mode soon',
      'Need instructions'
    ],
    walk: [
      'Moving to location',
      'Path confirmed',
      'Walking',
      'Trajectory stable',
      'Following vector',
      'Advancing',
      'Let’s relocate',
      'Tracking you',
      'Footsteps engaged',
      'March operation'
    ],
    dead: [
      'System failure',
      'Core shutdown',
      'I will reboot',
      'Error… 0xDEAD',
      'Memory fading',
      'Goodbye… for now',
      'Fatal crash',
      'Power drained',
      'Diagnostic end',
      'I will recompile'
    ]
  },

  steelborn: {
    hello: [
      'Steelborn stands',
      'Metal breathes',
      'Ready to forge destiny',
      'Hammer in hand',
      'Hello warrior',
      'You called the forge',
      'Let’s heat things up',
      'I stand unbroken',
      'Born of steel',
      'We march strong'
    ],
    attack: [
      'Hammer strike!',
      'Break them!',
      'Smash!',
      'Let the steel sing',
      'Crush bones',
      'Full force',
      'Rage of iron',
      'I hit harder',
      'Tremble before steel',
      'They will shatter'
    ],
    idle: [
      'Cooling down',
      'I rest my hammer',
      'Still as iron',
      'Where to now',
      'My metal waits',
      'Silence of the forge',
      'Don’t leave me rusting',
      'Stand or command?',
      'Waiting warrior',
      'Breathing steel'
    ],
    walk: [
      'Heavy steps',
      'March of metal',
      'Lead and I follow',
      'Moving slowly',
      'I carry weight',
      'Walk with strength',
      'Follow the clang',
      'Iron moves',
      'Hammer shakes',
      'Forward we go'
    ],
    dead: [
      'Steel cracks…',
      'Forge goes dark',
      'I rust… not yet',
      'Broken but not gone',
      'Hammer falls',
      'Heat fading',
      'I’ll return reforged',
      'Iron sleeps',
      'My core cools',
      'I rise again someday'
    ]
  },

  warrok: {
    hello: [
      'Warrok awakens',
      'Blood and fire greet you',
      'You summon the beast',
      'Ready for slaughter',
      'My claws itch',
      'Speak mortal',
      'War calls',
      'Hungry again',
      'Let us rage',
      'The hunt begins'
    ],
    attack: [
      'Rip them apart!',
      'Tear their soul!',
      'Crush skulls!',
      'Eat the weak!',
      'Shred them!',
      'Rage unleashed!',
      'Blood for me!',
      'No mercy!',
      'Destroy now!',
      'Split their bones!'
    ],
    idle: [
      'I hunger…',
      'When do we kill?',
      'Why stillness?',
      'I grow restless',
      'Let me loose!',
      'Silence irritates me',
      'I wait for blood',
      'Caged beast here',
      'Move mortal',
      'My claws twitch'
    ],
    walk: [
      'Running wild',
      'Move fast!',
      'Hunt continues',
      'Track them',
      'Step by step',
      'Beast follows',
      'On the prowl',
      'Creeping forward',
      'Sniffing ahead',
      'Let’s roam'
    ],
    dead: [
      'Beast falls…',
      'I bite dust',
      'Next time… stronger',
      'Death tastes bitter',
      'Roar fades...',
      'My fury sleeps',
      'Claws dull…',
      'This is not end',
      'I return to hunt',
      'Warrok slumbers'
    ]
  },

  skeletonz: {
    hello: [
      'Rattle rattle hello',
      'Bones greet you',
      'I rise again',
      'Greetings… mortal',
      'Click click I’m here',
      'Back from grave',
      'Dusty but ready',
      'Another day undead',
      'Skeleton online',
      'Time to clatter'
    ],
    attack: [
      'Bone strike!',
      'Crack attack!',
      'Rattle them!',
      'Break their flesh!',
      'Shake them to pieces',
      'Clack clack!',
      'I poke you!',
      'Sharp bones!',
      'I’ll dismantle them',
      'Dust them!'
    ],
    idle: [
      'No muscles… still tired',
      'Just rattling',
      'Any orders?',
      'Standing dead',
      'Grave silence',
      'Waiting patiently',
      'I don’t breathe but bored',
      'Where to now?',
      'Bones chilled',
      'Dust settling'
    ],
    walk: [
      'Clack clack walking',
      'Bones moving',
      'Step by step',
      'Joints cracking',
      'Wobbling forward',
      'Skeleton following',
      'March of bones',
      'Dragging feet',
      'Grave stroll',
      'Creeping rattle'
    ],
    dead: [
      'Falling apart… again',
      'Oops bones scattered',
      'Back to dust',
      'See you after reassembly',
      'Rattle ends',
      'Skull cracked',
      'Dead once more',
      'I collapse',
      'Bone pile time',
      'Just rebuild me'
    ]
  },

  erika: {
    hello: [
      'Erika ready',
      'Hello hero',
      'Nice to see you',
      'Let’s do magic',
      'I trust you',
      'Warm greetings',
      'I stand by you',
      'Light surrounds us',
      'Blessings friend',
      'You’re not alone'
    ],
    attack: [
      'Casting strike!',
      'Magic burns!',
      'Feel my spell!',
      'Light attacks!',
      'Arcane burst!',
      'I send fire!',
      'No escape spell!',
      'Focused beam!',
      'Energy blast!',
      'Radiant force!'
    ],
    idle: [
      'Meditating…',
      'Magic sleeps',
      'I wait for your word',
      'Soft silence',
      'Calm before storm',
      'You need me?',
      'Still casting thoughts',
      'Breathing calmly',
      'Waiting patiently',
      'Daydreaming magic'
    ],
    walk: [
      'Walking lightly',
      'Magic follows',
      'Graceful steps',
      'I float a bit',
      'On my way',
      'Move with light',
      'Gliding forward',
      'Following you',
      'Quiet footsteps',
      'Let’s continue'
    ],
    dead: [
      'Light fades',
      'I fall softly',
      'Magic slips away',
      'Goodbye… for now',
      'My spell ends',
      'Fading warmth',
      'I’ll return glowing',
      'Darkness takes me',
      'Release…',
      'I rest for now'
    ]
  },

  arissa: {
    hello: [
      'Arissa here',
      'Ready to roam',
      'Greetings wanderer',
      'The shadows whisper',
      'I am yours to command',
      'Let’s sneak ahead',
      'Silent hello',
      'Eyes sharp',
      'Hunter at your side',
      'Let’s begin'
    ],
    attack: [
      'Silent strike!',
      'Shadow hit!',
      'Quick kill!',
      'They won’t see it',
      'Knife in the dark',
      'One less problem',
      'Down you go',
      'Swift cut!',
      'Dead before sound',
      'Fade them out'
    ],
    idle: [
      'Hidden… waiting',
      'Silence is comfort',
      'Where do we stalk?',
      'Watching the shadows',
      'Still as night',
      'I wait your signal',
      'Sneaking thoughts',
      'Listening closely',
      'Quiet moment',
      'Hunter rests'
    ],
    walk: [
      'Silent steps',
      'Gliding through shadows',
      'Moving unseen',
      'Follow the wind',
      'Tracking paths',
      'Walking quietly',
      'Step softly',
      'On the hunt',
      'Close behind',
      'In the dark we move'
    ],
    dead: [
      'Shadow fades…',
      'Caught at last',
      'I slip away',
      'My silence ends',
      'Falling into dark',
      'No more whispers',
      'Blade drops…',
      'I vanish',
      'Light… gone',
      'I return someday'
    ]
  }
};
