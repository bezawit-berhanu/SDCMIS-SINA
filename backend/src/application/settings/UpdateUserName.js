class UpdateUserName {
    constructor({ userRepository }) {
        this.userRepository = userRepository;
    }

    async execute({ userId, fullName }) {
        if (!userId) {
            const error = new Error("Authentication is required.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        const trimmedName = typeof fullName === "string" ? fullName.trim() : "";
        if (!trimmedName || trimmedName.length < 1) {
            const error = new Error("Full name is required.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            error.fields = { fullName: "Full name is required." };
            throw error;
        }

        if (trimmedName.length > 120) {
            const error = new Error("Full name must not exceed 120 characters.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            error.fields = { fullName: "Full name must not exceed 120 characters." };
            throw error;
        }

        const existingUser = await this.userRepository.findActiveById(userId);
        if (!existingUser) {
            const error = new Error("User account was not found.");
            error.statusCode = 404;
            error.code = "NOT_FOUND";
            throw error;
        }

        const updated = await this.userRepository.update(userId, {
            fullname: trimmedName,
        });

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

module.exports = UpdateUserName;
