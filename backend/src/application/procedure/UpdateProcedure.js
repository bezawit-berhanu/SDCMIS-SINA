/**
 * UpdateProcedure Use Case (Task 2 - CRUD Update)
 */
class UpdateProcedure {
    constructor(procedureRepository, patientRepository) {
        this.procedureRepository = procedureRepository;
        this.patientRepository = patientRepository;
    }

    async execute(procedureId, updateData = {}) {
        if (!procedureId) {
            throw new Error("Procedure ID is required for update.");
        }

        const existing = await this.procedureRepository.findById(procedureId);
        if (!existing) {
            throw new Error(`Procedure with ID ${procedureId} not found.`);
        }

        const updated = await this.procedureRepository.update(procedureId, updateData);

        let remainingFee = 0;
        if (this.patientRepository?.findById) {
            const patient = await this.patientRepository.findById(existing.patientId);
            if (patient) {
                remainingFee = patient.remainingFee || patient.balance || 0;
            }
        }

        return {
            procedure: updated,
            remainingFee,
        };
    }
}

module.exports = UpdateProcedure;
