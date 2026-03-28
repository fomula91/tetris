// ═══════════════════════════════════════════
//  FLOATING PARTICLES
// ═══════════════════════════════════════════
export function createParticles() {
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
}
