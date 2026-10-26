const BalanceCalculator = require("../../domain/services/balance.calculator");

/**
 * GetPaymentHistory Use Case (Task 9)
 * 
 * Displays payment ledger history containing:
 * - Amount
 * - Due Date / Payment Date
 * - Recorded by
 */
class GetPaymentHistory {
    constructor(paymentRepository, patientRepository, procedureRepository) {
        this.paymentRepository = paymentRepository;
        this.patientRepository = patientRepository;
        this.procedureRepository = procedureRepository;
    }

    async execute(patientId) {
        if (!patientId) {
            throw new Error("PatientId is required to fetch payment history.");
        }

        const patient = this.patientRepository?.findById
            ? await this.patientRepository.findById(patientId)
            : null;

        if (!patient) {
            throw new Error(`Patient with ID ${patientId} not found.`);
        }

        const rawPayments = await this.paymentRepository.findByPatientId(patientId);
        const procedures = this.procedureRepository?.findByPatientId
            ? await this.procedureRepository.findByPatientId(patientId)
            : (patient.procedures || []);

        const totalCost = BalanceCalculator.calculateTotalProcedureCost(procedures);
        const totalPaid = BalanceCalculator.calculateTotalPayments(rawPayments);
        const remainingFee = BalanceCalculator.calculateRemainingFee(totalCost, totalPaid);

        // Format history displaying: Amount, Due Date, Recorded by (Task 9)
        const paymentHistory = rawPayments.map((p, idx) => {
            const dateVal = p.PaymentDate || p.paymentDate || p.payment_date || new Date();
            const recordedByName = p.recordedByDetails?.fullName || p.RecordedBy || p.recordedBy || "Front Desk";
            return {
                PaymentId: p.PaymentId || p.paymentId || p.id || `RCP-${idx + 1}`,
                PatientId: patientId,
                Amount: Number(p.Amount !== undefined ? p.Amount : p.amount),
                DueDate: dateVal instanceof Date ? dateVal.toISOString() : new Date(dateVal).toISOString(),
                PaymentDate: dateVal instanceof Date ? dateVal.toISOString() : new Date(dateVal).toISOString(),
                RecordedBy: recordedByName,
                recordedBy: recordedByName,
                recordStatus: p.recordStatus || "ACTIVE",
            };
        });

        return {
            patientId,
            patientName: patient.name || patient.fullName,
            remainingFee,
            totalProcedureCost: totalCost,
            totalPaid,
            paymentHistory,
            // Aliased for convenience
            payments: paymentHistory,
        };
    }
}

module.exports = GetPaymentHistory;
