//Assembling express

const express = require("express");

const requestId = require("./presentation/middleware/requestId");

const notFound = require("./presentation/middleware/notFound");

const errorHandler = require("./presentation/middleware/errorHandler");

const healthRoutes = require("./presentation/routes/health.routes");
const authRoutes = require("./presentation/routes/auth.routes");
const app = express();
app.use(express.json());
app.use(requestId);

app.use("/api", healthRoutes);
app.use("/api/v1/auth");
app.use(notFound);
app.use(errorHandler);


module.exports = app;
