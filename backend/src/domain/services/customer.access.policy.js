const { UserRole } = require("../enums/enum");

/**
 * CustomerAccessPolicy
 * Enforces horizontal access control and patient data isolation.
 * Staff (Dentists, Receptionists) can access clinical records.
 * Customers are strictly restricted to their own linked patient data per SRS BR-05.
 */
class CustomerAccessPolicy {
    /**
     * Determines whether an authenticated user is authorized to access a given patient's records.
     * @param {Object} user - The authenticated user object from req.user
     * @param {string} targetPatientId - The patient ID being requested
     * @returns {{ allowed: boolean, statusCode?: number, code?: string, message?: string }}
     */
    static canAccessPatient(user, targetPatientId) {
        if (!user) {
            return {
                allowed: false,
                statusCode: 401,
                code: "UNAUTHENTICATED",
                message: "Authentication is required to access patient records.",
            };
        }

        // Clinical staff (Dentist, Receptionist) have access to clinical patient charts
        if (user.role === UserRole.DENTIST || user.role === UserRole.RECEPTIONIST) {
            return { allowed: true };
        }

        // If user role is CUSTOMER, enforce strict horizontal isolation (SRS BR-05)
        if (user.role === UserRole.CUSTOMER) {
            const ownedPatientId = user.linkedPatientId || user.patientId;

            if (!targetPatientId || !ownedPatientId || String(ownedPatientId).trim() !== String(targetPatientId).trim()) {
                return {
                    allowed: false,
                    statusCode: 403,
                    code: "FORBIDDEN",
                    errorCode: "ERR-NOT-FOUND-OR-FORBIDDEN",
                    message: "That record could not be found.",
                };
            }

            return { allowed: true };
        }

        return {
            allowed: false,
            statusCode: 403,
            code: "FORBIDDEN",
            errorCode: "ERR-FORBIDDEN",
            message: "You do not have permission to do that.",
        };
    }

    /**
     * Helper to verify if an authenticated user is the designated owner of a patient record.
     */
    static isCustomerOwner(user, targetPatientId) {
        return this.canAccessPatient(user, targetPatientId).allowed;
    }
}

module.exports = CustomerAccessPolicy;
