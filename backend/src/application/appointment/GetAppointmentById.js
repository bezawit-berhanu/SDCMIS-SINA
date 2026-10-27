/**
 * Application Use Case: GetAppointmentById
 * Retrieves detailed appointment records with resolved patient demographics and procedure metadata.
 */
class GetAppointmentById {
    constructor({ appointmentRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
    }

    async execute(id) {
        if (!id) {
            const err = new Error("Appointment ID is required.");
            err.statusCode = 400;
            throw err;
        }

        const appointment = await this.appointmentRepository.findById(id);
        if (!appointment) {
            const err = new Error(`Appointment with ID "${id}" was not found.`);
            err.statusCode = 404;
            throw err;
        }

        return appointment;
    }
}

module.exports = GetAppointmentById;
