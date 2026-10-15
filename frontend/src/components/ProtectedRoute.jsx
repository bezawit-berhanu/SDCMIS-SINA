import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Restore session...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children || <Outlet />;
}