/**
 * Main game orchestrator.
 * Coordinates: Board, ExplosionEngine, PlayerManager, UndoManager, Renderer.
 * Uses HashTable (open addressing — linear probing) to track ownership counts
 * for efficient win detection.
 *
 * DSA CONCEPTS USED:
 * - HashTable for ownership tracking
 * - CircularLinkedList (via PlayerManager) for turn order
 * - Stack (via UndoManager) for undo history
 * - Queue (via ExplosionEngine) for BFS chain reactions
 * - 2D Array (via Board) for grid state
 */
class GameController {
  constructor(config) {
    // config = { rows: 8, cols: 8, players: [{ id, name, color }] }
    this.config = config;
    this.board = new Board(config.rows, config.cols);
    this.ownershipMap = new HashTable(); // playerID → cell count
    this.engine = new ExplosionEngine(this.board);
    this.playerManager = new PlayerManager(config.players);
    this.undoManager = new UndoManager(this.board);
    this.renderer = null; // set via setRenderer(renderer)
    this.soundEngine = null; // set via setSoundEngine(soundEngine)
    this.gameOver = false;
    this.isAnimating = false;
    this.turnNumber = 0;
    this.totalPlayers = config.players.length;

    // Stats tracking (section 7e)
    this.chainCount = 0;   // total chain reactions across the game
    this.longestChain = 0; // max queue depth reached in a single explosion run

    // Initialize ownershipMap with 0 for each player
    config.players.forEach(p => this.ownershipMap.set(p.id, 0));
  }

  /**
   * Attach a renderer instance for UI updates.
   */
  setRenderer(renderer) {
    this.renderer = renderer;
  }

  /**
   * Attach a sound engine instance for audio feedback.
   */
  setSoundEngine(soundEngine) {
    this.soundEngine = soundEngine;
  }

  /**
   * Handle a cell click at (r, c).
   * Validates the move, places an orb, triggers explosions,
   * checks eliminations and win condition, then advances the turn.
   */
  async handleCellClick(r, c) {
    if (this.gameOver || this.isAnimating) return;

    const current = this.playerManager.getCurrentPlayer();
    const cell = this.board.getCell(r, c);

    // Validate: only empty cells OR own cells can be clicked
    if (cell.owner !== null && cell.owner !== current.id) {
      // Invalid move — shake + sound
      if (this.renderer) this.renderer.shakeCell(r, c);
      if (this.soundEngine) this.soundEngine.playInvalidMove();
      return;
    }

    // Lock input during animation
    this.isAnimating = true;

    // Save snapshot for undo BEFORE making changes
    this.undoManager.saveSnapshot(current.id);

    // Track old owner for ownership map update
    const oldOwner = cell.owner;

    // Place orb
    const newOrbs = cell.orbs + 1;
    this.board.setCell(r, c, current.id, newOrbs);
    this._updateOwnership(oldOwner, current.id);

    // Play place sound
    if (this.soundEngine) this.soundEngine.playPlace();

    // Trigger explosion if critical mass reached
    if (newOrbs >= this.board.getCriticalMass(r, c)) {
      if (this.soundEngine) this.soundEngine.playExplode();

      let explosionStep = 0;
      const result = await this.engine.explodeQueue(r, c, current.id, (changedCells, fromR, fromC, neighbours, playerColor) => {
        this._recalculateOwnershipMap();
        explosionStep++;

        if (this.soundEngine) this.soundEngine.playChain(explosionStep);

        // Play animation via AnimationEngine
        if (this.renderer && this.renderer.animEngine) {
          this.renderer.animEngine.playExplosion(fromR, fromC, neighbours, playerColor);
        }

        if (this.renderer) {
          changedCells.forEach(pos => this.renderer.flashCell(pos.r, pos.c));
          this.renderer.render();
        }
      });

      // Update stats
      this.chainCount += result.chainCount;
      if (result.longestChain > this.longestChain) {
        this.longestChain = result.longestChain;
      }
    }

    this._recalculateOwnershipMap();
    this.turnNumber++;

    // Check eliminations (only valid after each player has had at least 1 turn)
    if (this.turnNumber > this.totalPlayers) {
      this._checkEliminations();
    }

    // Check win condition
    if (!this.gameOver) {
      this._checkWinCondition();
    }

    // Advance to next player's turn
    if (!this.gameOver) {
      this.playerManager.nextTurn();
    }

    // Unlock input
    this.isAnimating = false;

    // Re-render the UI
    if (this.renderer) {
      this.renderer.render();
    }
  }

  /**
   * Undo the last move: restore the board, ownership map, and turn.
   */
  handleUndo() {
    if (!this.undoManager.canUndo()) return;

    const prevPlayerID = this.undoManager.undo();
    // Board is already restored by undoManager.undo()
    this._recalculateOwnershipMap();

    // Restore player turn to prevPlayerID by traversing the circular list
    let attempts = this.playerManager.getRemainingCount();
    while (attempts-- > 0) {
      if (this.playerManager.getCurrentPlayer()?.id === prevPlayerID) break;
      this.playerManager.list.next();
    }

    this.turnNumber = Math.max(0, this.turnNumber - 1);

    if (this.renderer) this.renderer.render();
  }

  /**
   * Reset the game, optionally with a new configuration.
   */
  resetGame(newConfig) {
    const cfg = newConfig || this.config;
    this.config = cfg;
    this.board.resize(cfg.rows, cfg.cols);
    this.ownershipMap = new HashTable();
    this.engine = new ExplosionEngine(this.board);
    this.playerManager = new PlayerManager(cfg.players);
    this.undoManager = new UndoManager(this.board);
    this.gameOver = false;
    this.isAnimating = false;
    this.turnNumber = 0;
    this.totalPlayers = cfg.players.length;
    this.chainCount = 0;
    this.longestChain = 0;
    cfg.players.forEach(p => this.ownershipMap.set(p.id, 0));
    if (this.renderer) this.renderer.render();
  }

  /**
   * Return match statistics for the win screen.
   */
  getMatchStats() {
    return {
      totalTurns: this.turnNumber,
      chainReactions: this.chainCount,
      longestChain: this.longestChain
    };
  }

  /**
   * Incrementally update the ownership map for a single cell change.
   * Used when placing an orb (before any chain reaction).
   * @private
   */
  _updateOwnership(oldOwner, newOwner) {
    if (oldOwner && oldOwner !== newOwner) {
      const prev = this.ownershipMap.get(oldOwner) || 0;
      this.ownershipMap.set(oldOwner, Math.max(0, prev - 1));
    }
    if (newOwner) {
      const curr = this.ownershipMap.get(newOwner) || 0;
      this.ownershipMap.set(newOwner, curr + 1);
    }
  }

  /**
   * Full recalculation of the ownership map by scanning the entire board.
   * More accurate than incremental updates during chain reactions
   * where multiple cells change owners rapidly.
   * @private
   */
  _recalculateOwnershipMap() {
    this.config.players.forEach(p => this.ownershipMap.set(p.id, 0));
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.getCell(r, c);
        if (cell.owner) {
          const cur = this.ownershipMap.get(cell.owner) || 0;
          this.ownershipMap.set(cell.owner, cur + 1);
        }
      }
    }
  }

  /**
   * Check if any active player has 0 cells and eliminate them.
   * Only called after all players have had at least one turn.
   * @private
   */
  _checkEliminations() {
    this.config.players.forEach(p => {
      if (this.playerManager.isActive(p.id)) {
        const count = this.ownershipMap.get(p.id) || 0;
        if (count === 0) {
          this.playerManager.eliminatePlayer(p.id);
        }
      }
    });
  }

  /**
   * Check if only one player remains — they win.
   * @private
   */
  _checkWinCondition() {
    if (this.playerManager.getRemainingCount() === 1) {
      this.gameOver = true;
      const winner = this.playerManager.getCurrentPlayer();
      if (this.soundEngine) this.soundEngine.playWin();
      if (this.renderer) this.renderer.showWinScreen(winner, this.getMatchStats());
    }
  }

  /**
   * Return debug information for the DSA debug panel.
   */
  getDebugInfo() {
    return {
      queueSize: 0, // live queue size only meaningful during explosion
      stackDepth: this.undoManager.getHistoryDepth(),
      hashMapEntries: this.config.players.map(p => ({
        player: p.id,
        cells: this.ownershipMap.get(p.id) || 0
      })),
      turnNumber: this.turnNumber,
      activePlayers: this.playerManager.getRemainingCount()
    };
  }
}
