/**
 * ============================================================================
 * SDCMIS-SINA Comprehensive Security Testing Suite
 * ============================================================================
 *
 * Test Scenarios Covered:
 *   1. Wrong Password (Authentication Defense)
 *   2. Invalid Session (Token Tampering, Expiration, Revocation)
 *   3. Unauthorized API Request (Missing/Malformed Authorization Headers)
 *   4. Customer Accessing Dentist Endpoint (Horizontal/Vertical RBAC Enforcement)
 *   5. Receptionist Accessing Admin Functionality (Least-Privilege & Administrative Boundaries)
 *
 * Each test suite documents:
 *   - Objective & Security Risk Analysis
 *   - Expected Status & Error Codes
 *   - Attack Vector Simulation (Parameter Pollution, Header Tampering, Injection)
 * ============================================================================
 */

const { describe, it, before, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const express = require("express");
const jwt = require("jsonwebtoken");

// 1. Mock Prisma to isolate unit/integration execution from remote database
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

const authenticate = require("./src/Presentation/middleware/auth");
const authorize = require("./src/Presentation/middleware/authorize");
const errorHandler = require("./src/Presentation/middleware/errorHandler");
const tokenService = require("./src/Infrastructure/authentication/token.service");
const passwordService = require("./src/Infrastructure/authentication/password.service");
const LoginUser = require("./src/application/auth/LoginUser");
const GetCurrentUser = require("./src/application/auth/GetCurrentUser");
const container = require("./src/container/container");
const env = require("./src/config/env");
const { UserRole, RecordStatus, ThemePreference } = require("./src/domain/enums/enum");

const ISSUER = "sdcmis-sina-api";
const AUDIENCE = "sdcmis-sina_client";

function createMockUserRepository(seedUsers = []) {
    const users = [...seedUsers];

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

describe("SDCMIS-SINA Security Testing Suite", () => {
    let server;
    let baseUrl;
    let samplePasswordHash;

    // Seeded accounts with varying roles & statuses
    let dentistUser;
    let receptionistUser;
    let customerUser;
    let inactiveUser;
    let deletedUser;

    let mockRepo;
    let loginUser;
    let originalGetCurrentUser;
    let originalLoginUser;

    let dentistToken;
    let receptionistToken;
    let customerToken;

    before(async () => {
        samplePasswordHash = await passwordService.hash("StrongP@ssw0rd2026!");

        dentistUser = {
            id: "usr-dentist-001",
            fullname: "Dr. Aster Sina",
            email: "dentist@sina-clinic.com",
            phone: "+251911000001",
            passwordHash: samplePasswordHash,
            role: UserRole.DENTIST,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        };

        receptionistUser = {
            id: "usr-reception-002",
            fullname: "Sara Frontdesk",
            email: "reception@sina-clinic.com",
            phone: "+251911000002",
            passwordHash: samplePasswordHash,
            role: UserRole.RECEPTIONIST,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        };

        customerUser = {
            id: "usr-customer-003",
            fullname: "Abebe Patient",
            email: "abebe@patient.com",
            phone: "+251911000003",
            passwordHash: samplePasswordHash,
            role: UserRole.CUSTOMER,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.ACTIVE,
            deletedAt: null,
        };

        inactiveUser = {
            id: "usr-inactive-004",
            fullname: "Inactive Staff",
            email: "disabled@sina-clinic.com",
            phone: "+251911000004",
            passwordHash: samplePasswordHash,
            role: UserRole.RECEPTIONIST,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.INACTIVE,
            deletedAt: null,
        };

        deletedUser = {
            id: "usr-deleted-005",
            fullname: "Terminated Account",
            email: "terminated@sina-clinic.com",
            phone: "+251911000005",
            passwordHash: samplePasswordHash,
            role: UserRole.CUSTOMER,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.DELETED,
            deletedAt: new Date(),
        };

        mockRepo = createMockUserRepository([
            dentistUser,
            receptionistUser,
            customerUser,
            inactiveUser,
            deletedUser,
        ]);

        loginUser = new LoginUser({
            userRepository: mockRepo,
            passwordService,
            tokenService,
        });

        originalGetCurrentUser = container.getCurrentUser;
        originalLoginUser = container.loginUser;

        container.getCurrentUser = new GetCurrentUser({ userRepository: mockRepo });
        container.loginUser = loginUser;

        dentistToken = tokenService.signAccessToken(dentistUser);
        receptionistToken = tokenService.signAccessToken(receptionistUser);
        customerToken = tokenService.signAccessToken(customerUser);

        // Build Express app for HTTP integration tests
        const testApp = express();
        testApp.use(express.json());

        // 1. Public Authentication Route
        testApp.post("/api/v1/auth/login", async (req, res, next) => {
            try {
                const result = await container.loginUser.execute(req.body);
                res.status(200).json({ success: true, data: result });
            } catch (err) {
                next(err);
            }
        });

        // 2. Authenticated Common Endpoint
        testApp.get("/api/v1/auth/me", authenticate, (req, res) => {
            res.status(200).json({ success: true, user: req.user });
        });

        // 3. Clinical Dentist-Only Endpoint
        testApp.get(
            "/api/v1/clinical/patient-records",
            authenticate,
            authorize(UserRole.DENTIST),
            (req, res) => {
                res.status(200).json({
                    success: true,
                    message: "Access granted to dental clinical records.",
                    records: [{ id: "rec-1", treatment: "Dental Crown Preparation" }],
                });
            }
        );

        testApp.post(
            "/api/v1/clinical/procedures",
            authenticate,
            authorize(UserRole.DENTIST),
            (req, res) => {
                res.status(201).json({
                    success: true,
                    message: "Clinical procedure recorded successfully.",
                    procedureId: "proc-new-999",
                });
            }
        );

        // 4. Administrative-Only Endpoints (Strictly System Admin / Clinic Configuration)
        testApp.get(
            "/api/v1/admin/clinic-settings",
            authenticate,
            authorize("ADMIN"),
            (req, res) => {
                res.status(200).json({
                    success: true,
                    clinicName: "Sina Dental Clinic",
                    overpaymentPolicy: "REJECT",
                });
            }
        );

        testApp.get(
            "/api/v1/admin/audit-logs",
            authenticate,
            authorize("ADMIN"),
            (req, res) => {
                res.status(200).json({
                    success: true,
                    auditLogs: [{ action: "ROLE_UPDATE", actor: "admin" }],
                });
            }
        );

        testApp.patch(
            "/api/v1/admin/users/roles",
            authenticate,
            authorize("ADMIN"),
            (req, res) => {
                res.status(200).json({
                    success: true,
                    message: "User role modified successfully.",
                });
            }
        );

        // 5. Front Desk Receptionist-Permitted Operations (Appointments & Queue)
        testApp.get(
            "/api/v1/reception/queue",
            authenticate,
            authorize(UserRole.RECEPTIONIST, UserRole.DENTIST),
            (req, res) => {
                res.status(200).json({
                    success: true,
                    queue: [{ ticket: "Q-101", status: "WAITING" }],
                });
            }
        );

        // Centralized error handling
        testApp.use(errorHandler);

        await new Promise((resolve) => {
            server = http.createServer(testApp);
            server.listen(0, "127.0.0.1", () => {
                const addr = server.address();
                baseUrl = `http://127.0.0.1:${addr.port}`;
                resolve();
            });
        });
    });

    after(async () => {
        if (originalGetCurrentUser) container.getCurrentUser = originalGetCurrentUser;
        if (originalLoginUser) container.loginUser = originalLoginUser;
        if (server && server.listening) {
            server.closeAllConnections?.();
            await new Promise((resolve) => server.close(resolve));
        }
    });

    // ========================================================================
    // SCENARIO 1: WRONG PASSWORD
    // ========================================================================
    describe("Security Test 1: Wrong Password (Authentication Defense)", () => {
        it("Description: Rejects authentication attempt when password does not match hash", async () => {
            const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "dentist@sina-clinic.com",
                    password: "IncorrectPassword123!",
                }),
            });

            assert.strictEqual(res.status, 401, "Expected 401 Unauthorized for wrong password");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, "INVALID_CREDENTIALS");
            assert.strictEqual(data.error.message, "Invalid email or password.");
        });

        it("Description: Defends against account enumeration by returning identical generic message for nonexistent user and wrong password", async () => {
            // Case A: Valid user, wrong password
            const resWrongPw = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "dentist@sina-clinic.com",
                    password: "WrongPassword999!",
                }),
            });
            const dataWrongPw = await resWrongPw.json();

            // Case B: Nonexistent user
            const resNoUser = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "nonexistent.hacker@example.com",
                    password: "SomePassword123!",
                }),
            });
            const dataNoUser = await resNoUser.json();

            assert.strictEqual(resWrongPw.status, 401);
            assert.strictEqual(resNoUser.status, 401);
            assert.strictEqual(dataWrongPw.error.code, dataNoUser.error.code);
            assert.strictEqual(dataWrongPw.error.message, dataNoUser.error.message);
        });

        it("Description: Neutralizes SQL/NoSQL injection payloads in the password field safely", async () => {
            const injectionPayloads = [
                "' OR '1'='1",
                "' OR '1'='1' --",
                "admin' --",
                "\" or \"\"=\"",
            ];

            for (const payload of injectionPayloads) {
                const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: "dentist@sina-clinic.com",
                        password: payload,
                    }),
                });

                assert.strictEqual(res.status, 401, `Failed to reject injection payload: ${payload}`);
                const data = await res.json();
                assert.strictEqual(data.success, false);
                assert.strictEqual(data.error.code, "INVALID_CREDENTIALS");
            }
        });

        it("Description: Guarantees that internal password hashes are never leaked in error response or body", async () => {
            const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "dentist@sina-clinic.com",
                    password: "WrongPassword123!",
                }),
            });
            const rawBody = await res.text();

            assert.strictEqual(rawBody.includes(samplePasswordHash), false, "Password hash was leaked in HTTP body!");
            assert.strictEqual(rawBody.includes("passwordHash"), false);
            assert.strictEqual(rawBody.includes("$2a$"), false);
            assert.strictEqual(rawBody.includes("$2b$"), false);
        });
    });

    // ========================================================================
    // SCENARIO 2: INVALID SESSION
    // ========================================================================
    describe("Security Test 2: Invalid Session (Token Integrity, Expiry & Revocation)", () => {
        it("Description: Rejects tampered JWT payload with 401 INVALID_OR_EXPIRED_TOKEN", async () => {
            // Take valid customer token, mutate payload to role DENTIST, keep original signature
            const parts = customerToken.split(".");
            const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
            payload.role = UserRole.DENTIST; // Forgery attempt
            const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
            const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

            const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${forgedToken}` },
            });

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, "INVALID_OR_EXPIRED_TOKEN");
            assert.strictEqual(data.error.message, "Your session is invalid or has expired.");
        });

        it("Description: Rejects JWT signed with unauthorized / foreign secret key", async () => {
            const rogueToken = jwt.sign(
                { role: UserRole.DENTIST },
                "unauthorized-secret-key-attacker-999999",
                {
                    subject: dentistUser.id,
                    issuer: ISSUER,
                    audience: AUDIENCE,
                    expiresIn: "1h",
                    algorithm: "HS256",
                }
            );

            const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${rogueToken}` },
            });

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.error.code, "INVALID_OR_EXPIRED_TOKEN");
        });

        it("Description: Rejects expired JWT token with 401 INVALID_OR_EXPIRED_TOKEN", async () => {
            // Generate a token that expired 10 minutes ago
            const expiredToken = jwt.sign(
                { role: UserRole.DENTIST },
                env.JWT_ACCESS_SECRET,
                {
                    subject: dentistUser.id,
                    issuer: ISSUER,
                    audience: AUDIENCE,
                    expiresIn: "-10m",
                    algorithm: "HS256",
                }
            );

            const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${expiredToken}` },
            });

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.error.code, "INVALID_OR_EXPIRED_TOKEN");
            assert.strictEqual(data.error.message, "Your session is invalid or has expired.");
        });

        it("Description: Rejects token with 'none' algorithm header (CVE-2015-9235 defense)", async () => {
            const noneHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
            const noneBody = Buffer.from(JSON.stringify({
                sub: dentistUser.id,
                role: UserRole.DENTIST,
                iss: ISSUER,
                aud: AUDIENCE,
            })).toString("base64url");
            const noneAlgToken = `${noneHeader}.${noneBody}.`;

            const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${noneAlgToken}` },
            });

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.error.code, "INVALID_OR_EXPIRED_TOKEN");
        });

        it("Description: Rejects session when user account has been disabled or marked INACTIVE", async () => {
            const tokenForInactive = tokenService.signAccessToken(inactiveUser);

            const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${tokenForInactive}` },
            });

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.error.code, "UNAUTHENTICATED");
            assert.strictEqual(data.error.message, "User account is unavailable.");
        });

        it("Description: Rejects session when user account has been soft-deleted", async () => {
            const tokenForDeleted = tokenService.signAccessToken(deletedUser);

            const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                headers: { Authorization: `Bearer ${tokenForDeleted}` },
            });

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.error.code, "UNAUTHENTICATED");
            assert.strictEqual(data.error.message, "User account is unavailable.");
        });
    });

    // ========================================================================
    // SCENARIO 3: UNAUTHORIZED API REQUEST
    // ========================================================================
    describe("Security Test 3: Unauthorized API Request (Header & Protocol Defense)", () => {
        it("Description: Rejects request to protected endpoint when Authorization header is omitted entirely", async () => {
            const res = await fetch(`${baseUrl}/api/v1/auth/me`);

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, "UNAUTHENTICATED");
            assert.strictEqual(data.error.message, "Authentication is required.");
        });

        it("Description: Rejects non-Bearer schemes (e.g. Basic, Token, APIKey)", async () => {
            const nonBearerSchemes = [
                "Basic dXNlcm5hbWU6cGFzc3dvcmQ=",
                "Token abcdef123456",
                "ApiKey secret-key-value",
                "BearerCustom xyz",
            ];

            for (const headerValue of nonBearerSchemes) {
                const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                    headers: { Authorization: headerValue },
                });

                assert.strictEqual(res.status, 401, `Failed to reject scheme: ${headerValue}`);
                const data = await res.json();
                assert.strictEqual(data.error.code, "UNAUTHENTICATED");
                assert.strictEqual(data.error.message, "Authentication is required.");
            }
        });

        it("Description: Rejects empty or whitespace-only Bearer token", async () => {
            const emptyHeaders = [
                "Bearer",
                "Bearer ",
                "Bearer   ",
                "Bearer \t",
            ];

            for (const headerValue of emptyHeaders) {
                const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
                    headers: { Authorization: headerValue },
                });

                assert.strictEqual(res.status, 401);
                const data = await res.json();
                assert.strictEqual(data.error.code, "UNAUTHENTICATED");
            }
        });

        it("Description: Blocks request at middleware level, guaranteeing controller is never executed", async () => {
            // Test against clinical procedure creation endpoint
            const res = await fetch(`${baseUrl}/api/v1/clinical/procedures`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientId: "pat-1", description: "Malicious unauthenticated injection" }),
            });

            assert.strictEqual(res.status, 401);
            const data = await res.json();
            assert.strictEqual(data.error.code, "UNAUTHENTICATED");
            assert.strictEqual(data.procedureId, undefined);
        });
    });

    // ========================================================================
    // SCENARIO 4: CUSTOMER ACCESSING DENTIST ENDPOINT
    // ========================================================================
    describe("Security Test 4: Customer Accessing Dentist Endpoint (RBAC Isolation)", () => {
        it("Description: Customer with valid session receives 403 FORBIDDEN when calling dentist clinical endpoint", async () => {
            const res = await fetch(`${baseUrl}/api/v1/clinical/patient-records`, {
                headers: { Authorization: `Bearer ${customerToken}` },
            });

            assert.strictEqual(res.status, 403, "Customer must not access dentist clinical records");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, "FORBIDDEN");
            assert.strictEqual(data.error.message, "You do not have permission to perform this action.");
        });

        it("Description: Blocks customer attempting privilege escalation via query parameters (?role=DENTIST)", async () => {
            const res = await fetch(`${baseUrl}/api/v1/clinical/patient-records?role=DENTIST`, {
                headers: { Authorization: `Bearer ${customerToken}` },
            });

            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.error.code, "FORBIDDEN");
        });

        it("Description: Blocks customer attempting privilege escalation via request JSON body", async () => {
            const res = await fetch(`${baseUrl}/api/v1/clinical/procedures`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${customerToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    role: UserRole.DENTIST,
                    description: "Unauthorized cavity fill attempt",
                }),
            });

            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.error.code, "FORBIDDEN");
            assert.strictEqual(data.procedureId, undefined);
        });

        it("Description: Blocks customer attempting role spoofing via custom HTTP headers (X-User-Role / X-Role)", async () => {
            const res = await fetch(`${baseUrl}/api/v1/clinical/patient-records`, {
                headers: {
                    Authorization: `Bearer ${customerToken}`,
                    "X-User-Role": "DENTIST",
                    "X-Role": "DENTIST",
                },
            });

            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.error.code, "FORBIDDEN");
        });

        it("Description: Grants access (200 OK) when legitimate Dentist accesses Dentist endpoint", async () => {
            const res = await fetch(`${baseUrl}/api/v1/clinical/patient-records`, {
                headers: { Authorization: `Bearer ${dentistToken}` },
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.message, "Access granted to dental clinical records.");
            assert.ok(Array.isArray(data.records));
        });
    });

    // ========================================================================
    // SCENARIO 5: RECEPTIONIST ACCESSING ADMIN FUNCTIONALITY
    // ========================================================================
    describe("Security Test 5: Receptionist Accessing Admin Functionality (Least-Privilege Enforcement)", () => {
        it("Description: Receptionist receives 403 FORBIDDEN when attempting to access clinic configuration settings", async () => {
            const res = await fetch(`${baseUrl}/api/v1/admin/clinic-settings`, {
                headers: { Authorization: `Bearer ${receptionistToken}` },
            });

            assert.strictEqual(res.status, 403, "Receptionist must not access clinic administrative settings");
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, "FORBIDDEN");
            assert.strictEqual(data.error.message, "You do not have permission to perform this action.");
        });

        it("Description: Receptionist receives 403 FORBIDDEN when attempting to view system audit logs", async () => {
            const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
                headers: { Authorization: `Bearer ${receptionistToken}` },
            });

            assert.strictEqual(res.status, 403, "Receptionist must not inspect system audit logs");
            const data = await res.json();
            assert.strictEqual(data.error.code, "FORBIDDEN");
        });

        it("Description: Receptionist receives 403 FORBIDDEN when attempting to modify user roles / promote users", async () => {
            const res = await fetch(`${baseUrl}/api/v1/admin/users/roles`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${receptionistToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    targetUserId: customerUser.id,
                    newRole: UserRole.DENTIST,
                }),
            });

            assert.strictEqual(res.status, 403, "Receptionist must not escalate user roles");
            const data = await res.json();
            assert.strictEqual(data.error.code, "FORBIDDEN");
        });

        it("Description: Receptionist receives 403 FORBIDDEN when attempting to access Dentist clinical procedures", async () => {
            const res = await fetch(`${baseUrl}/api/v1/clinical/patient-records`, {
                headers: { Authorization: `Bearer ${receptionistToken}` },
            });

            assert.strictEqual(res.status, 403, "Receptionist must not access clinical records");
            const data = await res.json();
            assert.strictEqual(data.error.code, "FORBIDDEN");
        });

        it("Description: Blocks receptionist attempting admin privilege escalation via query and body parameters", async () => {
            const res = await fetch(`${baseUrl}/api/v1/admin/clinic-settings?role=ADMIN&isAdmin=true`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${receptionistToken}`,
                    "Content-Type": "application/json",
                },
            });

            assert.strictEqual(res.status, 403);
            const data = await res.json();
            assert.strictEqual(data.error.code, "FORBIDDEN");
        });

        it("Description: Allows Receptionist access to their permitted front-desk operations (e.g. queue management)", async () => {
            const res = await fetch(`${baseUrl}/api/v1/reception/queue`, {
                headers: { Authorization: `Bearer ${receptionistToken}` },
            });

            assert.strictEqual(res.status, 200, "Receptionist must have access to front-desk queue");
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(Array.isArray(data.queue));
        });
    });
});
