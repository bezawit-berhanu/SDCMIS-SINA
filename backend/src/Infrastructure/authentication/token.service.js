const jwt = require("jsonwebtoken");
const env = require("../../config/env");

const ISSUER = "sdcmis-sina-api";
const AUDIENCE = "sdcmis-sina_client";

const tokenService = {
    signAccessToken(user) {
        return jwt.sign({
            role: user.role,
        },

            env.JWT_ACCESS_SECRET, {
            subject: user.id,
            expiresIn: env.JWT_ACCESS_EXPIRES_IN,
            issuer: ISSUER,
            audience: AUDIENCE,
            algorithm: "HS256",
        }
        );
    },
    verifyAccessToken(token) {
        return jwt.verify(token, env.JWT_ACCESS_SECRET, {
            algorithms: ["HS256"],
            issuer: ISSUER,
            audience: AUDIENCE,
        });
    },
};

module.exports = tokenService;