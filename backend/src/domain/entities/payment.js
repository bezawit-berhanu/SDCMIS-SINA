const { RecordStatus } = require("../enums/enum");

class Payment {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.id ?? null;
        const patientId = params.patientId || params.patient_id || null;
        const amount = params.amount !== undefined && params.amount !== null ? Number(params.amount) : 0;
        const paymentDate = params.paymentDate || params.payment_date || new Date();
        const recordedByUserId = params.recordedByUserId || params.recorded_by_user_id || null;
        const recordStatus = params.recordStatus || params.record_status || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || params.created_at || new Date();
        const updatedAt = params.updatedAt || params.updated_at || new Date();
        const deletedAt = params.deletedAt ?? null;

        if (Number.isNaN(amount) || amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        this.id = id;
        this.patientId = patientId;
        this.amount = Number(amount.toFixed(2));
        this.paymentDate = paymentDate instanceof Date ? paymentDate : new Date(paymentDate);
        this.recordedByUserId = recordedByUserId;
        this.recordStatus = recordStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
        this.deletedAt = deletedAt ? (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)) : null;
    }

    toSafeObject() {
        return {
            id: this.id,
            patientId: this.patientId,
            amount: this.amount,
            paymentDate: this.paymentDate,
            recordedByUserId: this.recordedByUserId,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = Payment;
