/**
 * Domain Repository Interface for Queue management.
 * Specifies the contract for patient check-in, live queue displays,
 * state transitions (WAITING -> SERVING -> DONE), and auto-advance.
 */
class IQueueRepository {
    async create(queueEntryData) {
        throw new Error("Method create() must be implemented.");
    }

    async findById(id) {
        throw new Error("Method findById() must be implemented.");
    }

    async findByPatientId(patientId, options = {}) {
        throw new Error("Method findByPatientId() must be implemented.");
    }

    async findTodayQueue(options = {}) {
        throw new Error("Method findTodayQueue() must be implemented.");
    }

    async findWaiting(date = new Date()) {
        throw new Error("Method findWaiting() must be implemented.");
    }

    async findServing(date = new Date()) {
        throw new Error("Method findServing() must be implemented.");
    }

    async findNextWaiting(date = new Date()) {
        throw new Error("Method findNextWaiting() must be implemented.");
    }

    async getNextQueueNumber(date = new Date()) {
        throw new Error("Method getNextQueueNumber() must be implemented.");
    }

    async update(id, updateData) {
        throw new Error("Method update() must be implemented.");
    }

    async updateStatus(id, status, metadata = {}) {
        throw new Error("Method updateStatus() must be implemented.");
    }

    async delete(id) {
        throw new Error("Method delete() must be implemented.");
    }
}

module.exports = IQueueRepository;
