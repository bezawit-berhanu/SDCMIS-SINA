const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const express = require("express");

// Mock prisma before requiring container/app to prevent remote TiDB connection in tests
const mockPrisma = {
    user: {
        findFirst: async () => null,
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

const authorize = require("./src/Presentation/middleware/authorize");
const authenticate = require("./src/Presentation/middleware/auth");
const errorHandler = require("./src/Presentation/middleware/errorHandler");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const container = require("./src/container/container");
const GetCurrentUser = require("./src/application/auth/GetCurrentUser");
const { UserRole, RecordStatus } = require("./src/domain/enums/enum");

describe("RBAC Authorization Middleware (Unit Tests)", () => {
    it("returns 401 UNAUTHENTICATED when req.user is missing", (t, done) => {
        const middleware = authorize(UserRole.DENTIST);
        const req = {};
        const res = {};

        middleware(req, res, (err) => {
            assert.ok(err, "Expected an error to be passed to next()");
            assert.strictEqual(err.statusCode, 401);
            assert.strictEqual(err.code, "UNAUTHENTICATED");
            assert.strictEqual(err.message, "Authentication is required.");
            done();
        });
    });

    it("allows access when user has the exact permitted role", (t, done) => {
        const middleware = authorize(UserRole.DENTIST);
        const req = { user: { id: "1", role: UserRole.DENTIST } };
        const res = {};

        middleware(req, res, (err) => {
            assert.strictEqual(err, undefined, "Expected next() with no errors");
            done();
        });
    });

    it("allows access when user matches one of multiple permitted roles passed as arguments", (t, done) => {
        const middleware = authorize(UserRole.DENTIST, UserRole.RECEPTIONIST);
        const req = { user: { id: "2", role: UserRole.RECEPTIONIST } };
        const res = {};

        middleware(req, res, (err) => {
            assert.strictEqual(err, undefined, "Expected next() with no errors");
            done();
        });
    });

    it("allows access when roles are passed as an array", (t, done) => {
        const middleware = authorize([UserRole.DENTIST, UserRole.RECEPTIONIST]);
        const req = { user: { id: "3", role: UserRole.DENTIST } };
        const res = {};

        middleware(req, res, (err) => {
            assert.strictEqual(err, undefined, "Expected next() with no errors");
            done();
        });
    });

    it("returns 403 FORBIDDEN when authenticated user has an unpermitted role", (t, done) => {
        const middleware = authorize(UserRole.DENTIST);
        const req = { user: { id: "4", role: UserRole.CUSTOMER } };
        const res = {};

        middleware(req, res, (err) => {
            assert.ok(err, "Expected error for unpermitted role");
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, "FORBIDDEN");
            assert.strictEqual(err.message, "You do not have permission to perform this action.");
            done();
        });
    });

    it("returns 403 FORBIDDEN when req.user.role is null, undefined, or missing", (t, done) => {
        const middleware = authorize(UserRole.DENTIST);
        const req = { user: { id: "5" } };
        const res = {};

        middleware(req, res, (err) => {
            assert.ok(err);
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, "FORBIDDEN");
            done();
        });
    });

    it("returns 403 FORBIDDEN when req.user.role is an invalid or unrecognized string", (t, done) => {
        const middleware = authorize(UserRole.DENTIST, UserRole.RECEPTIONIST);
        const req = { user: { id: "6", role: "SUPER_ADMIN" } };
        const res = {};

        middleware(req, res, (err) => {
            assert.ok(err);
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, "FORBIDDEN");
            done();
        });
    });

    it("fails closed (403) when no allowed roles are configured", (t, done) => {
        const middleware = authorize();
        const req = { user: { id: "7", role: UserRole.DENTIST } };
        const res = {};

        middleware(req, res, (err) => {
            assert.ok(err);
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, "FORBIDDEN");
            done();
        });
    });

    it("ignores client body and query parameters attempting role elevation", (t, done) => {
        const middleware = authorize(UserRole.DENTIST);
        const req = {
            user: { id: "8", role: UserRole.CUSTOMER },
            body: { role: UserRole.DENTIST },
            query: { role: UserRole.DENTIST },
            params: { role: UserRole.DENTIST },
        };
        const res = {};

        middleware(req, res, (err) => {
            assert.ok(err, "Must deny access even if body/query specifies an authorized role");
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.code, "FORBIDDEN");
            done();
        });
    });
});

describe("RBAC HTTP Integration Tests with Express", () => {
    let server;
    let baseUrl;
    let originalGetCurrentUser;

    const testUsers = {
        dentist: {
            id: "user-dentist-id",
            fullname: "Dr. Dentist",
            email: "dentist@example.com",
            role: UserRole.DENTIST,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        },
        receptionist: {
            id: "user-receptionist-id",
            fullname: "Reception Staff",
            email: "reception@example.com",
            role: UserRole.RECEPTIONIST,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        },
        customer: {
            id: "user-customer-id",
            fullname: "Patient Customer",
            email: "customer@example.com",
            role: UserRole.CUSTOMER,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        },
    };

    let dentistToken;
    let receptionistToken;
    let customerToken;

    before(async () => {
        originalGetCurrentUser = container.getCurrentUser;

        const mockRepo = {
            async findActiveById(id) {
                const found = Object.values(testUsers).find((u) => u.id === id);
                if (found && found.recordStatus === RecordStatus.ACTIVE && !found.deletedAt) {
                    return found;
                }
                return null;
            },
        };

        container.getCurrentUser = new GetCurrentUser({
            userRepository: mockRepo,
        });

        dentistToken = tokenService.signAccessToken(testUsers.dentist);
        receptionistToken = tokenService.signAccessToken(testUsers.receptionist);
        customerToken = tokenService.signAccessToken(testUsers.customer);

        // Build a dedicated Express test app to verify end-to-end routing with auth and authorize
        const testApp = express();
        testApp.use(express.json());

        // Public route
        testApp.get("/api/test/public", (req, res) => {
            res.status(200).json({ success: true, message: "public-ok" });
        });

        // Any authenticated user
        testApp.get("/api/test/profile", authenticate, (req, res) => {
            res.status(200).json({ success: true, user: req.user });
        });

        // Dentist only
        testApp.get(
            "/api/test/clinical-records",
            authenticate,
            authorize(UserRole.DENTIST),
            (req, res) => {
                res.status(200).json({ success: true, message: "clinical-records-ok" });
            }
        );

        // Staff only (Dentist or Receptionist)
        testApp.get(
            "/api/test/appointments",
            authenticate,
            authorize(UserRole.DENTIST, UserRole.RECEPTIONIST),
            (req, res) => {
                res.status(200).json({ success: true, message: "appointments-ok" });
            }
        );

        // Customer only
        testApp.get(
            "/api/test/my-portal",
            authenticate,
            authorize(UserRole.CUSTOMER),
            (req, res) => {
                res.status(200).json({ success: true, message: "portal-ok" });
            }
        );

        testApp.use(errorHandler);

        await new Promise((resolve) => {
            server = http.createServer(testApp);
            server.listen(0, "127.0.0.1", () => {
                const address = server.address();
                baseUrl = `http://127.0.0.1:${address.port}`;
                resolve();
            });
        });
    });

    after(async () => {
        if (originalGetCurrentUser) container.getCurrentUser = originalGetCurrentUser;
        if (server && server.listening) {
            server.closeAllConnections?.();
            await new Promise((resolve) => server.close(resolve));
        }
    });

    it("public route is accessible without token", async () => {
        const res = await fetch(`${baseUrl}/api/test/public`);
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
    });

    it("returns 401 when accessing protected endpoint without token", async () => {
        const res = await fetch(`${baseUrl}/api/test/clinical-records`);
        assert.strictEqual(res.status, 401);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error.code, "UNAUTHENTICATED");
    });

    it("returns 403 when CUSTOMER attempts to access DENTIST endpoint", async () => {
        const res = await fetch(`${baseUrl}/api/test/clinical-records`, {
            headers: { Authorization: `Bearer ${customerToken}` },
        });
        assert.strictEqual(res.status, 403);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error.code, "FORBIDDEN");
        assert.strictEqual(data.error.message, "You do not have permission to perform this action.");
    });

    it("returns 403 when RECEPTIONIST attempts to access DENTIST endpoint", async () => {
        const res = await fetch(`${baseUrl}/api/test/clinical-records`, {
            headers: { Authorization: `Bearer ${receptionistToken}` },
        });
        assert.strictEqual(res.status, 403);
        const data = await res.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.error.code, "FORBIDDEN");
    });

    it("grants access (200) when DENTIST accesses DENTIST endpoint", async () => {
        const res = await fetch(`${baseUrl}/api/test/clinical-records`, {
            headers: { Authorization: `Bearer ${dentistToken}` },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, "clinical-records-ok");
    });

    it("supports multiple permitted roles: grants access to both DENTIST and RECEPTIONIST", async () => {
        const dentistRes = await fetch(`${baseUrl}/api/test/appointments`, {
            headers: { Authorization: `Bearer ${dentistToken}` },
        });
        assert.strictEqual(dentistRes.status, 200);

        const receptionRes = await fetch(`${baseUrl}/api/test/appointments`, {
            headers: { Authorization: `Bearer ${receptionistToken}` },
        });
        assert.strictEqual(receptionRes.status, 200);

        const customerRes = await fetch(`${baseUrl}/api/test/appointments`, {
            headers: { Authorization: `Bearer ${customerToken}` },
        });
        assert.strictEqual(customerRes.status, 403);
    });

    it("grants CUSTOMER access to CUSTOMER-only endpoint", async () => {
        const res = await fetch(`${baseUrl}/api/test/my-portal`, {
            headers: { Authorization: `Bearer ${customerToken}` },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
    });

    it("prevents privilege escalation when client passes role in body or query", async () => {
        // Customer attempts to access dentist endpoint by injecting role in body and query
        const res = await fetch(`${baseUrl}/api/test/clinical-records?role=DENTIST`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${customerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: UserRole.DENTIST }),
        });
        // Since test endpoint was defined with GET, let's verify with GET as well
        const getRes = await fetch(`${baseUrl}/api/test/clinical-records?role=DENTIST`, {
            headers: { Authorization: `Bearer ${customerToken}` },
        });
        assert.strictEqual(getRes.status, 403);
        const data = await getRes.json();
        assert.strictEqual(data.error.code, "FORBIDDEN");
    });

    it("generic authenticated endpoint /api/test/profile works for all authenticated roles", async () => {
        for (const [roleName, token] of [
            ["DENTIST", dentistToken],
            ["RECEPTIONIST", receptionistToken],
            ["CUSTOMER", customerToken],
        ]) {
            const res = await fetch(`${baseUrl}/api/test/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            assert.strictEqual(res.status, 200, `Failed for role ${roleName}`);
            const data = await res.json();
            assert.strictEqual(data.user.role, roleName);
        }
    });
});
