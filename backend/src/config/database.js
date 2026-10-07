//This file imports centeralized environment configurations.

const env = require("./env");

const databaseConfig = {
    url: env.TIDB_DATABASE_URL,
};

module.exports = databaseConfig;