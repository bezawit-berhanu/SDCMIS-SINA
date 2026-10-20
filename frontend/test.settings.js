import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";

// Mock minimal browser storage environment
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

describe("Frontend Personal Settings & Validation Test Suite", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    describe("1. Update Name Validation", () => {
        function validateName(fullName) {
            const trimmed = typeof fullName === "string" ? fullName.trim() : "";
            if (!trimmed) {
                return { valid: false, error: "Full name is required." };
            }
            if (trimmed.length > 120) {
                return { valid: false, error: "Full name must not exceed 120 characters." };
            }
            return { valid: true, value: trimmed };
        }

        it("accepts a valid legal name", () => {
            const res = validateName("Dr. Alice Smith");
            assert.strictEqual(res.valid, true);
            assert.strictEqual(res.value, "Dr. Alice Smith");
        });

        it("rejects empty or whitespace-only name", () => {
            const res = validateName("    ");
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "Full name is required.");
        });

        it("rejects name exceeding 120 characters", () => {
            const longName = "A".repeat(121);
            const res = validateName(longName);
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "Full name must not exceed 120 characters.");
        });
    });

    describe("2. Update Contact Validation", () => {
        function validateContact({ email, phone }) {
            const trimmedEmail = typeof email === "string" ? email.trim() : "";
            const trimmedPhone = typeof phone === "string" ? phone.trim() : "";

            if (!trimmedEmail && !trimmedPhone) {
                return { valid: false, error: "At least an email address or phone number is required." };
            }

            if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                return { valid: false, error: "Please provide a valid email address." };
            }

            if (trimmedPhone) {
                const digits = trimmedPhone.replace(/\D/g, "");
                if (digits.length < 7 || digits.length > 15) {
                    return { valid: false, error: "Phone number must contain between 7 and 15 digits." };
                }
            }

            return {
                valid: true,
                email: trimmedEmail || null,
                phone: trimmedPhone || null,
            };
        }

        it("accepts valid email and phone", () => {
            const res = validateContact({ email: "user@example.com", phone: "+251911223344" });
            assert.strictEqual(res.valid, true);
            assert.strictEqual(res.email, "user@example.com");
            assert.strictEqual(res.phone, "+251911223344");
        });

        it("accepts email only when phone is blank", () => {
            const res = validateContact({ email: "user@example.com", phone: "" });
            assert.strictEqual(res.valid, true);
            assert.strictEqual(res.email, "user@example.com");
            assert.strictEqual(res.phone, null);
        });

        it("accepts phone only when email is blank", () => {
            const res = validateContact({ email: "", phone: "+251911223344" });
            assert.strictEqual(res.valid, true);
            assert.strictEqual(res.email, null);
            assert.strictEqual(res.phone, "+251911223344");
        });

        it("rejects when both email and phone are blank", () => {
            const res = validateContact({ email: "  ", phone: "  " });
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "At least an email address or phone number is required.");
        });

        it("rejects invalid email format", () => {
            const res = validateContact({ email: "not-an-email", phone: "+251911223344" });
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "Please provide a valid email address.");
        });

        it("rejects phone with fewer than 7 digits", () => {
            const res = validateContact({ email: "user@example.com", phone: "12345" });
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "Phone number must contain between 7 and 15 digits.");
        });
    });

    describe("3. Change Password Validation", () => {
        function validateChangePassword({ currentPassword, newPassword, confirmPassword }) {
            if (!currentPassword) {
                return { valid: false, error: "Current password is required." };
            }
            if (!newPassword) {
                return { valid: false, error: "New password is required." };
            }
            if (newPassword.length < 8) {
                return { valid: false, error: "New password must be at least 8 characters long." };
            }
            if (newPassword !== confirmPassword) {
                return { valid: false, error: "New password and confirmation do not match." };
            }
            if (currentPassword === newPassword) {
                return { valid: false, error: "New password cannot be the same as current password." };
            }
            return { valid: true };
        }

        it("accepts valid password change inputs", () => {
            const res = validateChangePassword({
                currentPassword: "OldPassword1!",
                newPassword: "NewSecur3Password!",
                confirmPassword: "NewSecur3Password!",
            });
            assert.strictEqual(res.valid, true);
        });

        it("rejects when current password is blank", () => {
            const res = validateChangePassword({
                currentPassword: "",
                newPassword: "NewSecur3Password!",
                confirmPassword: "NewSecur3Password!",
            });
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "Current password is required.");
        });

        it("rejects when new password and confirm password mismatch", () => {
            const res = validateChangePassword({
                currentPassword: "OldPassword1!",
                newPassword: "NewSecur3Password!",
                confirmPassword: "MismatchPassword2@",
            });
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "New password and confirmation do not match.");
        });

        it("rejects when new password is identical to current password", () => {
            const res = validateChangePassword({
                currentPassword: "SamePassword1!",
                newPassword: "SamePassword1!",
                confirmPassword: "SamePassword1!",
            });
            assert.strictEqual(res.valid, false);
            assert.strictEqual(res.error, "New password cannot be the same as current password.");
        });
    });

    describe("4. Session Storage & Profile Persistence", () => {
        it("stores updated user and reflects changes on subsequent reads", () => {
            const initialUser = {
                id: "user-123",
                fullName: "Initial Name",
                email: "initial@example.com",
                phone: "+251911111111",
                role: "DENTIST",
                themePreference: "LIGHT",
            };

            authStorage.save({ accessToken: "fake-jwt-token", user: initialUser });
            assert.strictEqual(authStorage.getUser().fullName, "Initial Name");

            // Update user name and theme
            const updatedUser = {
                ...initialUser,
                fullName: "Updated Dr. Smith",
                themePreference: "DARK",
            };
            authStorage.save({ accessToken: "fake-jwt-token", user: updatedUser });

            const retrieved = authStorage.getUser();
            assert.strictEqual(retrieved.fullName, "Updated Dr. Smith");
            assert.strictEqual(retrieved.themePreference, "DARK");
            assert.strictEqual(authStorage.getToken(), "fake-jwt-token");
        });
    });
});
