const { RecordStatus, ProcedureStatus } = require("../enums/enum");

class Procedure {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.id ?? null;
        const patientId = params.patientId || params.patient_id || null;
        const description = params.description || "";
        const status = params.status || ProcedureStatus.NEXT;
        const cost = params.cost !== undefined && params.cost !== null ? Number(params.cost) : 0;
        const targetDate = params.targetDate || params.target_date || new Date();
        const completedDate = params.completedDate || params.completed_date || null;
        const createdByUserId = params.createdByUserId || params.created_by_user_id || null;
        const recordStatus = params.recordStatus || params.record_status || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || params.created_at || new Date();
        const updatedAt = params.updatedAt || params.updated_at || new Date();
        const deletedAt = params.deletedAt ?? null;

        if (typeof description !== "string" || description.trim().length < 1 || description.trim().length > 500) {
            throw new Error("Procedure description must contain between 1 and 500 characters.");
        }

        if (!Object.values(ProcedureStatus).includes(status)) {
            throw new Error("Invalid procedure status.");
        }

        if (Number.isNaN(cost) || cost < 0) {
            throw new Error("Procedure cost cannot be negative.");
        }

        this.id = id;
        this.patientId = patientId;
        this.description = description.trim();
        this.status = status;
        this.cost = Number(cost.toFixed(2));
        this.targetDate = targetDate instanceof Date ? targetDate : new Date(targetDate);
        this.completedDate = completedDate ? (completedDate instanceof Date ? completedDate : new Date(completedDate)) : null;
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
            description: this.description,
            status: this.status,
            cost: this.cost,
            targetDate: this.targetDate,
            completedDate: this.completedDate,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = Procedure;
