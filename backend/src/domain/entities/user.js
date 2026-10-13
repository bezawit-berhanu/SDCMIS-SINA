const {
    UserRole,
    RecordStatus,
    ThemePreference,
} = require("../enums/enum");

class User {
    constructor(data = {}) {
        // Support both object parameter and positional parameters if any
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.id ?? null;
        const fullName = params.fullName || params.fullname || "";
        const email = params.email ?? null;
        const phone = params.phone ?? null;
        const passwordHash = params.passwordHash ?? "";
        const role = params.role;
        const themePreference = params.themePreference || ThemePreference.LIGHT;
        const recordStatus = params.recordStatus || RecordStatus.ACTIVE;
        const linkedPatientId = params.linkedPatientId ?? null;
        const deletedAt = params.deletedAt ?? null;
        const createdAt = params.createdAt || new Date();
        const updatedAt = params.updatedAt || new Date();

        if (
            typeof fullName !== "string" ||
            fullName.trim().length < 1 ||
            fullName.trim().length > 120
        ) {
            throw new Error(
                "Full name must contain between 1 and 120 characters."
            );
        }

        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : null;
        const normalizedPhone = typeof phone === "string" ? phone.trim() : null;
        const hasEmail = normalizedEmail !== null && normalizedEmail.length > 0;
        const hasPhone = normalizedPhone !== null && normalizedPhone.length > 0;

        if (!hasEmail && !hasPhone) {
            throw new Error(
                "A user must have at least an email address or phone number."
            );
        }

        if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new Error("Email address has an invalid format.");
        }

        if (hasPhone && (!/^\+?[0-9\s\-().]{7,30}$/.test(normalizedPhone) || normalizedPhone.replace(/\D/g, "").length < 7 || normalizedPhone.replace(/\D/g, "").length > 15)) {
            throw new Error("Phone number has an invalid format.");
        }

        if (typeof passwordHash !== "string" || passwordHash.trim().length === 0) {
            throw new Error("A password hash is required.");
        }

        if (!Object.values(UserRole).includes(role)) {
            throw new Error("The specified user role is invalid.");
        }

        if (!Object.values(ThemePreference).includes(themePreference)) {
            throw new Error("The specified theme preference is invalid.");
        }

        if (!Object.values(RecordStatus).includes(recordStatus)) {
            throw new Error("The specified record status is invalid.");
        }

        this.id = id;
        this.fullName = fullName.trim();
        this.email = normalizedEmail;
        this.phone = normalizedPhone;
        this.passwordHash = passwordHash;
        this.role = role;
        this.themePreference = themePreference;
        this.recordStatus = recordStatus;
        this.linkedPatientId = linkedPatientId;
        this.deletedAt = deletedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    get isActive() {
        return this.recordStatus === RecordStatus.ACTIVE && !this.deletedAt;
    }

    toSafeObject() {
        return {
            id: this.id,
            fullName: this.fullName,
            email: this.email,
            phone: this.phone,
            role: this.role,
            themePreference: this.themePreference,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = User;