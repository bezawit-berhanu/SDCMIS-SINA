const User = require("../../domain/entities/user");
const {
    UserRole,
    RecordStatus,
    ThemePreference,
} = require("../../domain/enums/enum");

/**
 * Password Policy Specification:
 * - Length: Between 8 and 72 characters (72 bytes maximum to prevent bcrypt truncation).
 * - Complexity: Must contain at least:
 *   1. One uppercase English letter ([A-Z])
 *   2. One lowercase English letter ([a-z])
 *   3. One numeric digit ([0-9])
 *   4. One special character / symbol ([^A-Za-z0-9])
 */
const PASSWORD_POLICY = {
    MIN_LENGTH: 8,
    MAX_BYTES: 72,
    HAS_UPPERCASE: /[A-Z]/,
    HAS_LOWERCASE: /[a-z]/,
    HAS_NUMBER: /[0-9]/,
    HAS_SPECIAL: /[^A-Za-z0-9]/,
};

class RegisterUser {
    constructor({ userRepository, passwordService }) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
    }

    async execute({ fullName, email, phone, password }) {
        const fields = {};

        // 1. Required fields validation: Full Name
        const trimmedFullName = typeof fullName === "string" ? fullName.trim() : "";
        if (!trimmedFullName || trimmedFullName.length < 1) {
            fields.fullName = "Full name is required.";
        } else if (trimmedFullName.length > 120) {
            fields.fullName = "Full name must not exceed 120 characters.";
        }

        // 2. Contact info validation: Email & Phone
        const normalizedEmail = typeof email === "string" && email.trim().length > 0
            ? email.trim().toLowerCase()
            : null;
        const normalizedPhone = typeof phone === "string" && phone.trim().length > 0
            ? phone.trim()
            : null;

        if (!normalizedEmail && !normalizedPhone) {
            fields.contact = "At least an email address or phone number is required.";
        }

        if (normalizedEmail) {
            if (normalizedEmail.length > 255) {
                fields.email = "Email address must not exceed 255 characters.";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                fields.email = "Email address has an invalid format.";
            }
        }

        if (normalizedPhone) {
            const digitsOnly = normalizedPhone.replace(/\D/g, "");
            if (normalizedPhone.length > 30) {
                fields.phone = "Phone number must not exceed 30 characters.";
            } else if (!/^\+?[0-9\s\-().]{7,30}$/.test(normalizedPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
                fields.phone = "Phone number has an invalid format. Must contain 7 to 15 digits.";
            }
        }

        // 3. Password validation and strength enforcement
        if (typeof password !== "string" || password.length === 0) {
            fields.password = "Password is required.";
        } else if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
            fields.password = `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long.`;
        } else if (Buffer.byteLength(password, "utf8") > PASSWORD_POLICY.MAX_BYTES) {
            fields.password = `Password exceeds the maximum supported length of ${PASSWORD_POLICY.MAX_BYTES} bytes.`;
        } else if (
            !PASSWORD_POLICY.HAS_UPPERCASE.test(password) ||
            !PASSWORD_POLICY.HAS_LOWERCASE.test(password) ||
            !PASSWORD_POLICY.HAS_NUMBER.test(password) ||
            !PASSWORD_POLICY.HAS_SPECIAL.test(password)
        ) {
            fields.password = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
        }

        // If any validation failed, reject with 400 Bad Request
        if (Object.keys(fields).length > 0) {
            const firstErrorMessage = Object.values(fields)[0];
            const error = new Error(firstErrorMessage || "Validation failed.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            error.fields = fields;
            throw error;
        }

        // 4. Duplicate account prevention (pre-check respecting active & soft-deleted records)
        if (normalizedEmail) {
            const existingUserByEmail = await this.userRepository.findAnyByEmail(normalizedEmail);
            if (existingUserByEmail) {
                const error = new Error("An account with this email address already exists.");
                error.statusCode = 409;
                error.code = "DUPLICATE_ACCOUNT";
                error.fields = { email: "Email is already registered" };
                throw error;
            }
        }

        if (normalizedPhone) {
            const existingUserByPhone = await this.userRepository.findAnyByPhone(normalizedPhone);
            if (existingUserByPhone) {
                const error = new Error("An account with this phone number already exists.");
                error.statusCode = 409;
                error.code = "DUPLICATE_ACCOUNT";
                error.fields = { phone: "Phone number is already registered" };
                throw error;
            }
        }

        // 5. Secure password hashing
        const passwordHash = await this.passwordService.hash(password);

        // 6. Enforce server-side default registration role (Never permit elevated roles)
        const role = UserRole.CUSTOMER;

        // 7. Domain entity validation
        const userEntity = new User({
            fullName: trimmedFullName,
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
            role,
            themePreference: ThemePreference.LIGHT,
            recordStatus: RecordStatus.ACTIVE,
        });

        // 8. Persist to database with safe unique constraint conflict handling
        let savedUser;
        try {
            savedUser = await this.userRepository.create({
                fullname: userEntity.fullName,
                email: userEntity.email,
                phone: userEntity.phone,
                passwordHash: userEntity.passwordHash,
                role: userEntity.role,
                themePreference: userEntity.themePreference,
                recordStatus: userEntity.recordStatus,
            });
        } catch (dbError) {
            // Handle race-condition uniqueness violations (Prisma P2002 or MariaDB 1062)
            if (
                dbError.code === "P2002" ||
                dbError.errno === 1062 ||
                (typeof dbError.message === "string" && dbError.message.toLowerCase().includes("unique"))
            ) {
                const target = Array.isArray(dbError.meta?.target)
                    ? dbError.meta.target.join(" ")
                    : String(dbError.meta?.target || dbError.message || "");

                const isEmailConflict = target.toLowerCase().includes("email");
                const isPhoneConflict = target.toLowerCase().includes("phone");

                const conflictError = new Error(
                    isEmailConflict
                        ? "An account with this email address already exists."
                        : isPhoneConflict
                        ? "An account with this phone number already exists."
                        : "An account with the supplied credentials already exists."
                );
                conflictError.statusCode = 409;
                conflictError.code = "DUPLICATE_ACCOUNT";
                conflictError.fields = {};
                if (isEmailConflict) conflictError.fields.email = "Email is already registered";
                if (isPhoneConflict) conflictError.fields.phone = "Phone number is already registered";
                throw conflictError;
            }

            // Other unexpected database errors bubble up to centralized errorHandler
            throw dbError;
        }

        // 9. Build and return sanitized, safe representation (never expose passwordHash)
        const safeUser = new User({
            id: savedUser.id,
            fullName: savedUser.fullname || savedUser.fullName,
            email: savedUser.email,
            phone: savedUser.phone,
            passwordHash: "PROTECTED",
            role: savedUser.role,
            themePreference: savedUser.themePreference,
            recordStatus: savedUser.recordStatus,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt,
        }).toSafeObject();

        return {
            user: safeUser,
        };
    }
}

module.exports = RegisterUser;
