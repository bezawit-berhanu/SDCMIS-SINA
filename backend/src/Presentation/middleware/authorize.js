function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error("Authentication is requried.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            return next(error);
        }

        if (!allowedRoles.includes(req.user.role)) {
            const error = new Error("You do not have permission perform this action");
            error.statusCode = 403;
            error.code = "FORBIDDEN";
            return next(error);
        }

        next();
    };
}

module.exports = authorize;