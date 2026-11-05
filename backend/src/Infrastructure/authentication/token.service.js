const jwt = require("jsonwebtoken");
const env = require("../../config/env");

const ISSUER = "sdcmis-sina-api";
const AUDIENCE = "sdcmis-sina_client";

const tokenService = {
    signAccessToken(user) {
        return jwt.sign(
            {
                role: user.role,
            },
            env.JWT_ACCESS_SECRET,
            {
                subject: user.id,
                expiresIn: env.JWT_ACCESS_EXPIRES_IN,
                issuer: ISSUER,
                audience: AUDIENCE,
                algorithm: "HS256",
            }
        );
    },
    generateAccessToken(user) {
        return this.signAccessToken(user);
    },
    verifyAccessToken(token) {
        if (!token || typeof token !== "string") {
            const error = new Error("Token missing or invalid.");
            error.statusCode = 401;
            error.code = "INVALID_TOKEN";
            throw error;
        }

        try {
            return jwt.verify(token, env.JWT_ACCESS_SECRET, {
                algorithms: ["HS256"],
                issuer: ISSUER,
                audience: AUDIENCE,
            });
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                const expiredError = new Error("For your security, please log in again.");
                expiredError.statusCode = 401;
                expiredError.code = "ERR-SESSION-EXPIRED";
                throw expiredError;
            }
            const authError = new Error("Authentication token is invalid or corrupt.");
            authError.statusCode = 401;
            authError.code = "INVALID_TOKEN";
            throw authError;
        }
    },
    extractBearerToken(authorizationHeader) {
        if (!authorizationHeader || typeof authorizationHeader !== "string") {
            return null;
        }
        const match = authorizationHeader.trim().match(/^Bearer\s+(.+)$/i);
        return match ? match[1].trim() : null;
    },
    decodeToken(token) {
        try {
            return jwt.decode(token, { complete: true });
        } catch {
            return null;
        }
    },
};

module.exports = tokenService;
