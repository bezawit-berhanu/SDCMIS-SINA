class AutoAdvanceQueue {
    constructor({ queueRepository, callCustomer, realtimeGateway } = {}) {
        this.queueRepository = queueRepository;
        this.callCustomer = callCustomer;
        this.realtimeGateway = realtimeGateway;
    }

    async execute(options = {}) {
        const { dentistId, dentistName } = options;

        // Step 1: System identifies next waiting patient in FIFO sequence
        const nextWaiting = await this.queueRepository.findNextWaiting();

        if (!nextWaiting) {
            return {
                advanced: false,
                queueEntry: null,
                message: "No waiting patients remaining in queue.",
            };
        }

        // Step 2: WAITING -> SERVING according to defined queue rules
        const callResult = await this.callCustomer.execute({
            queueEntryId: nextWaiting.id,
            dentistId: dentistId || nextWaiting.dentistId,
            dentistName: dentistName || nextWaiting.dentistName,
        });

        return {
            advanced: true,
            queueEntry: callResult.queueEntry,
            notification: callResult.notification,
            message: `Auto-advanced to next patient ${callResult.queueEntry.formattedQueueNumber} (${callResult.queueEntry.patientName || "Patient"}), status now SERVING.`,
        };
    }
}

module.exports = AutoAdvanceQueue;
