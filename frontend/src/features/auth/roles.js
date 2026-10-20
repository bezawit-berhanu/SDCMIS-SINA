export const UserRole = Object.freeze({
    DENTIST: "DENTIST",
    RECEPTIONIST: "RECEPTIONIST",
    CUSTOMER: "CUSTOMER",
});

/**
 * Returns the default dashboard path for a given user role.
 *
 * @param {string} [role]
 * @returns {string}
 */
export function getDefaultDashboardForRole(role) {
    switch (role) {
        case UserRole.DENTIST:
            return "/dentist";
        case UserRole.RECEPTIONIST:
            return "/receptionist";
        case UserRole.CUSTOMER:
            return "/customer";
        default:
            return "/login";
    }
}

/**
 * Checks whether a user role is permitted by the given allowed roles specification.
 *
 * @param {string} userRole
 * @param {string|string[]} allowedRoles
 * @returns {boolean}
 */
export function isRoleAuthorized(userRole, allowedRoles) {
    if (!userRole) return false;
    if (!allowedRoles) return true;
    const permitted = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (permitted.length === 0) return true;
    return permitted.includes(userRole);
}

export default UserRole;

