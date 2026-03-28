// ═══════════════════════════════════════════
//  GAME LOGIC
// ═══════════════════════════════════════════
import { COLS, ROWS, PIECES } from './constants.js';
import state, { resetGrid } from './state.js';
import { SFX, updateBGMSpeed } from './audio.js';
import { updateUI, showCombo } from './ui.js';

function randType() {
  return Math.floor(Math.random() * 7) + 1;
}

export function collides(p, dx = 0, dy = 0, mat = null) {
  const m = mat || p.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const nx = p.x + c + dx;
      const ny = p.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && state.grid[ny][nx]) return true;
    }
  }
  return false;
}

export function rotate(matrix) {
  const N = matrix.length;
  const M = matrix[0].length;
  const result = Array.from({ length: M }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++)
    for (let c = 0; c < M; c++)
      result[c][N - 1 - r] = matrix[r][c];
  return result;
}

export function spawnPiece() {
  const type = state.nextPiece ? state.nextPiece.type : randType();
  const matrix = PIECES[type];
  state.piece = {
    matrix,
    type,
    x: Math.floor(COLS / 2) - Math.floor(matrix[0].length / 2),
    y: 0,
  };
  const nt = Math.ceil(Math.random() * 7);
  state.nextPiece = { type: nt, matrix: PIECES[nt] };
  state.totalPieces++;

  if (collides(state.piece)) {
    return false; // signal game over
  }
  return true;
}

function lock() {
  state.piece.matrix.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val && state.piece.y + r >= 0) {
        state.grid[state.piece.y + r][state.piece.x + c] = val;
      }
    });
  });
  SFX.lock();
  clearLines();
  if (!spawnPiece()) {
    return false; // game over
  }
  return true;
}

function clearLines() {
  let cleared = 0;
  const prevLevel = state.level;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (state.grid[r].every(v => v)) {
      state.grid.splice(r, 1);
      state.grid.unshift(Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    const pts = [0, 100, 300, 500, 800];
    state.score += (pts[cleared] || 800) * state.level;
    state.lines += cleared;
    state.level = Math.floor(state.lines / 10) + 1;
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      localStorage.setItem('tetrisBest', state.bestScore);
    }
    SFX.clear(cleared);
    showCombo(cleared);
    if (state.level > prevLevel) {
      setTimeout(() => SFX.levelUp(), 350);
      updateBGMSpeed();
    }
    updateUI();
  }
}

export function drop() {
  if (!collides(state.piece, 0, 1)) {
    state.piece.y++;
    return true;
  } else {
    return lock();
  }
}

export function hardDrop() {
  SFX.hardDrop();
  while (!collides(state.piece, 0, 1)) {
    state.piece.y++;
    state.score += 2;
  }
  const alive = lock();
  updateUI();
  return alive;
}

export function initGame() {
  resetGrid();
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.gameOver = false;
  state.paused = false;
  state.totalPieces = 0;
  state.gameStartTime = Date.now();
  state.bestScore = parseInt(localStorage.getItem('tetrisBest') || '0');
  spawnPiece();
  updateUI();
}
