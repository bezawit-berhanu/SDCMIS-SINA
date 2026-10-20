import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { isRoleAuthorized } from "../features/auth/roles";
import Loading from "./common/Loading";
import AccessDenied from "./common/AccessDenied";

/**
 * Route protection component enforcing authentication and optional role-based authorization.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Children to render when authorized.
 * @param {string|string[]} [props.allowedRoles] - Optional permitted roles. If omitted, any authenticated user is allowed.
 * @param {string} [props.redirectTo] - Path to redirect to on unauthenticated. Defaults to "/login".
 */
export default function ProtectedRoute({
    children,
    allowedRoles,
    redirectTo = "/login",
}) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading message="Restoring session..." />;
    }

    if (!user) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Role-based access enforcement (defense-in-depth on the frontend)
    if (allowedRoles && !isRoleAuthorized(user.role, allowedRoles)) {
        const permitted = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        return <AccessDenied requiredRoles={permitted} />;
    }

    return children || <Outlet />;
}

/**
 * Convenience alias for role-guarded routes.
 */
export function RoleProtectedRoute({ roles, allowedRoles, ...props }) {
    return <ProtectedRoute allowedRoles={roles || allowedRoles} {...props} />;
}