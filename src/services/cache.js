/**
 * HafA DIGITAL - Enterprise Client Caching Engine
 * 
 * Multi-tiered caching (In-Memory Map + localStorage) with strict Time-To-Live (TTL)
 * management and dynamic invalidation strategies for read-heavy operations.
 */

const CACHE_PREFIX = 'hafa_cache_';
const memoryCache = new Map();

// Default TTL configurations (in minutes)
export const DEFAULT_TTLS = {
  getEmployees: 15,
  getSettings: 30,
  getProductionTasks: 5,
  getAttendance: 2,
  getEmployeePerformanceSummary: 5,
  getWorkProofs: 5,
  DEFAULT: 5
};

/**
 * Returns the TTL in minutes configured for a specific action
 * @param {string} action - API Action name
 * @returns {number} TTL in minutes
 */
export const getTTLForAction = (action) => {
  return DEFAULT_TTLS[action] || DEFAULT_TTLS.DEFAULT;
};

/**
 * Normalizes cache key string
 */
const formatKey = (key) => {
  return key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
};

export const cache = {
  /**
   * Retrieves data from in-memory or localStorage cache if valid and unexpired
   * @param {string} key - Cache identifier key
   * @returns {any|null} Cached data object or null if cache miss/expired
   */
  get: (key) => {
    const fullKey = formatKey(key);
    const now = Date.now();

    // 1. Check high-performance in-memory cache
    if (memoryCache.has(fullKey)) {
      const entry = memoryCache.get(fullKey);
      if (entry.expiry > now) {
        return entry.data;
      }
      memoryCache.delete(fullKey);
    }

    // 2. Check persistent localStorage cache
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(fullKey);
        if (raw) {
          const item = JSON.parse(raw);
          if (item.expiry > now) {
            // Repopulate in-memory cache for fast subsequent access
            memoryCache.set(fullKey, item);
            return item.data;
          }
          // Expired - purge from storage
          localStorage.removeItem(fullKey);
        }
      }
    } catch (err) {
      console.warn('[Cache] Error reading from storage:', err);
    }

    return null;
  },

  /**
   * Saves data into in-memory and localStorage cache with specified TTL
   * @param {string} key - Cache key
   * @param {any} data - Data payload to cache
   * @param {number} [ttlMinutes] - Time to live in minutes
   */
  set: (key, data, ttlMinutes) => {
    const fullKey = formatKey(key);
    const ttl = (ttlMinutes || DEFAULT_TTLS.DEFAULT) * 60 * 1000;
    const cacheItem = {
      data: data,
      expiry: Date.now() + ttl,
      createdAt: new Date().toISOString()
    };

    memoryCache.set(fullKey, cacheItem);

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(fullKey, JSON.stringify(cacheItem));
      }
    } catch (err) {
      console.warn('[Cache] Error saving to storage:', err);
    }
  },

  /**
   * Removes a specific key from cache
   * @param {string} key - Cache key to delete
   */
  remove: (key) => {
    const fullKey = formatKey(key);
    memoryCache.delete(fullKey);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(fullKey);
      }
    } catch (err) {}
  },

  /**
   * Invalidates cache keys matching a specific action or pattern
   * @param {string} pattern - Prefix or action string to purge
   */
  invalidatePattern: (pattern) => {
    const searchStr = formatKey(pattern);

    // Memory cache purge
    for (const k of memoryCache.keys()) {
      if (k.includes(searchStr) || k.includes(pattern)) {
        memoryCache.delete(k);
      }
    }

    // LocalStorage purge
    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.includes(searchStr) || k.includes(pattern))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch (err) {
      console.warn('[Cache] Error invalidating pattern:', err);
    }
  },

  /**
   * Clears all HafA DIGITAL application cache entries
   */
  clearAll: () => {
    memoryCache.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch (err) {}
  }
};
