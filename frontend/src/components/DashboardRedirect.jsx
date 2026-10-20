import { Navigate } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";

/**
 * Redirects an authenticated user to their role-specific canonical dashboard.
 */
export default function DashboardRedirect() {
    const { user } = useAuth();
    const destination = getDefaultDashboardForRole(user?.role);
    return <Navigate to={destination} replace />;
}
