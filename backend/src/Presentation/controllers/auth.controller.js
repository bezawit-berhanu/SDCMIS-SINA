
const container = require("../../container/container");

const authController = {
    async register(req, res, next) {
        try {
            // Extract only the permitted registration fields from the request body.
            // Client-supplied roles or privileges are strictly excluded here.
            const { fullName, fullname, email, phone, password } = req.body ?? {};

            const result = await container.registerUser.execute({
                fullName: fullName || fullname,
                email,
                phone,
                password,
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
};

module.exports = authController;
