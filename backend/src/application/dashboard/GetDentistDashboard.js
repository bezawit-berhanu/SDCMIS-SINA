const { cacheService } = require("../../Infrastructure/cache/cache.service");

/**
 * Use Case: GetDentistDashboard
 * Implements FR-DEN-01 & SCR-04:
 * Clinic-wide statistics dashboard:
 * - total active patients
 * - total remaining fees owed (aggregate)
 * - patient counts segmented by service type
 * Integrates in-memory caching (NFR-PERF-01) with fresh computation capability (BR-33).
 */
class GetDentistDashboard {
    constructor({ patientRepository, procedureRepository, paymentRepository } = {}) {
        this.patientRepository = patientRepository;
        this.procedureRepository = procedureRepository;
        this.paymentRepository = paymentRepository;
    }

    async execute(options = {}) {
        const cacheKey = "dentist:dashboard";

        if (!options.bypassCache) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Fetch all active patients
        const patients = await this.patientRepository.findAll({ limit: 10000 });
        const patientList = Array.isArray(patients) ? patients : patients.patients || [];

        const totalActivePatients = patientList.length;

        let totalRemainingFee = 0;
        const serviceTypeMap = {};

        for (const p of patientList) {
            const balance = Number(p.remaining_fee ?? p.remainingFee ?? p.balance ?? 0);
            totalRemainingFee += isNaN(balance) ? 0 : balance;

            const service = (p.service_type || p.serviceType || "General Checkup").trim();
            serviceTypeMap[service] = (serviceTypeMap[service] || 0) + 1;
        }

        const byServiceType = Object.entries(serviceTypeMap).map(([serviceType, patientCount]) => ({
            serviceType,
            patientCount,
        }));

        const result = {
            totalActivePatients,
            totalRemainingFee: Number(totalRemainingFee.toFixed(2)),
            byServiceType,
            computedAt: new Date().toISOString(),
        };

        // Cache for 60 seconds
        cacheService.set(cacheKey, result, 60000);

        return result;
    }
}

module.exports = GetDentistDashboard;
