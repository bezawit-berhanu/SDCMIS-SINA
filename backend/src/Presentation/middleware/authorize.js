/**
 * Role-Based Access Control (RBAC) authorization middleware.
 * Restricts access to endpoints based on one or more allowed user roles.
 *
 * @param {...(string|string[])} roles - The permitted role(s).
 * @returns {import("express").RequestHandler}
 */
function authorize(...roles) {
    // Flatten arguments to support both authorize('DENTIST', 'RECEPTIONIST')
    // and authorize(['DENTIST', 'RECEPTIONIST'])
    const allowedRoles = roles.flat().filter(Boolean);

    return (req, res, next) => {
        // 1. Enforce that authentication middleware has already run and attached req.user
        if (!req.user) {
            const error = new Error("Authentication is required.");
            error.statusCode = 401;
            error.code = "UNAUTHENTICATED";
            return next(error);
        }

        // 2. Read only the authenticated user's role (never trust request body/params)
        const userRole = req.user.role;

        // 3. Fail-closed: deny if no allowed roles configured, missing user role, or role not permitted
        if (
            !userRole ||
            typeof userRole !== "string" ||
            allowedRoles.length === 0 ||
            !allowedRoles.includes(userRole)
        ) {
            const error = new Error("You do not have permission to perform this action.");
            error.statusCode = 403;
            error.code = "FORBIDDEN";
            error.errorCode = "ERR-FORBIDDEN";
            return next(error);
        }

        next();
    };
}

module.exports = authorize;
