const container = require("../../container/container");

const authController = {
    async register(req, res, next) {
        try {
            // Support role classification for staff (DENTIST, RECEPTIONIST) and patient (CUSTOMER)
            const { fullName, fullname, email, phone, password, role } = req.body ?? {};

            const result = await container.registerUser.execute({
                fullName: fullName || fullname,
                email,
                phone,
                password,
                role,
            });

            // Return 201 Created with sanitized safe user information
            return res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async login(req, res, next) {
        try {
            // Extract only the expected login fields from the request body.
            const { email, username, phone, identifier, password } = req.body ?? {};

            // Let the application use case handle login rules.
            const result = await container.loginUser.execute({
                email,
                username,
                phone,
                identifier,
                password,
            });

            // Return the access token and safe user information.
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            // Forward failures to the shared Express error handler.
            next(error);
        }
    },

    async getCurrentUser(req, res, next) {
        try {
            // authenticate middleware has already resolved the current user.
            return res.status(200).json({
                success: true,
                data: {
                    user: req.user,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    async logout(req, res, next) {
        try {
            res.clearCookie("refreshToken");
            return res.status(200).json({
                success: true,
                message: "Logged out successfully.",
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = authController;
