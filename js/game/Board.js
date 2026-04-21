/**
 * DSA CONCEPT: 2D Array
 * The entire game board is a 2D array of cell objects.
 * board.grid[row][col] = { owner: playerID | null, orbs: number }
 * Provides spatial queries (neighbors, critical mass) and
 * snapshot/restore for undo functionality.
 */
class Board {
  constructor(rows = 8, cols = 8) {
    this.rows = rows;
    this.cols = cols;
    this.grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ owner: null, orbs: 0 }))
    );
  }

  /**
   * Return the cell object at (r, c).
   */
  getCell(r, c) {
    return this.grid[r][c];
  }

  /**
   * Overwrite the cell at (r, c) with the given owner and orb count.
   */
  setCell(r, c, owner, orbs) {
    this.grid[r][c] = { owner, orbs };
  }

  /**
   * Return true if (r, c) is within board bounds.
   */
  isValid(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  /**
   * Return an array of { r, c } for the valid orthogonal neighbors
   * of the given cell. No diagonals.
   */
  getNeighbors(r, c) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return dirs
      .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
      .filter(pos => this.isValid(pos.r, pos.c));
  }

  /**
   * Critical mass equals the number of orthogonal neighbors.
   * Corner = 2, Edge = 3, Inner = 4.
   */
  getCriticalMass(r, c) {
    return this.getNeighbors(r, c).length;
  }

  /**
   * Deep-clone the grid into a plain 2D array of { owner, orbs } objects.
   * Used by UndoManager to snapshot board state.
   */
  clone() {
    return this.grid.map(row =>
      row.map(cell => ({ owner: cell.owner, orbs: cell.orbs }))
    );
  }

  /**
   * Restore the grid from a previously cloned 2D array snapshot.
   */
  restore(snapshot) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = { owner: snapshot[r][c].owner, orbs: snapshot[r][c].orbs };
      }
    }
  }

  /**
   * Clear the entire board back to empty cells.
   */
  reset() {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({ owner: null, orbs: 0 }))
    );
  }

  /**
   * Resize the board to new dimensions and reset.
   */
  resize(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.reset();
  }

  /**
   * Count how many cells the given player currently owns.
   */
  countCellsByPlayer(playerID) {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].owner === playerID) count++;
      }
    }
    return count;
  }

  /**
   * Return total number of cells on the board.
   */
  totalCells() {
    return this.rows * this.cols;
  }
}
