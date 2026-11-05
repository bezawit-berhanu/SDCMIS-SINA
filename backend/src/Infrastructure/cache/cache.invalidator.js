const { cacheService } = require("./cache.service");

/**
 * Cache Invalidator Service
 * Automates cache eviction when domain entities undergo mutations (Create, Update, Delete)
 * Satisfies SRS BR-33 and NFR-REL-03:
 * "Dashboard statistics reflect current database state without stale cache issues."
 */
class CacheInvalidator {
    static invalidateDashboardCaches() {
        cacheService.del("dentist:dashboard");
        cacheService.del("receptionist:dashboard");
        cacheService.delPattern("^patient:");
    }

    static onPatientMutated(patientId) {
        CacheInvalidator.invalidateDashboardCaches();
        if (patientId) {
            cacheService.del(`patient:${patientId}`);
            cacheService.del(`patient:${patientId}:procedures`);
            cacheService.del(`patient:${patientId}:payments`);
            cacheService.del(`customer:dashboard:${patientId}`);
        }
    }

    static onProcedureMutated(patientId) {
        CacheInvalidator.invalidateDashboardCaches();
        if (patientId) {
            cacheService.del(`patient:${patientId}`);
            cacheService.del(`patient:${patientId}:procedures`);
            cacheService.del(`customer:dashboard:${patientId}`);
        }
    }

    static onPaymentMutated(patientId) {
        CacheInvalidator.invalidateDashboardCaches();
        if (patientId) {
            cacheService.del(`patient:${patientId}`);
            cacheService.del(`patient:${patientId}:payments`);
            cacheService.del(`customer:dashboard:${patientId}`);
        }
    }

    static onQueueMutated(patientId) {
        cacheService.del("receptionist:dashboard");
        if (patientId) {
            cacheService.del(`customer:dashboard:${patientId}`);
        }
    }
}

module.exports = CacheInvalidator;
