// ═══════════════════════════════════════════
//  RENDERER
// ═══════════════════════════════════════════
import { COLS, ROWS, CELL, COLORS, COLORS_DARK } from './constants.js';
import state from './state.js';

const board = document.getElementById('board');
const ctx = board.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nctx = nextCanvas.getContext('2d');

function drawCell(context, x, y, colorIdx, alpha = 1, cellSize = CELL) {
  const color = COLORS[colorIdx];
  const px = x * cellSize, py = y * cellSize;
  const s = cellSize - 1;
  const r = 3;

  context.globalAlpha = alpha;

  context.shadowColor = color;
  context.shadowBlur = 10;

  context.fillStyle = color;
  context.beginPath();
  context.roundRect(px + 1, py + 1, s - 1, s - 1, r);
  context.fill();

  context.shadowBlur = 0;

  const grad = context.createLinearGradient(px, py, px, py + s);
  grad.addColorStop(0, 'rgba(255,255,255,0.25)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  context.fillStyle = grad;
  context.beginPath();
  context.roundRect(px + 2, py + 2, s - 3, s - 3, r - 1);
  context.fill();

  context.fillStyle = 'rgba(255,255,255,0.3)';
  context.beginPath();
  context.roundRect(px + 3, py + 3, s - 6, 5, 2);
  context.fill();

  context.strokeStyle = 'rgba(255,255,255,0.1)';
  context.lineWidth = 0.5;
  context.beginPath();
  context.roundRect(px + 1.5, py + 1.5, s - 2, s - 2, r);
  context.stroke();

  context.globalAlpha = 1;
}

function getGhost() {
  const { piece, grid } = state;
  let dy = 0;
  while (!ghostCollides(piece, dy + 1)) dy++;
  return { ...piece, y: piece.y + dy };
}

function ghostCollides(p, dy) {
  const m = p.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const nx = p.x + c;
      const ny = p.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && state.grid[ny][nx]) return true;
    }
  }
  return false;
}

export function draw() {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, board.height);
  bgGrad.addColorStop(0, '#08081a');
  bgGrad.addColorStop(1, '#060612');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, board.width, board.height);

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

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let r = 1; r < ROWS; r++)
    for (let c = 1; c < COLS; c++)
      ctx.fillRect(c * CELL - 0.5, r * CELL - 0.5, 1, 1);

  state.grid.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val) drawCell(ctx, c, r, val);
    });
  });

  if (state.piece && !state.gameOver) {
    if (state.showGhost) {
      const ghost = getGhost();
      ghost.matrix.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val) drawCell(ctx, ghost.x + c, ghost.y + r, val, 0.25);
        });
      });
    }

    state.piece.matrix.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) drawCell(ctx, state.piece.x + c, state.piece.y + r, val);
      });
    });
  }

  // Next piece preview
  nctx.fillStyle = 'rgba(12, 14, 28, 0.9)';
  nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (state.nextPiece) {
    const m = state.nextPiece.matrix;
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
