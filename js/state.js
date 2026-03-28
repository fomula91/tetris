// ═══════════════════════════════════════════
//  SHARED GAME STATE
// ═══════════════════════════════════════════
import { ROWS, COLS } from './constants.js';

const state = {
  grid: [],
  piece: null,
  nextPiece: null,
  score: 0,
  bestScore: 0,
  level: 1,
  lines: 0,
  gameOver: false,
  paused: false,
  running: false,
  totalPieces: 0,
  gameStartTime: 0,
  onMainScreen: true,
  showGhost: true,
  muteState: false,
  optionsOpen: false,
  dropTimer: 0,
  lastTime: 0,
  animFrame: null,
};

export function resetGrid() {
  state.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export default state;
