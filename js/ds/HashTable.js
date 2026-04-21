/**
 * DSA CONCEPT: Hash Table (Open Addressing — Linear Probing)
 * PURPOSE: Tracks how many cells each player owns.
 * Collisions are resolved by linearly scanning forward for the next
 * empty or tombstone slot. A DELETED sentinel handles deletions so
 * probing chains are not broken.
 */
class HashTable {
  constructor(capacity = 32) {
    this.capacity = capacity;
    this.size = 0;
    this._keys   = new Array(capacity).fill(undefined);
    this._values = new Array(capacity).fill(undefined);
    this.DELETED  = Symbol('DELETED'); // tombstone marker
  }

  /**
   * Hash function: polynomial rolling hash (base 31).
   * Returns an index in [0, capacity).
   */
  _hash(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++)
      h = (h * 31 + key.charCodeAt(i)) % this.capacity;
    return h;
  }

  /**
   * Insert or update a key-value pair.
   * Finds the correct slot via linear probing.
   * Triggers _rehash() when load factor exceeds 0.7.
   */
  set(key, value) {
    if ((this.size + 1) / this.capacity > 0.7) {
      this._rehash();
    }

    let idx = this._hash(key);
    let firstDeletedIdx = -1;

    for (let i = 0; i < this.capacity; i++) {
      const k = this._keys[idx];

      // Found an empty slot — key doesn't exist yet
      if (k === undefined) {
        if (firstDeletedIdx !== -1) {
          // Reuse the first tombstone slot we encountered
          this._keys[firstDeletedIdx] = key;
          this._values[firstDeletedIdx] = value;
        } else {
          this._keys[idx] = key;
          this._values[idx] = value;
        }
        this.size++;
        return;
      }

      // Track first tombstone encountered
      if (k === this.DELETED) {
        if (firstDeletedIdx === -1) firstDeletedIdx = idx;
      } else if (k === key) {
        // Key already exists — update value
        this._values[idx] = value;
        return;
      }

      idx = (idx + 1) % this.capacity;
    }

    // If we reach here, table is full of tombstones — use the first deleted slot
    if (firstDeletedIdx !== -1) {
      this._keys[firstDeletedIdx] = key;
      this._values[firstDeletedIdx] = value;
      this.size++;
    }
  }

  /**
   * Return value for the given key, or null if not found.
   * Stops probing at the first truly empty (undefined) slot.
   */
  get(key) {
    let idx = this._hash(key);

    for (let i = 0; i < this.capacity; i++) {
      const k = this._keys[idx];

      if (k === undefined) return null; // truly empty — key not present
      if (k !== this.DELETED && k === key) return this._values[idx];

      idx = (idx + 1) % this.capacity;
    }

    return null;
  }

  /**
   * Mark the slot as DELETED (tombstone). Do NOT set to undefined
   * so probing chains are not broken.
   */
  delete(key) {
    let idx = this._hash(key);

    for (let i = 0; i < this.capacity; i++) {
      const k = this._keys[idx];

      if (k === undefined) return; // key not found
      if (k !== this.DELETED && k === key) {
        this._keys[idx] = this.DELETED;
        this._values[idx] = undefined;
        this.size--;
        return;
      }

      idx = (idx + 1) % this.capacity;
    }
  }

  /**
   * Return true if the key exists (and is not deleted).
   */
  has(key) {
    let idx = this._hash(key);

    for (let i = 0; i < this.capacity; i++) {
      const k = this._keys[idx];

      if (k === undefined) return false;
      if (k !== this.DELETED && k === key) return true;

      idx = (idx + 1) % this.capacity;
    }

    return false;
  }

  /**
   * Return an array of all live keys (skip undefined and DELETED).
   */
  keys() {
    const result = [];
    for (let i = 0; i < this.capacity; i++) {
      const k = this._keys[i];
      if (k !== undefined && k !== this.DELETED) {
        result.push(k);
      }
    }
    return result;
  }

  /**
   * Double capacity and re-insert all live entries into fresh arrays.
   */
  _rehash() {
    const oldKeys = this._keys;
    const oldValues = this._values;
    const oldCapacity = this.capacity;

    this.capacity = oldCapacity * 2;
    this._keys   = new Array(this.capacity).fill(undefined);
    this._values = new Array(this.capacity).fill(undefined);
    this.size = 0;

    for (let i = 0; i < oldCapacity; i++) {
      const k = oldKeys[i];
      if (k !== undefined && k !== this.DELETED) {
        this.set(k, oldValues[i]);
      }
    }
  }

  /**
   * Returns a snapshot of the raw internal arrays for the debug panel.
   * Each entry: { index, key, value, status: 'live'|'deleted'|'empty' }
   */
  debugSlots() {
    const slots = [];
    for (let i = 0; i < this.capacity; i++) {
      const k = this._keys[i];
      let status, key, value;

      if (k === undefined) {
        status = 'empty';
        key = '—';
        value = '—';
      } else if (k === this.DELETED) {
        status = 'deleted';
        key = 'DELETED';
        value = '—';
      } else {
        status = 'live';
        key = k;
        value = this._values[i];
      }

      slots.push({ index: i, key, value, status });
    }
    return slots;
  }
}
