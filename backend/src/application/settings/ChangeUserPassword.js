const PASSWORD_POLICY = {
    MIN_LENGTH: 8,
    MAX_BYTES: 72,
    HAS_UPPERCASE: /[A-Z]/,
    HAS_LOWERCASE: /[a-z]/,
    HAS_NUMBER: /[0-9]/,
    HAS_SPECIAL: /[^A-Za-z0-9]/,
};

class ChangeUserPassword {
    constructor({ userRepository, passwordService }) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    async execute({ userId, currentPassword, newPassword }) {
        if (!userId) {
            const error = new Error("Authentication is required.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        const fields = {};

        if (typeof currentPassword !== "string" || !currentPassword) {
            fields.currentPassword = "Current password is required.";
        }

        if (typeof newPassword !== "string" || !newPassword) {
            fields.newPassword = "New password is required.";
        } else if (newPassword.length < PASSWORD_POLICY.MIN_LENGTH) {
            fields.newPassword = `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long.`;
        } else if (Buffer.byteLength(newPassword, "utf8") > PASSWORD_POLICY.MAX_BYTES) {
            fields.newPassword = `Password exceeds the maximum supported length of ${PASSWORD_POLICY.MAX_BYTES} bytes.`;
        } else if (
            !PASSWORD_POLICY.HAS_UPPERCASE.test(newPassword) ||
            !PASSWORD_POLICY.HAS_LOWERCASE.test(newPassword) ||
            !PASSWORD_POLICY.HAS_NUMBER.test(newPassword) ||
            !PASSWORD_POLICY.HAS_SPECIAL.test(newPassword)
        ) {
            fields.newPassword =
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
        }

        if (Object.keys(fields).length > 0) {
            const firstErrorMessage = Object.values(fields)[0];
            const error = new Error(firstErrorMessage || "Validation failed.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            error.fields = fields;
            throw error;
        }

        const existingUser = await this.userRepository.findActiveById(userId);
        if (!existingUser) {
            const error = new Error("User account was not found.");
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        // Verify current password against stored hash
        const isCurrentValid = await this.passwordService.verify(
            currentPassword,
            existingUser.passwordHash
        );

        if (!isCurrentValid) {
            const error = new Error("Current password is incorrect.");
            error.statusCode = 400;
            error.code = "INVALID_CURRENT_PASSWORD";
            error.fields = { currentPassword: "The current password you provided is incorrect." };
            throw error;
        }

        // Prevent reusing identical password
        const isSamePassword = await this.passwordService.verify(
            newPassword,
            existingUser.passwordHash
        );

        if (isSamePassword) {
            const error = new Error("New password must be different from current password.");
            error.statusCode = 400;
            error.code = "PASSWORD_REUSED";
            error.fields = { newPassword: "New password cannot be the same as current password." };
            throw error;
        }

        // Securely hash new password
        const newPasswordHash = await this.passwordService.hash(newPassword);

        // Persist update
        await this.userRepository.update(userId, {
            passwordHash: newPasswordHash,
        });

        return {
            success: true,
            message: "Password changed successfully.",
        };
    }
}

module.exports = ChangeUserPassword;
