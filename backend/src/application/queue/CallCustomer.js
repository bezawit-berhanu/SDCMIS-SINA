const { QueueStatus } = require("../../domain/enums/enum");

class CallCustomer {
    constructor({ queueRepository, notificationRepository, patientRepository, userRepository, realtimeGateway } = {}) {
        this.queueRepository = queueRepository;
        this.notificationRepository = notificationRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.realtimeGateway = realtimeGateway;
    }

    async execute(payload = {}) {
        const { queueEntryId, callerUserId } = payload;
        let { dentistId, dentistName } = payload;

        let entry;
        if (queueEntryId) {
            entry = await this.queueRepository.findById(queueEntryId);
            if (!entry) {
                const error = new Error(`Queue entry with ID ${queueEntryId} not found.`);
                error.statusCode = 404;
                throw error;
            }
        } else {
            // If no ID specified, automatically find the next waiting patient
            entry = await this.queueRepository.findNextWaiting();
            if (!entry) {
                const error = new Error("No waiting patients in queue to call.");
                error.statusCode = 404;
                throw error;
            }
        }

        if (entry.status === QueueStatus.DONE || entry.status === QueueStatus.SERVING) {
            const error = new Error("This patient's status can't be changed that way.");
            error.statusCode = 400;
            error.code = "INVALID_QUEUE_TRANSITION";
            error.errorCode = "ERR-INVALID-QUEUE-TRANSITION";
            throw error;
        }

        // Step 1: Identify dentist
        if (!dentistId) {
            if (entry.dentistId) {
                dentistId = entry.dentistId;
                dentistName = entry.dentistName || dentistName;
            } else if (this.patientRepository && typeof this.patientRepository.findById === "function") {
                try {
                    const patient = await this.patientRepository.findById(entry.patientId);
                    if (patient?.dentistId) {
                        dentistId = patient.dentistId;
                    }
                } catch (_) {}
            }
        }

        // Default dentist fallback if none specified
        if (!dentistId) {
            dentistId = "usr-dentist-01";
            dentistName = dentistName || "Dr. Sara";
        }

        // If dentistName not resolved, look up dentist details
        if (!dentistName && this.userRepository && typeof this.userRepository.findById === "function") {
            try {
                const user = await this.userRepository.findById(dentistId);
                if (user?.fullName) {
                    dentistName = `Dr. ${user.fullName}`;
                }
            } catch (_) {}
        }

        dentistName = dentistName || "Dr. Sara";

        // Step 2: Change queue status (WAITING -> SERVING), record calledTime
        const updatedEntry = await this.queueRepository.updateStatus(entry.id, QueueStatus.SERVING, {
            dentistId,
            dentistName,
            calledTime: new Date(),
        });

        // Step 3: Create notification for the identified dentist (SRS FR-DEN-02 & Appendix F)
        // Format: "Upcoming customer: {Customer Name} — {Next Procedure}"
        const patientName = updatedEntry.patientName || updatedEntry.customerName || "Patient";
        const nextProcedure = updatedEntry.serviceType || updatedEntry.procedureName || "(no procedure logged yet)";
        const notificationMessage = `Upcoming customer: ${patientName} — ${nextProcedure}`;
        let notification = null;
        if (this.notificationRepository) {
            try {
                notification = await this.notificationRepository.create({
                    recipientUserId: dentistId,
                    message: notificationMessage,
                    relatedQueueEntryId: updatedEntry.id,
                });
            } catch (_) {}
        }

        // Step 4: Dispatch real-time notifications to Dentist and Customer browsers
        if (this.realtimeGateway) {
            try {
                this.realtimeGateway.broadcastPatientCalled(updatedEntry, notification);
                this.realtimeGateway.broadcastQueueStatusChanged(updatedEntry, QueueStatus.WAITING);
                const fullList = await this.queueRepository.findTodayQueue();
                this.realtimeGateway.broadcastQueueUpdated(fullList);
            } catch (_) {}
        }

        return {
            success: true,
            queueEntry: updatedEntry,
            notification,
            message: `Patient ${updatedEntry.formattedQueueNumber} is called and dentist notified.`,
        };
    }
}

module.exports = CallCustomer;
