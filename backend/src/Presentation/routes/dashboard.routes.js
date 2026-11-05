const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

// All dashboard endpoints require authentication (FR-AUTH-04)
router.use(authenticate);

// Dentist Dashboard & Tasks (SRS Section 8.5.3: GET /dentist/dashboard, /dentist/tasks, /dentist/missed-appointments)
router.get("/dentist/dashboard", authorize("DENTIST"), (req, res, next) => dashboardController.getDentistDashboard(req, res, next));
router.get("/dentist/tasks", authorize("DENTIST"), (req, res, next) => dashboardController.getDentistTasks(req, res, next));
router.get("/dentist/missed-appointments", authorize("DENTIST"), (req, res, next) => dashboardController.getDentistMissedAppointments(req, res, next));

// Receptionist Dashboard & Customers (SRS Section 8.5.3: GET /receptionist/dashboard, /receptionist/customers)
router.get("/receptionist/dashboard", authorize("RECEPTIONIST", "DENTIST"), (req, res, next) => dashboardController.getReceptionistDashboard(req, res, next));
router.get("/receptionist/customers", authorize("RECEPTIONIST", "DENTIST"), (req, res, next) => dashboardController.getReceptionistCustomers(req, res, next));

module.exports = router;
