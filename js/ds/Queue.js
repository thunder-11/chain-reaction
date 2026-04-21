/**
 * DSA CONCEPT: Queue (FIFO — First In, First Out)
 * PURPOSE: Powers the chain explosion engine using BFS traversal.
 * Uses an array with a head pointer for O(1) enqueue and dequeue.
 */
class Queue {
  constructor() {
    this.data = [];
    this.head = 0;
  }

  enqueue(item) {
    this.data.push(item);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.data[this.head++];
  }

  peek() {
    return this.isEmpty() ? null : this.data[this.head];
  }

  isEmpty() {
    return this.head >= this.data.length;
  }

  size() {
    return this.data.length - this.head;
  }

  clear() {
    this.data = [];
    this.head = 0;
  }
}
