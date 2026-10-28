const { QueueStatus } = require("../../domain/enums/enum");

class GetLiveQueue {
    constructor({ queueRepository } = {}) {
        this.queueRepository = queueRepository;
    }

    async execute(query = {}) {
        const { status, date, dentistId } = query;
        let queue = await this.queueRepository.findTodayQueue({ date, status });

        if (dentistId) {
            queue = queue.filter((e) => !e.dentistId || e.dentistId === dentistId);
        }

        // Compute summary metrics
        const allEntries = await this.queueRepository.findTodayQueue({ date });
        const waitingEntries = allEntries.filter((e) => e.status === QueueStatus.WAITING);
        const servingEntries = allEntries.filter((e) => e.status === QueueStatus.SERVING);
        const doneEntries = allEntries.filter((e) => e.status === QueueStatus.DONE);

        const currentServing = servingEntries.length > 0 ? servingEntries[0] : null;
        const nextWaiting = waitingEntries.length > 0 ? waitingEntries[0] : null;

        return {
            queue,
            summary: {
                totalCount: allEntries.length,
                waitingCount: waitingEntries.length,
                servingCount: servingEntries.length,
                doneCount: doneEntries.length,
                currentServing,
                nextWaiting,
                estimatedWaitTimeMinutes: waitingEntries.length * 15,
            },
        };
    }
}

module.exports = GetLiveQueue;
