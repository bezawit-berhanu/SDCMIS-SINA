const container = require("../../container/container");

const userController = {
    async getProfile(req, res, next) {
        try {
            const user = await container.getCurrentUser.execute(req.user.id);
            return res.status(200).json({
                success: true,
                data: {
                    user,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    async updateName(req, res, next) {
        try {
            const fullName = req.body.fullName !== undefined ? req.body.fullName : req.body.fullname;
            const result = await container.updateUserName.execute({
                userId: req.user.id,
                fullName,
            });

            return res.status(200).json({
                success: true,
                message: "Name updated successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async updateContact(req, res, next) {
        try {
            const { email, phone } = req.body ?? {};
            const result = await container.updateUserContact.execute({
                userId: req.user.id,
                email,
                phone,
            });

            return res.status(200).json({
                success: true,
                message: "Contact information updated successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword, password } = req.body ?? {};
            const result = await container.changeUserPassword.execute({
                userId: req.user.id,
                currentPassword,
                newPassword: newPassword || password,
            });

            return res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    },

    async updateProfile(req, res, next) {
        try {
            const fullName = req.body.fullName !== undefined ? req.body.fullName : req.body.fullname;
            const { email, phone, themePreference, theme } = req.body ?? {};

            const result = await container.updateUserProfile.execute({
                userId: req.user.id,
                fullName,
                email,
                phone,
                themePreference: themePreference || theme,
            });

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async updateTheme(req, res, next) {
        try {
            const theme = (req.body.theme || req.body.themePreference || "LIGHT").toUpperCase();
            const validThemes = ["LIGHT", "DARK"];
            const selectedTheme = validThemes.includes(theme) ? theme : "LIGHT";

            const result = await container.updateUserProfile.execute({
                userId: req.user.id,
                themePreference: selectedTheme,
            });

            return res.status(200).json({
                success: true,
                message: "Theme preference updated successfully.",
                data: {
                    themePreference: selectedTheme,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = userController;
