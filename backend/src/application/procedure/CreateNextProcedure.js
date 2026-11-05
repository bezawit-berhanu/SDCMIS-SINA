const Procedure = require("../../domain/entities/procedure");
const { ProcedureStatus } = require("../../domain/enums/enum");

/**
 * CreateNextProcedure Use Case (Task 2)
 * 
 * Enforces rule: "Only one next procedure per patient"
 */
class CreateNextProcedure {
    constructor(procedureRepository, patientRepository) {
        this.procedureRepository = procedureRepository;
        this.patientRepository = patientRepository;
    }

    async execute(input = {}) {
        const patientId = input.PatientId || input.patientId || input.patient_id;
        if (!patientId) {
            throw new Error("PatientId is required to schedule next procedure.");
        }

        // 1. Verify patient exists
        if (this.patientRepository?.findById) {
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(`Patient with ID ${patientId} does not exist.`);
            }
        }

        // 2. Enforce: "Only one next procedure per patient" (SRS BR-11, BR-13)
        const existingNext = await this.procedureRepository.findNextByPatientId(patientId);
        if (existingNext) {
            const error = new Error("This patient already has a Next Procedure. Complete or start it before adding another.");
            error.statusCode = 409;
            error.code = "DUPLICATE_NEXT_PROCEDURE";
            error.errorCode = "ERR-DUPLICATE-NEXT-PROCEDURE";
            throw error;
        }

        // 3. Create Procedure with status NEXT
        const procedure = new Procedure({
            patientId,
            name: input.Name || input.name,
            description: input.Description || input.description,
            cost: input.Cost !== undefined ? input.Cost : input.cost,
            status: ProcedureStatus.NEXT,
            targetDate: input.TargetDate || input.targetDate || new Date(),
            createdByUserId: input.createdByUserId || input.RecordedBy || "usr-admin-01",
        });

        const created = await this.procedureRepository.create(procedure);

        // Fetch refreshed patient balance
        let remainingFee = 0;
        if (this.patientRepository?.findById) {
            const updatedPatient = await this.patientRepository.findById(patientId);
            if (updatedPatient) {
                remainingFee = updatedPatient.remainingFee || updatedPatient.balance || 0;
            }
        }

        return {
            procedure: created,
            remainingFee,
        };
    }
}

module.exports = CreateNextProcedure;
