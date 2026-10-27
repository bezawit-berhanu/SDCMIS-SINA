/**
 * Presentation Controller for Appointment APIs
 * Handles CRUD, Cancellation, Rescheduling, Missed appointment detection and retrieval.
 */
class AppointmentController {
    constructor(container) {
        this.container = container;
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.cancel = this.cancel.bind(this);
        this.reschedule = this.reschedule.bind(this);
        this.syncMissed = this.syncMissed.bind(this);
    }

    async create(req, res) {
        try {
            const data = await this.container.createAppointment.execute(req.body, req.user);
            return res.status(201).json({
                status: "success",
                message: "Appointment booked successfully.",
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: err.statusCode === 404 ? "NOT_FOUND" : (err.statusCode === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR"),
                    message: err.message,
                },
            });
        }
    }

    async list(req, res) {
        try {
            const data = await this.container.getAppointments.execute(req.query);
            return res.status(200).json({
                status: "success",
                count: data.length,
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: "INTERNAL_ERROR",
                    message: err.message,
                },
            });
        }
    }

    async getById(req, res) {
        try {
            const data = await this.container.getAppointmentById.execute(req.params.id);
            return res.status(200).json({
                status: "success",
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
                    message: err.message,
                },
            });
        }
    }

    async update(req, res) {
        try {
            const data = await this.container.updateAppointment.execute(req.params.id, req.body, req.user);
            return res.status(200).json({
                status: "success",
                message: "Appointment updated successfully.",
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: err.statusCode === 404 ? "NOT_FOUND" : "BAD_REQUEST",
                    message: err.message,
                },
            });
        }
    }

    async delete(req, res) {
        try {
            const data = await this.container.deleteAppointment.execute(req.params.id);
            return res.status(200).json({
                status: "success",
                message: "Appointment deleted successfully.",
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
                    message: err.message,
                },
            });
        }
    }

    async cancel(req, res) {
        try {
            const data = await this.container.cancelAppointment.execute(req.params.id, req.body, req.user);
            return res.status(200).json({
                status: "success",
                message: "Appointment cancelled successfully.",
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: err.statusCode === 404 ? "NOT_FOUND" : "BAD_REQUEST",
                    message: err.message,
                },
            });
        }
    }

    async reschedule(req, res) {
        try {
            const data = await this.container.rescheduleAppointment.execute(req.params.id, req.body, req.user);
            return res.status(200).json({
                status: "success",
                message: "Appointment rescheduled successfully. Status updated to UPCOMING.",
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: err.statusCode === 404 ? "NOT_FOUND" : "BAD_REQUEST",
                    message: err.message,
                },
            });
        }
    }

    async syncMissed(req, res) {
        try {
            const data = await this.container.detectAndSyncMissedAppointments.execute(req.body);
            return res.status(200).json({
                status: "success",
                message: "Missed appointments detection and synchronization executed successfully.",
                data,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                error: {
                    code: "INTERNAL_ERROR",
                    message: err.message,
                },
            });
        }
    }
}

module.exports = AppointmentController;
