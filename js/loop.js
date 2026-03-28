// ═══════════════════════════════════════════
//  GAME LOOP & LIFECYCLE
// ═══════════════════════════════════════════
import state from './state.js';
import { ensureAudioReady, SFX, startBGM, stopBGM } from './audio.js';
import { initGame } from './game.js';
import { draw } from './renderer.js';
import { drop } from './game.js';
import { getElapsedTime } from './ui.js';

function getDropSpeed() {
  return Math.max(100, 1000 - (state.level - 1) * 80);
}

function loop(timestamp) {
  if (!state.running || state.paused || state.gameOver) return;
  const dt = timestamp - state.lastTime;
  state.lastTime = timestamp;
  state.dropTimer += dt;
  if (state.dropTimer >= getDropSpeed()) {
    const alive = drop();
    state.dropTimer = 0;
    if (alive === false) {
      endGame();
      return;
    }
  }
  draw();
  state.animFrame = requestAnimationFrame(loop);
}

export function startFromMainScreen() {
  ensureAudioReady();
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('wrapper').classList.remove('hidden');
  state.onMainScreen = false;
  setTimeout(() => startGame(), 500);
}

export function returnToMainScreen() {
  state.onMainScreen = true;
  state.running = false;
  state.gameOver = false;
  cancelAnimationFrame(state.animFrame);
  stopBGM();
  document.getElementById('wrapper').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');
  document.getElementById('gameover-overlay').classList.add('hidden');
  const best = localStorage.getItem('tetrisBest') || '0';
  document.getElementById('ms-best-score').textContent = parseInt(best).toLocaleString();
}

export function startGame() {
  ensureAudioReady();
  stopBGM();
  initGame();
  state.running = true;
  document.getElementById('gameover-overlay').classList.add('hidden');
  document.getElementById('pause-overlay').classList.add('hidden');
  state.lastTime = performance.now();
  state.dropTimer = 0;
  cancelAnimationFrame(state.animFrame);
  state.animFrame = requestAnimationFrame(loop);
  startBGM();
}

export function endGame() {
  state.gameOver = true;
  state.running = false;
  cancelAnimationFrame(state.animFrame);
  stopBGM();
  SFX.gameOver();

  const isNewBest = state.score > parseInt(localStorage.getItem('tetrisBest') || '0') && state.score > 0;

  document.getElementById('final-score').textContent = state.score.toString().padStart(6, '0');
  document.getElementById('best-score').textContent = state.bestScore.toString().padStart(6, '0');
  document.getElementById('final-level').textContent = state.level;
  document.getElementById('final-lines').textContent = state.lines;
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

export { loop };
