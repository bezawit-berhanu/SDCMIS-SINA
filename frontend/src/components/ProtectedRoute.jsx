import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import Loading from "./common/Loading";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading message="Restoring session..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children || <Outlet />;
}