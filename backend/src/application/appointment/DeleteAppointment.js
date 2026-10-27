/**
 * Application Use Case: DeleteAppointment
 * Removes or archives an appointment record.
 */
class DeleteAppointment {
    constructor({ appointmentRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
    }

    async execute(id) {
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

        return this.appointmentRepository.delete(id);
    }
}

module.exports = DeleteAppointment;
