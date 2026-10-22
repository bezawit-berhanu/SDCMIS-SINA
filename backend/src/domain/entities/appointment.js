const { RecordStatus, AppointmentStatus } = require("../enums/enum");

class Appointment {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.id ?? null;
        const patientId = params.patientId || params.patient_id || null;
        const procedureId = params.procedureId || params.procedure_id || null;
        const scheduledDate = params.scheduledDate || params.scheduled_date || new Date();
        const status = params.status || AppointmentStatus.UPCOMING;
        const createdByUserId = params.createdByUserId || params.created_by_user_id || null;
        const recordStatus = params.recordStatus || params.record_status || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || params.created_at || new Date();
        const updatedAt = params.updatedAt || params.updated_at || new Date();
        const deletedAt = params.deletedAt ?? null;

        if (!Object.values(AppointmentStatus).includes(status)) {
            throw new Error("Invalid appointment status.");
        }

        this.id = id;
        this.patientId = patientId;
        this.procedureId = procedureId;
        this.scheduledDate = scheduledDate instanceof Date ? scheduledDate : new Date(scheduledDate);
        this.status = status;
        this.createdByUserId = createdByUserId;
        this.recordStatus = recordStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
        this.deletedAt = deletedAt ? (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)) : null;
    }

    toSafeObject() {
        return {
            id: this.id,
            patientId: this.patientId,
            procedureId: this.procedureId,
            scheduledDate: this.scheduledDate,
            status: this.status,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = Appointment;
