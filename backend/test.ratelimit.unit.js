const assert = require("node:assert");
const { createRateLimiter, RateLimiterStore } = require("./src/Presentation/middleware/rateLimiter");

async function runTests() {
    console.log("=== RateLimiter Middleware Unit Test Suite (NFR-SEC-05 / BR-09) ===");

    // Test 1: RateLimiterStore increments and resets
    {
        const store = new RateLimiterStore();
        const r1 = store.increment("test:ip1", 1000);
        assert.strictEqual(r1.count, 1, "Initial hit should be 1");
        const r2 = store.increment("test:ip1", 1000);
        assert.strictEqual(r2.count, 2, "Second hit should be 2");
        store.reset();
        const r3 = store.increment("test:ip1", 1000);
        assert.strictEqual(r3.count, 1, "Hit after reset should be 1");
        console.log("✓ Test 1: RateLimiterStore increments and resets passed");
    }

    // Test 2: RateLimiter allows requests under limit
    {
        const store = new RateLimiterStore();
        const limiter = createRateLimiter({
            windowMs: 5000,
            max: 3,
            store,
            enableInTests: true,
        });

        const headers = {};
        const req = {
            headers: {},
            ip: "192.168.1.10",
        };
        const res = {
            setHeader: (k, v) => { headers[k] = v; },
            status: () => res,
            json: () => {},
        };

        let nextCalled = false;
        limiter(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true, "next() should be called under limit");
        assert.strictEqual(headers["X-RateLimit-Limit"], 3, "Limit header should match");
        assert.strictEqual(headers["X-RateLimit-Remaining"], 2, "Remaining should be 2");
        console.log("✓ Test 2: RateLimiter allows requests under limit passed");
    }

    // Test 3: RateLimiter returns 429 when max limit is exceeded
    {
        const store = new RateLimiterStore();
        const limiter = createRateLimiter({
            windowMs: 5000,
            max: 2,
            store,
            enableInTests: true,
        });

        const req = {
            headers: {},
            ip: "10.0.0.1",
        };
        const headers = {};
        let responseStatus = null;
        let responseBody = null;

        const res = {
            setHeader: (k, v) => { headers[k] = v; },
            status: (s) => { responseStatus = s; return res; },
            json: (b) => { responseBody = b; },
        };

        // Call 1
        limiter(req, res, () => {});
        // Call 2
        limiter(req, res, () => {});
        // Call 3 (should block)
        let nextCalledOnThird = false;
        limiter(req, res, () => { nextCalledOnThird = true; });

        assert.strictEqual(nextCalledOnThird, false, "Third call should not call next()");
        assert.strictEqual(responseStatus, 429, "Status should be 429 Too Many Requests");
        assert.strictEqual(responseBody?.code, "ERR-RATE-LIMITED", "Error code should be ERR-RATE-LIMITED");
        assert.strictEqual(responseBody?.success, false, "Success should be false");
        assert.ok(headers["Retry-After"] !== undefined, "Retry-After header should be set");
        console.log("✓ Test 3: RateLimiter returns 429 with ERR-RATE-LIMITED on limit exceeded passed");
    }

    // Test 4: RateLimiter isolates different source IPs
    {
        const store = new RateLimiterStore();
        const limiter = createRateLimiter({
            windowMs: 5000,
            max: 1,
            store,
            enableInTests: true,
        });

        const reqA = { headers: {}, ip: "192.168.1.1" };
        const reqB = { headers: {}, ip: "192.168.1.2" };
        const res = { setHeader: () => {}, status: () => res, json: () => {} };

        let passedA = false;
        limiter(reqA, res, () => { passedA = true; });
        assert.strictEqual(passedA, true, "First IP should pass");

        let passedB = false;
        limiter(reqB, res, () => { passedB = true; });
        assert.strictEqual(passedB, true, "Second distinct IP should also pass");

        let blockedA = false;
        let statusA = null;
        const resA = {
            setHeader: () => {},
            status: (s) => { statusA = s; return resA; },
            json: () => { blockedA = true; },
        };
        limiter(reqA, resA, () => {});
        assert.strictEqual(blockedA, true, "Repeated request from first IP should be blocked");
        assert.strictEqual(statusA, 429, "Status should be 429");
        console.log("✓ Test 4: RateLimiter isolates different source IPs passed");
    }

    console.log("ALL 4 RateLimiter unit tests passed successfully!");
}

runTests().catch((err) => {
    console.error("RateLimiter test failure:", err);
    process.exit(1);
});
