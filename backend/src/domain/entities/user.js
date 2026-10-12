class User {
    constructor(
        id = null,
        firstName,
        lastName,
        email = null,
        phone = null,
        passwordHash,
        role,
        clinicId,
        themePreference,
        status,
        lastLoginAt,
        createdAt,
        updatedAt) {
        this.id = id;
        this.email = email;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
        this.clinicId = clinicId;
        this.avatarUrl = avatarUrl;
        this.themePreference = themePreference;
        this.status = status;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        if (
            typeof fullName !== "string" ||
            fullName.trim().length < 1 ||
            fullName.trim.length > 120
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
        if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
    ) {
            throw new Error("Email address has an invalid format.");
        }

    }
}

module.exports = User;