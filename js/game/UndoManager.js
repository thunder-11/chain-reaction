/**
 * DSA CONCEPT: Stack (LIFO)
 * Stores up to 10 board state snapshots for undo functionality.
 * Each snapshot captures the full grid state and the player ID
 * whose turn produced that state, enabling accurate turn restoration.
 */
class UndoManager {
  constructor(board) {
    this.board = board;
    this.history = new Stack(10); // max 10 undos
  }

  /**
   * Push a snapshot of the current board state onto the history stack.
   * Stores the player ID so GameController can restore the correct turn.
   */
  saveSnapshot(currentPlayerID) {
    this.history.push({
      grid: this.board.clone(),
      playerID: currentPlayerID
    });
  }

  /**
   * Pop the last snapshot, restore the board from it,
   * and return the player ID associated with that snapshot.
   * Returns null if no snapshots are available.
   */
  undo() {
    const snapshot = this.history.pop();
    if (!snapshot) return null;
    this.board.restore(snapshot.grid);
    return snapshot.playerID;
  }

  /**
   * Return true if there is at least one snapshot to undo to.
   */
  canUndo() {
    return !this.history.isEmpty();
  }

  /**
   * Return the number of snapshots currently stored.
   */
  getHistoryDepth() {
    return this.history.size();
  }

  /**
   * Clear all stored snapshots.
   */
  clear() {
    this.history.clear();
  }
}
