/**
 * AnimationEngine — all DOM-level visual effects:
 *   - Orb flight particles during explosions
 *   - Shockwave rings on the source cell
 *   - Cell flash helper
 *   - Smooth transition helpers
 * Keeps all animation logic out of Renderer and GameController.
 */
class AnimationEngine {
  constructor(boardEl, cellElements) {
    this.boardEl      = boardEl;
    this.cellElements = cellElements;
  }

  /**
   * Play a full explosion animation: shockwave on the source cell,
   * flash it, and fly particles to each neighbour.
   * All sub-effects use transitions/animations for smoothness.
   */
  async playExplosion(fromR, fromC, neighbours, playerColor) {
    this._shockwave(fromR, fromC, playerColor);
    this._flashCell(fromR, fromC);
    const promises = neighbours.map(nb =>
      this._flyParticle(fromR, fromC, nb.r, nb.c, playerColor)
    );
    await Promise.all(promises);
  }

  /**
   * Spawn a .shockwave div centred on the source cell.
   * Uses CSS animation with transition-ready initial state.
   */
  _shockwave(r, c, color) {
    const cellEl = this.cellElements[r][c];
    const ring = document.createElement('div');
    ring.className = 'shockwave';

    const rect = cellEl.getBoundingClientRect();
    const boardRect = this.boardEl.getBoundingClientRect();

    ring.style.left = (rect.left - boardRect.left + rect.width / 2) + 'px';
    ring.style.top  = (rect.top  - boardRect.top  + rect.height / 2) + 'px';
    ring.style.width  = rect.width + 'px';
    ring.style.height = rect.height + 'px';
    ring.style.setProperty('--player-color', color);
    ring.style.borderColor = color;

    // Start transparent, transition to visible via animation
    ring.style.opacity = '0';
    this.boardEl.appendChild(ring);
    requestAnimationFrame(() => {
      ring.style.opacity = '';
    });

    ring.addEventListener('animationend', () => {
      ring.style.transition = 'opacity 100ms ease';
      ring.style.opacity = '0';
      setTimeout(() => ring.remove(), 100);
    }, { once: true });
  }

  /**
   * Spawn a .particle div that flies from source cell to destination cell.
   * Uses CSS custom properties --dx and --dy for the flight vector.
   * Returns a Promise that resolves when the animation ends.
   */
  _flyParticle(fromR, fromC, toR, toC, color) {
    return new Promise(resolve => {
      const fromEl = this.cellElements[fromR][fromC];
      const toEl   = this.cellElements[toR][toC];

      const fromRect  = fromEl.getBoundingClientRect();
      const toRect    = toEl.getBoundingClientRect();
      const boardRect = this.boardEl.getBoundingClientRect();

      const startX = fromRect.left - boardRect.left + fromRect.width / 2;
      const startY = fromRect.top  - boardRect.top  + fromRect.height / 2;
      const endX   = toRect.left   - boardRect.left + toRect.width / 2;
      const endY   = toRect.top    - boardRect.top  + toRect.height / 2;

      const dx = endX - startX;
      const dy = endY - startY;

      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = startX + 'px';
      particle.style.top  = startY + 'px';
      particle.style.background = color;
      particle.style.boxShadow = '0 0 8px ' + color;
      particle.style.setProperty('--dx', dx + 'px');
      particle.style.setProperty('--dy', dy + 'px');

      this.boardEl.appendChild(particle);

      particle.addEventListener('animationend', () => {
        particle.remove();
        resolve();
      }, { once: true });

      // Fallback in case animationend doesn't fire
      setTimeout(() => {
        if (particle.parentNode) particle.remove();
        resolve();
      }, 300);
    });
  }

  /**
   * Add .exploding class to a cell with a smooth transition in/out.
   * The class adds a CSS animation; removal is delayed to let it finish.
   */
  _flashCell(r, c) {
    const el = this.cellElements[r][c];
    el.style.transition = 'transform 120ms ease, border-color 120ms ease';
    el.classList.add('exploding');
    setTimeout(() => {
      el.classList.remove('exploding');
      // Restore normal transition after flash
      el.style.transition = '';
    }, 150);
  }

  /**
   * Smoothly highlight a cell (e.g. for receiving an orb during explosion).
   * Adds a brief scale bump and glow transition.
   */
  pulseCell(r, c, color) {
    const el = this.cellElements[r][c];
    el.style.transition = 'transform 200ms ease, box-shadow 200ms ease';
    el.style.transform = 'scale(1.08)';
    el.style.boxShadow = '0 0 12px ' + color;
    setTimeout(() => {
      el.style.transform = '';
      el.style.boxShadow = '';
      setTimeout(() => { el.style.transition = ''; }, 200);
    }, 200);
  }
}
