// ═══════════════════════════════════════════
//  INPUT HANDLING
// ═══════════════════════════════════════════
import state from './state.js';
import { ensureAudioReady, SFX, toggleMute, startBGM, stopBGM } from './audio.js';
import { collides, rotate, drop, hardDrop } from './game.js';
import { draw } from './renderer.js';
import { updateUI, showPauseStats } from './ui.js';
import { startFromMainScreen, startGame, endGame } from './loop.js';
import { closeOptions } from './options.js';

export function setupInput() {
  document.addEventListener('keydown', e => {
    ensureAudioReady();

    if (e.code === 'Escape') {
      e.preventDefault();
      if (state.optionsOpen) {
        closeOptions();
      }
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      if (state.optionsOpen) return;
      if (state.onMainScreen) {
        startFromMainScreen();
        return;
      }
      if (state.gameOver) {
        startGame();
        return;
      }
      if (!state.running) return;
      if (!state.paused) {
        const alive = hardDrop();
        if (alive === false) {
          endGame();
        }
      }
      return;
    }

    if (e.code === 'KeyM') {
      toggleMute();
      return;
    }

    if (e.code === 'KeyP') {
      if (!state.running || state.gameOver) return;
      state.paused = !state.paused;
      if (state.paused) showPauseStats();
      document.getElementById('pause-overlay').classList.toggle('hidden', !state.paused);
      if (!state.paused) {
        state.lastTime = performance.now();
        // Re-import loop dynamically to avoid circular dependency
        import('./loop.js').then(({ loop }) => {
          state.animFrame = requestAnimationFrame(loop);
        });
        startBGM();
      } else {
        stopBGM();
      }
      return;
    }

    if (!state.running || state.paused || state.gameOver) return;

    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        if (!collides(state.piece, -1)) { state.piece.x--; SFX.move(); }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (!collides(state.piece, 1)) { state.piece.x++; SFX.move(); }
        break;
      case 'ArrowDown':
        e.preventDefault();
        {
          const alive = drop();
          state.score++;
          updateUI();
          state.dropTimer = 0;
          if (alive === false) {
            endGame();
            return;
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        {
          const rotated = rotate(state.piece.matrix);
          if (!collides(state.piece, 0, 0, rotated)) { state.piece.matrix = rotated; SFX.rotate(); }
          else if (!collides(state.piece, 1, 0, rotated)) { state.piece.x++; state.piece.matrix = rotated; SFX.rotate(); }
          else if (!collides(state.piece, -1, 0, rotated)) { state.piece.x--; state.piece.matrix = rotated; SFX.rotate(); }
        }
        break;
    }
    draw();
  });
}
