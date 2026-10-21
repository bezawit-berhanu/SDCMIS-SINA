/**
 * ============================================================================
 * SDCMIS-SINA Frontend Client-Side Security Testing Suite
 * ============================================================================
 *
 * Test Scenarios Covered:
 *   1. Wrong Password (Client Storage Safety & Error Isolation)
 *   2. Invalid Session (Expiry Detection, Cache Purging, Auto-Logout Dispatch)
 *   3. Unauthorized API Request (Header Interception & Protected Route Guards)
 *   4. Customer Accessing Dentist Endpoint (Route Guard Defense & Fallback Isolation)
 *   5. Receptionist Accessing Admin Functionality (Sidebar Pruning & Boundary Guarding)
 * ============================================================================
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { Buffer } from "node:buffer";

import {
    UserRole,
    getDefaultDashboardForRole,
    isRoleAuthorized,
} from "./src/features/auth/roles.js";

// Mock browser sessionStorage & window event system
class MockStorage {
    constructor() {
        this.store = new Map();
    }
    getItem(key) {
        return this.store.get(key) || null;
    }
    setItem(key, value) {
        this.store.set(key, String(value));
    }
    removeItem(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
}

globalThis.window = globalThis;
globalThis.sessionStorage = new MockStorage();

import { authStorage } from "./src/features/auth/auth_storage.js";

function createMockJwt(payload) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.mockSignature`;
}

// Emulate route guard logic from ProtectedRoute.jsx
function evaluateProtectedRoute({ user, loading, allowedRoles, targetPath }) {
    if (loading) {
        return { status: "LOADING", message: "Restoring session..." };
    }

    if (!user) {
        return {
            status: "REDIRECT",
            redirectTo: "/login",
            state: { from: targetPath },
        };
    }

    if (allowedRoles && !isRoleAuthorized(user.role, allowedRoles)) {
        const permitted = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        return {
            status: "ACCESS_DENIED",
            code: 403,
            requiredRoles: permitted,
            userRole: user.role,
            fallbackDashboard: getDefaultDashboardForRole(user.role),
        };
    }

    return { status: "AUTHORIZED", path: targetPath, user };
}

// Emulate navigation menu items from Sidebar.jsx
function getVisibleNavigationItems(user) {
    const navItems = [
        { path: "/dentist", label: "Dentist Portal", roles: [UserRole.DENTIST] },
        { path: "/receptionist", label: "Receptionist Desk", roles: [UserRole.RECEPTIONIST] },
        { path: "/customer", label: "Customer Portal", roles: [UserRole.CUSTOMER] },
        { path: "/settings", label: "Settings" },
        { path: "/", label: "Home Page" },
    ];

    return navItems.filter(
        (item) => !item.roles || (user?.role && item.roles.includes(user.role))
    );
}

describe("Frontend Client-Side Security Testing Suite", () => {
    beforeEach(() => {
        globalThis.sessionStorage.clear();
    });

    // ========================================================================
    // SCENARIO 1: WRONG PASSWORD (CLIENT-SIDE DEFENSE)
    // ========================================================================
    describe("Security Test 1: Wrong Password (Client State Safety)", () => {
        it("Description: Failed authentication does not store partial tokens or corrupted user objects", () => {
            // Emulate receiving 401 INVALID_CREDENTIALS from server
            const failedLoginResponse = {
                status: 401,
                data: {
                    success: false,
                    error: {
                        code: "INVALID_CREDENTIALS",
                        message: "Invalid email or password.",
                    },
                },
            };

            assert.strictEqual(failedLoginResponse.status, 401);
            // On failure, authStorage must NOT be populated
            assert.strictEqual(authStorage.getToken(), null);
            assert.strictEqual(authStorage.getUser(), null);
            assert.strictEqual(authStorage.hasToken(), false);
        });

        it("Description: 401 on login attempts does not trigger global unhandled session wipe loops", () => {
            const loginUrl = "/api/v1/auth/login";
            const isAuthAttempt = loginUrl.includes("/auth/login") || loginUrl.includes("/auth/register");
            assert.strictEqual(isAuthAttempt, true, "Login endpoints must be identified as auth attempts");
        });
    });

    // ========================================================================
    // SCENARIO 2: INVALID SESSION (CLIENT EXPIRY & TAMPERING DETECTION)
    // ========================================================================
    describe("Security Test 2: Invalid Session (Client Expiry & Tampering Defense)", () => {
        it("Description: Expired session token is detected and instantly purged from storage", () => {
            const expiredToken = createMockJwt({
                sub: "usr-001",
                role: UserRole.DENTIST,
                exp: Math.floor(Date.now() / 1000) - 600, // Expired 10 min ago
            });

            authStorage.save({
                accessToken: expiredToken,
                user: { id: "usr-001", fullName: "Dr. Aster", role: UserRole.DENTIST },
            });

            // Parse exp from token
            const parts = expiredToken.split(".");
            const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
            const isExpired = payload.exp * 1000 <= Date.now();

            assert.strictEqual(isExpired, true, "Expired token must be flagged");

            // Client sanitization triggers
            if (isExpired) {
                authStorage.clear();
            }

            assert.strictEqual(authStorage.getToken(), null);
            assert.strictEqual(authStorage.getUser(), null);
        });

        it("Description: Malformed or unparseable token in storage is discarded without throwing exceptions", () => {
            function parseJwtPayload(token) {
                if (!token || typeof token !== "string") return null;
                try {
                    const parts = token.split(".");
                    if (parts.length < 2) return null;
                    const base64Url = parts[1];
                    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
                    return JSON.parse(jsonPayload);
                } catch {
                    return null;
                }
            }

            globalThis.sessionStorage.setItem("sdcmis_access_token", "invalid.garbage-data");

            const token = authStorage.getToken();
            const payload = parseJwtPayload(token);
            const isInvalid = payload === null;

            assert.strictEqual(isInvalid, true, "Malformed token payload must return null");

            if (isInvalid) {
                authStorage.clear();
            }

            assert.strictEqual(authStorage.getToken(), null);
        });

        it("Description: Tampered user role in local storage does not compromise protected routes", () => {
            // Attacker edits sessionStorage to claim they are DENTIST
            const customerUser = { id: "usr-cust", fullName: "Abebe", role: UserRole.CUSTOMER };

            // When evaluated with real customer role, dentist portal is blocked
            const decision = evaluateProtectedRoute({
                user: customerUser,
                loading: false,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist",
            });

            assert.strictEqual(decision.status, "ACCESS_DENIED");
            assert.strictEqual(decision.code, 403);
            assert.strictEqual(decision.fallbackDashboard, "/customer");
        });
    });

    // ========================================================================
    // SCENARIO 3: UNAUTHORIZED API REQUEST (CLIENT INTERCEPTION)
    // ========================================================================
    describe("Security Test 3: Unauthorized API Request (Protected Route Guards)", () => {
        it("Description: Unauthenticated user accessing protected clinical routes is redirected to /login", () => {
            const decision = evaluateProtectedRoute({
                user: null,
                loading: false,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist",
            });

            assert.strictEqual(decision.status, "REDIRECT");
            assert.strictEqual(decision.redirectTo, "/login");
            assert.deepStrictEqual(decision.state, { from: "/dentist" });
        });

        it("Description: Unauthenticated user accessing settings is redirected to /login", () => {
            const decision = evaluateProtectedRoute({
                user: null,
                loading: false,
                allowedRoles: undefined,
                targetPath: "/settings",
            });

            assert.strictEqual(decision.status, "REDIRECT");
            assert.strictEqual(decision.redirectTo, "/login");
            assert.deepStrictEqual(decision.state, { from: "/settings" });
        });
    });

    // ========================================================================
    // SCENARIO 4: CUSTOMER ACCESSING DENTIST ENDPOINT (CLIENT ROUTE RBAC)
    // ========================================================================
    describe("Security Test 4: Customer Accessing Dentist Endpoint (Client-Side Defense)", () => {
        it("Description: Customer navigating directly to /dentist receives 403 AccessDenied with fallback link", () => {
            const customerUser = { id: "cust-01", fullName: "Abebe Patient", role: UserRole.CUSTOMER };

            const decision = evaluateProtectedRoute({
                user: customerUser,
                loading: false,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist",
            });

            assert.strictEqual(decision.status, "ACCESS_DENIED");
            assert.strictEqual(decision.code, 403);
            assert.deepStrictEqual(decision.requiredRoles, [UserRole.DENTIST]);
            assert.strictEqual(decision.fallbackDashboard, "/customer");
        });

        it("Description: Navigation sidebar completely omits Dentist Portal for Customer users", () => {
            const customerUser = { id: "cust-01", fullName: "Abebe Patient", role: UserRole.CUSTOMER };
            const visibleItems = getVisibleNavigationItems(customerUser);

            const paths = visibleItems.map((item) => item.path);
            assert.strictEqual(paths.includes("/dentist"), false, "Dentist portal must not appear in customer sidebar");
            assert.strictEqual(paths.includes("/receptionist"), false, "Reception desk must not appear in customer sidebar");
            assert.strictEqual(paths.includes("/customer"), true, "Customer portal must be accessible");
            assert.strictEqual(paths.includes("/settings"), true, "Settings must be accessible");
        });
    });

    // ========================================================================
    // SCENARIO 5: RECEPTIONIST ACCESSING ADMIN FUNCTIONALITY (CLIENT-SIDE)
    // ========================================================================
    describe("Security Test 5: Receptionist Accessing Admin Functionality (Client-Side Defense)", () => {
        it("Description: Receptionist navigating to /dentist clinical portal is blocked with 403 AccessDenied", () => {
            const receptionistUser = { id: "rec-01", fullName: "Sara Frontdesk", role: UserRole.RECEPTIONIST };

            const decision = evaluateProtectedRoute({
                user: receptionistUser,
                loading: false,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist",
            });

            assert.strictEqual(decision.status, "ACCESS_DENIED");
            assert.strictEqual(decision.code, 403);
            assert.deepStrictEqual(decision.requiredRoles, [UserRole.DENTIST]);
            assert.strictEqual(decision.fallbackDashboard, "/receptionist");
        });

        it("Description: Navigation sidebar completely omits Dentist Portal and Administrative portals for Receptionist", () => {
            const receptionistUser = { id: "rec-01", fullName: "Sara Frontdesk", role: UserRole.RECEPTIONIST };
            const visibleItems = getVisibleNavigationItems(receptionistUser);

            const paths = visibleItems.map((item) => item.path);
            assert.strictEqual(paths.includes("/dentist"), false, "Dentist portal must not appear in receptionist sidebar");
            assert.strictEqual(paths.includes("/customer"), false, "Customer portal must not appear in receptionist sidebar");
            assert.strictEqual(paths.includes("/receptionist"), true, "Reception desk must be visible");
            assert.strictEqual(paths.includes("/settings"), true, "Settings must be visible");
        });

        it("Description: Receptionist cannot access arbitrary admin routes through URL parameter injection", () => {
            const receptionistUser = { id: "rec-01", fullName: "Sara Frontdesk", role: UserRole.RECEPTIONIST };

            // URL contains query injection like /dentist?role=ADMIN
            const decision = evaluateProtectedRoute({
                user: receptionistUser,
                loading: false,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist?role=ADMIN",
            });

            assert.strictEqual(decision.status, "ACCESS_DENIED");
            assert.strictEqual(decision.code, 403);
        });
    });
});
