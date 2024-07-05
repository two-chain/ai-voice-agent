import NodeCache from "node-cache";

// Create a cache instance with default settings
const cache = new NodeCache();

// Default TTL in seconds (e.g., 1 hour)
const DEFAULT_TTL = 3600;

interface CacheUtil {
  getOrSet<T>(
    key: string,
    ttl: number,
    fetchFunction: () => Promise<T>
  ): Promise<T>;
  set<T>(key: string, value: T, ttl?: number): boolean;
  get<T>(key: string): T | undefined;
  del(key: string | string[]): number;
  flush(): void;
}

const cacheUtil: CacheUtil = {
  /**
   * Get data from cache or fetch it and set in cache
   * @param key - The cache key
   * @param ttl - Time to live in seconds
   * @param fetchFunction - Function to fetch data if not in cache
   * @returns The cached or fetched data
   */
  async getOrSet<T>(
    key: string,
    ttl: number,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    const value = cache.get<T>(key);
    if (value !== undefined) {
      console.log(`Cache hit for key: $${key}`);
      return value;
    }

    console.log(`Cache miss for key: $${key}, fetching data`);
    const fetchedData = await fetchFunction();
    cache.set(key, fetchedData, ttl);
    return fetchedData;
  },

  /**
   * Set data in cache
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in seconds (optional, defaults to DEFAULT_TTL)
   * @returns true if the key has been set, false if not
   */
  set<T>(key: string, value: T, ttl: number = DEFAULT_TTL): boolean {
    return cache.set(key, value, ttl);
  },

  /**
   * Get data from cache
   * @param key - The cache key
   * @returns The cached value or undefined if not found
   */
  get<T>(key: string): T | undefined {
    return cache.get<T>(key);
  },

  /**
   * Delete data from cache
   * @param key - The cache key or an array of cache keys
   * @returns Number of deleted entries
   */
  del(key: string | string[]): number {
    return cache.del(key);
  },

  /**
   * Clear all data from cache
   */
  flush(): void {
    cache.flushAll();
  },
};

export default cacheUtil;
