// ═══════════════════════════════════════════
//  OPTIONS PANEL
// ═══════════════════════════════════════════
import state from './state.js';
import { initAudio, stopBGM } from './audio.js';
import { draw } from './renderer.js';
import { showPauseStats } from './ui.js';

export function toggleOptions() {
  if (state.optionsOpen) {
    closeOptions();
  } else {
    openOptions();
  }
}

export function openOptions() {
  initAudio();
  state.optionsOpen = true;
  document.getElementById('options-backdrop').classList.remove('hidden');
  document.getElementById('options-panel').classList.remove('hidden');
  if (state.running && !state.paused && !state.gameOver) {
    state.paused = true;
    showPauseStats();
    document.getElementById('pause-overlay').classList.remove('hidden');
    stopBGM();
  }
}

export function closeOptions() {
  state.optionsOpen = false;
  document.getElementById('options-backdrop').classList.add('hidden');
  document.getElementById('options-panel').classList.add('hidden');
}

export function toggleFullscreen() {
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

export function toggleGhostPiece() {
  state.showGhost = !state.showGhost;
  const toggle = document.getElementById('ghost-toggle');
  toggle.classList.toggle('active', state.showGhost);
  draw();
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
