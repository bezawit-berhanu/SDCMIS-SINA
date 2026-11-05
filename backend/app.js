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

const procedureRoutes = require("./src/Presentation/routes/procedure.routes");
const paymentRoutes = require("./src/Presentation/routes/payment.routes");
const createAppointmentRoutes = require("./src/Presentation/routes/appointment.routes");
const createQueueRoutes = require("./src/Presentation/routes/queue.routes");
const createNotificationRoutes = require("./src/Presentation/routes/notification.routes");
const container = require("./src/container/container");
const { createRateLimiter } = require("./src/Presentation/middleware/rateLimiter");

const appointmentRoutes = createAppointmentRoutes(container);
const queueRoutes = createQueueRoutes(container);
const notificationRoutes = createNotificationRoutes(container);

// Task 5: Background scheduler to periodically detect and update missed appointments
if (process.env.NODE_ENV !== "test") {
    container.detectAndSyncMissedAppointments.startScheduler(60000);
}

const app = express();

// Load balancer & reverse proxy readiness (NFR-SCA-02)
app.set("trust proxy", 1);
app.disable("x-powered-by");

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

// Global API Rate Limiter (NFR-SEC-05, BR-09): 200 req/min
const globalApiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 200,
    prefix: "global_api",
});
app.use("/api", globalApiLimiter);

// Health check endpoint
app.use("/api", healthRoutes);

// Authentication endpoints
app.use("/api/v1/auth", authRoutes);
app.use("/api/auth", authRoutes);

// User personal settings endpoints
app.use("/api/v1/users", userRoutes);
app.use("/api/users", userRoutes);

// Procedure management endpoints (Tasks 1, 2, 3, 4, 5)
app.use("/api/v1/procedures", procedureRoutes);
app.use("/api/procedures", procedureRoutes);
app.use("/procedures", procedureRoutes);
app.use("/api/v1/patients/:patientId/procedures", procedureRoutes);
app.use("/api/patients/:patientId/procedures", procedureRoutes);
app.use("/patients/:patientId/procedures", procedureRoutes);

// Payment & Billing management endpoints (Tasks 6, 7, 8, 9)
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/payments", paymentRoutes);
app.use("/api/v1/patients/:patientId/payments", paymentRoutes);
app.use("/api/patients/:patientId/payments", paymentRoutes);
app.use("/patients/:patientId/payments", paymentRoutes);

// Appointment management endpoints (Tasks 1, 2, 3, 4, 5, 6, 7, 8, 9)
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/api/v1/patients/:patientId/appointments", appointmentRoutes);
app.use("/api/patients/:patientId/appointments", appointmentRoutes);
app.use("/patients/:patientId/appointments", appointmentRoutes);

// Patient management endpoints (Task 2: GET, POST, PUT, DELETE /patients)
app.use("/api/v1/patients", patientRoutes);
app.use("/api/patients", patientRoutes);
app.use("/patients", patientRoutes);
app.use("/api/v1/customers", patientRoutes);
app.use("/api/customers", patientRoutes);
app.use("/customers", patientRoutes);

// Branch & Dentist management endpoints (Task 10 & 11)
app.use("/api/v1/branches", branchRoutes);
app.use("/api/branches", branchRoutes);
app.use("/branches", branchRoutes);
app.use("/api/v1/dentists", branchRoutes);
app.use("/api/dentists", branchRoutes);
app.use("/dentists", branchRoutes);

// Queue management endpoints (Live Queue, Check-in, Call, Auto-advance, Complete)
app.use("/api/v1/queue", queueRoutes);
app.use("/api/queue", queueRoutes);
app.use("/queue", queueRoutes);

// SignalR Hub Negotiation endpoint per SignalR protocol specification
app.post(["/hub/queue/negotiate", "/api/v1/queue/negotiate"], (req, res) => {
    res.json({
        negotiateVersion: 1,
        connectionId: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        connectionToken: `sig-tok-${Date.now()}`,
        availableTransports: [
            {
                transport: "WebSockets",
                transferFormats: ["Text", "Binary"],
            },
        ],
    });
});

// Notification endpoints (Dentist & Receptionist real-time alerts)
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/notifications", notificationRoutes);

// Fallback & centralized error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
