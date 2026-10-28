const { QueueStatus } = require("../../domain/enums/enum");

class CheckInPatient {
    constructor({ queueRepository, patientRepository, realtimeGateway } = {}) {
        this.queueRepository = queueRepository;
        this.patientRepository = patientRepository;
        this.realtimeGateway = realtimeGateway;
    }

    async execute(payload = {}) {
        const { patientId, dentistId, dentistName, serviceType, notes, createdByUserId } = payload;

        if (!patientId) {
            const error = new Error("Patient ID is required for check-in.");
            error.statusCode = 400;
            throw error;
        }

        // Verify patient
        let patient = null;
        if (this.patientRepository && typeof this.patientRepository.findById === "function") {
            try {
                patient = await this.patientRepository.findById(patientId);
            } catch (_) {}
        }

        // Check if patient already has an active WAITING or SERVING queue entry today
        const todayEntries = await this.queueRepository.findTodayQueue();
        const activeExisting = todayEntries.find(
            (e) => e.patientId === patientId && (e.status === QueueStatus.WAITING || e.status === QueueStatus.SERVING)
        );

        if (activeExisting) {
            const error = new Error(
                `Patient is already checked in with active ticket ${activeExisting.formattedQueueNumber} (${activeExisting.status}).`
            );
            error.statusCode = 409;
            error.activeEntry = activeExisting;
            throw error;
        }

        const patientName = patient?.full_name || patient?.fullName || payload.patientName || "Patient";
        const finalService = serviceType || patient?.service_type || patient?.serviceType || "General Consultation";
        const finalDentistId = dentistId || patient?.dentistId || null;
        const finalDentistName = dentistName || (finalDentistId ? "Assigned Dentist" : null);

        const created = await this.queueRepository.create({
            patientId,
            patientName,
            serviceType: finalService,
            dentistId: finalDentistId,
            dentistName: finalDentistName,
            notes: notes || "",
            status: QueueStatus.WAITING,
            checkInTime: new Date(),
            createdByUserId: createdByUserId || "usr-receptionist-01",
        });

        // Broadcast to WebSocket & SSE listeners
        if (this.realtimeGateway) {
            try {
                this.realtimeGateway.broadcastPatientCheckedIn(created);
                const updatedList = await this.queueRepository.findTodayQueue();
                this.realtimeGateway.broadcastQueueUpdated(updatedList);
            } catch (_) {}
        }

        return created;
    }
}

module.exports = CheckInPatient;
