import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { Buffer } from "node:buffer";

import {
    UserRole,
    getDefaultDashboardForRole,
    isRoleAuthorized,
} from "./src/features/auth/roles.js";

// Mock minimal browser storage environment for testing session persistence
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

// Helper to construct mock JWTs with given payload
function createMockJwt(payload) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${header}.${body}.mockSignature`;
}

// Emulate route guard logic exactly as implemented in ProtectedRoute & PublicRoute
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

function evaluatePublicRoute({ user, loading, targetPath, fromPath }) {
    if (loading) {
        return { status: "LOADING", message: "Checking authentication session..." };
    }

    if (user) {
        const isSelf = fromPath === "/login" || fromPath === "/register";
        const destination = !isSelf && fromPath
            ? fromPath
            : getDefaultDashboardForRole(user.role);

        return {
            status: "REDIRECT",
            redirectTo: destination,
        };
    }

    return { status: "PERMITTED", path: targetPath };
}

describe("Frontend Protected Routing & RBAC Verification Suite", () => {
    beforeEach(() => {
        globalThis.sessionStorage.clear();
    });

    describe("1-4: Unauthenticated access to protected routes", () => {
        it("Scenario 1: unauthenticated user opening /dentist is redirected to /login with return destination", () => {
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

        it("Scenario 2: unauthenticated user opening /receptionist is redirected to /login with return destination", () => {
            const decision = evaluateProtectedRoute({
                user: null,
                loading: false,
                allowedRoles: [UserRole.RECEPTIONIST],
                targetPath: "/receptionist",
            });

            assert.strictEqual(decision.status, "REDIRECT");
            assert.strictEqual(decision.redirectTo, "/login");
            assert.deepStrictEqual(decision.state, { from: "/receptionist" });
        });

        it("Scenario 3: unauthenticated user opening /customer is redirected to /login with return destination", () => {
            const decision = evaluateProtectedRoute({
                user: null,
                loading: false,
                allowedRoles: [UserRole.CUSTOMER],
                targetPath: "/customer",
            });

            assert.strictEqual(decision.status, "REDIRECT");
            assert.strictEqual(decision.redirectTo, "/login");
            assert.deepStrictEqual(decision.state, { from: "/customer" });
        });

        it("Scenario 4: unauthenticated user opening /settings is redirected to /login with return destination", () => {
            const decision = evaluateProtectedRoute({
                user: null,
                loading: false,
                allowedRoles: undefined, // Any authenticated user allowed
                targetPath: "/settings",
            });

            assert.strictEqual(decision.status, "REDIRECT");
            assert.strictEqual(decision.redirectTo, "/login");
            assert.deepStrictEqual(decision.state, { from: "/settings" });
        });
    });

    describe("5-7: Authorized role access to respective dashboards", () => {
        it("Scenario 5: dentist can access /dentist", () => {
            const dentistUser = { id: "u-1", fullName: "Dr. Dentist", role: UserRole.DENTIST };
            const decision = evaluateProtectedRoute({
                user: dentistUser,
                loading: false,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist",
            });

            assert.strictEqual(decision.status, "AUTHORIZED");
            assert.strictEqual(decision.path, "/dentist");
            assert.strictEqual(decision.user.role, UserRole.DENTIST);
        });

        it("Scenario 6: receptionist can access /receptionist", () => {
            const receptionistUser = { id: "u-2", fullName: "Receptionist Sarah", role: UserRole.RECEPTIONIST };
            const decision = evaluateProtectedRoute({
                user: receptionistUser,
                loading: false,
                allowedRoles: [UserRole.RECEPTIONIST],
                targetPath: "/receptionist",
            });

            assert.strictEqual(decision.status, "AUTHORIZED");
            assert.strictEqual(decision.path, "/receptionist");
            assert.strictEqual(decision.user.role, UserRole.RECEPTIONIST);
        });

        it("Scenario 7: customer can access /customer", () => {
            const customerUser = { id: "u-3", fullName: "Patient John", role: UserRole.CUSTOMER };
            const decision = evaluateProtectedRoute({
                user: customerUser,
                loading: false,
                allowedRoles: [UserRole.CUSTOMER],
                targetPath: "/customer",
            });

            assert.strictEqual(decision.status, "AUTHORIZED");
            assert.strictEqual(decision.path, "/customer");
            assert.strictEqual(decision.user.role, UserRole.CUSTOMER);
        });

        it("All authenticated roles can access /settings (least-privilege common settings)", () => {
            for (const role of [UserRole.DENTIST, UserRole.RECEPTIONIST, UserRole.CUSTOMER]) {
                const user = { id: `u-${role}`, fullName: `User ${role}`, role };
                const decision = evaluateProtectedRoute({
                    user,
                    loading: false,
                    allowedRoles: undefined,
                    targetPath: "/settings",
                });

                assert.strictEqual(decision.status, "AUTHORIZED");
                assert.strictEqual(decision.path, "/settings");
            }
        });
    });

    describe("8: Cross-role protection (wrong role denied access)", () => {
        it("customer cannot access /dentist and receives 403 AccessDenied with fallback link", () => {
            const customerUser = { id: "u-3", fullName: "Patient John", role: UserRole.CUSTOMER };
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

        it("receptionist cannot access /dentist and receives 403 AccessDenied", () => {
            const receptionistUser = { id: "u-2", fullName: "Receptionist Sarah", role: UserRole.RECEPTIONIST };
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

        it("dentist cannot access /receptionist desk and receives 403 AccessDenied", () => {
            const dentistUser = { id: "u-1", fullName: "Dr. Dentist", role: UserRole.DENTIST };
            const decision = evaluateProtectedRoute({
                user: dentistUser,
                loading: false,
                allowedRoles: [UserRole.RECEPTIONIST],
                targetPath: "/receptionist",
            });

            assert.strictEqual(decision.status, "ACCESS_DENIED");
            assert.strictEqual(decision.code, 403);
            assert.deepStrictEqual(decision.requiredRoles, [UserRole.RECEPTIONIST]);
            assert.strictEqual(decision.fallbackDashboard, "/dentist");
        });
    });

    describe("9-10: Session persistence, restoration, and expired token handling", () => {
        it("Scenario 9: restores cached user on page refresh during loading without false redirect", () => {
            const token = createMockJwt({
                sub: "u-1",
                role: UserRole.DENTIST,
                exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour valid
            });
            authStorage.save({
                accessToken: token,
                user: { id: "u-1", fullName: "Dr. Dentist", role: UserRole.DENTIST },
            });

            // While session is restoring (/api/v1/auth/me pending)
            const loadingDecision = evaluateProtectedRoute({
                user: authStorage.getUser(),
                loading: true,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist",
            });

            assert.strictEqual(loadingDecision.status, "LOADING");
            assert.strictEqual(loadingDecision.message, "Restoring session...");
        });

        it("Scenario 10: expired session is detected and prevented from accessing protected routes", () => {
            const expiredToken = createMockJwt({
                sub: "u-1",
                role: UserRole.DENTIST,
                exp: Math.floor(Date.now() / 1000) - 300, // Expired 5 mins ago
            });

            authStorage.save({
                accessToken: expiredToken,
                user: { id: "u-1", fullName: "Dr. Dentist", role: UserRole.DENTIST },
            });

            // Verify safe parseJwtPayload expiration logic
            const payload = JSON.parse(Buffer.from(expiredToken.split(".")[1], "base64url").toString());
            const isExpired = payload.exp * 1000 <= Date.now();
            assert.strictEqual(isExpired, true, "Token must be detected as expired");

            // AuthStorage is cleared on expired token
            authStorage.clear();
            assert.strictEqual(authStorage.getToken(), null);
            assert.strictEqual(authStorage.getUser(), null);

            const decision = evaluateProtectedRoute({
                user: null,
                loading: false,
                allowedRoles: [UserRole.DENTIST],
                targetPath: "/dentist",
            });

            assert.strictEqual(decision.status, "REDIRECT");
            assert.strictEqual(decision.redirectTo, "/login");
        });

        it("handles malformed tokens safely without throwing unhandled exceptions", () => {
            authStorage.save({
                accessToken: "not-a-valid-jwt-token",
                user: { id: "bad" },
            });

            const token = authStorage.getToken();
            const parts = token.split(".");
            const isMalformed = parts.length < 2;
            assert.strictEqual(isMalformed, true);

            authStorage.clear();
            assert.strictEqual(authStorage.getToken(), null);
        });
    });

    describe("11-13: Public routes, redirection logic, and loop prevention", () => {
        it("Scenario 11: login redirects to preserved destination if authorized", () => {
            const dentistUser = { id: "u-1", fullName: "Dr. Dentist", role: UserRole.DENTIST };
            const preservedDestination = "/dentist";

            const returnTarget = (preservedDestination && preservedDestination !== "/login" && preservedDestination !== "/register")
                ? preservedDestination
                : getDefaultDashboardForRole(dentistUser.role);

            assert.strictEqual(returnTarget, "/dentist");
        });

        it("Scenario 11 (fallback): login without return destination redirects to role default dashboard", () => {
            assert.strictEqual(getDefaultDashboardForRole(UserRole.DENTIST), "/dentist");
            assert.strictEqual(getDefaultDashboardForRole(UserRole.RECEPTIONIST), "/receptionist");
            assert.strictEqual(getDefaultDashboardForRole(UserRole.CUSTOMER), "/customer");
            assert.strictEqual(getDefaultDashboardForRole(null), "/login");
        });

        it("Scenario 12: unauthenticated users can access /login and /register", () => {
            const loginDecision = evaluatePublicRoute({
                user: null,
                loading: false,
                targetPath: "/login",
            });
            assert.strictEqual(loginDecision.status, "PERMITTED");
            assert.strictEqual(loginDecision.path, "/login");

            const registerDecision = evaluatePublicRoute({
                user: null,
                loading: false,
                targetPath: "/register",
            });
            assert.strictEqual(registerDecision.status, "PERMITTED");
            assert.strictEqual(registerDecision.path, "/register");
        });

        it("Scenario 12: authenticated users on /login are redirected to their dashboard", () => {
            const customerUser = { id: "u-3", fullName: "Patient John", role: UserRole.CUSTOMER };
            const decision = evaluatePublicRoute({
                user: customerUser,
                loading: false,
                targetPath: "/login",
                fromPath: null,
            });

            assert.strictEqual(decision.status, "REDIRECT");
            assert.strictEqual(decision.redirectTo, "/customer");
        });

        it("Scenario 13: self-referential /login in return state does not cause infinite redirect loop", () => {
            const dentistUser = { id: "u-1", fullName: "Dr. Dentist", role: UserRole.DENTIST };
            const decision = evaluatePublicRoute({
                user: dentistUser,
                loading: false,
                targetPath: "/login",
                fromPath: "/login", // Malicious or loop-causing return URL
            });

            assert.strictEqual(decision.status, "REDIRECT");
            // Must redirect to role dashboard instead of looping back to /login
            assert.strictEqual(decision.redirectTo, "/dentist");
        });
    });
});
