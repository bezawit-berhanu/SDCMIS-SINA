/**
 * Application Use Case: UpdateAppointment
 * Updates appointment details such as scheduled time, clinical procedure association, or notes.
 */
class UpdateAppointment {
    constructor({ appointmentRepository, procedureRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
        this.procedureRepository = procedureRepository;
    }

    async execute(id, updateData = {}, user = null) {
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

        if (updateData.procedureId && this.procedureRepository) {
            const proc = await this.procedureRepository.findById(updateData.procedureId);
            if (!proc) {
                const err = new Error(`Procedure with ID "${updateData.procedureId}" was not found.`);
                err.statusCode = 404;
                throw err;
            }
        }

        const updated = await this.appointmentRepository.update(id, updateData);
        return updated;
    }
}

module.exports = UpdateAppointment;
