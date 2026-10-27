import { createBrowserRouter, Navigate } from "react-router-dom";
import PublicLayout from "../layouts/publicLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import PublicRoute from "../components/PublicRoute.jsx";
import DashboardRedirect from "../components/DashboardRedirect.jsx";
import { UserRole } from "../features/auth/auth-context";

import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import DentistPage from "../pages/DentistPage.jsx";
import ReceptionistPage from "../pages/ReceptionistPage.jsx";
import CustomerPage from "../pages/CustomerPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import PatientsPage from "../pages/PatientsPage.jsx";
import AppointmentsPage from "../pages/AppointmentsPage.jsx";
import MissedAppointmentsPage from "../pages/MissedAppointmentsPage.jsx";

const router = createBrowserRouter([
    // Public home route
    {
        path: "/",
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
        ],
    },

    // Public authentication routes (guarded against authenticated sessions)
    {
        element: (
            <PublicRoute>
                <AuthLayout />
            </PublicRoute>
        ),
        children: [
            {
                path: "/login",
                element: <LoginPage />,
            },
            {
                path: "/register",
                element: <RegisterPage />,
            },
        ],
    },

    // Protected application routes (requires authenticated session)
    {
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: "/dentist",
                element: (
                    <ProtectedRoute allowedRoles={[UserRole.DENTIST]}>
                        <DentistPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/patients",
                element: (
                    <ProtectedRoute allowedRoles={[UserRole.DENTIST, UserRole.RECEPTIONIST]}>
                        <PatientsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/appointments",
                element: (
                    <ProtectedRoute allowedRoles={[UserRole.DENTIST, UserRole.RECEPTIONIST]}>
                        <AppointmentsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/appointments/missed",
                element: (
                    <ProtectedRoute allowedRoles={[UserRole.DENTIST, UserRole.RECEPTIONIST]}>
                        <MissedAppointmentsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/receptionist",
                element: (
                    <ProtectedRoute allowedRoles={[UserRole.RECEPTIONIST]}>
                        <ReceptionistPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/customer",
                element: (
                    <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                        <CustomerPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: "/settings",
                element: <SettingsPage />,
            },
            {
                path: "/dashboard",
                element: <DashboardRedirect />,
            },
        ],
    },

    // Fallback for unmatched routes
    {
        path: "*",
        element: <Navigate to="/" replace />,
    },
]);

export default router;
