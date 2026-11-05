const { QueueStatus } = require("../../domain/enums/enum");

class CompleteVisit {
    constructor({ queueRepository, autoAdvanceQueue, realtimeGateway } = {}) {
        this.queueRepository = queueRepository;
        this.autoAdvanceQueue = autoAdvanceQueue;
        this.realtimeGateway = realtimeGateway;
    }

    async execute(payload = {}) {
        const { queueEntryId, autoAdvance = false, notes } = payload;

        let entry;
        if (queueEntryId) {
            entry = await this.queueRepository.findById(queueEntryId);
            if (!entry) {
                const error = new Error(`Queue entry with ID ${queueEntryId} not found.`);
                error.statusCode = 404;
                throw error;
            }
        } else {
            // Find current serving patient to complete
            const servingList = await this.queueRepository.findServing();
            if (servingList.length === 0) {
                const error = new Error("No currently SERVING patient visit found to complete.");
                error.statusCode = 404;
                throw error;
            }
            entry = servingList[0];
        }

        if (entry.status !== QueueStatus.SERVING) {
            const error = new Error("This patient's status can't be changed that way.");
            error.statusCode = 400;
            error.code = "INVALID_QUEUE_TRANSITION";
            error.errorCode = "ERR-INVALID-QUEUE-TRANSITION";
            throw error;
        }

        // Transition: SERVING -> DONE
        const completed = await this.queueRepository.updateStatus(entry.id, QueueStatus.DONE, {
            completedTime: new Date(),
            notes: notes !== undefined ? notes : entry.notes,
        });

        // Optionally trigger auto advance
        let nextPatient = null;
        if (autoAdvance && this.autoAdvanceQueue) {
            try {
                const advanceResult = await this.autoAdvanceQueue.execute();
                nextPatient = advanceResult?.queueEntry || null;
            } catch (_) {}
        } else {
            nextPatient = await this.queueRepository.findNextWaiting();
        }

        // Broadcast real-time visit completion
        if (this.realtimeGateway) {
            try {
                this.realtimeGateway.broadcastVisitCompleted(completed, nextPatient);
                const updatedQueue = await this.queueRepository.findTodayQueue();
                this.realtimeGateway.broadcastQueueUpdated(updatedQueue);
            } catch (_) {}
        }

        return {
            success: true,
            queueEntry: completed,
            nextWaiting: nextPatient,
            message: `Visit for patient ${completed.formattedQueueNumber} completed successfully.`,
        };
    }
}

module.exports = CompleteVisit;
