/**
 * Renderer — DOM-based game renderer.
 * Renders the Board state to a CSS grid of div cells.
 * Orbs are absolutely-positioned animated spans. No canvas needed.
 * Updates the HUD, scoreboard, debug panel, and win screen.
 * Integrates AnimationEngine for explosion effects.
 */
class Renderer {
  constructor(board, config, controller) {
    this.board = board;
    this.config = config;
    this.controller = controller;

    this.boardEl = document.getElementById('game-board');
    this.currentPlayerEl = document.getElementById('current-player-name');
    this.currentColorEl = document.getElementById('current-player-chip');
    this.undoBtnEl = document.getElementById('undo-btn');
    this.winScreenEl = document.getElementById('win-screen');
    this.winnerNameEl = document.getElementById('winner-name');
    this.debugPanelEl = document.getElementById('debug-content');
    this.scoreboardEl = document.getElementById('scoreboard');
    this.winStatsEl = document.getElementById('win-stats');

    this.cellElements = []; // 2D array of DOM div elements
    this._lastRenderedPlayer = null; // for turn HUD transition

    // Keyboard navigation state
    this._focusR = 0;
    this._focusC = 0;

    this._buildGrid();
    this._attachHUDEvents();
    this._attachKeyboard();

    // Create AnimationEngine after grid is built
    this.animEngine = new AnimationEngine(this.boardEl, this.cellElements);
  }

  /**
   * Build the CSS grid of cell divs and attach click + hover handlers.
   */
  _buildGrid() {
    this.boardEl.innerHTML = '';
    this.cellElements = [];

    // Set CSS grid columns dynamically
    this.boardEl.style.gridTemplateColumns = `repeat(${this.board.cols}, 1fr)`;

    // Set board aspect ratio CSS variables (section 7d)
    this.boardEl.style.setProperty('--board-cols', this.board.cols);
    this.boardEl.style.setProperty('--board-rows', this.board.rows);

    for (let r = 0; r < this.board.rows; r++) {
      this.cellElements[r] = [];
      for (let c = 0; c < this.board.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute('tabindex', '-1');
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Cell row ${r + 1} column ${c + 1}`);

        cell.addEventListener('click', () => {
          this.controller.handleCellClick(r, c);
        });

        // Ghost orb on hover (section 7c)
        cell.addEventListener('mouseenter', () => {
          this._showGhostOrb(r, c);
        });
        cell.addEventListener('mouseleave', () => {
          this._removeGhostOrbs();
        });

        this.boardEl.appendChild(cell);
        this.cellElements[r][c] = cell;
      }
    }
  }

  /**
   * Returns [{top, left}] percentage positions for N orbs inside the cell.
   * Section 2 — precise atom positioning.
   */
  _orbPositions(n) {
    // Positions are tighter so atoms touch/overlap like they are joined
    const positions = {
      1: [{ top: 50, left: 50 }],
      2: [{ top: 50, left: 38 }, { top: 50, left: 62 }],
      3: [{ top: 35, left: 50 }, { top: 60, left: 36 }, { top: 60, left: 64 }],
      4: [{ top: 36, left: 36 }, { top: 36, left: 64 },
          { top: 64, left: 36 }, { top: 64, left: 64 }],
    };
    return positions[Math.min(n, 4)] || positions[4];
  }

  /**
   * Re-render every cell, the HUD, scoreboard, and debug panel.
   */
  render() {
    const current = this.controller.playerManager.getCurrentPlayer();

    // Remove any lingering ghost orbs
    this._removeGhostOrbs();

    // Update every cell's appearance
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.getCell(r, c);
        const el = this.cellElements[r][c];
        el.innerHTML = '';
        el.className = 'cell';
        el.style.removeProperty('--cell-color');

        if (cell.owner) {
          const playerConfig = this.config.players.find(p => p.id === cell.owner);
          if (playerConfig) {
            el.style.setProperty('--cell-color', playerConfig.color);
            el.classList.add('owned');
          }

          // Render orbs inside a rotating container (fixes atom containment)
          const orbContainer = document.createElement('div');
          orbContainer.className = 'orb-container';

          const orbPos = this._orbPositions(cell.orbs);
          for (let i = 0; i < cell.orbs; i++) {
            const orb = document.createElement('span');
            orb.className = 'orb';
            const pos = orbPos[i] || orbPos[orbPos.length - 1];
            orb.style.top = pos.top + '%';
            orb.style.left = pos.left + '%';
            orbContainer.appendChild(orb);
          }

          // Stage-based orbit speed: faster as cell nears critical mass
          const critMass = this.board.getCriticalMass(r, c);
          const orbsNeeded = critMass - cell.orbs;

          if (cell.orbs >= 2) {
            orbContainer.classList.add('orbiting');
            // Scale: from 3.12s (far) down to 0.52s (1 away), proportional
            // All speeds are 30% slower than original values
            const maxSpeed = 3.12;  // slowest rotation (seconds)
            const minSpeed = 0.52;  // fastest rotation (seconds)
            const ratio = Math.max(0, Math.min(1, 1 - (orbsNeeded / critMass)));
            const speed = maxSpeed - ratio * (maxSpeed - minSpeed);
            orbContainer.style.setProperty('--orbit-speed', speed.toFixed(2) + 's');
          }

          el.appendChild(orbContainer);

        }

        // Keyboard focus indicator
        if (r === this._focusR && c === this._focusC) {
          el.classList.add('keyboard-focus');
        }
      }
    }

    // Update HUD with turn transition (section 6)
    if (current) {
      if (this._lastRenderedPlayer && this._lastRenderedPlayer !== current.id) {
        this._animateTurnTransition(current);
      } else {
        this.currentPlayerEl.textContent = current.name;
        this.currentColorEl.style.backgroundColor = current.color;
      }
      this._lastRenderedPlayer = current.id;
    }

    // Update undo button
    this.undoBtnEl.disabled = !this.controller.undoManager.canUndo();

    // Update scoreboard (section 7b)
    this._updateScoreboard();

    // Update debug panel
    this._updateDebugPanel();
  }

  /**
   * Animate the turn indicator when the current player changes.
   */
  _animateTurnTransition(current) {
    const indicator = document.querySelector('.player-indicator');
    if (!indicator) {
      this.currentPlayerEl.textContent = current.name;
      this.currentColorEl.style.backgroundColor = current.color;
      return;
    }

    indicator.style.transition = 'transform 150ms ease, opacity 150ms ease';
    indicator.style.transform = 'translateY(-6px)';
    indicator.style.opacity = '0';

    setTimeout(() => {
      this.currentPlayerEl.textContent = current.name;
      this.currentColorEl.style.backgroundColor = current.color;
      indicator.style.transform = 'translateY(6px)';

      requestAnimationFrame(() => {
        indicator.style.transition = 'transform 150ms ease, opacity 150ms ease';
        indicator.style.transform = 'translateY(0)';
        indicator.style.opacity = '1';
      });
    }, 150);
  }

  /**
   * Show a ghost orb preview on hover for valid cells (section 7c).
   */
  _showGhostOrb(r, c) {
    if (this.controller.gameOver || this.controller.isAnimating) return;
    const current = this.controller.playerManager.getCurrentPlayer();
    if (!current) return;

    const cell = this.board.getCell(r, c);

    // Only show ghost on empty cells or cells owned by current player
    if (cell.owner !== null && cell.owner !== current.id) return;

    const el = this.cellElements[r][c];
    const futureCount = cell.orbs + 1;
    const orbPos = this._orbPositions(futureCount);
    const ghostPos = orbPos[futureCount - 1] || orbPos[orbPos.length - 1];

    const ghost = document.createElement('span');
    ghost.className = 'orb orb-ghost';
    ghost.style.top = ghostPos.top + '%';
    ghost.style.left = ghostPos.left + '%';
    ghost.style.setProperty('--cell-color', current.color);
    ghost.style.background = current.color;
    el.appendChild(ghost);
  }

  /**
   * Remove all ghost orb elements from the board.
   */
  _removeGhostOrbs() {
    const ghosts = this.boardEl.querySelectorAll('.orb-ghost');
    ghosts.forEach(g => g.remove());
  }

  /**
   * Update the scoreboard with per-player stats (section 7b).
   */
  _updateScoreboard() {
    if (!this.scoreboardEl) return;
    const current = this.controller.playerManager.getCurrentPlayer();
    const totalCells = this.board.totalCells();

    let html = '';
    this.config.players.forEach(p => {
      const cellCount = this.controller.ownershipMap.get(p.id) || 0;
      const isActive = current && current.id === p.id;
      const isAlive = this.controller.playerManager.isActive(p.id);
      const pct = totalCells > 0 ? (cellCount / totalCells * 100) : 0;

      html += '<div class="scoreboard-row' +
        (isActive ? ' scoreboard-active' : '') +
        (isAlive ? '' : ' scoreboard-eliminated') +
        '" style="--sb-color: ' + p.color + '">' +
        '<div class="sb-info">' +
          '<span class="sb-chip" style="background:' + p.color + '"></span>' +
          '<span class="sb-name">' + p.name + '</span>' +
          '<span class="sb-count">' + cellCount + '</span>' +
        '</div>' +
        '<div class="sb-bar-track">' +
          '<div class="sb-bar-fill" style="width:' + pct + '%;background:' + p.color + '"></div>' +
        '</div>' +
      '</div>';
    });

    this.scoreboardEl.innerHTML = html;
  }

  /**
   * Briefly flash a cell during chain-reaction explosions.
   * Uses a smooth transition for the exploding state.
   */
  flashCell(r, c) {
    const el = this.cellElements[r][c];
    el.style.transition = 'transform 100ms ease, border-color 100ms ease, box-shadow 100ms ease';
    el.classList.add('exploding');
    setTimeout(() => {
      el.classList.remove('exploding');
      setTimeout(() => { el.style.transition = ''; }, 120);
    }, 120);
  }

  /**
   * Shake a cell to indicate an invalid move (section 7f).
   * Smooth transition back to normal after shake ends.
   */
  shakeCell(r, c) {
    const el = this.cellElements[r][c];
    el.classList.add('invalid-move');
    el.addEventListener('animationend', () => {
      el.classList.remove('invalid-move');
      el.style.transition = 'transform 150ms ease';
      setTimeout(() => { el.style.transition = ''; }, 150);
    }, { once: true });
  }

  /**
   * Show the win screen overlay with smooth fade-in transition.
   */
  showWinScreen(winner, stats) {
    this.winnerNameEl.textContent = winner.name + ' Wins!';
    this.winnerNameEl.style.color = winner.color;

    // Smooth fade-in transition
    this.winScreenEl.style.opacity = '0';
    this.winScreenEl.classList.remove('hidden');
    this.winScreenEl.style.transition = 'opacity 350ms ease';
    requestAnimationFrame(() => {
      this.winScreenEl.style.opacity = '1';
    });

    if (this.winStatsEl && stats) {
      this.winStatsEl.innerHTML =
        '<div class="win-stat"><span class="win-stat-label">Total turns</span><strong>' + stats.totalTurns + '</strong></div>' +
        '<div class="win-stat"><span class="win-stat-label">Chain reactions</span><strong>' + stats.chainReactions + '</strong></div>' +
        '<div class="win-stat"><span class="win-stat-label">Longest chain</span><strong>' + stats.longestChain + '</strong></div>';
    }
  }

  /**
   * Hide the win screen overlay with smooth fade-out transition.
   */
  hideWinScreen() {
    this.winScreenEl.style.transition = 'opacity 250ms ease';
    this.winScreenEl.style.opacity = '0';
    setTimeout(() => {
      this.winScreenEl.classList.add('hidden');
      this.winScreenEl.style.transition = '';
      this.winScreenEl.style.opacity = '';
    }, 250);
  }

  /**
   * Update the DSA debug panel with live game state info.
   * Shows HashTable internal slots with open addressing visualization (section 1).
   */
  _updateDebugPanel() {
    if (!this.debugPanelEl) return;
    const info = this.controller.getDebugInfo();

    let html =
      '<div class="debug-row"><span>Stack depth</span><strong>' + info.stackDepth + '</strong></div>' +
      '<div class="debug-row"><span>Turn #</span><strong>' + info.turnNumber + '</strong></div>' +
      '<div class="debug-row"><span>Active players</span><strong>' + info.activePlayers + '</strong></div>' +
      '<div class="debug-section">HashTable — Linear Probing</div>';

    // Show ownership summary
    info.hashMapEntries.forEach(function(e) {
      var p = null;
      for (var i = 0; i < this.config.players.length; i++) {
        if (this.config.players[i].id === e.player) { p = this.config.players[i]; break; }
      }
      html += '<div class="debug-row">' +
        '<span style="color:' + (p ? p.color : '#fff') + '">' + (p ? p.name : e.player) + '</span>' +
        '<strong>' + e.cells + ' cells</strong>' +
        '</div>';
    }.bind(this));

    // Show HashTable internal slots table (section 1)
    const slots = this.controller.ownershipMap.debugSlots();
    html += '<div class="debug-section">Internal Slots</div>' +
      '<table class="debug-table">' +
      '<thead><tr><th>Slot</th><th>Key</th><th>Value</th><th>Status</th></tr></thead>' +
      '<tbody>';

    // Only show first 16 slots to keep panel manageable
    const maxSlots = Math.min(slots.length, 16);
    for (let i = 0; i < maxSlots; i++) {
      const s = slots[i];
      const statusClass = s.status === 'live' ? 'slot-live' : (s.status === 'deleted' ? 'slot-deleted' : 'slot-empty');
      html += '<tr class="' + statusClass + '">' +
        '<td>' + s.index + '</td>' +
        '<td>' + s.key + '</td>' +
        '<td>' + s.value + '</td>' +
        '<td>' + (s.status === 'deleted' ? 'tombstone' : s.status) + '</td>' +
        '</tr>';
    }
    if (slots.length > 16) {
      html += '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary)">… ' + (slots.length - 16) + ' more slots</td></tr>';
    }
    html += '</tbody></table>';

    this.debugPanelEl.innerHTML = html;
  }

  /**
   * Attach click handler for undo button.
   */
  _attachHUDEvents() {
    this.undoBtnEl.addEventListener('click', () => {
      this.controller.handleUndo();
    });
  }

  /**
   * Keyboard accessibility: arrow keys move focus, Enter places an orb (section 9).
   */
  _attachKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Only respond when game screen is visible
      const gameScreen = document.getElementById('game-screen');
      if (!gameScreen || gameScreen.classList.contains('hidden')) return;

      let handled = false;

      switch (e.key) {
        case 'ArrowUp':
          this._focusR = Math.max(0, this._focusR - 1);
          handled = true;
          break;
        case 'ArrowDown':
          this._focusR = Math.min(this.board.rows - 1, this._focusR + 1);
          handled = true;
          break;
        case 'ArrowLeft':
          this._focusC = Math.max(0, this._focusC - 1);
          handled = true;
          break;
        case 'ArrowRight':
          this._focusC = Math.min(this.board.cols - 1, this._focusC + 1);
          handled = true;
          break;
        case 'Enter':
        case ' ':
          this.controller.handleCellClick(this._focusR, this._focusC);
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        this.render();
        // Focus the cell element for screen readers
        if (this.cellElements[this._focusR] && this.cellElements[this._focusR][this._focusC]) {
          this.cellElements[this._focusR][this._focusC].focus();
        }
      }
    });
  }
}
