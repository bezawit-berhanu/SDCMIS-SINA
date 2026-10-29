const { QueueStatus } = require("../../domain/enums/enum");

/**
 * GetCustomerQueuePosition
 * Task 4: Resolves customer's ticket number, sequential position in line, and queue status.
 * Example:
 * Your Queue Number: #007
 * Position: 2
 * Status: WAITING
 */
class GetCustomerQueuePosition {
    constructor({ queueRepository } = {}) {
        this.queueRepository = queueRepository;
    }

    async execute(patientId) {
        if (!patientId) {
            const error = new Error("Patient ID is required to determine queue position.");
            error.statusCode = 400;
            throw error;
        }

        const todayQueue = await this.queueRepository.findTodayQueue();
        const activeEntry = todayQueue.find(
            (q) => q.patientId === patientId && (q.status === QueueStatus.WAITING || q.status === QueueStatus.SERVING)
        ) || todayQueue.find((q) => q.patientId === patientId);

        if (!activeEntry) {
            return {
                inQueue: false,
                queueNumber: null,
                formattedQueueNumber: null,
                position: null,
                status: null,
                message: "You are not currently checked into today's dental queue.",
            };
        }

        let position = 0;
        let positionText = "";

        if (activeEntry.status === QueueStatus.WAITING) {
            const waitingEntries = todayQueue
                .filter((q) => q.status === QueueStatus.WAITING)
                .sort((a, b) => a.queueNumber - b.queueNumber);

            const index = waitingEntries.findIndex((q) => q.id === activeEntry.id);
            position = index >= 0 ? index + 1 : 1;
            positionText = `${position}`;
        } else if (activeEntry.status === QueueStatus.SERVING) {
            position = 0;
            positionText = "Now Serving";
        } else {
            position = 0;
            positionText = "Completed";
        }

        return {
            inQueue: true,
            queueEntryId: activeEntry.id,
            queueNumber: activeEntry.queueNumber,
            formattedQueueNumber: activeEntry.formattedQueueNumber,
            position,
            positionText,
            status: activeEntry.status,
            dentist: activeEntry.dentistName || null,
            calledTime: activeEntry.calledTime || null,
            checkInTime: activeEntry.checkInTime || null,
            display: {
                ticket: activeEntry.formattedQueueNumber,
                position,
                status: activeEntry.status,
                summary: `Your Queue Number: ${activeEntry.formattedQueueNumber}\nPosition: ${position}\nStatus: ${activeEntry.status}`,
            },
        };
    }
}

module.exports = GetCustomerQueuePosition;
