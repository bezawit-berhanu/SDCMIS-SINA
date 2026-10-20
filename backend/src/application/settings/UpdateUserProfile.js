const { ThemePreference } = require("../../domain/enums/enum");

class UpdateUserProfile {
    constructor({ userRepository }) {
        this.userRepository = userRepository;
    }

    async execute({ userId, fullName, email, phone, themePreference }) {
        if (!userId) {
            const error = new Error("Authentication is required.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        const existingUser = await this.userRepository.findActiveById(userId);
        if (!existingUser) {
            const error = new Error("User account was not found.");
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        const updateData = {};
        const fields = {};

        // 1. Full name validation (if provided)
        if (fullName !== undefined) {
            const trimmedName = typeof fullName === "string" ? fullName.trim() : "";
            if (!trimmedName || trimmedName.length < 1) {
                fields.fullName = "Full name is required.";
            } else if (trimmedName.length > 120) {
                fields.fullName = "Full name must not exceed 120 characters.";
            } else {
                updateData.fullname = trimmedName;
            }
        }

        // 2. Contact validation (if email or phone provided)
        let targetEmail = existingUser.email;
        let targetPhone = existingUser.phone;

        if (email !== undefined) {
            const raw = typeof email === "string" ? email.trim().toLowerCase() : "";
            targetEmail = raw.length > 0 ? raw : null;
            if (targetEmail) {
                if (targetEmail.length > 255) {
                    fields.email = "Email address must not exceed 255 characters.";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
                    fields.email = "Email address has an invalid format.";
                }
            }
            updateData.email = targetEmail;
        }

        if (phone !== undefined) {
            const raw = typeof phone === "string" ? phone.trim() : "";
            targetPhone = raw.length > 0 ? raw : null;
            if (targetPhone) {
                const digitsOnly = targetPhone.replace(/\D/g, "");
                if (targetPhone.length > 30) {
                    fields.phone = "Phone number must not exceed 30 characters.";
                } else if (!/^\+?[0-9\s\-().]{7,30}$/.test(targetPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
                    fields.phone = "Phone number has an invalid format. Must contain 7 to 15 digits.";
                }
            }
            updateData.phone = targetPhone;
        }

        // Ensure at least one contact method remains
        if ((email !== undefined || phone !== undefined) && !targetEmail && !targetPhone) {
            fields.contact = "At least an email address or phone number is required.";
        }

        // 3. Theme preference validation (if provided)
        if (themePreference !== undefined) {
            if (!Object.values(ThemePreference).includes(themePreference)) {
                fields.themePreference = "The specified theme preference is invalid.";
            } else {
                updateData.themePreference = themePreference;
            }
        }

        if (Object.keys(fields).length > 0) {
            const firstErrorMessage = Object.values(fields)[0];
            const error = new Error(firstErrorMessage || "Validation failed.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            error.fields = fields;
            throw error;
        }

        // 4. Duplicate checks
        if (email !== undefined && targetEmail && targetEmail !== existingUser.email) {
            const existing = await this.userRepository.findAnyByEmailExcludingUser(targetEmail, userId);
            if (existing) {
                const error = new Error("An account with this email address already exists.");
                error.statusCode = 409;
                error.code = "DUPLICATE_ACCOUNT";
                error.fields = { email: "Email is already registered" };
                throw error;
            }
        }

        if (phone !== undefined && targetPhone && targetPhone !== existingUser.phone) {
            const existing = await this.userRepository.findAnyByPhoneExcludingUser(targetPhone, userId);
            if (existing) {
                const error = new Error("An account with this phone number already exists.");
                error.statusCode = 409;
                error.code = "DUPLICATE_ACCOUNT";
                error.fields = { phone: "Phone number is already registered" };
                throw error;
            }
        }

        const updated = await this.userRepository.update(userId, updateData);

        return {
            user: {
                id: updated.id,
                fullName: updated.fullname || updated.fullName,
                email: updated.email,
                phone: updated.phone,
                role: updated.role,
                themePreference: updated.themePreference,
            },
        };
    }
}

module.exports = UpdateUserProfile;
