const tokenService = require("../../Infrastructure/authentication/token.service");
const container = require("../../container/container");

async function authenticate(req, res, next) {
    try {
        const token = tokenService.extractBearerToken(req.headers.authorization);

        if (!token) {
            const error = new Error("Authentication is required.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            throw error;
        }

        const payload = tokenService.verifyAccessToken(token);

        const user = await container.getCurrentUser.execute(payload.sub);

        if (!user || user.recordStatus === "DELETED") {
            const error = new Error("User account not found or deactivated.");
            error.statusCode = 401;
            error.code = "ACCOUNT_INACTIVE";
            throw error;
        }

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
            error.code = error.code || "INVALID_OR_EXPIRED_TOKEN";
            error.message = error.code === "ERR-SESSION-EXPIRED"
                ? "For your security, please log in again."
                : "Your session is invalid or has expired.";
        }

        next(error);
    }
}

module.exports = authenticate;