/**
 * Domain Repository Interface for Appointment management.
 * Specifies the contract for appointment persistence, status transitions,
 * scheduling, and missed appointment detection.
 */
class IAppointmentRepository {
    async create(appointmentData) {
        throw new Error("Method create() must be implemented.");
    }

    async findById(id) {
        throw new Error("Method findById() must be implemented.");
    }

    async findAll(filter = {}) {
        throw new Error("Method findAll() must be implemented.");
    }

    async findByPatientId(patientId) {
        throw new Error("Method findByPatientId() must be implemented.");
    }

    async findUpcoming(options = {}) {
        throw new Error("Method findUpcoming() must be implemented.");
    }

    async findMissed(options = {}) {
        throw new Error("Method findMissed() must be implemented.");
    }

    async update(id, updateData) {
        throw new Error("Method update() must be implemented.");
    }

    async cancel(id, reason = "") {
        throw new Error("Method cancel() must be implemented.");
    }

    async reschedule(id, newDate, additionalNotes = "") {
        throw new Error("Method reschedule() must be implemented.");
    }

    async delete(id) {
        throw new Error("Method delete() must be implemented.");
    }

    async detectAndMarkMissed(currentDate = new Date()) {
        throw new Error("Method detectAndMarkMissed() must be implemented.");
    }
}

module.exports = IAppointmentRepository;
