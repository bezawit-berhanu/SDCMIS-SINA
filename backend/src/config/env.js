//Responsible for reading reading and validating environment variables.

require("dotenv").config();

const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 5000,
    TIDB_DATABASE_URL: process.env.TIDB_DATABASE_URL,
};

if (!env.TIDB_DATABASE_URL) {
    throw new Error(
        "TIDB_DATABASE URL is not defiend in the environment variables."
    );
}

module.exports = env;