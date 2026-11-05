const container = require("../../container/container");

/**
 * Dashboard & Worklist Controller
 * Implements SRS Section 8.5.3:
 * - GET /dentist/dashboard (FR-DEN-01)
 * - GET /dentist/tasks (FR-DEN-11)
 * - GET /dentist/missed-appointments (FR-DEN-12)
 * - GET /receptionist/dashboard (FR-REC-01)
 * - GET /receptionist/customers (FR-REC-02)
 */
class DashboardController {
    async getDentistDashboard(req, res, next) {
        try {
            const data = await container.getDentistDashboard.execute({
                bypassCache: req.query.fresh === "true",
            });
            return res.status(200).json({
                success: true,
                ...data,
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async getDentistTasks(req, res, next) {
        try {
            const result = await container.getAppointments.execute({
                status: "UPCOMING",
                limit: 100,
            });
            const tasks = Array.isArray(result) ? result : result.appointments || [];

            // Sort chronologically (soonest first) per FR-DEN-11
            tasks.sort((a, b) => {
                const dateA = new Date(a.scheduled_date || a.scheduledDate || a.appointmentDate || 0);
                const dateB = new Date(b.scheduled_date || b.scheduledDate || b.appointmentDate || 0);
                return dateA - dateB;
            });

            return res.status(200).json({
                success: true,
                count: tasks.length,
                data: tasks,
                tasks,
            });
        } catch (error) {
            next(error);
        }
    }

    async getDentistMissedAppointments(req, res, next) {
        try {
            const result = await container.getAppointments.execute({
                status: "MISSED",
                limit: 100,
            });
            const missed = Array.isArray(result) ? result : result.appointments || [];

            return res.status(200).json({
                success: true,
                count: missed.length,
                data: missed,
                missedAppointments: missed,
            });
        } catch (error) {
            next(error);
        }
    }

    async getReceptionistDashboard(req, res, next) {
        try {
            const data = await container.getReceptionistDashboard.execute({
                bypassCache: req.query.fresh === "true",
            });
            return res.status(200).json({
                success: true,
                ...data,
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    async getReceptionistCustomers(req, res, next) {
        try {
            const result = await container.getPatients.execute(req.query);
            const customers = Array.isArray(result) ? result : result.patients || [];

            return res.status(200).json({
                success: true,
                count: customers.length,
                data: customers,
                customers,
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DashboardController();
