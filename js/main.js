// ═══════════════════════════════════════════
//  MAIN ENTRY POINT
// ═══════════════════════════════════════════
import { createParticles } from './particles.js';
import { onMasterVolChange, onBgmVolChange, onSfxVolChange } from './audio.js';
import { draw } from './renderer.js';
import { updateTimeDisplay } from './ui.js';
import { setupInput } from './input.js';
import { startFromMainScreen } from './loop.js';
import { toggleOptions, openOptions, closeOptions, toggleFullscreen, toggleGhostPiece } from './options.js';

// Expose functions for HTML onclick handlers
window.startFromMainScreen = startFromMainScreen;
window.toggleOptions = toggleOptions;
window.openOptions = openOptions;
window.closeOptions = closeOptions;
window.toggleFullscreen = toggleFullscreen;
window.toggleGhostPiece = toggleGhostPiece;
window.onMasterVolChange = onMasterVolChange;
window.onBgmVolChange = onBgmVolChange;
window.onSfxVolChange = onSfxVolChange;

// Initialize
createParticles();
setupInput();
setInterval(updateTimeDisplay, 1000);

// Show best score on main screen
const savedBest = localStorage.getItem('tetrisBest') || '0';
document.getElementById('ms-best-score').textContent = parseInt(savedBest).toLocaleString();

// Initial draw
draw();
