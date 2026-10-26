const Payment = require("../../domain/entities/payment");
const IPaymentRepository = require("../../domain/repositories/payment.repository.interface");
const { RecordStatus } = require("../../domain/enums/enum");
const BalanceCalculator = require("../../domain/services/balance.calculator");

class PaymentRepository extends IPaymentRepository {
    constructor(prisma, patientRepository) {
        super();
        this.prisma = prisma;
        this.patientRepository = patientRepository;
    }

    _getSeedPatients() {
        if (this.patientRepository) {
            if (Array.isArray(this.patientRepository.patients)) {
                return this.patientRepository.patients;
            }
            if (Array.isArray(this.patientRepository.seedPatients)) {
                return this.patientRepository.seedPatients;
            }
        }
        return [];
    }

    _findPatientInMemory(patientId) {
        const patients = this._getSeedPatients();
        return patients.find((p) => p.id === patientId && p.record_status !== RecordStatus.DELETED && !p.deletedAt);
    }

    _syncPatientBalance(patientId) {
        const patient = this._findPatientInMemory(patientId);
        if (!patient) return 0;
        const procedures = (patient.procedures || []).filter((p) => p.recordStatus !== RecordStatus.DELETED && p.record_status !== "DELETED");
        const payments = (patient.payments || []).filter((p) => p.recordStatus !== RecordStatus.DELETED && p.record_status !== "DELETED");
        const newBalance = BalanceCalculator.calculateRemainingFee(procedures, payments);
        patient.remaining_fee = newBalance;
        patient.remainingFee = newBalance;
        patient.balance = newBalance;
        return newBalance;
    }

    async create(paymentInput, options = {}) {
        const payment = paymentInput instanceof Payment
            ? paymentInput
            : new Payment(paymentInput);

        const patientId = payment.patientId;
        if (!patientId) {
            throw new Error("PatientId is required to record payment.");
        }

        // Validate Amount > 0 (handled by entity, check here as well)
        if (payment.amount <= 0) {
            throw new Error("Payment amount must be greater than zero.");
        }

        // Validate Patient Exists
        const patient = this._findPatientInMemory(patientId);
        let currentBalance = 0;
        if (patient) {
            currentBalance = Number(patient.remaining_fee ?? patient.remainingFee ?? patient.balance ?? 0);
        } else {
            // Check Prisma
            try {
                if (this.prisma?.patient?.findUnique) {
                    const p = await this.prisma.patient.findUnique({ where: { id: patientId } });
                    if (!p || p.record_status === "DELETED") {
                        throw new Error(`Patient with ID ${patientId} not found.`);
                    }
                    currentBalance = Number(p.remaining_fee ?? 0);
                } else {
                    throw new Error(`Patient with ID ${patientId} not found.`);
                }
            } catch (err) {
                if (err.message.includes("not found")) throw err;
            }
        }

        // Validate permitted balance if required (Task 7)
        if (options.enforcePermittedBalance || options.policy === "REJECT") {
            if (payment.amount > currentBalance && currentBalance > 0) {
                throw new Error(`Payment amount ($${payment.amount.toFixed(2)}) exceeds permitted outstanding balance ($${currentBalance.toFixed(2)}).`);
            }
        }

        // In-Memory fallback when patient exists in memory
        if (patient) {
            if (!Array.isArray(patient.payments)) {
                patient.payments = [];
            }

            const newId = payment.id || `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            payment.id = newId;
            payment.paymentId = newId;
            payment.PaymentId = newId;

            const record = {
                id: newId,
                paymentId: newId,
                PaymentId: newId,
                patientId: patientId,
                PatientId: patientId,
                patient_id: patientId,
                amount: payment.amount,
                Amount: payment.amount,
                paymentDate: payment.paymentDate,
                PaymentDate: payment.paymentDate,
                payment_date: payment.paymentDate,
                recordedBy: payment.recordedBy,
                RecordedBy: payment.recordedBy,
                recordedByUserId: payment.recordedBy,
                recordStatus: RecordStatus.ACTIVE,
                createdAt: payment.createdAt || new Date(),
                updatedAt: new Date(),
            };

            patient.payments.push(record);
            this._syncPatientBalance(patientId);

            return new Payment(record);
        }

        // Try Prisma
        try {
            if (this.prisma?.payment?.create) {
                const created = await this.prisma.payment.create({
                    data: {
                        id: payment.id || undefined,
                        patient_id: patient.id,
                        amount: payment.amount,
                        payment_date: payment.paymentDate,
                        recorded_by_user_id: payment.recordedBy || "usr-receptionist-01",
                        record_status: payment.recordStatus,
                    },
                    include: {
                        recordedBy: true,
                    },
                });

                // Recalculate balance
                const allProcs = this.prisma.procedure ? await this.prisma.procedure.findMany({ where: { patientId, record_status: "ACTIVE" } }) : [];
                const allPayments = await this.prisma.payment.findMany({ where: { patient_id: patientId, record_status: "ACTIVE" } });
                const newBalance = BalanceCalculator.calculateRemainingFee(allProcs, allPayments);

                if (this.prisma.patient?.update) {
                    await this.prisma.patient.update({
                        where: { id: patientId },
                        data: { remaining_fee: newBalance },
                    });
                }

                const resultPayment = new Payment(created);
                if (created.recordedBy) {
                    resultPayment.recordedByDetails = {
                        id: created.recordedBy.id,
                        fullName: created.recordedBy.fullname,
                        role: created.recordedBy.role,
                    };
                }
                return resultPayment;
            }
        } catch (_) {}

        throw new Error(`Patient with ID ${patientId} not found.`);
    }

    async findById(id) {
        if (!id) return null;

        const patients = this._getSeedPatients();
        for (const pat of patients) {
            const match = (pat.payments || []).find((p) =>
                (p.id === id || p.paymentId === id || p.PaymentId === id) &&
                p.recordStatus !== RecordStatus.DELETED &&
                p.record_status !== "DELETED"
            );
            if (match) return new Payment(match);
        }

        try {
            if (this.prisma?.payment?.findUnique) {
                const found = await this.prisma.payment.findUnique({
                    where: { id },
                    include: { recordedBy: true },
                });
                if (found && found.record_status !== "DELETED") {
                    const pay = new Payment(found);
                    if (found.recordedBy) {
                        pay.recordedByDetails = {
                            id: found.recordedBy.id,
                            fullName: found.recordedBy.fullname,
                            role: found.recordedBy.role,
                        };
                    }
                    return pay;
                }
            }
        } catch (_) {}

        return null;
    }

    async findByPatientId(patientId) {
        if (!patientId) return [];

        const patient = this._findPatientInMemory(patientId);
        if (patient && Array.isArray(patient.payments)) {
            return patient.payments
                .filter((p) => p.recordStatus !== RecordStatus.DELETED && p.record_status !== "DELETED")
                .map((p) => new Payment(p));
        }

        try {
            if (this.prisma?.payment?.findMany) {
                const list = await this.prisma.payment.findMany({
                    where: { patient_id: patientId, record_status: "ACTIVE" },
                    include: { recordedBy: true },
                    orderBy: { payment_date: "desc" },
                });
                return list.map((p) => {
                    const pay = new Payment(p);
                    if (p.recordedBy) {
                        pay.recordedByDetails = {
                            id: p.recordedBy.id,
                            fullName: p.recordedBy.fullname,
                            role: p.recordedBy.role,
                        };
                    }
                    return pay;
                });
            }
        } catch (_) {}

        return [];
    }

    async calculateTotalsByPatientId(patientId) {
        const payments = await this.findByPatientId(patientId);
        return BalanceCalculator.calculateTotalPayments(payments);
    }
}

module.exports = PaymentRepository;
