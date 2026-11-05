const logger = require("../../config/logger");
const prisma = require("../prisma");

/**
 * Audit Logger Service
 * Implements SRS NFR-SEC-04 & Section 7.2.8:
 * "Every create/update/delete on Patient, Procedure, Payment, and Appointment records
 * shall be written to the append-only audit log with actor and timestamp."
 */
class AuditLogger {
    /**
     * Records an audit log entry
     * @param {Object} params
     * @param {string} params.actorUserId - User ID who triggered mutation
     * @param {string} params.entityType - 'PATIENT' | 'PROCEDURE' | 'APPOINTMENT' | 'PAYMENT' | 'USER'
     * @param {string} params.entityId - ID of mutated record
     * @param {string} params.action - 'CREATE' | 'UPDATE' | 'DELETE'
     * @param {Object|string} params.changeSummary - Diff or summary of changes
     */
    static async log({ actorUserId, entityType, entityId, action, changeSummary }) {
        const summaryText =
            typeof changeSummary === "object" ? JSON.stringify(changeSummary) : String(changeSummary || "");

        // 1. Write structured log internally
        logger.info(`[AUDIT] ${action} ${entityType} #${entityId} by User ${actorUserId}`, {
            audit: {
                actorUserId,
                entityType,
                entityId,
                action,
                changeSummary: summaryText,
                timestamp: new Date().toISOString(),
            },
        });

        // 2. Persist to DB table if Prisma auditLog model is active
        try {
            if (prisma?.auditLog?.create) {
                await prisma.auditLog.create({
                    data: {
                        actor_user_id: actorUserId || "usr-system",
                        entity_type: entityType,
                        entity_id: entityId,
                        action,
                        change_summary: summaryText,
                    },
                });
            }
        } catch (err) {
            // Fail-safe: do not crash active user request if audit storage fails
            logger.warn(`Failed to persist database audit log: ${err.message}`);
        }
    }
}

module.exports = AuditLogger;
