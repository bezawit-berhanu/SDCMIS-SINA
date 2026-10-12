const app = require("./app");

const env = require("./src/config/env");

const server = app.listen(env.PORT, () => {
    console.log(
        `SDCMIS API running on port ${env.PORT} in ${env.NODE_ENV} mode`
    );
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(
            `Port ${env.PORT} is already in use (EADDRINUSE). Please ensure no previous server instance is running or set a different PORT in environment variables.`
        );
    } else {
        console.error("HTTP server error:", error);
    }
});