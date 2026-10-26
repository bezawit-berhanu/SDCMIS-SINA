/**
 * DeleteProcedure Use Case (Task 2 - CRUD Delete)
 */
class DeleteProcedure {
    constructor(procedureRepository, patientRepository) {
        this.procedureRepository = procedureRepository;
        this.patientRepository = patientRepository;
    }

    async execute(procedureId) {
        if (!procedureId) {
            throw new Error("Procedure ID is required for deletion.");
        }

        const existing = await this.procedureRepository.findById(procedureId);
        if (!existing) {
            throw new Error(`Procedure with ID ${procedureId} not found.`);
        }

        const success = await this.procedureRepository.delete(procedureId);

        let remainingFee = 0;
        if (this.patientRepository?.findById) {
            const patient = await this.patientRepository.findById(existing.patientId);
            if (patient) {
                remainingFee = patient.remainingFee || patient.balance || 0;
            }
        }

        return {
            success,
            deletedId: procedureId,
            remainingFee,
        };
    }
}

module.exports = DeleteProcedure;
