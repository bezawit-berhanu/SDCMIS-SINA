/**
 * Application Use Case: DetectAndSyncMissedAppointments
 * Implements Task 5 & 6:
 * - Scheduler background process to periodically check appointments
 * - Missed appointment detection logic (Appointment Date Passed + No completed visit -> Missed)
 */
class DetectAndSyncMissedAppointments {
    constructor({ appointmentRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
        this.timer = null;
        this.intervalMs = 60000; // default check every 1 minute
    }

    async execute(options = {}) {
        const currentDate = options.currentDate ? new Date(options.currentDate) : new Date();
        const result = await this.appointmentRepository.detectAndMarkMissed(currentDate);

        return {
            ...result,
            checkedAt: currentDate.toISOString(),
        };
    }

    startScheduler(intervalMs = 60000) {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.intervalMs = intervalMs;
        this.timer = setInterval(async () => {
            try {
                const res = await this.execute();
                if (res.updatedCount > 0) {
                    console.log(`[AppointmentScheduler] Detected and updated ${res.updatedCount} missed appointment(s).`);
                }
            } catch (err) {
                console.error("[AppointmentScheduler] Error checking missed appointments:", err.message);
            }
        }, this.intervalMs);

        // Don't prevent process from exiting in test environments
        if (this.timer.unref) {
            this.timer.unref();
        }

        console.log(`[AppointmentScheduler] Background appointment scheduler started (Interval: ${this.intervalMs}ms).`);
        return this;
    }

    stopScheduler() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log("[AppointmentScheduler] Background appointment scheduler stopped.");
        }
    }
}

module.exports = DetectAndSyncMissedAppointments;
