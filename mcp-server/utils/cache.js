/**
 * Cache Utility for MCP Server
 * In-memory cache with LRU eviction and TTL support
 * Pure Node.js implementation without external dependencies
 */

class Cache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour in milliseconds
    this.checkInterval = options.checkInterval || 60000; // 1 minute
    this.enableStats = options.enableStats !== false;
    
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0
    };
    
    // Start TTL checker
    this.startTTLChecker();
  }
  
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      if (this.enableStats) this.stats.misses++;
      return undefined;
    }
    
    // Check if expired
    if (item.expireAt && Date.now() > item.expireAt) {
      this.delete(key);
      if (this.enableStats) {
        this.stats.misses++;
        this.stats.expirations++;
      }
      return undefined;
    }
    
    // Update access order for LRU
    this.updateAccessOrder(key);
    
    if (this.enableStats) this.stats.hits++;
    return item.value;
  }
  
  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl) {
    const expireAt = ttl ? Date.now() + ttl : (this.defaultTTL ? Date.now() + this.defaultTTL : null);
    
    // Check if we need to evict
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      value,
      expireAt,
      createdAt: Date.now()
    });
    
    this.updateAccessOrder(key);
    
    if (this.enableStats) this.stats.sets++;
  }
  
  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if deleted, false if not found
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      // Remove from access order
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      
      if (this.enableStats) this.stats.deletes++;
    }
    
    return deleted;
  }
  
  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    
    if (this.enableStats) {
      this.stats.deletes += size;
    }
  }
  
  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if exists and not expired
   */
  has(key) {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    // Check if expired
    if (item.expireAt && Date.now() > item.expireAt) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get cache size
   * @returns {number} Number of items in cache
   */
  size() {
    return this.cache.size;
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      expirations: 0
    };
  }
  
  /**
   * Update access order for LRU
   * @private
   */
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    
    if (index > -1) {
      // Remove from current position
      this.accessOrder.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }
  
  /**
   * Evict least recently used item
   * @private
   */
  evictLRU() {
    if (this.accessOrder.length === 0) return;
    
    // Get least recently used key
    const lruKey = this.accessOrder.shift();
    this.cache.delete(lruKey);
    
    if (this.enableStats) this.stats.evictions++;
  }
  
  /**
   * Start TTL checker interval
   * @private
   */
  startTTLChecker() {
    this.ttlChecker = setInterval(() => {
      const now = Date.now();
      const keysToDelete = [];
      
      // Find expired entries
      for (const [key, item] of this.cache.entries()) {
        if (item.expireAt && now > item.expireAt) {
          keysToDelete.push(key);
        }
      }
      
      // Delete expired entries
      keysToDelete.forEach(key => {
        this.delete(key);
        if (this.enableStats) this.stats.expirations++;
      });
    }, this.checkInterval);
  }
  
  /**
   * Stop TTL checker interval
   */
  stopTTLChecker() {
    if (this.ttlChecker) {
      clearInterval(this.ttlChecker);
      this.ttlChecker = null;
    }
  }
  
  /**
   * Get all keys in cache
   * @returns {Array} Array of cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Get all values in cache
   * @returns {Array} Array of cache values
   */
  values() {
    const values = [];
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (!item.expireAt || now <= item.expireAt) {
        values.push(item.value);
      }
    }
    
    return values;
  }
  
  /**
   * Create cache middleware for Express
   * @param {Object} options - Middleware options
   * @returns {Function} Express middleware
   */
  middleware(options = {}) {
    const cache = this;
    const keyGenerator = options.keyGenerator || ((req) => `${req.method}:${req.originalUrl || req.url}`);
    const ttl = options.ttl || this.defaultTTL;
    const condition = options.condition || ((req) => req.method === 'GET');
    
    return (req, res, next) => {
      // Check if should cache
      if (!condition(req)) {
        return next();
      }
      
      const key = keyGenerator(req);
      const cachedResponse = cache.get(key);
      
      if (cachedResponse) {
        // Return cached response
        res.set(cachedResponse.headers);
        res.status(cachedResponse.statusCode);
        return res.send(cachedResponse.body);
      }
      
      // Capture response for caching
      const originalSend = res.send;
      res.send = function(body) {
        res.send = originalSend;
        
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(key, {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: body
          }, ttl);
        }
        
        return res.send(body);
      };
      
      next();
    };
  }
}

// Create singleton instance
const cache = new Cache({
  maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 3600000,
  checkInterval: parseInt(process.env.CACHE_CHECK_INTERVAL) || 60000
});

module.exports = cache;
module.exports.Cache = Cache;