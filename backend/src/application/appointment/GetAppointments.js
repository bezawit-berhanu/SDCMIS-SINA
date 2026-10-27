/**
 * Application Use Case: GetAppointments
 * Retrieves appointments with flexible filtering for Upcoming Dashboard,
 * Missed Appointments tracking, Patient history, or Full Calendar view.
 */
class GetAppointments {
    constructor({ appointmentRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
    }

    async execute(query = {}) {
        const view = (query.view || "").toLowerCase();

        if (view === "upcoming") {
            return this.appointmentRepository.findUpcoming({
                currentDate: query.currentDate ? new Date(query.currentDate) : new Date(),
            });
        }

        if (view === "missed") {
            return this.appointmentRepository.findMissed({
                currentDate: query.currentDate ? new Date(query.currentDate) : new Date(),
            });
        }

        return this.appointmentRepository.findAll({
            patientId: query.patientId,
            status: query.status,
            procedureId: query.procedureId,
        });
    }
}

module.exports = GetAppointments;
