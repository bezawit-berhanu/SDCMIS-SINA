const { RecordStatus, AppointmentStatus } = require("../enums/enum");

class Appointment {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.appointmentId || params.appointment_id || params.id || null;
        const patientId = params.patientId || params.patient_id || null;
        const procedureId = params.procedureId || params.procedure_id || null;
        const appointmentDate = params.appointmentDate || params.appointment_date || params.scheduledDate || params.scheduled_date || new Date();
        const status = (params.status || AppointmentStatus.UPCOMING).toUpperCase();
        const notes = typeof params.notes === "string" ? params.notes.trim() : (params.notes || "");
        const createdByUserId = params.createdByUserId || params.created_by_user_id || null;
        const recordStatus = params.recordStatus || params.record_status || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || params.created_at || new Date();
        const updatedAt = params.updatedAt || params.updated_at || new Date();
        const deletedAt = params.deletedAt ?? null;

        if (!patientId) {
            throw new Error("PatientId is required for an appointment.");
        }

        const validStatuses = Object.values(AppointmentStatus);
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid appointment status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
        }

        const parsedDate = appointmentDate instanceof Date ? appointmentDate : new Date(appointmentDate);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new Error("Invalid appointment date format.");
        }

        this.id = id;
        this.appointmentId = id;
        this.patientId = String(patientId);
        this.procedureId = procedureId ? String(procedureId) : null;
        this.appointmentDate = parsedDate;
        this.scheduledDate = parsedDate; // Backwards compatibility alias
        this.status = status;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.recordStatus = recordStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
        this.deletedAt = deletedAt ? (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)) : null;
    }

    markMissed() {
        if (this.status === AppointmentStatus.ATTENDED) {
            throw new Error("Cannot mark an attended appointment as missed.");
        }
        if (this.status === AppointmentStatus.CANCELLED) {
            throw new Error("Cannot mark a cancelled appointment as missed.");
        }
        this.status = AppointmentStatus.MISSED;
        this.updatedAt = new Date();
        return this;
    }

    markAttended() {
        if (this.status === AppointmentStatus.CANCELLED) {
            throw new Error("Cannot mark a cancelled appointment as attended.");
        }
        this.status = AppointmentStatus.ATTENDED;
        this.updatedAt = new Date();
        return this;
    }

    cancel(reason = "") {
        if (this.status === AppointmentStatus.ATTENDED) {
            throw new Error("Cannot cancel an already completed/attended appointment.");
        }
        this.status = AppointmentStatus.CANCELLED;
        if (reason) {
            this.notes = this.notes ? `${this.notes} | Cancellation Reason: ${reason}` : `Cancellation Reason: ${reason}`;
        }
        this.updatedAt = new Date();
        return this;
    }

    reschedule(newDate, additionalNotes = "") {
        if (!newDate) {
            throw new Error("New appointment date is required for rescheduling.");
        }
        const parsed = newDate instanceof Date ? newDate : new Date(newDate);
        if (Number.isNaN(parsed.getTime())) {
            throw new Error("Invalid new appointment date format.");
        }

        const oldDateStr = this.appointmentDate.toISOString();
        this.appointmentDate = parsed;
        this.scheduledDate = parsed;
        this.status = AppointmentStatus.UPCOMING;
        const reschedNote = `Rescheduled from ${oldDateStr}`;
        this.notes = this.notes
            ? `${this.notes} | ${reschedNote}${additionalNotes ? ` (${additionalNotes})` : ""}`
            : `${reschedNote}${additionalNotes ? ` (${additionalNotes})` : ""}`;
        this.updatedAt = new Date();
        return this;
    }

    isMissed(currentDate = new Date()) {
        const now = currentDate instanceof Date ? currentDate : new Date(currentDate);
        return (
            this.status !== AppointmentStatus.ATTENDED &&
            this.status !== AppointmentStatus.CANCELLED &&
            this.appointmentDate.getTime() < now.getTime()
        );
    }

    toSafeObject() {
        return {
            appointmentId: this.id,
            id: this.id,
            patientId: this.patientId,
            procedureId: this.procedureId,
            appointmentDate: this.appointmentDate,
            scheduledDate: this.appointmentDate,
            status: this.status,
            notes: this.notes,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = Appointment;
