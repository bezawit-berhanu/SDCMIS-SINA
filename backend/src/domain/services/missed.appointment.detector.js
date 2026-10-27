const { AppointmentStatus, ProcedureStatus } = require("../enums/enum");

/**
 * Domain Service: MissedAppointmentDetector
 * Implements business rule:
 *   Appointment Date Passed
 *       +
 *   No completed visit
 *       ↓
 *   Missed Appointment
 */
class MissedAppointmentDetector {
    /**
     * Determines whether an individual appointment should be classified as missed.
     * @param {Object} appointment Appointment domain entity or data object
     * @param {Object} context Optional clinical context: { completedVisit: boolean, procedureStatus: string, currentDate: Date }
     * @returns {boolean}
     */
    static shouldBeMarkedMissed(appointment, context = {}) {
        if (!appointment) return false;

        const status = (appointment.status || "").toUpperCase();

        // Already attended, completed, or formally cancelled appointments cannot become missed
        if (status === AppointmentStatus.ATTENDED || status === AppointmentStatus.CANCELLED) {
            return false;
        }

        // Already marked missed
        if (status === AppointmentStatus.MISSED) {
            return true;
        }

        const now = context.currentDate instanceof Date
            ? context.currentDate
            : (context.currentDate ? new Date(context.currentDate) : new Date());

        const aptDate = appointment.appointmentDate instanceof Date
            ? appointment.appointmentDate
            : new Date(appointment.appointmentDate || appointment.scheduledDate);

        if (Number.isNaN(aptDate.getTime())) {
            return false;
        }

        // Condition 1: Appointment Date Passed
        const datePassed = aptDate.getTime() < now.getTime();
        if (!datePassed) {
            return false;
        }

        // Condition 2: No completed visit
        // Check if there is an explicit completed visit flag or if linked procedure is already DONE
        const hasCompletedVisit = Boolean(context.completedVisit);
        const procedureDone = context.procedureStatus && context.procedureStatus.toUpperCase() === ProcedureStatus.DONE;

        if (hasCompletedVisit || procedureDone) {
            return false;
        }

        return true;
    }

    /**
     * Evaluates a collection of appointments and returns those that qualify as missed.
     * @param {Array} appointments Array of appointment objects/entities
     * @param {Object} options Optional evaluation settings: { currentDate: Date, procedureMap: Map }
     * @returns {Array} Array of missed appointment entities/records
     */
    static detectMissed(appointments = [], options = {}) {
        if (!Array.isArray(appointments)) return [];

        const now = options.currentDate || new Date();
        const procedureMap = options.procedureMap || new Map();

        return appointments.filter((apt) => {
            const procStatus = apt.procedureId ? procedureMap.get(apt.procedureId)?.status : null;
            return this.shouldBeMarkedMissed(apt, {
                currentDate: now,
                procedureStatus: procStatus,
                completedVisit: apt.completedVisit,
            });
        });
    }
}

module.exports = MissedAppointmentDetector;
