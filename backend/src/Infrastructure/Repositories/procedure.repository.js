const Procedure = require("../../domain/entities/procedure");
const IProcedureRepository = require("../../domain/repositories/procedure.repository.interface");
const { ProcedureStatus, RecordStatus } = require("../../domain/enums/enum");
const BalanceCalculator = require("../../domain/services/balance.calculator");

class ProcedureRepository extends IProcedureRepository {
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
        if (!patient) return;
        const procedures = (patient.procedures || []).filter((p) => p.recordStatus !== RecordStatus.DELETED && p.record_status !== "DELETED");
        const payments = (patient.payments || []).filter((p) => p.recordStatus !== RecordStatus.DELETED && p.record_status !== "DELETED");
        const newBalance = BalanceCalculator.calculateRemainingFee(procedures, payments);
        patient.remaining_fee = newBalance;
        patient.remainingFee = newBalance;
        patient.balance = newBalance;
    }

    async create(procedureInput) {
        const procedure = procedureInput instanceof Procedure
            ? procedureInput
            : new Procedure(procedureInput);

        const patientId = procedure.patientId;
        if (!patientId) {
            throw new Error("PatientId is required to create a procedure.");
        }

        // Rule (Task 2): Only one next procedure per patient
        if (procedure.status === ProcedureStatus.NEXT) {
            const existingNext = await this.findNextByPatientId(patientId);
            if (existingNext) {
                throw new Error("Only one next procedure per patient is allowed.");
            }
        }

        // In-Memory persistence when patient exists in memory
        const patient = this._findPatientInMemory(patientId);
        if (patient) {
            if (!Array.isArray(patient.procedures)) {
                patient.procedures = [];
            }

            const newId = procedure.id || `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            procedure.id = newId;
            procedure.procedureId = newId;
            procedure.ProcedureId = newId;

            const record = {
                id: newId,
                procedureId: newId,
                ProcedureId: newId,
                patientId: patientId,
                PatientId: patientId,
                name: procedure.name,
                Name: procedure.name,
                description: procedure.description,
                Description: procedure.description,
                cost: procedure.cost,
                Cost: procedure.cost,
                status: procedure.status,
                Status: procedure.status,
                targetDate: procedure.targetDate,
                TargetDate: procedure.targetDate,
                completedDate: procedure.completedDate,
                CompletedDate: procedure.completedDate,
                createdByUserId: procedure.createdByUserId || "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: procedure.createdAt || new Date(),
                updatedAt: new Date(),
            };

            patient.procedures.push(record);
            this._syncPatientBalance(patientId);

            return new Procedure(record);
        }

        // Try Prisma persistence if connected
        try {
            if (this.prisma?.procedure?.create) {
                const created = await this.prisma.procedure.create({
                    data: {
                        id: procedure.id || undefined,
                        patientId: procedure.patientId,
                        name: procedure.name,
                        description: procedure.description,
                        cost: procedure.cost,
                        status: procedure.status,
                        targetDate: procedure.targetDate,
                        completedDate: procedure.completedDate,
                        created_by_user_id: procedure.createdByUserId || "usr-admin-01",
                        record_status: procedure.recordStatus,
                    },
                });

                // Update patient remaining balance
                const allProcs = await this.findByPatientId(patientId);
                const payments = this.prisma.payment ? await this.prisma.payment.findMany({ where: { patient_id: patientId, record_status: "ACTIVE" } }) : [];
                const newBalance = BalanceCalculator.calculateRemainingFee(allProcs, payments);
                if (this.prisma.patient?.update) {
                    await this.prisma.patient.update({
                        where: { id: patientId },
                        data: { remaining_fee: newBalance },
                    });
                }

                return new Procedure(created);
            }
        } catch (_) {
            // Fallback
        }

        throw new Error(`Patient with ID ${patientId} not found.`);
    }

    async findById(id) {
        if (!id) return null;

        const patients = this._getSeedPatients();
        for (const pat of patients) {
            const match = (pat.procedures || []).find((p) =>
                (p.id === id || p.procedureId === id) &&
                p.recordStatus !== RecordStatus.DELETED &&
                p.record_status !== "DELETED"
            );
            if (match) return new Procedure(match);
        }

        try {
            if (this.prisma?.procedure?.findUnique) {
                const found = await this.prisma.procedure.findUnique({
                    where: { id },
                });
                if (found && found.record_status !== "DELETED") {
                    return new Procedure(found);
                }
            }
        } catch (_) {}

        return null;
    }

    async findByPatientId(patientId) {
        if (!patientId) return [];

        const patient = this._findPatientInMemory(patientId);
        if (patient && Array.isArray(patient.procedures)) {
            return patient.procedures
                .filter((p) => p.recordStatus !== RecordStatus.DELETED && p.record_status !== "DELETED")
                .map((p) => new Procedure(p));
        }

        try {
            if (this.prisma?.procedure?.findMany) {
                const list = await this.prisma.procedure.findMany({
                    where: {
                        patientId,
                        record_status: "ACTIVE",
                    },
                    orderBy: { targetDate: "asc" },
                });
                return list.map((p) => new Procedure(p));
            }
        } catch (_) {}

        return [];
    }

    async findNextByPatientId(patientId) {
        const procedures = await this.findByPatientId(patientId);
        return procedures.find((p) => p.status === ProcedureStatus.NEXT) || null;
    }

    async findOngoingByPatientId(patientId) {
        const procedures = await this.findByPatientId(patientId);
        return procedures.find((p) => p.status === ProcedureStatus.ONGOING) || null;
    }

    async update(id, updateData = {}) {
        if (!id) throw new Error("Procedure ID is required for update.");

        const existing = await this.findById(id);
        if (!existing) {
            throw new Error(`Procedure with ID ${id} not found.`);
        }

        // If updating status to NEXT, enforce single Next procedure rule
        const newStatus = updateData.status || updateData.Status;
        if (newStatus === ProcedureStatus.NEXT && existing.status !== ProcedureStatus.NEXT) {
            const currentNext = await this.findNextByPatientId(existing.patientId);
            if (currentNext && currentNext.id !== id) {
                throw new Error("Only one next procedure per patient is allowed.");
            }
        }

        // 1. In-memory update if patient is in memory
        const patient = this._findPatientInMemory(existing.patientId);
        if (patient && Array.isArray(patient.procedures)) {
            const procRecord = patient.procedures.find((p) => p.id === id || p.procedureId === id);
            if (procRecord) {
                if (updateData.name !== undefined) {
                    procRecord.name = updateData.name;
                    procRecord.Name = updateData.name;
                }
                if (updateData.description !== undefined) {
                    procRecord.description = updateData.description;
                    procRecord.Description = updateData.description;
                }
                if (updateData.cost !== undefined) {
                    const c = Number(updateData.cost);
                    procRecord.cost = c;
                    procRecord.Cost = c;
                }
                if (newStatus !== undefined) {
                    procRecord.status = newStatus;
                    procRecord.Status = newStatus;
                }
                if (updateData.targetDate !== undefined) {
                    const td = updateData.targetDate ? new Date(updateData.targetDate) : null;
                    procRecord.targetDate = td;
                    procRecord.TargetDate = td;
                }
                if (updateData.completedDate !== undefined) {
                    const cd = updateData.completedDate ? new Date(updateData.completedDate) : null;
                    procRecord.completedDate = cd;
                    procRecord.CompletedDate = cd;
                }
                procRecord.updatedAt = new Date();
                this._syncPatientBalance(existing.patientId);
                return new Procedure(procRecord);
            }
        }

        // 2. Prisma update
        try {
            if (this.prisma?.procedure?.update) {
                const updatedPrisma = await this.prisma.procedure.update({
                    where: { id },
                    data: {
                        name: updateData.name !== undefined ? updateData.name : undefined,
                        description: updateData.description !== undefined ? updateData.description : undefined,
                        cost: updateData.cost !== undefined ? updateData.cost : undefined,
                        status: newStatus !== undefined ? newStatus : undefined,
                        targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
                        completedDate: updateData.completedDate ? new Date(updateData.completedDate) : undefined,
                        updated_at: new Date(),
                    },
                });

                // Resync balance
                const allProcs = await this.findByPatientId(existing.patientId);
                const payments = this.prisma.payment ? await this.prisma.payment.findMany({ where: { patient_id: existing.patientId, record_status: "ACTIVE" } }) : [];
                const newBalance = BalanceCalculator.calculateRemainingFee(allProcs, payments);
                if (this.prisma.patient?.update) {
                    await this.prisma.patient.update({
                        where: { id: existing.patientId },
                        data: { remaining_fee: newBalance },
                    });
                }

                return new Procedure(updatedPrisma);
            }
        } catch (_) {}

        throw new Error(`Procedure with ID ${id} could not be updated.`);
    }

    async delete(id) {
        if (!id) throw new Error("Procedure ID is required for deletion.");
        const existing = await this.findById(id);
        if (!existing) {
            throw new Error(`Procedure with ID ${id} not found.`);
        }

        // 1. In-memory deletion
        const patient = this._findPatientInMemory(existing.patientId);
        if (patient && Array.isArray(patient.procedures)) {
            const procRecord = patient.procedures.find((p) => p.id === id || p.procedureId === id);
            if (procRecord) {
                procRecord.recordStatus = RecordStatus.DELETED;
                procRecord.record_status = RecordStatus.DELETED;
                procRecord.deletedAt = new Date();
                this._syncPatientBalance(existing.patientId);
                return true;
            }
        }

        // 2. Prisma deletion
        try {
            if (this.prisma?.procedure?.update) {
                await this.prisma.procedure.update({
                    where: { id },
                    data: { record_status: "DELETED", deletedAt: new Date() },
                });
                return true;
            }
        } catch (_) {}

        return false;
    }
}

module.exports = ProcedureRepository;
