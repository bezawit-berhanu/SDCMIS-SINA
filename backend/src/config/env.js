//Responsible for reading reading and validating environment variables.

const path = require("path");
const dotenv = require("dotenv");

// Load backend/.env first, then root .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../../../backend/.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 5000,
    TIDB_DATABASE_URL: process.env.TIDB_DATABASE_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
};

if (!env.TIDB_DATABASE_URL) {
    throw new Error(
        "TIDB_DATABASE_URL is not defined in the environment variables."
    );
}
if (!env.JWT_ACCESS_SECRET || env.JWT_ACCESS_SECRET === "REPLACE_WITH_A_LONG_RANDOM_SECRET") {
    throw new Error("JWT_ACCESS_SECRET is not defined in the environment variables.");
}

if (Buffer.byteLength(env.JWT_ACCESS_SECRET, "utf8") < 32) {
    throw new Error("JWT_ACCESS_SECRET must be at least 32 bytes long.");
}

module.exports = env;