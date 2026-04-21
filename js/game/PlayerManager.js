/**
 * DSA CONCEPT: Circular Linked List
 * Manages player turn order using a CircularLinkedList.
 * Handles round-robin turn advancement and dynamic player
 * elimination when a player loses all their cells.
 */
class PlayerManager {
  constructor(playerConfigs) {
    // playerConfigs = [{ id, name, color }, ...]
    this.list = new CircularLinkedList();
    this.allPlayers = {}; // plain object: id → config (for reference)

    playerConfigs.forEach(p => {
      this.list.append({ ...p, turnCount: 0 });
      this.allPlayers[p.id] = p;
    });
  }

  /**
   * Return the data of the current player node.
   */
  getCurrentPlayer() {
    return this.list.getCurrent();
  }

  /**
   * Increment the current player's turnCount, then advance to the next player.
   */
  nextTurn() {
    const cur = this.list.getCurrent();
    if (cur) cur.turnCount++;
    this.list.next();
  }

  /**
   * Remove a player from the circular list by their ID.
   */
  eliminatePlayer(playerID) {
    this.list.removeByID(playerID);
  }

  /**
   * Return true if the player with the given ID is still in the turn cycle.
   */
  isActive(playerID) {
    return this.list.hasID(playerID);
  }

  /**
   * Return the number of players still in the game.
   */
  getRemainingCount() {
    return this.list.getSize();
  }

  /**
   * Return an array of all player IDs (including eliminated ones).
   */
  getAllPlayerIDs() {
    return Object.keys(this.allPlayers);
  }

  /**
   * Traverse the circular list and reset all turnCounts to 0.
   * Used when the game resets.
   */
  resetTurnCounts() {
    const count = this.list.getSize();
    for (let i = 0; i < count; i++) {
      const p = this.list.getCurrent();
      if (p) p.turnCount = 0;
      this.list.next();
    }
  }
}
