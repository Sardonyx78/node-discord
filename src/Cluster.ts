/**
 * A set of options passed to the set method
 */
export interface ClusterSetOptions {
  /**
   * Whether or not to add the new item when the Cluster's limit is reached
   */
  force: boolean;
  /**
   * Whether or not to shift the first item in the Cluster when the limit is reached
   */
  shift: boolean;
}

/**
 * Clusters serve as data holders throughout the library.
 * They are a combination of JavaScript Maps and Arrays with the
 * ability to hold large amount of data.
 * @class
 * @extends Map
 * @template K, V
 */
class Cluster<K, V> extends Map<K, V> {
  /**
   * The maximum amount of items allowed in this Cluster
   */
  public readonly limit: number;

  constructor(entries?: Iterable<readonly [K, V]> | null, limit?: number) {
    if (entries) {
      super(entries);
    } else {
      super();
    }

    this.limit = limit || 0;
  }

  /**
   * Whether the given argument is a cluster
   * @param {*} cluster Data to check if cluster
   * @returns {boolean}
   */
  public static isCluster(cluster: unknown): boolean {
    return cluster instanceof Cluster;
  }

  /**
   * Maps the {@link Cluster} values into an array
   * @type {V[]}
   */
  public get toArray(): V[] {
    return [...this.values()];
  }

  /**
   * Maps the {@link Cluster} keys into an array
   * @type {K[]}
   */
  public get toArrayKeys(): K[] {
    return [...this.keys()];
  }

  /**
   * Maps the {@link Cluster} entries an array
   * @type {[K, V][]}
   */
  public get toArrayEntries(): [K, V][] {
    return [...this.entries()];
  }

  /**
   * Filters the map according to the given callback function, and
   * returns a new filtered {@link Cluster}.
   * Equivalent to {@link Array.filter}
   * @param {function(value: V, key: K, cluster: this): boolean} cb Callback function
   * @returns {Cluster<K, V>}
   */
  public filter(cb: (value: V, key?: K, cluster?: this) => boolean): Cluster<K, V> {
    const cluster = new Cluster<K, V>();

    for (const [key, value] of this) {
      if (cb(value, key, this)) {
        cluster.set(key, value);
      }
    }

    return cluster;
  }

  /**
   * Get the first value in the {@link Cluster}
   * @type {V | undefined}
   */
  public get first(): V | undefined {
    if (!this.size) return undefined;

    return this.values().next().value;
  }

  /**
   * Get he first key in the {@link Cluster}
   * @returns {K}
   */
  public get firstKey(): K | undefined {
    if (!this.size) return undefined;

    return this.keys().next().value;
  }

  /**
   * Get the last value in the {@link Cluster}
   * @type {V}
   */
  public get last(): V | undefined {
    if (!this.size) return undefined;

    return this.toArray[this.size - 1];
  }

  /**
   * Get he last key in the {@link Cluster}
   * @returns {K}
   */
  public get lastKey(): K | undefined {
    if (!this.size) return undefined;

    return this.toArrayKeys[this.size - 1];
  }

  /**
   * ֛Merges cluster(s) on top of this one. Replaces existing keys by newer clusters
   * @param {...(Cluster<K, V> | [K, V][])[]} clusters The cluster(s) to be merged on top of this one
   */
  public merge(...clusters: (Cluster<K, V> | [K, V][])[]): void {
    for (const cluster of clusters) {
      for (const [key, value] of cluster) {
        this.set(key, value);
      }
    }
  }

  /**
   * Checks if the Cluster has reached its limit and sets the item using {@link Map.prototype.set}
   * @param {K} key The key to set
   * @param {V} value The value to set
   * @param {Partial<ClusterSetOptions>} options The options to considerate when reaching the Cluster's limit
   * @returns {this}
   */
  public set(key: K, value: V, options?: Partial<ClusterSetOptions>): this {
    // If the key already exists, a new item won't be added, thus keeping the size at the limit
    if (!options?.force && this.limit <= this.size && !this.has(key)) {
      if (options?.shift && this.firstKey) {
        this.delete(this.firstKey);
      } else return this;
    }

    return super.set(key, value);
  }

  public toJSON(): V[] {
    return this.toArray;
  }
}

export default Cluster;
