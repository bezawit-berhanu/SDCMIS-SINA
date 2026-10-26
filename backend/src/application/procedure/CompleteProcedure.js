const { ProcedureStatus } = require("../../domain/enums/enum");

/**
 * CompleteProcedure Use Case (Task 5)
 * Sets procedure status from Ongoing to Done and records completedDate.
 */
class CompleteProcedure {
    constructor(procedureRepository, patientRepository) {
        this.procedureRepository = procedureRepository;
        this.patientRepository = patientRepository;
    }

    async execute({ procedureId, patientId, completionDate } = {}) {
        let procedure = null;

        if (procedureId) {
            procedure = await this.procedureRepository.findById(procedureId);
            if (!procedure) {
                throw new Error(`Procedure with ID ${procedureId} not found.`);
            }
        } else if (patientId) {
            procedure = await this.procedureRepository.findOngoingByPatientId(patientId);
            if (!procedure) {
                throw new Error(`No active ongoing procedure found for patient ${patientId}.`);
            }
        } else {
            throw new Error("Either procedureId or patientId must be provided.");
        }

        if (procedure.status === ProcedureStatus.DONE) {
            return {
                procedure,
                message: "Procedure is already completed.",
            };
        }

        const date = completionDate ? new Date(completionDate) : new Date();

        // Mark completed (Task 5)
        procedure.markCompleted(date);

        const updated = await this.procedureRepository.update(procedure.id, {
            status: ProcedureStatus.DONE,
            completedDate: date,
        });

        return {
            procedure: updated,
            message: "Procedure marked as completed successfully.",
        };
    }
}

module.exports = CompleteProcedure;
