/**
 * In-Memory High-Performance Cache Service
 * Implements SRS Section 3.1 & NFR-PERF-01:
 * "Data Layer (relational database plus, optionally, a lightweight cache for dashboard aggregates)"
 * Features: TTL expiration, LRU eviction, pattern invalidation, hit/miss metrics.
 */

class CacheService {
    constructor(options = {}) {
        this.maxEntries = options.maxEntries || 1000;
        this.defaultTtlMs = options.defaultTtlMs || 60000; // 1 minute default
        this.store = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletions: 0,
        };

        // Periodic sweeper for expired keys
        this.sweepInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, item] of this.store.entries()) {
                if (item.expiresAt <= now) {
                    this.store.delete(key);
                }
            }
        }, 30000);

        if (this.sweepInterval.unref) {
            this.sweepInterval.unref();
        }
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) {
            this.stats.misses += 1;
            return null;
        }

        if (item.expiresAt <= Date.now()) {
            this.store.delete(key);
            this.stats.misses += 1;
            return null;
        }

        // Re-insert to maintain LRU recency
        this.store.delete(key);
        this.store.set(key, item);
        this.stats.hits += 1;
        return item.value;
    }

    set(key, value, ttlMs) {
        const effectiveTtl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
        const expiresAt = Date.now() + effectiveTtl;

        // Evict oldest if reaching capacity
        if (this.store.size >= this.maxEntries && !this.store.has(key)) {
            const oldestKey = this.store.keys().next().value;
            if (oldestKey) {
                this.store.delete(oldestKey);
            }
        }

        this.store.set(key, { value, expiresAt });
        this.stats.sets += 1;
        return value;
    }

    del(key) {
        const deleted = this.store.delete(key);
        if (deleted) {
            this.stats.deletions += 1;
        }
        return deleted;
    }

    delPattern(pattern) {
        let count = 0;
        const regex = typeof pattern === "string" ? new RegExp(pattern.replace(/\*/g, ".*")) : pattern;

        for (const key of this.store.keys()) {
            if (regex.test(key)) {
                this.store.delete(key);
                count += 1;
            }
        }
        this.stats.deletions += count;
        return count;
    }

    async getOrSet(key, fetchFn, ttlMs) {
        const cached = this.get(key);
        if (cached !== null && cached !== undefined) {
            return cached;
        }

        const freshValue = await fetchFn();
        this.set(key, freshValue, ttlMs);
        return freshValue;
    }

    flush() {
        this.store.clear();
    }

    getStats() {
        return {
            ...this.stats,
            size: this.store.size,
            hitRate:
                this.stats.hits + this.stats.misses > 0
                    ? Number((this.stats.hits / (this.stats.hits + this.stats.misses)).toFixed(3))
                    : 0,
        };
    }
}

const cacheService = new CacheService();

module.exports = {
    CacheService,
    cacheService,
};
