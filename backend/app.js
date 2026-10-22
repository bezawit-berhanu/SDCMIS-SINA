// Assembling express
const express = require("express");

const requestId = require("./src/Presentation/middleware/requestId");
const notFound = require("./src/Presentation/middleware/notFound");
const errorHandler = require("./src/Presentation/middleware/errorHandler");

const healthRoutes = require("./src/Presentation/routes/health.routes");
const authRoutes = require("./src/Presentation/routes/auth.routes");
const userRoutes = require("./src/Presentation/routes/user.routes");
const patientRoutes = require("./src/Presentation/routes/patient.routes");
const branchRoutes = require("./src/Presentation/routes/branch.routes");

const app = express();

// Standard CORS handling for local frontend integration
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, Accept");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    next();
});

app.use(express.json());
app.use(requestId);

// Health check endpoint
app.use("/api", healthRoutes);

// Authentication endpoints
app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// User personal settings endpoints
app.use("/api/v1/users", userRoutes);
app.use("/api/users", userRoutes);

// Patient management endpoints (Task 2: GET, POST, PUT, DELETE /patients)
app.use("/api/v1/patients", patientRoutes);
app.use("/api/patients", patientRoutes);
app.use("/patients", patientRoutes);

// Branch & Dentist management endpoints (Task 10 & 11)
app.use("/api/v1/branches", branchRoutes);
app.use("/api/branches", branchRoutes);
app.use("/branches", branchRoutes);
app.use("/api/v1/dentists", branchRoutes);
app.use("/api/dentists", branchRoutes);
app.use("/dentists", branchRoutes);

// Fallback & centralized error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
