/**
 * Procedure Repository Interface
 * Defines contracts for procedure persistence and querying.
 */
class IProcedureRepository {
    async create(procedure) {
        throw new Error("IProcedureRepository.create must be implemented");
    }

    async findById(id) {
        throw new Error("IProcedureRepository.findById must be implemented");
    }

    async findByPatientId(patientId) {
        throw new Error("IProcedureRepository.findByPatientId must be implemented");
    }

    async findNextByPatientId(patientId) {
        throw new Error("IProcedureRepository.findNextByPatientId must be implemented");
    }

    async findOngoingByPatientId(patientId) {
        throw new Error("IProcedureRepository.findOngoingByPatientId must be implemented");
    }

    async update(id, updateData) {
        throw new Error("IProcedureRepository.update must be implemented");
    }

    async delete(id) {
        throw new Error("IProcedureRepository.delete must be implemented");
    }
}

module.exports = IProcedureRepository;
