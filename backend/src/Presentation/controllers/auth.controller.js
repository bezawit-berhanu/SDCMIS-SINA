const container = require("../../container/container");

const authController = {
    async login(req, res, next) {
        try {
            const { email, password } = req.body ?? {};

            const result = await container.loginUser.execute({
                email,
                password,
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
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
    };


module.exports = authContorller;