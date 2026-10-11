class LoginUser {
    constructor({ userRepository, passwordService, tokenService }) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
    }

    async execute({ email, password }) {
        if (
            typeof email !== "string" ||
            !email.trim() ||
            typeof password !== "string" ||
            !password
        ) {
            const error = new Error("Email and Password are required.");
            error.statusCode = 400;
            error.code = "VALIDATION_ERROR";
            throw error;
        }
        const user = await this.userRepository.findByEmail(email);
        const passwordValid = await this.passwordService.verify(
            password, user?.passwordHash
        );

        if (!user || !passwordIsValid) {
            const error = new Error("Invalid email or password.");
            error.statusCode = 401;
            error.code = "Invalid_CREDENTAILS";
            throw error;
        }

        const accessToken = this.tokenService.signAccessToken(user);

        return {
            accessToken,
            tokenType: "Bearer",
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        };
    }
}

module.exports = LoginUser;