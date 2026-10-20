import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import { getDefaultDashboardForRole } from "../features/auth/roles";
import Loading from "./common/Loading";

/**
 * Public route guard component for unauthenticated-only routes (e.g. /login, /register).
 *
 * - Unauthenticated users can access the route.
 * - Authenticated users are redirected to their intended return URL or their default dashboard.
 * - Displays a loading state while session restoration is pending to prevent flashing.
 */
export default function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <Loading message="Checking authentication session..." />;
    }

    if (user) {
        const fromPath = location.state?.from?.pathname || location.state?.from;
        const isSelfRoute = fromPath === "/login" || fromPath === "/register";
        const destination = !isSelfRoute && fromPath
            ? fromPath
            : getDefaultDashboardForRole(user.role);

        return <Navigate to={destination} replace />;
    }

    return children || <Outlet />;
}
