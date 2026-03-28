// ═══════════════════════════════════════════
//  SOUND ENGINE (Web Audio API)
// ═══════════════════════════════════════════
import state from './state.js';

const AC = new (window.AudioContext || window.webkitAudioContext)();
let masterGain, bgmGain, sfxGain;
let bgmNodes = [];
let bgmRunning = false;
let bgmLoopTimer = null;

export function initAudio() {
  if (masterGain) return;
  masterGain = AC.createGain(); masterGain.gain.value = 0.7;
  bgmGain    = AC.createGain(); bgmGain.gain.value = 0.28;
  sfxGain    = AC.createGain(); sfxGain.gain.value = 1.0;
  bgmGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(AC.destination);
}

export function ensureAudioReady() {
  if (!masterGain) initAudio();
  if (AC.state === 'suspended') AC.resume();
}

function tone(freq, type, startTime, duration, gainVal = 0.3, targetGain = 0) {
  const osc = AC.createOscillator();
  const g   = AC.createGain();
  osc.type      = type;
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(gainVal, startTime);
  g.gain.exponentialRampToValueAtTime(Math.max(targetGain, 0.0001), startTime + duration);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
  return osc;
}

function noise(startTime, duration, gainVal = 0.15) {
  const bufSize = AC.sampleRate * duration;
  const buf = AC.createBuffer(1, bufSize, AC.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource();
  src.buffer = buf;
  const g = AC.createGain();
  g.gain.setValueAtTime(gainVal, startTime);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  const filt = AC.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = 800; filt.Q.value = 0.5;
  src.connect(filt); filt.connect(g); g.connect(sfxGain);
  src.start(startTime); src.stop(startTime + duration);
}

// ── SFX ──
export const SFX = {
  move() {
    const t = AC.currentTime;
    tone(220, 'square', t, 0.04, 0.12, 0);
  },
  rotate() {
    const t = AC.currentTime;
    tone(440, 'square', t, 0.03, 0.15, 0);
    tone(660, 'square', t + 0.03, 0.04, 0.10, 0);
  },
  lock() {
    const t = AC.currentTime;
    noise(t, 0.08, 0.2);
    tone(110, 'square', t, 0.1, 0.18, 0);
  },
  hardDrop() {
    const t = AC.currentTime;
    const osc = AC.createOscillator();
    const g   = AC.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(g); g.connect(sfxGain);
    osc.start(t); osc.stop(t + 0.15);
    noise(t + 0.05, 0.08, 0.25);
  },
  clear(count) {
    const t = AC.currentTime;
    const chords = [
      [523, 659, 784],
      [587, 740, 880],
      [659, 831, 988],
      [523, 659, 784, 1047],
    ];
    const notes = chords[Math.min(count, 4) - 1];
    notes.forEach((freq, i) => {
      tone(freq, 'square', t + i * 0.06, 0.3, 0.18, 0);
    });
    if (count === 4) {
      setTimeout(() => {
        const t2 = AC.currentTime;
        [1047, 1319, 1568, 2093].forEach((f, i) => {
          tone(f, 'square', t2 + i * 0.07, 0.25, 0.15, 0);
        });
      }, 280);
    }
  },
  levelUp() {
    const t = AC.currentTime;
    [262, 330, 392, 523, 659].forEach((f, i) => {
      tone(f, 'square', t + i * 0.07, 0.2, 0.18, 0);
    });
  },
  gameOver() {
    const t = AC.currentTime;
    [523, 494, 440, 392, 330, 262].forEach((f, i) => {
      tone(f, 'square', t + i * 0.12, 0.18, 0.2, 0);
    });
    setTimeout(() => {
      const t2 = AC.currentTime;
      noise(t2, 0.4, 0.15);
      tone(80, 'sawtooth', t2, 0.5, 0.2, 0);
    }, 750);
  },
};

// ── BGM ──
const BGM_BPM  = 160;
const BGM_BEAT = 60 / BGM_BPM;
function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

const MELODY = [
  [64,1],[62,0.5],[60,0.5],[62,0.5],[64,1],[64,0.5],[64,1.5],
  [62,1],[62,0.5],[62,1.5],
  [64,1],[67,0.5],[67,1.5],
  [64,1],[62,0.5],[60,0.5],[62,0.5],[64,1],[64,0.5],[64,1],
  [62,1],[62,0.5],[64,0.5],[62,0.5],[60,2],
  [62,1],[62,0.5],[64,0.5],[62,0.5],[64,0.5],[65,0.5],[64,1],
  [60,1],[60,0.5],[60,1.5],
  [64,1],[62,0.5],[60,0.5],[62,0.5],[64,1],[64,0.5],[64,1],
  [62,1],[62,0.5],[62,1.5],
  [64,1],[67,0.5],[67,1.5],
  [64,1],[62,0.5],[60,0.5],[62,0.5],[64,1],[64,0.5],[64,1],
  [62,1],[62,0.5],[64,0.5],[62,0.5],[60,2],
];

const BASS = [
  [40,2],[45,2],[43,2],[48,2],
  [40,2],[45,2],[40,2],[45,2],
  [40,2],[45,2],[43,2],[48,2],
  [40,2],[45,2],[40,4],
];

function scheduleBGM(startTime) {
  bgmNodes = [];
  let t = startTime;
  MELODY.forEach(([note, beats]) => {
    const dur = beats * BGM_BEAT;
    const osc = AC.createOscillator();
    const g   = AC.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(midiToHz(note), t);
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.7, t + 0.01);
    g.gain.setValueAtTime(0.7, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0, t + dur);
    osc.connect(g); g.connect(bgmGain);
    osc.start(t); osc.stop(t + dur + 0.05);
    bgmNodes.push(osc);
    t += dur;
  });
  const loopDuration = t - startTime;
  let tb = startTime;
  BASS.forEach(([note, beats]) => {
    const dur = beats * BGM_BEAT;
    const osc = AC.createOscillator();
    const g   = AC.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(midiToHz(note), tb);
    g.gain.setValueAtTime(0.0, tb);
    g.gain.linearRampToValueAtTime(0.35, tb + 0.02);
    g.gain.setValueAtTime(0.35, tb + dur * 0.7);
    g.gain.linearRampToValueAtTime(0.0, tb + dur);
    osc.connect(g); g.connect(bgmGain);
    osc.start(tb); osc.stop(tb + dur + 0.05);
    bgmNodes.push(osc);
    tb += dur;
  });
  for (let i = 0; i < 32; i++) {
    const ht = startTime + i * BGM_BEAT * 0.5;
    const buf = AC.createBuffer(1, Math.floor(AC.sampleRate * 0.04), AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(); src.buffer = buf;
    const gn  = AC.createGain();
    const flt = AC.createBiquadFilter(); flt.type = 'highpass'; flt.frequency.value = 7000;
    gn.gain.setValueAtTime(i % 2 === 0 ? 0.12 : 0.06, ht);
    gn.gain.exponentialRampToValueAtTime(0.0001, ht + 0.04);
    src.connect(flt); flt.connect(gn); gn.connect(bgmGain);
    src.start(ht); src.stop(ht + 0.05);
    bgmNodes.push(src);
  }
  return loopDuration;
}

export function startBGM() {
  if (bgmRunning) return;
  bgmRunning = true;
  if (AC.state === 'suspended') AC.resume();
  function loop() {
    const loopDuration = scheduleBGM(AC.currentTime);
    bgmLoopTimer = setTimeout(loop, loopDuration * 1000 - 100);
  }
  loop();
}

export function stopBGM() {
  bgmRunning = false;
  clearTimeout(bgmLoopTimer);
  bgmNodes.forEach(n => { try { n.stop(); } catch(e) {} });
  bgmNodes = [];
}

export function updateBGMSpeed() {
  bgmGain.gain.setTargetAtTime(0.28 + (state.level - 1) * 0.015, AC.currentTime, 0.1);
}

export function toggleMute() {
  initAudio();
  state.muteState = !state.muteState;
  const vol = state.muteState ? 0 : parseInt(document.getElementById('master-vol').value) / 100;
  masterGain.gain.setTargetAtTime(vol, AC.currentTime, 0.05);
}

export function onMasterVolChange(val) {
  initAudio();
  const v = val / 100;
  masterGain.gain.setTargetAtTime(v, AC.currentTime, 0.02);
  document.getElementById('master-vol-value').textContent = val + '%';
  document.getElementById('master-vol-fill').style.width = val + '%';
  state.muteState = val === '0';
}

export function onBgmVolChange(val) {
  initAudio();
  const v = val / 100;
  bgmGain.gain.setTargetAtTime(v * 0.7, AC.currentTime, 0.02);
  document.getElementById('bgm-vol-value').textContent = val + '%';
  document.getElementById('bgm-vol-fill').style.width = val + '%';
}

export function onSfxVolChange(val) {
  initAudio();
  const v = val / 100;
  sfxGain.gain.setTargetAtTime(v, AC.currentTime, 0.02);
  document.getElementById('sfx-vol-value').textContent = val + '%';
  document.getElementById('sfx-vol-fill').style.width = val + '%';
}
