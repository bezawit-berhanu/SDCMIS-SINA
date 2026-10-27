/**
 * Application Use Case: CancelAppointment
 * Cancels a scheduled appointment with audit reason and state transition to CANCELLED.
 */
class CancelAppointment {
    constructor({ appointmentRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
    }

    async execute(id, payload = {}, user = null) {
        if (!id) {
            const err = new Error("Appointment ID is required.");
            err.statusCode = 400;
            throw err;
        }

        const existing = await this.appointmentRepository.findById(id);
        if (!existing) {
            const err = new Error(`Appointment with ID "${id}" was not found.`);
            err.statusCode = 404;
            throw err;
        }

        const reason = payload.reason || payload.cancellationReason || "Cancelled by clinical staff";
        const cancelled = await this.appointmentRepository.cancel(id, reason);
        return cancelled;
    }
}

module.exports = CancelAppointment;
