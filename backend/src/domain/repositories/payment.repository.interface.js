/**
 * Payment Repository Interface
 * Defines contracts for financial payment records and transactions.
 */
class IPaymentRepository {
    async create(payment) {
        throw new Error("IPaymentRepository.create must be implemented");
    }

    async findById(id) {
        throw new Error("IPaymentRepository.findById must be implemented");
    }

    async findByPatientId(patientId) {
        throw new Error("IPaymentRepository.findByPatientId must be implemented");
    }

    async calculateTotalsByPatientId(patientId) {
        throw new Error("IPaymentRepository.calculateTotalsByPatientId must be implemented");
    }
}

module.exports = IPaymentRepository;
