/**
 * DSA CONCEPT: Stack (LIFO — Last In, First Out)
 * PURPOSE: Stores board snapshots for undo functionality.
 * Supports a configurable max size — oldest entries are evicted when full.
 */
class Stack {
  constructor(maxSize = 10) {
    this.items = [];
    this.maxSize = maxSize;
  }

  push(item) {
    if (this.items.length >= this.maxSize) this.items.shift();
    this.items.push(item);
  }

  pop() {
    return this.items.length ? this.items.pop() : null;
  }

  peek() {
    return this.items[this.items.length - 1] || null;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}
