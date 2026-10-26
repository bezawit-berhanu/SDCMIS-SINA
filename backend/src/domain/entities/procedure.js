const { RecordStatus, ProcedureStatus } = require("../enums/enum");

/**
 * Procedure Domain Entity
 * 
 * Model Tree:
 * Procedure
 * ├── ProcedureId
 * ├── PatientId
 * ├── Name
 * ├── Description
 * ├── Cost
 * ├── Status
 * ├── TargetDate
 * └── CompletedDate
 */
class Procedure {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.ProcedureId ?? params.procedureId ?? params.id ?? params.procedure_id ?? null;
        const patientId = params.PatientId || params.patientId || params.patient_id || null;

        const rawName = params.Name || params.name || params.procedureName || params.procedure_name || "";
        const rawDesc = params.Description || params.description || "";

        // Resolve name and description gracefully with fallback
        const name = (rawName || rawDesc.slice(0, 120)).trim();
        const description = (rawDesc || rawName).trim();

        const status = params.Status || params.status || ProcedureStatus.NEXT;

        const rawCost = params.Cost !== undefined && params.Cost !== null
            ? params.Cost
            : (params.cost !== undefined && params.cost !== null ? params.cost : 0);
        const cost = Number(rawCost);

        const rawTargetDate = params.TargetDate || params.targetDate || params.target_date || new Date();
        const rawCompletedDate = params.CompletedDate !== undefined
            ? params.CompletedDate
            : (params.completedDate !== undefined ? params.completedDate : params.completed_date);

        const createdByUserId = params.createdByUserId || params.created_by_user_id || null;
        const recordStatus = params.recordStatus || params.record_status || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || params.created_at || new Date();
        const updatedAt = params.updatedAt || params.updated_at || new Date();
        const deletedAt = params.deletedAt ?? null;

        // Validations
        if (typeof name !== "string" || name.length < 1 || name.length > 120) {
            throw new Error("Procedure name must contain between 1 and 120 characters.");
        }

        if (typeof description !== "string" || description.length < 1 || description.length > 500) {
            throw new Error("Procedure description must contain between 1 and 500 characters.");
        }

        if (!Object.values(ProcedureStatus).includes(status)) {
            throw new Error("Invalid procedure status.");
        }

        if (Number.isNaN(cost) || cost < 0) {
            throw new Error("Procedure cost cannot be negative.");
        }

        const targetDate = rawTargetDate instanceof Date ? rawTargetDate : new Date(rawTargetDate);
        if (Number.isNaN(targetDate.getTime())) {
            throw new Error("Invalid procedure target date.");
        }

        let completedDate = null;
        if (rawCompletedDate) {
            completedDate = rawCompletedDate instanceof Date ? rawCompletedDate : new Date(rawCompletedDate);
            if (Number.isNaN(completedDate.getTime())) {
                throw new Error("Invalid procedure completed date.");
            }
        }

        // Canonical properties
        this.id = id;
        this.procedureId = id;
        this.ProcedureId = id;

        this.patientId = patientId;
        this.PatientId = patientId;

        this.name = name;
        this.Name = name;

        this.description = description;
        this.Description = description;

        this.cost = Number(cost.toFixed(2));
        this.Cost = this.cost;

        this.status = status;
        this.Status = status;

        this.targetDate = targetDate;
        this.TargetDate = targetDate;

        this.completedDate = completedDate;
        this.CompletedDate = completedDate;

        // Metadata properties
        this.createdByUserId = createdByUserId;
        this.recordStatus = recordStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
        this.deletedAt = deletedAt ? (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)) : null;
    }

    isNext() {
        return this.status === ProcedureStatus.NEXT;
    }

    isOngoing() {
        return this.status === ProcedureStatus.ONGOING;
    }

    isDone() {
        return this.status === ProcedureStatus.DONE;
    }

    transitionToOngoing() {
        if (this.status === ProcedureStatus.DONE) {
            throw new Error("Cannot transition a completed procedure back to ongoing.");
        }
        this.status = ProcedureStatus.ONGOING;
        this.Status = ProcedureStatus.ONGOING;
        this.updatedAt = new Date();
        return this;
    }

    markCompleted(completionDate = new Date()) {
        const date = completionDate instanceof Date ? completionDate : new Date(completionDate);
        if (Number.isNaN(date.getTime())) {
            throw new Error("Invalid procedure completed date.");
        }
        this.status = ProcedureStatus.DONE;
        this.Status = ProcedureStatus.DONE;
        this.completedDate = date;
        this.CompletedDate = date;
        this.updatedAt = new Date();
        return this;
    }

    toSafeObject() {
        return {
            id: this.id,
            procedureId: this.procedureId,
            ProcedureId: this.ProcedureId,
            patientId: this.patientId,
            PatientId: this.PatientId,
            name: this.name,
            Name: this.Name,
            description: this.description,
            Description: this.Description,
            cost: this.cost,
            Cost: this.Cost,
            status: this.status,
            Status: this.Status,
            targetDate: this.targetDate,
            TargetDate: this.TargetDate,
            completedDate: this.completedDate,
            CompletedDate: this.CompletedDate,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = Procedure;
