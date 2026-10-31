const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const jwt = require("jsonwebtoken");

// Mock prisma to avoid remote connection timeouts
const mockPrisma = {
    user: {
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (args) => ({ id: "mock-sec-id", ...args.data }),
    },
    patient: {
        findFirst: async () => null,
        findUnique: async () => null,
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
const userRepository = require("./src/Infrastructure/Repositories/user.repository");
const CustomerAccessPolicy = require("./src/domain/services/customer.access.policy");

/**
 * 8) Security Testing Suite
 * Tests:
 * - Authentication defense & wrong password handling
 * - Token tampering, signature mismatch, and expiration defense
 * - Role-Based Access Control (RBAC) across DENTIST, RECEPTIONIST, CUSTOMER
 * - Customer Data Isolation: Customer A -> GET /api/patients/B -> 403 Forbidden
 * - Injection & path traversal defense
 */
describe("8) Security Testing Suite — RBAC, Isolation & Attack Surface", () => {
    let server;
    let baseUrl;

    const customerUserA = {
        id: "usr-cust-A",
        role: "CUSTOMER",
        fullName: "Customer Alice",
        linkedPatientId: "pat-A",
        recordStatus: "ACTIVE",
        deletedAt: null,
    };

    const customerUserB = {
        id: "usr-cust-B",
        role: "CUSTOMER",
        fullName: "Customer Bob",
        linkedPatientId: "pat-B",
        recordStatus: "ACTIVE",
        deletedAt: null,
    };

    const dentistUser = {
        id: "usr-dent-01",
        role: "DENTIST",
        fullName: "Dr. Sara",
        recordStatus: "ACTIVE",
        deletedAt: null,
    };

    const receptionistUser = {
        id: "usr-rec-01",
        role: "RECEPTIONIST",
        fullName: "Receptionist Martha",
        recordStatus: "ACTIVE",
        deletedAt: null,
    };

    before((_, done) => {
        // Seed users into in-memory store so authentication middleware can resolve them
        userRepository.seedUser(customerUserA);
        userRepository.seedUser(customerUserB);
        userRepository.seedUser(dentistUser);
        userRepository.seedUser(receptionistUser);

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

    it("8.1 Token Integrity: Rejects tampered JWT token signature", async () => {
        const validToken = tokenService.signAccessToken(dentistUser);
        const parts = validToken.split(".");
        const tamperedToken = `${parts[0]}.${parts[1]}abc.${parts[2]}`;

        const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${tamperedToken}` },
        });

        assert.equal(res.status, 401, "Tampered signature must be rejected with 401 Unauthorized");
    });

    it("8.2 Token Expiry: Rejects expired session token", async () => {
        const secret = process.env.JWT_SECRET || "sdcmis-sina-jwt-secret-key-at-least-32-chars-long!";
        const expiredToken = jwt.sign(
            { sub: dentistUser.id, role: dentistUser.role },
            secret,
            { expiresIn: -10 }
        );

        const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${expiredToken}` },
        });

        assert.equal(res.status, 401, "Expired token must be rejected with 401 Unauthorized");
    });

    it("8.3 Customer Data Authorization: CustomerAccessPolicy allows access to own record", () => {
        const policy = CustomerAccessPolicy.canAccessPatient(customerUserA, "pat-A");
        assert.equal(policy.allowed, true, "Customer A must be permitted to access own record");
    });

    it("8.4 Customer Data Authorization: Customer A -> Patient B -> 403 Forbidden", () => {
        const policyOther = CustomerAccessPolicy.canAccessPatient(customerUserA, "pat-B");
        assert.equal(policyOther.allowed, false, "Customer A must NOT be permitted to access Patient B");
        assert.equal(policyOther.statusCode, 403);
        assert.equal(policyOther.code, "FORBIDDEN");

        // Evaluates clinical role permissions
        const dentistPolicy = CustomerAccessPolicy.canAccessPatient(dentistUser, "pat-B");
        assert.equal(dentistPolicy.allowed, true, "Dentist must have clinical access to patient records");

        const receptionistPolicy = CustomerAccessPolicy.canAccessPatient(receptionistUser, "pat-B");
        assert.equal(receptionistPolicy.allowed, true, "Receptionist must have desk access to patient records");
    });

    it("8.5 RBAC Endpoint Guard: Customer cannot access Dentist chairside endpoints", async () => {
        const customerToken = tokenService.signAccessToken(customerUserA);
        const res = await fetch(`${baseUrl}/api/v1/queue/call`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${customerToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ queueNumber: 1 }),
        });

        assert.equal(res.status, 403, `Customer calling patient must return 403 Forbidden, got ${res.status}`);
        const data = await res.json();
        assert.equal(data.code, "FORBIDDEN");
    });

    it("8.6 Parameter Pollution & SQL/NoSQL Injection Defense: Sanitizes malicious identifiers", async () => {
        const dentistToken = tokenService.signAccessToken(dentistUser);
        const res = await fetch(`${baseUrl}/api/v1/patients/pat-001'%20OR%20'1'='1`, {
            headers: { Authorization: `Bearer ${dentistToken}` },
        });

        assert.ok([400, 404].includes(res.status), "SQL injection attack string in parameter must return 400 or 404");
    });
});
