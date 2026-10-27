const { AppointmentStatus } = require("../../domain/enums/enum");

/**
 * Application Use Case: RescheduleAppointment
 * Implements Task 7 Rescheduling logic:
 *   Dentist/Staff Selects: New appointment date
 *   Then: Missed -> Upcoming
 */
class RescheduleAppointment {
    constructor({ appointmentRepository, patientRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
    }

    async execute(id, payload = {}, user = null) {
        if (!id) {
            const err = new Error("Appointment ID is required for rescheduling.");
            err.statusCode = 400;
            throw err;
        }

        const newDate = payload.newAppointmentDate || payload.appointmentDate || payload.scheduledDate;
        if (!newDate) {
            const err = new Error("New appointment date is required for rescheduling.");
            err.statusCode = 400;
            throw err;
        }

        const parsedDate = new Date(newDate);
        if (Number.isNaN(parsedDate.getTime())) {
            const err = new Error("Invalid new appointment date format.");
            err.statusCode = 400;
            throw err;
        }

        const existing = await this.appointmentRepository.findById(id);
        if (!existing) {
            const err = new Error(`Appointment with ID "${id}" was not found.`);
            err.statusCode = 404;
            throw err;
        }

        const actorName = user?.fullName || user?.name || "Dentist";
        const customNote = payload.notes ? `Note: ${payload.notes}` : "";
        const rescheduleAudit = `Rescheduled by ${actorName} to ${parsedDate.toISOString()}. ${customNote}`.trim();

        // Perform reschedule: Transitions Missed -> Upcoming and sets new date
        const rescheduled = await this.appointmentRepository.reschedule(id, parsedDate, rescheduleAudit);

        // Keep patient in-memory record updated
        if (this.patientRepository?.patients && rescheduled.patientId) {
            const patient = this.patientRepository.patients.find((p) => String(p.id) === String(rescheduled.patientId));
            if (patient && Array.isArray(patient.appointments)) {
                const pAptIdx = patient.appointments.findIndex((a) => String(a.id) === String(id) || String(a.appointmentId) === String(id));
                if (pAptIdx >= 0) {
                    patient.appointments[pAptIdx] = {
                        ...patient.appointments[pAptIdx],
                        appointmentDate: parsedDate,
                        scheduledDate: parsedDate,
                        status: AppointmentStatus.UPCOMING,
                        notes: rescheduled.notes,
                    };
                }
            }
        }

        return rescheduled;
    }
}

module.exports = RescheduleAppointment;
