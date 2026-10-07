const app = require(".app");

const env = require("./config/env");

const server = app.listen(env.PORT, () => {
    console.log(
        `SDCMIS API running on port ${env.PORT} in ${env.NODE_ENV} mode`
    );
});

server.on("error", (error) => {
    console.error("HTTP server error: error");
});