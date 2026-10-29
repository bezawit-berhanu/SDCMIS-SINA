const { UserRole } = require("../enums/enum");

/**
 * CustomerAccessPolicy
 * Enforces horizontal access control and patient data isolation.
 * Staff (Dentists, Receptionists) can access clinical records.
 * Customers are strictly restricted to their own linked patient data.
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

        // Clinical staff (Dentist, Receptionist, Admin) have access to clinical patient charts
        if (user.role === UserRole.DENTIST || user.role === UserRole.RECEPTIONIST) {
            return { allowed: true };
        }

        // If user role is CUSTOMER, enforce data ownership
        if (user.role === UserRole.CUSTOMER) {
            // Customer's linked patient ID or user ID matching target patient
            const ownedPatientId = user.linkedPatientId || user.patientId;

            if (!targetPatientId || !ownedPatientId || String(ownedPatientId).trim() !== String(targetPatientId).trim()) {
                return {
                    allowed: false,
                    statusCode: 403,
                    code: "FORBIDDEN",
                    message: "You do not have permission to view another patient's data.",
                };
            }

            return { allowed: true };
        }

        return {
            allowed: false,
            statusCode: 403,
            code: "FORBIDDEN",
            message: "Unauthorized role for patient data access.",
        };
    }
}

module.exports = CustomerAccessPolicy;

