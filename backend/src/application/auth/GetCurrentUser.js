
class GetCurrentUser {
    constructor({ userRepository }) {
        // The repository is responsible for retrieving the latest user record.
        this.userRepository = userRepository;
    }

    async execute(userId) {
        // The token's subject identifies the user, but the database remains
        // the source of truth for whether that account is still active.
        const user = await this.userRepository.findActiveById(userId);

        if (!user) {
            const error = new Error("User account is unavailable.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        // Expose only the fields needed by the application.
        return {
            id: user.id,
            fullName: user.fullname || user.fullName,
            email: user.email,
            role: user.role,
        };
    }
}

module.exports = GetCurrentUser;
