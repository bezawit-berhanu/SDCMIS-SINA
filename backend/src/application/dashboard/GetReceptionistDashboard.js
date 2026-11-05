const { cacheService } = require("../../Infrastructure/cache/cache.service");

/**
 * Use Case: GetReceptionistDashboard
 * Implements FR-REC-01 & SCR-10:
 * Attendance statistics dashboard:
 * - scheduledThisMonth: number of customers with appointments scheduled for current month
 * - noShowsLastMonth: number of customers who did not come (MISSED) last month
 * - attendedThisMonth: number of customers who have come in during current month
 * Computations evaluated against clinic local calendar month per BR-23.
 */
class GetReceptionistDashboard {
    constructor({ appointmentRepository, queueRepository } = {}) {
        this.appointmentRepository = appointmentRepository;
        this.queueRepository = queueRepository;
    }

    async execute(options = {}) {
        const cacheKey = "receptionist:dashboard";

        if (!options.bypassCache) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        // First day of current month and last day of current month
        const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
        const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        // Previous month boundaries
        const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        let scheduledThisMonth = 0;
        let noShowsLastMonth = 0;
        let attendedThisMonth = 0;

        try {
            const allAppointments = await this.appointmentRepository.findAll({ limit: 10000 });
            const list = Array.isArray(allAppointments) ? allAppointments : allAppointments.appointments || [];

            for (const appt of list) {
                const apptDate = new Date(appt.scheduled_date || appt.scheduledDate || appt.appointmentDate);
                const status = (appt.status || "").toUpperCase();

                // Current month scheduled count
                if (apptDate >= startOfCurrentMonth && apptDate <= endOfCurrentMonth) {
                    scheduledThisMonth += 1;
                    if (status === "ATTENDED" || status === "DONE" || status === "COMPLETED") {
                        attendedThisMonth += 1;
                    }
                }

                // Last month no-shows
                if (apptDate >= startOfLastMonth && apptDate <= endOfLastMonth) {
                    if (status === "MISSED") {
                        noShowsLastMonth += 1;
                    }
                }
            }
        } catch (_) {
            // Graceful fallback if appointments query is empty
        }

        const result = {
            scheduledThisMonth,
            noShowsLastMonth,
            attendedThisMonth,
            computedAt: new Date().toISOString(),
        };

        // Cache for 60 seconds
        cacheService.set(cacheKey, result, 60000);

        return result;
    }
}

module.exports = GetReceptionistDashboard;
