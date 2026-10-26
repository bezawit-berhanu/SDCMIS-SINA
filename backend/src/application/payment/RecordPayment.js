const Payment = require("../../domain/entities/payment");
const { UserRole } = require("../../domain/enums/enum");

/**
 * RecordPayment Use Case (Task 7)
 * 
 * Rules:
 * - Receptionist / Dentist Can record payment
 * - Validate: Amount > 0
 * - Validate: Patient Exists
 * - Validate: Payment does not exceed permitted balance if required
 */
class RecordPayment {
    constructor(paymentRepository, patientRepository) {
        this.paymentRepository = paymentRepository;
        this.patientRepository = patientRepository;
    }

    async execute(input = {}, actor = {}) {
        const patientId = input.PatientId || input.patientId || input.patient_id;
        const rawAmount = input.Amount !== undefined ? input.Amount : input.amount;
        const amount = Number(rawAmount);

        // 1. Role Authorization Check: Receptionist / Dentist Can record payment (Task 7)
        const role = actor.role || actor.userRole || input.userRole;
        if (role) {
            const normalizedRole = String(role).toUpperCase();
            const allowedRoles = [UserRole.RECEPTIONIST, UserRole.DENTIST, "ADMIN", "SUPERADMIN"];
            if (!allowedRoles.includes(normalizedRole)) {
                throw new Error("Unauthorized: Only a Receptionist or Dentist can record payments.");
            }
        }

        // 2. Validate: Amount > 0 (Task 7)
        if (Number.isNaN(amount) || amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        // 3. Validate: Patient Exists (Task 7)
        if (!patientId) {
            throw new Error("PatientId is required to record a payment.");
        }

        let patient = null;
        if (this.patientRepository?.findById) {
            patient = await this.patientRepository.findById(patientId);
        }
        if (!patient) {
            throw new Error(`Patient with ID ${patientId} does not exist.`);
        }

        // 4. Validate: Payment does not exceed permitted balance if required (Task 7)
        const currentBalance = Number(patient.remainingFee ?? patient.balance ?? 0);
        const enforceBalance = input.enforcePermittedBalance === true || input.overpaymentPolicy === "REJECT";
        if (enforceBalance && currentBalance > 0 && amount > currentBalance) {
            throw new Error(`Payment amount ($${amount.toFixed(2)}) exceeds permitted outstanding balance ($${currentBalance.toFixed(2)}).`);
        }

        const recordedBy = actor.id || actor.fullName || input.RecordedBy || input.recordedBy || "usr-receptionist-01";
        const paymentDate = input.PaymentDate || input.paymentDate || new Date();

        const payment = new Payment({
            patientId,
            amount,
            paymentDate,
            recordedBy,
        });

        const createdPayment = await this.paymentRepository.create(payment, {
            enforcePermittedBalance: enforceBalance,
        });

        // Re-read updated patient remaining balance (Task 8)
        let updatedBalance = 0;
        let totalPaid = 0;
        if (this.patientRepository?.findById) {
            const refreshed = await this.patientRepository.findById(patientId);
            if (refreshed) {
                updatedBalance = Number(refreshed.remainingFee ?? refreshed.balance ?? 0);
            }
        }
        if (this.paymentRepository?.calculateTotalsByPatientId) {
            totalPaid = await this.paymentRepository.calculateTotalsByPatientId(patientId);
        }

        return {
            payment: createdPayment,
            patientId,
            remainingFee: updatedBalance,
            totalPaid,
            message: "Payment successfully recorded and account balance updated.",
        };
    }
}

module.exports = RecordPayment;
