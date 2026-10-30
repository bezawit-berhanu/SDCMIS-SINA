const { RecordStatus } = require("../../domain/enums/enum");

class LoginUser {
    constructor({ userRepository, passwordService, tokenService }) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }

    async execute({ email, username, phone, identifier, password }) {
        const rawIdentifier = email || identifier || username || phone;

        const fields = {};
        if (typeof rawIdentifier !== "string" || !rawIdentifier.trim()) {
            fields.identifier = "Email or phone number is required.";
        }

        if (typeof password !== "string" || !password) {
            fields.password = "Password is required.";
        }

        if (Object.keys(fields).length > 0) {
            const error = new Error("Email and password are required.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            error.fields = fields;
            throw error;
        }

        const normalizedIdentifier = rawIdentifier.trim();

        // Check if identifier contains '@' for email lookup, otherwise try phone lookup with email fallback
        let user = null;
        if (normalizedIdentifier.includes("@")) {
            user = await this.userRepository.findAnyByEmail(normalizedIdentifier.toLowerCase());
        } else {
            user = (await this.userRepository.findAnyByPhone(normalizedIdentifier)) ||
                   (await this.userRepository.findAnyByEmail(normalizedIdentifier.toLowerCase()));
        }

        // Verify password against stored hash (if user exists)
        const passwordValid = await this.passwordService.verify(
            password,
            user?.passwordHash
        );

        if (!user || !passwordValid) {
            const error = new Error("Invalid email or password.");
            error.statusCode = 401;
            error.code = "INVALID_CREDENTIALS";
            throw error;
        }

        // Reject inactive or soft-deleted accounts
        const isInactive = user.recordStatus !== RecordStatus.ACTIVE || Boolean(user.deletedAt);
        if (isInactive) {
            const error = new Error("Account is inactive or disabled.");
            error.statusCode = 401;
            error.code = "ACCOUNT_INACTIVE";
            throw error;
        }

        // Generate signed JWT access token
        const accessToken = this.tokenService.signAccessToken(user);

        return {
            accessToken,
            tokenType: "Bearer",
            user: {
                id: user.id,
                fullName: user.fullname || user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                themePreference: user.themePreference,
            },
        };
    }
}

module.exports = LoginUser;