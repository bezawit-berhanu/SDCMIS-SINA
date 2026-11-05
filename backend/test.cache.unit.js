const assert = require("node:assert");
const { CacheService, cacheService } = require("./src/Infrastructure/cache/cache.service");
const { CacheInvalidator } = require("./src/Infrastructure/cache/cache.invalidator");

async function runTests() {
    console.log("=== CacheService & CacheInvalidator Unit Test Suite (NFR-PERF-01 / BR-33) ===");

    // Test 1: Basic Get / Set and Hit/Miss stats
    {
        const cache = new CacheService({ defaultTtlMs: 5000 });
        assert.strictEqual(cache.get("missing_key"), null, "Missing key should return null");
        cache.set("user:1", { name: "Abebe" });
        const val = cache.get("user:1");
        assert.deepStrictEqual(val, { name: "Abebe" }, "Cached value should match");

        const stats = cache.getStats();
        assert.strictEqual(stats.hits, 1, "Should have 1 hit");
        assert.strictEqual(stats.misses, 1, "Should have 1 miss");
        assert.strictEqual(stats.sets, 1, "Should have 1 set");
        console.log("✓ Test 1: Basic Get/Set and Hit/Miss stats passed");
    }

    // Test 2: TTL Expiration
    {
        const cache = new CacheService({ defaultTtlMs: 20 });
        cache.set("short_lived", "data", 20);
        assert.strictEqual(cache.get("short_lived"), "data", "Should exist immediately");

        await new Promise((r) => setTimeout(r, 40));
        assert.strictEqual(cache.get("short_lived"), null, "Expired key should return null");
        console.log("✓ Test 2: TTL Expiration passed");
    }

    // Test 3: LRU Eviction on maxEntries
    {
        const cache = new CacheService({ maxEntries: 2, defaultTtlMs: 10000 });
        cache.set("key1", "val1");
        cache.set("key2", "val2");
        // Access key1 so key2 becomes least recently used
        cache.get("key1");
        // Add third key -> key2 should be evicted
        cache.set("key3", "val3");

        assert.strictEqual(cache.get("key1"), "val1", "key1 should remain (accessed recently)");
        assert.strictEqual(cache.get("key2"), null, "key2 should be evicted by LRU");
        assert.strictEqual(cache.get("key3"), "val3", "key3 should exist");
        console.log("✓ Test 3: LRU Eviction on capacity limit passed");
    }

    // Test 4: getOrSet fetchFn caching
    {
        const cache = new CacheService();
        let fetchCount = 0;
        const fetchFn = async () => {
            fetchCount += 1;
            return { timestamp: Date.now(), count: 42 };
        };

        const res1 = await cache.getOrSet("computed_metric", fetchFn, 5000);
        const res2 = await cache.getOrSet("computed_metric", fetchFn, 5000);

        assert.strictEqual(fetchCount, 1, "fetchFn should only be executed once");
        assert.deepStrictEqual(res1, res2, "Both calls should return identical cached data");
        console.log("✓ Test 4: getOrSet lazy caching passed");
    }

    // Test 5: Pattern-based deletion (delPattern)
    {
        const cache = new CacheService();
        cache.set("patient:1001", "recordA");
        cache.set("patient:1002", "recordB");
        cache.set("dentist:dashboard", "dash");

        const deletedCount = cache.delPattern("^patient:");
        assert.strictEqual(deletedCount, 2, "Should delete 2 patient keys");
        assert.strictEqual(cache.get("patient:1001"), null);
        assert.strictEqual(cache.get("patient:1002"), null);
        assert.strictEqual(cache.get("dentist:dashboard"), "dash", "dentist:dashboard should remain intact");
        console.log("✓ Test 5: Pattern-based deletion passed");
    }

    // Test 6: CacheInvalidator on domain mutations
    {
        cacheService.flush();
        cacheService.set("dentist:dashboard", "cached-dentist");
        cacheService.set("receptionist:dashboard", "cached-receptionist");
        cacheService.set("patient:pat-1", "cached-patient");
        cacheService.set("customer:dashboard:pat-1", "cached-customer");

        CacheInvalidator.onPaymentMutated("pat-1");

        assert.strictEqual(cacheService.get("dentist:dashboard"), null, "Dentist dashboard should be invalidated on payment");
        assert.strictEqual(cacheService.get("receptionist:dashboard"), null, "Receptionist dashboard should be invalidated on payment");
        assert.strictEqual(cacheService.get("customer:dashboard:pat-1"), null, "Customer dashboard should be invalidated on payment");
        console.log("✓ Test 6: CacheInvalidator domain event invalidation passed");
    }

    console.log("ALL 6 Cache unit tests passed successfully!");
}

runTests().catch((err) => {
    console.error("Cache test failure:", err);
    process.exit(1);
});
