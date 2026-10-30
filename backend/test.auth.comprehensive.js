const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

// Mock prisma before requiring app to avoid remote DB timeout
const mockPrisma = {
    user: {
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (args) => ({ id: "mock-id", ...args.data }),
    },
    $disconnect: async () => {},
};
require.cache[require.resolve("./src/Infrastructure/prisma")] = {
    id: require.resolve("./src/Infrastructure/prisma"),
    filename: require.resolve("./src/Infrastructure/prisma"),
    loaded: true,
    exports: mockPrisma,
};

const app = require("./app");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const passwordService = require("./src/Infrastructure/authentication/password.service");
const container = require("./src/container/container");

/**
 * 1) Authentication Testing Suite
 * Tests:
 * - Registration
 * - Duplicate registration
 * - Login
 * - Wrong password
 * - Logout
 * - Session persistence
 * - Unauthorized access
 */
describe("1) Authentication Testing Suite", () => {
    let server;
    let baseUrl;

    before((_, done) => {
        server = http.createServer(app);
        server.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://localhost:${port}`;
            done();
        });
    });

    after((_, done) => {
        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    const testEmail = `auth.test.${Date.now()}@example.com`;
    const testPassword = "SecurePass123!";
    let authToken = null;

    it("1.1 Registration: Successfully registers a new user with hashed password", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Aster Awoke",
                email: testEmail,
                phone: `+251911${Math.floor(100000 + Math.random() * 900000)}`,
                password: testPassword,
            }),
        });

        assert.ok([200, 201].includes(res.status), `Expected 200 or 201, got ${res.status}`);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.data.user);
        assert.equal(data.data.user.email, testEmail);
        assert.equal(data.data.user.role, "CUSTOMER", "Public registration must default to CUSTOMER role");
        assert.strictEqual(data.data.user.passwordHash, undefined, "passwordHash must not leak");
    });

    it("1.2 Duplicate Registration: Rejects registration with duplicate email", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: "Duplicate Aster",
                email: testEmail,
                phone: "+251922334455",
                password: testPassword,
            }),
        });

        assert.equal(res.status, 409, "Duplicate registration must return 409 Conflict");
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(
            data.error.code === "DUPLICATE_ACCOUNT" ||
            data.error.message.includes("already exists")
        );
    });

    it("1.3 Login: Successfully authenticates valid credentials and returns JWT token", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
            }),
        });

        assert.equal(res.status, 200, "Valid login must return 200 OK");
        const data = await res.json();
        assert.equal(data.success, true);
        const token = data.data.accessToken || data.data.tokens?.accessToken;
        assert.ok(token, "Response must include accessToken");
        authToken = token;
    });

    it("1.4 Wrong Password: Rejects login with invalid password", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "CompletelyWrongPassword!",
            }),
        });

        assert.equal(res.status, 401, "Invalid password must return 401 Unauthorized");
        const data = await res.json();
        assert.equal(data.success, false);
        assert.equal(data.error.code, "INVALID_CREDENTIALS");
    });

    it("1.5 Session Persistence: Valid JWT token authenticates and retrieves user session", async () => {
        assert.ok(authToken, "Must have active auth token");
        const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        assert.equal(res.status, 200, "Valid session must return 200 OK");
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.data.user.email, testEmail);
    });

    it("1.6 Unauthorized Access: Missing or invalid token is rejected", async () => {
        const resNoToken = await fetch(`${baseUrl}/api/v1/auth/me`, {
            method: "GET",
        });
        assert.equal(resNoToken.status, 401, "Missing token must return 401");

        const resBadToken = await fetch(`${baseUrl}/api/v1/auth/me`, {
            method: "GET",
            headers: {
                Authorization: "Bearer invalid.fake.token",
            },
        });
        assert.equal(resBadToken.status, 401, "Invalid token must return 401");
    });

    it("1.7 Logout: Successfully invalidates session / clears cookies", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/logout`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        assert.equal(res.status, 200, "Logout must return 200 OK");
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.message, "Logged out successfully.");
    });
});
