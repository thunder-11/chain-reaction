/**
 * DSA CONCEPTS USED: Queue (BFS) + Recursion
 * PRIMARY METHOD: explodeQueue() — Queue-based BFS chain reaction
 * SECONDARY METHOD: explodeRecursive() — recursive DFS explosion (for demo)
 *
 * The explosion engine is the core mechanic of Chain Reaction:
 * when a cell reaches its critical mass, it explodes and distributes
 * orbs to its neighbors, potentially triggering cascading explosions.
 */
class ExplosionEngine {
  constructor(board) {
    this.board = board;
  }

  /**
   * PRIMARY — Queue-based BFS explosion.
   * Called when a cell reaches critical mass after orb placement.
   * Uses the Queue class from Phase 1 (not array.shift).
   *
   * @param {number} startR - row of the initially exploding cell
   * @param {number} startC - col of the initially exploding cell
   * @param {string} currentPlayer - ID of the current player
   * @param {Function} onStep - callback(stepChanged, fromR, fromC, neighbours, playerColor)
   * @returns {Object} { chainCount, longestChain }
   */
  async explodeQueue(startR, startC, currentPlayer, onStep) {
    const queue = new Queue();
    queue.enqueue({ r: startR, c: startC });

    let chainCount = 0;
    let longestChain = 0;
    let currentDepth = 0;

    while (!queue.isEmpty()) {
      const batchSize = queue.size();
      currentDepth++;
      if (currentDepth > longestChain) longestChain = currentDepth;

      for (let b = 0; b < batchSize; b++) {
        const { r, c } = queue.dequeue();
        const cell = this.board.getCell(r, c);
        const critMass = this.board.getCriticalMass(r, c);

        // Only explode if the cell still has enough orbs
        if (cell.orbs < critMass) continue;

        chainCount++;

        // Explode: reset this cell to empty
        this.board.setCell(r, c, null, 0);

        // Distribute 1 orb to each orthogonal neighbor
        const neighbors = this.board.getNeighbors(r, c);
        for (const nb of neighbors) {
          const nbCell = this.board.getCell(nb.r, nb.c);
          const newOrbs = nbCell.orbs + 1;
          this.board.setCell(nb.r, nb.c, currentPlayer, newOrbs);

          // If the neighbor now reaches critical mass, enqueue it
          if (newOrbs >= this.board.getCriticalMass(nb.r, nb.c)) {
            queue.enqueue({ r: nb.r, c: nb.c });
          }
        }

        // Collect cells changed in this step and notify + delay
        const stepChanged = [{ r, c }, ...neighbors.map(nb => ({ r: nb.r, c: nb.c }))];
        if (onStep) onStep(stepChanged, r, c, neighbors, currentPlayer);
        await this._delay(80);
      }
    }

    return { chainCount, longestChain };
  }

  /**
   * Promise-based delay helper for animation pacing.
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * SECONDARY — Recursive DFS explosion (alternate DSA demonstration).
   * Uses the call stack (implicit recursion stack) instead of an explicit Queue.
   * A visited set prevents infinite loops in cyclic chain reactions.
   *
   * @param {number} r - row of the exploding cell
   * @param {number} c - col of the exploding cell
   * @param {string} currentPlayer - ID of the current player
   * @param {Set} visited - tracks cells already exploded in this chain
   */
  explodeRecursive(r, c, currentPlayer, visited = new Set()) {
    const key = r + ',' + c;
    if (visited.has(key)) return;
    visited.add(key);

    const cell = this.board.getCell(r, c);
    if (cell.orbs < this.board.getCriticalMass(r, c)) return;

    const neighbors = this.board.getNeighbors(r, c);

    // Explode: reset this cell to empty
    this.board.setCell(r, c, null, 0);

    // Distribute 1 orb to each neighbor
    for (const nb of neighbors) {
      const nbCell = this.board.getCell(nb.r, nb.c);
      const newOrbs = nbCell.orbs + 1;
      this.board.setCell(nb.r, nb.c, currentPlayer, newOrbs);

      // Recurse if the neighbor now reaches critical mass
      if (newOrbs >= this.board.getCriticalMass(nb.r, nb.c)) {
        this.explodeRecursive(nb.r, nb.c, currentPlayer, visited);
      }
    }
  }
}
