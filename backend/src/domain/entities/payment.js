const { RecordStatus } = require("../enums/enum");

/**
 * Payment Domain Entity
 * 
 * Model Tree:
 * Payment
 * ├── PaymentId
 * ├── PatientId
 * ├── Amount
 * ├── PaymentDate
 * └── RecordedBy
 */
class Payment {
    constructor(data = {}) {
        const params = (typeof data === "object" && data !== null && !Array.isArray(data)) ? data : {};

        const id = params.PaymentId ?? params.paymentId ?? params.id ?? null;
        const patientId = params.PatientId || params.patientId || params.patient_id || null;
        const rawAmount = params.Amount !== undefined && params.Amount !== null
            ? params.Amount
            : (params.amount !== undefined && params.amount !== null ? params.amount : 0);
        const amount = Number(rawAmount);

        const rawPaymentDate = params.PaymentDate || params.paymentDate || params.payment_date || new Date();
        const recordedBy = params.RecordedBy || params.recordedBy || params.recordedByUserId || params.recorded_by_user_id || null;

        const recordStatus = params.recordStatus || params.record_status || RecordStatus.ACTIVE;
        const createdAt = params.createdAt || params.created_at || new Date();
        const updatedAt = params.updatedAt || params.updated_at || new Date();
        const deletedAt = params.deletedAt ?? null;

        // Validations
        if (Number.isNaN(amount) || amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        if (!patientId || (typeof patientId === "string" && patientId.trim().length === 0)) {
            throw new Error("PatientId is required for payment.");
        }

        const paymentDate = rawPaymentDate instanceof Date ? rawPaymentDate : new Date(rawPaymentDate);
        if (Number.isNaN(paymentDate.getTime())) {
            throw new Error("Invalid payment date.");
        }

        // Tree properties (Task 6)
        this.id = id;
        this.paymentId = id;
        this.PaymentId = id;

        this.patientId = patientId;
        this.PatientId = patientId;

        this.amount = Number(amount.toFixed(2));
        this.Amount = this.amount;

        this.paymentDate = paymentDate;
        this.PaymentDate = paymentDate;

        this.recordedBy = recordedBy;
        this.RecordedBy = recordedBy;
        this.recordedByUserId = recordedBy;

        // Audit & metadata properties
        this.recordStatus = recordStatus;
        this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
        this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
        this.deletedAt = deletedAt ? (deletedAt instanceof Date ? deletedAt : new Date(deletedAt)) : null;
    }

    toSafeObject() {
        return {
            id: this.id,
            paymentId: this.paymentId,
            PaymentId: this.PaymentId,
            patientId: this.patientId,
            PatientId: this.PatientId,
            amount: this.amount,
            Amount: this.Amount,
            paymentDate: this.paymentDate,
            PaymentDate: this.PaymentDate,
            recordedBy: this.recordedBy,
            RecordedBy: this.RecordedBy,
            recordedByUserId: this.recordedByUserId,
            recordStatus: this.recordStatus,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

module.exports = Payment;

