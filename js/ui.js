// ═══════════════════════════════════════════
//  UI UPDATES
// ═══════════════════════════════════════════
import state from './state.js';

export function updateUI() {
  document.getElementById('score-display').textContent = state.score.toString().padStart(6, '0');
  document.getElementById('best-display').textContent = state.bestScore.toString().padStart(6, '0');
  document.getElementById('level-display').textContent = state.level;
  document.getElementById('lines-display').textContent = state.lines;
  document.getElementById('level-fill').style.width = ((state.lines % 10) * 10) + '%';
  document.getElementById('pieces-display').textContent = state.totalPieces;
}

export function updateTimeDisplay() {
  if (!state.running || state.paused || state.gameOver) return;
  const elapsed = Math.floor((Date.now() - state.gameStartTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  document.getElementById('time-display').textContent = m + ':' + s;
  const minutes = elapsed / 60;
  document.getElementById('ppm-display').textContent = minutes > 0 ? Math.round(state.totalPieces / minutes) : 0;
}

export function getElapsedTime() {
  const elapsed = Math.floor((Date.now() - state.gameStartTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return m + ':' + s;
}

export function showCombo(count) {
  const labels = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS!'];
  const popup = document.getElementById('combo-popup');
  popup.textContent = labels[Math.min(count, 4)];
  popup.classList.remove('show');
  void popup.offsetWidth;
  popup.classList.add('show');

  if (count >= 2) {
    document.getElementById('wrapper').classList.add('shake');
    setTimeout(() => document.getElementById('wrapper').classList.remove('shake'), 300);
  }

  const flash = document.getElementById('line-flash');
  flash.style.top = '40%';
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
}

export function showPauseStats() {
  document.getElementById('pause-score').textContent = state.score.toString().padStart(6, '0');
  document.getElementById('pause-level').textContent = state.level;
  document.getElementById('pause-lines').textContent = state.lines;
}
