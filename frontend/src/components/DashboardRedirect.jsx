import { Navigate } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Loading from "./common/Loading";

/**
 * Redirects an authenticated user to their role-specific canonical dashboard
 * while gracefully waiting for session resolution to avoid redirect flash.
 */
export default function DashboardRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading message="Resolving your workspace dashboard..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const destination = getDefaultDashboardForRole(user.role);
    return <Navigate to={destination} replace />;
}
