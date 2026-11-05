const CacheInvalidator = require("../../Infrastructure/cache/cache.invalidator");

/**
 * Application Use Case: DetectAndSyncMissedAppointments
 * Implements SRS FR-DEN-12, BR-21, BR-22:
 * "The system shall automatically identify patients whose scheduled appointment date has passed
 * without a corresponding check-in/queue completion, and list them on a dedicated Missed Appointments page."
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

        if (result && result.updatedCount > 0) {
            CacheInvalidator.invalidateDashboardCaches();
        }

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

        // Don't prevent process from exiting in test or development environments
        if (this.timer && this.timer.unref) {
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
