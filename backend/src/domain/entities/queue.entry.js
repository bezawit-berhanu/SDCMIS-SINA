const { RecordStatus, QueueStatus } = require("../enums/enum");

/**
 * QueueEntry Domain Entity
 * 
 * Model Tree:
 * QueueEntry
 * ├── QueueEntryId
 * ├── PatientId
 * ├── QueueNumber
 * ├── Status
 * ├── CheckInTime
 * ├── CalledTime
 * └── CompletedTime
 */
class QueueEntry {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.queueEntryId || params.queue_entry_id || params.id || null;
        const patientId = params.patientId || params.patient_id || null;
        const queueNumber = params.queueNumber !== undefined ? params.queueNumber : params.queue_number;
        const status = (params.status || QueueStatus.WAITING).toUpperCase();
        
        const checkInTime = params.checkInTime || params.check_in_time || params.createdAt || params.created_at || new Date();
        const calledTime = params.calledTime || params.called_time || params.called_at || null;
        const completedTime = params.completedTime || params.completed_time || params.completed_at || null;

        const queueDate = params.queueDate || params.queue_date || new Date();
        const dentistId = params.dentistId || params.dentist_id || null;
        const dentistName = params.dentistName || params.dentist_name || null;
        const patientName = params.patientName || params.patient_name || null;
        const serviceType = params.serviceType || params.service_type || null;
        const notes = typeof params.notes === "string" ? params.notes.trim() : (params.notes || "");
        const createdByUserId = params.createdByUserId || params.created_by_user_id || null;
        const recordStatus = params.recordStatus || params.record_status || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || params.created_at || new Date();
        const updatedAt = params.updatedAt || params.updated_at || new Date();
        const deletedAt = params.deletedAt ?? null;

        if (!patientId) {
            throw new Error("PatientId is required for QueueEntry.");
        }

        const validStatuses = Object.values(QueueStatus);
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid queue status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
        }

        const parsedCheckIn = checkInTime instanceof Date ? checkInTime : new Date(checkInTime);
        if (Number.isNaN(parsedCheckIn.getTime())) {
            throw new Error("Invalid check-in time format.");
        }

        const numVal = parseInt(queueNumber, 10);
        if (queueNumber !== undefined && (Number.isNaN(numVal) || numVal < 1)) {
            throw new Error("QueueNumber must be a positive integer greater than zero.");
        }

        this.id = id;
        this.queueEntryId = id;
        this.patientId = String(patientId);
        this.queueNumber = Number.isNaN(numVal) ? 1 : numVal;
        this.status = status;
        this.checkInTime = parsedCheckIn;
        this.calledTime = calledTime ? (calledTime instanceof Date ? calledTime : new Date(calledTime)) : null;
        this.completedTime = completedTime ? (completedTime instanceof Date ? completedTime : new Date(completedTime)) : null;

        this.queueDate = queueDate instanceof Date ? queueDate : new Date(queueDate);
        this.dentistId = dentistId ? String(dentistId) : null;
        this.dentistName = dentistName;
        this.patientName = patientName;
        this.serviceType = serviceType;
        this.notes = notes;
        this.createdByUserId = createdByUserId;
        this.recordStatus = recordStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
        this.deletedAt = deletedAt ? (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)) : null;
    }

    get formattedQueueNumber() {
        return `#${String(this.queueNumber).padStart(3, "0")}`;
    }

    isWaiting() {
        return this.status === QueueStatus.WAITING;
    }

    isServing() {
        return this.status === QueueStatus.SERVING;
    }

    isDone() {
        return this.status === QueueStatus.DONE;
    }

    canCall() {
        return this.status === QueueStatus.WAITING;
    }

    canComplete() {
        return this.status === QueueStatus.SERVING || this.status === QueueStatus.WAITING;
    }

    /**
     * Transition: WAITING -> SERVING
     * Called by receptionist or dentist to call patient into treatment room
     */
    call(dentistId = null, dentistName = null) {
        if (this.status === QueueStatus.DONE) {
            throw new Error(`Cannot call a patient whose visit is already DONE (Queue ${this.formattedQueueNumber}).`);
        }

        this.status = QueueStatus.SERVING;
        this.calledTime = new Date();
        if (dentistId) {
            this.dentistId = String(dentistId);
        }
        if (dentistName) {
            this.dentistName = String(dentistName);
        }
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Alias for call()
     */
    serve(dentistId = null, dentistName = null) {
        return this.call(dentistId, dentistName);
    }

    markCalled(dentistId = null, dentistName = null, calledTime = null) {
        this.call(dentistId, dentistName);
        if (calledTime) this.calledTime = calledTime;
        return this;
    }

    markCompleted(completedTime = null) {
        this.complete();
        if (completedTime) this.completedTime = completedTime;
        return this;
    }

    /**
     * Transition: SERVING -> DONE (or fast-tracked from WAITING)
     * Marks visit as completed
     */
    complete() {
        if (this.status === QueueStatus.DONE) {
            throw new Error(`Queue entry ${this.formattedQueueNumber} is already completed.`);
        }

        this.status = QueueStatus.DONE;
        this.completedTime = new Date();
        this.updatedAt = new Date();
        return this;
    }

    toSafeObject() {
        return {
            queueEntryId: this.id,
            id: this.id,
            patientId: this.patientId,
            queueNumber: this.queueNumber,
            formattedQueueNumber: this.formattedQueueNumber,
            status: this.status,
            checkInTime: this.checkInTime,
            calledTime: this.calledTime,
            completedTime: this.completedTime,
            queueDate: this.queueDate,
            dentistId: this.dentistId,
            dentistName: this.dentistName,
            patientName: this.patientName,
            serviceType: this.serviceType,
            notes: this.notes,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = QueueEntry;
