// ═══════════════════════════════════════════
//  FLOATING PARTICLES
// ═══════════════════════════════════════════
(function createParticles() {
  const colors = ['#00e5ff', '#ff2d78', '#b24bf3', '#ffd000'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 15) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.width = p.style.height = (1 + Math.random() * 2) + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.boxShadow = `0 0 6px ${p.style.background}`;
    document.body.appendChild(p);
  }
})();

// ═══════════════════════════════════════════
//  SOUND ENGINE (Web Audio API)
// ═══════════════════════════════════════════
const AC = new (window.AudioContext || window.webkitAudioContext)();
let masterGain, bgmGain, sfxGain, bgmNodes = [], bgmRunning = false;

function initAudio() {
  masterGain = AC.createGain(); masterGain.gain.value = 0.7;
  bgmGain    = AC.createGain(); bgmGain.gain.value = 0.28;
  sfxGain    = AC.createGain(); sfxGain.gain.value = 1.0;
  bgmGain.connect(masterGain);
  sfxGain.connect(masterGain);
  masterGain.connect(AC.destination);
}

function tone(freq, type, startTime, duration, gainVal=0.3, targetGain=0, dest=null) {
  const osc = AC.createOscillator();
  const g   = AC.createGain();
  osc.type      = type;
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(gainVal, startTime);
  g.gain.exponentialRampToValueAtTime(Math.max(targetGain, 0.0001), startTime + duration);
  osc.connect(g);
  g.connect(dest || sfxGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
  return osc;
}

function noise(startTime, duration, gainVal=0.15) {
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

const SFX = {
  move() {
    const t = AC.currentTime;
    tone(220, 'square', t, 0.04, 0.12, 0);
  },
  rotate() {
    const t = AC.currentTime;
    tone(440, 'square', t, 0.03, 0.15, 0);
    tone(660, 'square', t+0.03, 0.04, 0.10, 0);
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

let bgmLoopTimer = null;
function startBGM() {
  if (bgmRunning) return;
  bgmRunning = true;
  if (AC.state === 'suspended') AC.resume();
  function loop() {
    const loopDuration = scheduleBGM(AC.currentTime);
    bgmLoopTimer = setTimeout(loop, loopDuration * 1000 - 100);
  }
  loop();
}

function stopBGM() {
  bgmRunning = false;
  clearTimeout(bgmLoopTimer);
  bgmNodes.forEach(n => { try { n.stop(); } catch(e){} });
  bgmNodes = [];
}

function updateBGMSpeed() {
  bgmGain.gain.setTargetAtTime(0.28 + (level - 1) * 0.015, AC.currentTime, 0.1);
}

let muteState = false;
let showGhost = true;
let optionsOpen = false;

function toggleMute() {
  if (!masterGain) initAudio();
  muteState = !muteState;
  const vol = muteState ? 0 : parseInt(document.getElementById('master-vol').value) / 100;
  masterGain.gain.setTargetAtTime(vol, AC.currentTime, 0.05);
}

// ── Options panel ──
function toggleOptions() {
  if (optionsOpen) {
    closeOptions();
  } else {
    openOptions();
  }
}

function openOptions() {
  if (!masterGain) initAudio();
  optionsOpen = true;
  document.getElementById('options-backdrop').classList.remove('hidden');
  document.getElementById('options-panel').classList.remove('hidden');
  // Pause game if running
  if (running && !paused && !gameOver) {
    paused = true;
    showPauseStats();
    document.getElementById('pause-overlay').classList.remove('hidden');
    stopBGM();
  }
}

function closeOptions() {
  optionsOpen = false;
  document.getElementById('options-backdrop').classList.add('hidden');
  document.getElementById('options-panel').classList.add('hidden');
}

function onMasterVolChange(val) {
  if (!masterGain) initAudio();
  const v = val / 100;
  masterGain.gain.setTargetAtTime(v, AC.currentTime, 0.02);
  document.getElementById('master-vol-value').textContent = val + '%';
  document.getElementById('master-vol-fill').style.width = val + '%';
  muteState = val === '0';
}

function onBgmVolChange(val) {
  if (!bgmGain) initAudio();
  const v = val / 100;
  bgmGain.gain.setTargetAtTime(v * 0.7, AC.currentTime, 0.02);
  document.getElementById('bgm-vol-value').textContent = val + '%';
  document.getElementById('bgm-vol-fill').style.width = val + '%';
}

function onSfxVolChange(val) {
  if (!sfxGain) initAudio();
  const v = val / 100;
  sfxGain.gain.setTargetAtTime(v, AC.currentTime, 0.02);
  document.getElementById('sfx-vol-value').textContent = val + '%';
  document.getElementById('sfx-vol-fill').style.width = val + '%';
}

function toggleFullscreen() {
  const toggle = document.getElementById('fullscreen-toggle');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      toggle.classList.add('active');
    }).catch(() => {});
  } else {
    document.exitFullscreen().then(() => {
      toggle.classList.remove('active');
    }).catch(() => {});
  }
}

// Sync fullscreen toggle if user exits fullscreen via Escape/F11
document.addEventListener('fullscreenchange', () => {
  const toggle = document.getElementById('fullscreen-toggle');
  if (document.fullscreenElement) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
});

function toggleGhostPiece() {
  showGhost = !showGhost;
  const toggle = document.getElementById('ghost-toggle');
  toggle.classList.toggle('active', showGhost);
  draw();
}

// ═══════════════════════════════════════════
//  GAME
// ═══════════════════════════════════════════
const COLS = 10, ROWS = 20, CELL = 30;
const board = document.getElementById('board');
const ctx = board.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nctx = nextCanvas.getContext('2d');

const COLORS = [
  null,
  '#00e5ff', // I - cyan
  '#ffd000', // O - gold
  '#b24bf3', // T - purple
  '#00e5a0', // S - teal
  '#ff2d78', // Z - pink
  '#ff7b00', // J - orange
  '#4dff91', // L - green
];

// Darker variants for depth
const COLORS_DARK = [
  null,
  '#007a8a', '#8a6e00', '#5e2880', '#007a55', '#8a1840', '#8a4200', '#2a8a4d',
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3],[0,0,0]],
  [[0,4,4],[4,4,0],[0,0,0]],
  [[5,5,0],[0,5,5],[0,0,0]],
  [[6,0,0],[6,6,6],[0,0,0]],
  [[0,0,7],[7,7,7],[0,0,0]],
];

let grid, piece, nextPiece, score, bestScore, level, lines, gameOver, paused, running;
let dropInterval, animFrame;
let totalPieces = 0, gameStartTime = 0;

function init() {
  grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  score = 0; level = 1; lines = 0; gameOver = false; paused = false;
  totalPieces = 0; gameStartTime = Date.now();
  bestScore = parseInt(localStorage.getItem('tetrisBest') || '0');
  spawnPiece();
  updateUI();
}

function spawnPiece() {
  const type = nextPiece ? nextPiece.type : randType();
  const matrix = PIECES[type];
  piece = {
    matrix,
    type,
    x: Math.floor(COLS / 2) - Math.floor(matrix[0].length / 2),
    y: 0,
  };
  const nt = Math.ceil(Math.random() * 7);
  nextPiece = { type: nt, matrix: PIECES[nt] };
  totalPieces++;

  if (collides(piece)) {
    endGame();
  }
}

function randType() { return Math.floor(Math.random() * 7) + 1; }

function collides(p, dx=0, dy=0, mat=null) {
  const m = mat || p.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const nx = p.x + c + dx;
      const ny = p.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && grid[ny][nx]) return true;
    }
  }
  return false;
}

function rotate(matrix) {
  const N = matrix.length;
  const M = matrix[0].length;
  const result = Array.from({length: M}, () => Array(N).fill(0));
  for (let r = 0; r < N; r++)
    for (let c = 0; c < M; c++)
      result[c][N - 1 - r] = matrix[r][c];
  return result;
}

function lock() {
  piece.matrix.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val && piece.y + r >= 0) {
        grid[piece.y + r][piece.x + c] = val;
      }
    });
  });
  SFX.lock();
  clearLines();
  spawnPiece();
}

function showCombo(count) {
  const labels = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'];
  const popup = document.getElementById('combo-popup');
  popup.textContent = labels[Math.min(count, 4)];
  popup.classList.remove('show');
  void popup.offsetWidth; // reflow
  popup.classList.add('show');

  if (count >= 2) {
    document.getElementById('wrapper').classList.add('shake');
    setTimeout(() => document.getElementById('wrapper').classList.remove('shake'), 300);
  }

  // Line flash effect
  const flash = document.getElementById('line-flash');
  flash.style.top = '40%';
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
}

function clearLines() {
  let cleared = 0;
  const prevLevel = level;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r].every(v => v)) {
      grid.splice(r, 1);
      grid.unshift(Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    const pts = [0, 100, 300, 500, 800];
    score += (pts[cleared] || 800) * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('tetrisBest', bestScore);
    }
    SFX.clear(cleared);
    showCombo(cleared);
    if (level > prevLevel) {
      setTimeout(() => SFX.levelUp(), 350);
      updateBGMSpeed();
    }
    updateUI();
  }
}

function drop() {
  if (!collides(piece, 0, 1)) {
    piece.y++;
  } else {
    lock();
  }
}

function hardDrop() {
  SFX.hardDrop();
  while (!collides(piece, 0, 1)) {
    piece.y++;
    score += 2;
  }
  lock();
  updateUI();
}

function updateUI() {
  document.getElementById('score-display').textContent = score.toString().padStart(6, '0');
  document.getElementById('best-display').textContent = bestScore.toString().padStart(6, '0');
  document.getElementById('level-display').textContent = level;
  document.getElementById('lines-display').textContent = lines;
  document.getElementById('level-fill').style.width = ((lines % 10) * 10) + '%';
  document.getElementById('pieces-display').textContent = totalPieces;
}

function updateTimeDisplay() {
  if (!running || paused || gameOver) return;
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  document.getElementById('time-display').textContent = m + ':' + s;
  const minutes = elapsed / 60;
  document.getElementById('ppm-display').textContent = minutes > 0 ? Math.round(totalPieces / minutes) : 0;
}

setInterval(updateTimeDisplay, 1000);

// ── Drawing ──
function drawCell(context, x, y, colorIdx, alpha=1, cellSize=CELL) {
  const color = COLORS[colorIdx];
  const dark  = COLORS_DARK[colorIdx];
  const px = x * cellSize, py = y * cellSize;
  const s = cellSize - 1;
  const r = 3; // corner radius

  context.globalAlpha = alpha;

  // Outer glow
  context.shadowColor = color;
  context.shadowBlur = 10;

  // Main fill with rounded rect
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(px + 1, py + 1, s - 1, s - 1, r);
  context.fill();

  context.shadowBlur = 0;

  // Inner gradient - top bright to bottom dark
  const grad = context.createLinearGradient(px, py, px, py + s);
  grad.addColorStop(0, 'rgba(255,255,255,0.25)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  context.fillStyle = grad;
  context.beginPath();
  context.roundRect(px + 2, py + 2, s - 3, s - 3, r - 1);
  context.fill();

  // Specular highlight
  context.fillStyle = 'rgba(255,255,255,0.3)';
  context.beginPath();
  context.roundRect(px + 3, py + 3, s - 6, 5, 2);
  context.fill();

  // Inner border
  context.strokeStyle = 'rgba(255,255,255,0.1)';
  context.lineWidth = 0.5;
  context.beginPath();
  context.roundRect(px + 1.5, py + 1.5, s - 2, s - 2, r);
  context.stroke();

  context.globalAlpha = 1;
}

function getGhost() {
  let dy = 0;
  while (!collides(piece, 0, dy + 1)) dy++;
  return { ...piece, y: piece.y + dy };
}

function draw() {
  // Clear with subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, board.height);
  bgGrad.addColorStop(0, '#08081a');
  bgGrad.addColorStop(1, '#060612');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, board.width, board.height);

  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 0.5;
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(board.width, r * CELL);
    ctx.stroke();
  }
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, board.height);
    ctx.stroke();
  }

  // Grid dots at intersections
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let r = 1; r < ROWS; r++)
    for (let c = 1; c < COLS; c++)
      ctx.fillRect(c * CELL - 0.5, r * CELL - 0.5, 1, 1);

  // Locked cells
  grid.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val) drawCell(ctx, c, r, val);
    });
  });

  if (piece && !gameOver) {
    // Ghost piece
    if (showGhost) {
      const ghost = getGhost();
      ghost.matrix.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) drawCell(ctx, ghost.x + c, ghost.y + r, val, 0.25);
        });
      });
    }

    // Active piece
    piece.matrix.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) drawCell(ctx, piece.x + c, piece.y + r, val);
      });
    });
  }

  // Next piece preview
  nctx.fillStyle = 'rgba(12, 14, 28, 0.9)';
  nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (nextPiece) {
    const m = nextPiece.matrix;
    const cs = 22;
    const totalW = m[0].length * cs;
    const totalH = m.length * cs;
    const ox = (nextCanvas.width - totalW) / 2;
    const oy = (nextCanvas.height - totalH) / 2;

    m.forEach((row, r) => {
      row.forEach((val, c) => {
        if (!val) return;
        const color = COLORS[val];
        const px = ox + c * cs;
        const py = oy + r * cs;

        nctx.shadowColor = color;
        nctx.shadowBlur = 8;
        nctx.fillStyle = color;
        nctx.beginPath();
        nctx.roundRect(px + 1, py + 1, cs - 2, cs - 2, 2);
        nctx.fill();

        nctx.shadowBlur = 0;
        const ng = nctx.createLinearGradient(px, py, px, py + cs);
        ng.addColorStop(0, 'rgba(255,255,255,0.25)');
        ng.addColorStop(1, 'rgba(0,0,0,0.2)');
        nctx.fillStyle = ng;
        nctx.beginPath();
        nctx.roundRect(px + 2, py + 2, cs - 4, cs - 4, 1);
        nctx.fill();
      });
    });
  }
}

// ── Game loop ──
let lastTime = 0;
let dropTimer = 0;

function getDropSpeed() {
  return Math.max(100, 1000 - (level - 1) * 80);
}

function loop(timestamp) {
  if (!running || paused || gameOver) return;
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  dropTimer += dt;
  if (dropTimer >= getDropSpeed()) {
    drop();
    dropTimer = 0;
  }
  draw();
  animFrame = requestAnimationFrame(loop);
}

function getElapsedTime() {
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return m + ':' + s;
}

function startGame() {
  if (AC.state === 'suspended') AC.resume();
  stopBGM();
  init();
  running = true;
  document.getElementById('start-overlay').classList.add('hidden');
  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('pause-overlay').classList.add('hidden');
  lastTime = performance.now();
  dropTimer = 0;
  cancelAnimationFrame(animFrame);
  animFrame = requestAnimationFrame(loop);
  startBGM();
}

function endGame() {
  gameOver = true;
  running = false;
  cancelAnimationFrame(animFrame);
  stopBGM();
  SFX.gameOver();

  const isNewBest = score > parseInt(localStorage.getItem('tetrisBest') || '0') && score > 0;

  document.getElementById('final-score').textContent = score.toString().padStart(6, '0');
  document.getElementById('best-score').textContent = bestScore.toString().padStart(6, '0');
  document.getElementById('final-level').textContent = level;
  document.getElementById('final-lines').textContent = lines;
  document.getElementById('final-time').textContent = getElapsedTime();

  const badge = document.getElementById('new-best-badge');
  if (isNewBest) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  document.getElementById('gameover-overlay').classList.remove('hidden');
  draw();
}

function showPauseStats() {
  document.getElementById('pause-score').textContent = score.toString().padStart(6, '0');
  document.getElementById('pause-level').textContent = level;
  document.getElementById('pause-lines').textContent = lines;
}

// ── Input ──
document.addEventListener('keydown', e => {
  if (!masterGain) initAudio();
  if (AC.state === 'suspended') AC.resume();

  if (e.code === 'Escape') {
    e.preventDefault();
    if (optionsOpen) {
      closeOptions();
    }
    return;
  }

  if (e.code === 'Space') {
    e.preventDefault();
    if (optionsOpen) return;
    if (!running || gameOver) {
      startGame();
      return;
    }
    if (!paused) hardDrop();
    return;
  }

  if (e.code === 'KeyM') {
    toggleMute();
    return;
  }

  if (e.code === 'KeyP') {
    if (!running || gameOver) return;
    paused = !paused;
    if (paused) showPauseStats();
    document.getElementById('pause-overlay').classList.toggle('hidden', !paused);
    if (!paused) {
      lastTime = performance.now();
      animFrame = requestAnimationFrame(loop);
      startBGM();
    } else {
      stopBGM();
    }
    return;
  }

  if (!running || paused || gameOver) return;

  switch(e.code) {
    case 'ArrowLeft':
      e.preventDefault();
      if (!collides(piece, -1)) { piece.x--; SFX.move(); }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!collides(piece, 1)) { piece.x++; SFX.move(); }
      break;
    case 'ArrowDown':
      e.preventDefault();
      drop();
      score++;
      updateUI();
      dropTimer = 0;
      break;
    case 'ArrowUp':
      e.preventDefault();
      const rotated = rotate(piece.matrix);
      if (!collides(piece, 0, 0, rotated)) { piece.matrix = rotated; SFX.rotate(); }
      else if (!collides(piece, 1, 0, rotated)) { piece.x++; piece.matrix = rotated; SFX.rotate(); }
      else if (!collides(piece, -1, 0, rotated)) { piece.x--; piece.matrix = rotated; SFX.rotate(); }
      break;
  }
  draw();
});

// Show best score on start screen
const savedBest = localStorage.getItem('tetrisBest') || '0';
document.getElementById('start-best-score').textContent = savedBest.padStart(6, '0');

// Initial draw
draw();
