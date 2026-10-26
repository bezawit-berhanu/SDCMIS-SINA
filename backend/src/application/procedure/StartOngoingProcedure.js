const { ProcedureStatus } = require("../../domain/enums/enum");

/**
 * StartOngoingProcedure Use Case (Task 4)
 * Transitions procedure status: Next -> Ongoing
 */
class StartOngoingProcedure {
    constructor(procedureRepository, patientRepository) {
        this.procedureRepository = procedureRepository;
        this.patientRepository = patientRepository;
    }

    async execute({ procedureId, patientId } = {}) {
        let procedure = null;

        if (procedureId) {
            procedure = await this.procedureRepository.findById(procedureId);
            if (!procedure) {
                throw new Error(`Procedure with ID ${procedureId} not found.`);
            }
        } else if (patientId) {
            procedure = await this.procedureRepository.findNextByPatientId(patientId);
            if (!procedure) {
                throw new Error(`No upcoming next procedure found for patient ${patientId}.`);
            }
        } else {
            throw new Error("Either procedureId or patientId must be provided.");
        }

        // Validate state before transition (Task 4)
        if (procedure.status === ProcedureStatus.DONE) {
            throw new Error("Cannot transition a completed procedure back to ongoing.");
        }

        if (procedure.status === ProcedureStatus.ONGOING) {
            return {
                procedure,
                message: "Procedure is already in ONGOING status.",
            };
        }

        if (procedure.status !== ProcedureStatus.NEXT) {
            throw new Error(`Cannot transition procedure from ${procedure.status} to ONGOING.`);
        }

        // Transition Next -> Ongoing
        procedure.transitionToOngoing();

        const updated = await this.procedureRepository.update(procedure.id, {
            status: ProcedureStatus.ONGOING,
        });

        return {
            procedure: updated,
            message: "Procedure status transitioned from Next to Ongoing successfully.",
        };
    }
}

module.exports = StartOngoingProcedure;
