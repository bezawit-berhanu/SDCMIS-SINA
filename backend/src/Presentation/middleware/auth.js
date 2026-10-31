const tokenService = require("../../Infrastructure/authentication/token.service");
const container = require("../../container/container");

async function authenticate(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        if (!authorization || !authorization.startsWith("Bearer ")) {
            const error = new Error("Authentication is required.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        const token = authorization.slice("Bearer ".length).trim();

        if (!token) {
            const error = new Error("Authentication is required.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        const payload = tokenService.verifyAccessToken(token);

        const user = await container.getCurrentUser.execute(payload.sub);

        req.user = user;

        next();
    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError" ||
            error.name === "SyntaxError" ||
            !error.statusCode
        ) {
            error.statusCode = 401;
            error.code = "INVALID_OR_EXPIRED_TOKEN";
            error.message = "Your session is invalid or has expired.";
        }

        next(error);
    }
}

module.exports = authenticate;