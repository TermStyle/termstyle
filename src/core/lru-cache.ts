/**
 * Lightweight LRU (Least Recently Used) Cache implementation
 * Provides fast access with automatic eviction of old entries
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  prev?: CacheNode<K, V>;
  next?: CacheNode<K, V>;
}

export class LRUCache<K, V> {
  private capacity: number;
  private size = 0;
  private cache = new Map<K, CacheNode<K, V>>();
  private head?: CacheNode<K, V>;
  private tail?: CacheNode<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Cache capacity must be greater than 0');
    }
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) {
      return undefined;
    }

    // Move to head (most recently used)
    this.moveToHead(node);
    return node.value;
  }

  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing node
      existingNode.value = value;
      this.moveToHead(existingNode);
      return;
    }

    // Create new node
    const newNode: CacheNode<K, V> = { key, value };

    if (this.size >= this.capacity) {
      // Remove least recently used (tail)
      this.removeTail();
    }

    this.addToHead(newNode);
    this.cache.set(key, newNode);
    this.size++;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(key);
    this.size--;
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = undefined;
    this.tail = undefined;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.capacity;
  }

  keys(): K[] {
    const keys: K[] = [];
    let current = this.head;
    while (current) {
      keys.push(current.key);
      current = current.next;
    }
    return keys;
  }

  values(): V[] {
    const values: V[] = [];
    let current = this.head;
    while (current) {
      values.push(current.value);
      current = current.next;
    }
    return values;
  }

  private addToHead(node: CacheNode<K, V>): void {
    node.prev = undefined;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: CacheNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToHead(node: CacheNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): void {
    if (!this.tail) {
      return;
    }

    const lastNode = this.tail;
    this.removeNode(lastNode);
    this.cache.delete(lastNode.key);
    // FIX BUG-010: Prevent size underflow in case of cache corruption
    this.size = Math.max(0, this.size - 1);
  }
}

/**
 * Create a simple memoization function using LRU cache
 */
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  options: { 
    capacity?: number; 
    keyGenerator?: (...args: Args) => string 
  } = {}
): (...args: Args) => Return {
  const cache = new LRUCache<string, Return>(options.capacity || 100);
  const keyGen = options.keyGenerator || ((...args) => JSON.stringify(args));

  return (...args: Args): Return => {
    const key = keyGen(...args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}