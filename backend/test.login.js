const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

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

const LoginUser = require("./src/application/auth/LoginUser");
const passwordService = require("./src/Infrastructure/authentication/password.service");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const container = require("./src/container/container");
const app = require("./app");
const { UserRole, RecordStatus, ThemePreference } = require("./src/domain/enums/enum");

function createMockUserRepository(initialUsers = []) {
    const users = [...initialUsers];

    return {
        users,
        async findByEmail(email) {
            if (!email) return null;
            const normalized = email.trim().toLowerCase();
            return users.find(
                (u) => u.email === normalized && u.recordStatus === RecordStatus.ACTIVE && !u.deletedAt
            ) || null;
        },
        async findByPhone(phone) {
            if (!phone) return null;
            const normalized = phone.trim();
            return users.find(
                (u) => u.phone === normalized && u.recordStatus === RecordStatus.ACTIVE && !u.deletedAt
            ) || null;
        },
        async findAnyByEmail(email) {
            if (!email) return null;
            const normalized = email.trim().toLowerCase();
            return users.find((u) => u.email === normalized) || null;
        },
        async findAnyByPhone(phone) {
            if (!phone) return null;
            const normalized = phone.trim();
            return users.find((u) => u.phone === normalized) || null;
        },
        async findActiveById(id) {
            if (!id) return null;
            return users.find(
                (u) => u.id === id && u.recordStatus === RecordStatus.ACTIVE && !u.deletedAt
            ) || null;
        },
    };
}

describe("LoginUser Use Case", () => {
    let mockRepo;
    let loginUser;
    let samplePasswordHash;

    before(async () => {
        samplePasswordHash = await passwordService.hash("ValidP@ssword123!");
    });

    beforeEach(() => {
        const seededUser = {
            id: "user-123",
            fullname: "Dr. Sarah Dentist",
            email: "sarah@example.com",
            phone: "+15551234567",
            passwordHash: samplePasswordHash,
            role: UserRole.DENTIST,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        };

        const inactiveUser = {
            id: "user-inactive",
            fullname: "Inactive User",
            email: "inactive@example.com",
            phone: "+15550000000",
            passwordHash: samplePasswordHash,
            role: UserRole.CUSTOMER,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.INACTIVE,
            deletedAt: null,
        };

        const deletedUser = {
            id: "user-deleted",
            fullname: "Deleted User",
            email: "deleted@example.com",
            phone: "+15559999999",
            passwordHash: samplePasswordHash,
            role: UserRole.CUSTOMER,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.DELETED,
            deletedAt: new Date(),
        };

        mockRepo = createMockUserRepository([seededUser, inactiveUser, deletedUser]);
        loginUser = new LoginUser({
            userRepository: mockRepo,
            passwordService,
            tokenService,
        });
    });

    describe("Successful Login", () => {
        it("authenticates active user by valid email and password", async () => {
            const res = await loginUser.execute({
                email: "sarah@example.com",
                password: "ValidP@ssword123!",
            });

            assert.ok(res.accessToken);
            assert.strictEqual(res.tokenType, "Bearer");
            assert.strictEqual(res.user.id, "user-123");
            assert.strictEqual(res.user.fullName, "Dr. Sarah Dentist");
            assert.strictEqual(res.user.email, "sarah@example.com");
            assert.strictEqual(res.user.role, UserRole.DENTIST);
            assert.strictEqual("passwordHash" in res.user, false);
            assert.strictEqual("password" in res.user, false);

            // Verify JWT
            const decoded = tokenService.verifyAccessToken(res.accessToken);
            assert.strictEqual(decoded.sub, "user-123");
            assert.strictEqual(decoded.role, UserRole.DENTIST);
        });

        it("authenticates active user by phone number as identifier", async () => {
            const res = await loginUser.execute({
                identifier: "+15551234567",
                password: "ValidP@ssword123!",
            });

            assert.ok(res.accessToken);
            assert.strictEqual(res.user.id, "user-123");
            assert.strictEqual(res.user.phone, "+15551234567");
        });

        it("authenticates active user by username alias", async () => {
            const res = await loginUser.execute({
                username: "sarah@example.com",
                password: "ValidP@ssword123!",
            });

            assert.ok(res.accessToken);
            assert.strictEqual(res.user.email, "sarah@example.com");
        });
    });

    describe("Invalid Credentials", () => {
        it("rejects non-existent email with 401 INVALID_CREDENTIALS", async () => {
            await assert.rejects(
                () => loginUser.execute({
                    email: "nonexistent@example.com",
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 401);
                    assert.strictEqual(err.code, "INVALID_CREDENTIALS");
                    assert.strictEqual(err.message, "Invalid email or password.");
                    return true;
                }
            );
        });

        it("rejects wrong password with 401 INVALID_CREDENTIALS", async () => {
            await assert.rejects(
                () => loginUser.execute({
                    email: "sarah@example.com",
                    password: "WrongPassword999!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 401);
                    assert.strictEqual(err.code, "INVALID_CREDENTIALS");
                    assert.strictEqual(err.message, "Invalid email or password.");
                    return true;
                }
            );
        });
    });

    describe("Input Validation", () => {
        it("rejects missing identifier/email with 400 VALIDATION_ERROR", async () => {
            await assert.rejects(
                () => loginUser.execute({
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.identifier);
                    return true;
                }
            );
        });

        it("rejects missing password with 400 VALIDATION_ERROR", async () => {
            await assert.rejects(
                () => loginUser.execute({
                    email: "sarah@example.com",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 400);
                    assert.strictEqual(err.code, "VALIDATION_ERROR");
                    assert.ok(err.fields.password);
                    return true;
                }
            );
        });
    });

    describe("Inactive and Deleted Accounts", () => {
        it("rejects login for inactive account with 401 ACCOUNT_INACTIVE", async () => {
            await assert.rejects(
                () => loginUser.execute({
                    email: "inactive@example.com",
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 401);
                    assert.strictEqual(err.code, "ACCOUNT_INACTIVE");
                    assert.strictEqual(err.message, "Account is inactive or disabled.");
                    return true;
                }
            );
        });

        it("rejects login for soft-deleted account with 401 ACCOUNT_INACTIVE", async () => {
            await assert.rejects(
                () => loginUser.execute({
                    email: "deleted@example.com",
                    password: "ValidP@ssword123!",
                }),
                (err) => {
                    assert.strictEqual(err.statusCode, 401);
                    assert.strictEqual(err.code, "ACCOUNT_INACTIVE");
                    return true;
                }
            );
        });
    });
});

describe("Express API HTTP Integration Tests for Login & Me", () => {
    let server;
    let baseUrl;
    let originalLoginUser;
    let originalGetCurrentUser;
    let samplePasswordHash;

    before(async () => {
        samplePasswordHash = await passwordService.hash("ValidP@ssword123!");
        originalLoginUser = container.loginUser;
        originalGetCurrentUser = container.getCurrentUser;

        await new Promise((resolve) => {
            server = http.createServer(app);
            server.listen(0, "127.0.0.1", () => {
                const address = server.address();
                baseUrl = `http://127.0.0.1:${address.port}`;
                resolve();
            });
        });
    });

    beforeEach(() => {
        const seededUser = {
            id: "user-http-1",
            fullname: "Http Patient",
            email: "http.patient@example.com",
            phone: "+15558887777",
            passwordHash: samplePasswordHash,
            role: UserRole.CUSTOMER,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        };

        const mockRepo = createMockUserRepository([seededUser]);

        container.loginUser = new LoginUser({
            userRepository: mockRepo,
            passwordService,
            tokenService,
        });

        const GetCurrentUser = require("./src/application/auth/GetCurrentUser");
        container.getCurrentUser = new GetCurrentUser({
            userRepository: mockRepo,
        });
    });

    after(async () => {
        if (originalLoginUser) container.loginUser = originalLoginUser;
        if (originalGetCurrentUser) container.getCurrentUser = originalGetCurrentUser;
        if (server && server.listening) {
            server.closeAllConnections?.();
            await new Promise((resolve) => server.close(resolve));
        }
    });

    it("POST /api/auth/login succeeds with valid credentials", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "http.patient@example.com",
                password: "ValidP@ssword123!",
            }),
        });

        assert.strictEqual(res.status, 200);
        const json = await res.json();
        assert.strictEqual(json.success, true);
        assert.ok(json.data.accessToken);
        assert.strictEqual(json.data.user.email, "http.patient@example.com");
        assert.strictEqual("passwordHash" in json.data.user, false);
    });

    it("POST /api/v1/auth/login succeeds with valid credentials (supporting v1 prefix)", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "http.patient@example.com",
                password: "ValidP@ssword123!",
            }),
        });

        assert.strictEqual(res.status, 200);
        const json = await res.json();
        assert.strictEqual(json.success, true);
        assert.ok(json.data.accessToken);
    });

    it("POST /api/auth/login returns 401 on wrong password", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "http.patient@example.com",
                password: "WrongPassword!",
            }),
        });

        assert.strictEqual(res.status, 401);
        const json = await res.json();
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.error.code, "INVALID_CREDENTIALS");
    });

    it("POST /api/auth/login returns 400 on missing fields", async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "",
                password: "",
            }),
        });

        assert.strictEqual(res.status, 400);
        const json = await res.json();
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.error.code, "VALIDATION_ERROR");
    });

    it("GET /api/v1/auth/me returns current user when valid Bearer token is provided", async () => {
        // First login to get a token
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "http.patient@example.com",
                password: "ValidP@ssword123!",
            }),
        });
        const loginJson = await loginRes.json();
        const token = loginJson.data.accessToken;

        // Call /me
        const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        assert.strictEqual(meRes.status, 200);
        const meJson = await meRes.json();
        assert.strictEqual(meJson.success, true);
        assert.strictEqual(meJson.data.user.id, "user-http-1");
        assert.strictEqual(meJson.data.user.email, "http.patient@example.com");
    });

    it("GET /api/v1/auth/me returns 401 UNAUTHENTICATED when Authorization header is missing", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
            method: "GET",
        });

        assert.strictEqual(res.status, 401);
        const json = await res.json();
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.error.code, "UNAUTHENTICATED");
    });

    it("GET /api/v1/auth/me returns 401 INVALID_OR_EXPIRED_TOKEN on forged/invalid token", async () => {
        const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
            method: "GET",
            headers: { Authorization: "Bearer forged.invalid.token" },
        });

        assert.strictEqual(res.status, 401);
        const json = await res.json();
        assert.strictEqual(json.success, false);
        assert.strictEqual(json.error.code, "INVALID_OR_EXPIRED_TOKEN");
    });
});
