/**
 * DSA CONCEPT: Circular Doubly Linked List
 * PURPOSE: Manages the player turn cycle in round-robin fashion.
 * Supports dynamic node removal when a player is eliminated,
 * keeping the circular structure intact.
 */

class ListNode {
  constructor(data) {
    this.data = data;
    this.next = null;
    this.prev = null;
  }
}

class CircularLinkedList {
  constructor() {
    this.current = null;
    this.size = 0;
  }

  /**
   * Append a new node to the circular list.
   * If the list is empty, the node points to itself.
   * Otherwise, insert before this.current (at the tail of the circle).
   * Does NOT change this.current.
   */
  append(data) {
    const node = new ListNode(data);

    if (this.size === 0) {
      node.next = node;
      node.prev = node;
      this.current = node;
    } else {
      const tail = this.current.prev;
      tail.next = node;
      node.prev = tail;
      node.next = this.current;
      this.current.prev = node;
    }

    this.size++;
  }

  /**
   * Advance this.current to the next node in the circle.
   */
  next() {
    if (this.current) {
      this.current = this.current.next;
    }
  }

  /**
   * Return the data of the current node, or null if the list is empty.
   */
  getCurrent() {
    return this.current ? this.current.data : null;
  }

  /**
   * Remove the node whose data.id matches the given id.
   * If removing the current node, advance current first.
   * If the list has only one node and it matches, clear the list.
   */
  removeByID(id) {
    if (this.size === 0) return;

    let node = this.current;

    for (let i = 0; i < this.size; i++) {
      if (node.data.id === id) {
        if (this.size === 1) {
          this.current = null;
          this.size = 0;
          return;
        }

        if (node === this.current) {
          this.current = this.current.next;
        }

        node.prev.next = node.next;
        node.next.prev = node.prev;
        this.size--;
        return;
      }
      node = node.next;
    }
  }

  /**
   * Return true if any node in the list has data.id === id.
   */
  hasID(id) {
    if (this.size === 0) return false;

    let node = this.current;

    for (let i = 0; i < this.size; i++) {
      if (node.data.id === id) return true;
      node = node.next;
    }

    return false;
  }

  getSize() {
    return this.size;
  }
}
