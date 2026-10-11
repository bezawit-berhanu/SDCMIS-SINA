
const container = require("../../container/container");

const authController = {
    async login(req, res, next) {
        try {
            // Extract only the expected login fields from the request body.
            const { email, password } = req.body ?? {};

            // Let the application use case handle login rules.
            const result = await container.loginUser.execute({
                email,
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
