class UpdateUserContact {
    constructor({ userRepository }) {
        this.userRepository = userRepository;
    }

    async execute({ userId, email, phone }) {
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

        // Determine target email and phone
        const rawEmail = email !== undefined ? (typeof email === "string" ? email.trim().toLowerCase() : "") : (existingUser.email || "");
        const rawPhone = phone !== undefined ? (typeof phone === "string" ? phone.trim() : "") : (existingUser.phone || "");

        const normalizedEmail = rawEmail.length > 0 ? rawEmail : null;
        const normalizedPhone = rawPhone.length > 0 ? rawPhone : null;

        const fields = {};

        // 1. Contact availability check
        if (!normalizedEmail && !normalizedPhone) {
            fields.contact = "At least an email address or phone number is required.";
        }

        // 2. Email format validation
        if (normalizedEmail) {
            if (normalizedEmail.length > 255) {
                fields.email = "Email address must not exceed 255 characters.";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                fields.email = "Email address has an invalid format.";
            }
        }

        // 3. Phone format validation
        if (normalizedPhone) {
            const digitsOnly = normalizedPhone.replace(/\D/g, "");
            if (normalizedPhone.length > 30) {
                fields.phone = "Phone number must not exceed 30 characters.";
            } else if (!/^\+?[0-9\s\-().]{7,30}$/.test(normalizedPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
                fields.phone = "Phone number has an invalid format. Must contain 7 to 15 digits.";
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

        // 4. Duplicate checks excluding current user
        if (normalizedEmail && normalizedEmail !== existingUser.email) {
            const existingByEmail = await this.userRepository.findAnyByEmailExcludingUser(normalizedEmail, userId);
            if (existingByEmail) {
                const error = new Error("An account with this email address already exists.");
                error.statusCode = 409;
                error.code = "DUPLICATE_ACCOUNT";
                error.fields = { email: "Email is already registered" };
                throw error;
            }
        }

        if (normalizedPhone && normalizedPhone !== existingUser.phone) {
            const existingByPhone = await this.userRepository.findAnyByPhoneExcludingUser(normalizedPhone, userId);
            if (existingByPhone) {
                const error = new Error("An account with this phone number already exists.");
                error.statusCode = 409;
                error.code = "DUPLICATE_ACCOUNT";
                error.fields = { phone: "Phone number is already registered" };
                throw error;
            }
        }

        const updated = await this.userRepository.update(userId, {
            email: normalizedEmail,
            phone: normalizedPhone,
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

module.exports = UpdateUserContact;
