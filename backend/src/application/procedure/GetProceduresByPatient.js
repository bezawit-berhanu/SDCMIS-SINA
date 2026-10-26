const { ProcedureStatus } = require("../../domain/enums/enum");
const BalanceCalculator = require("../../domain/services/balance.calculator");

/**
 * GetProceduresByPatient Use Case (Task 2 - CRUD Read)
 */
class GetProceduresByPatient {
    constructor(procedureRepository, patientRepository) {
        this.procedureRepository = procedureRepository;
        this.patientRepository = patientRepository;
    }

    async execute(patientId) {
        if (!patientId) {
            throw new Error("PatientId is required to retrieve procedures.");
        }

        const procedures = await this.procedureRepository.findByPatientId(patientId);

        const nextProcedure = procedures.find((p) => p.status === ProcedureStatus.NEXT) || null;
        const ongoingProcedure = procedures.find((p) => p.status === ProcedureStatus.ONGOING) || null;
        const completedProcedures = procedures.filter((p) => p.status === ProcedureStatus.DONE);
        const totalProcedureCost = BalanceCalculator.calculateTotalProcedureCost(procedures);

        return {
            patientId,
            procedures: procedures.map((p) => p.toSafeObject()),
            nextProcedure: nextProcedure ? nextProcedure.toSafeObject() : null,
            ongoingProcedure: ongoingProcedure ? ongoingProcedure.toSafeObject() : null,
            completedProcedures: completedProcedures.map((p) => p.toSafeObject()),
            totalProcedureCost,
        };
    }
}

module.exports = GetProceduresByPatient;
