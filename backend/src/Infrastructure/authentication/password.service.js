const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const passwordService = {
    async hash(plainPassword) {
        if (typeof plainPassword !== "string" || plainPassword.length === 0) {
            throw new Error("A password is required!");
        }

        if (Buffer.byteLength(plainPassword, "utf8") > 72) {
            throw new Error("Password exceeds the supported length.");
        }
        return bcrypt.hash(plainPassword, SALT_ROUNDS);
    },

    async verify(plainPassword, passwordHash) {
        if (typeof plainPassword !== "string" || typeof passwordHash !== "string" || !passwordHash) {
            return false;
        }

        if (Buffer.byteLength(plainPassword, "utf8") > 72) {
            return false;
        }

        return bcrypt.compare(plainPassword, passwordHash);
    },
};

module.exports = passwordService;