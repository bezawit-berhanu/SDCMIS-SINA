import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import OnboardingTour from "../components/onboarding/OnboardingTour";
import { useAuth } from "../features/auth/auth-context";

export default function DashboardLayout() {
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="dashboard-layout">
            <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
            <div className="dashboard-container">
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                <main className="dashboard-main">
                    <div className="dashboard-content">
                        <Outlet />
                    </div>
                </main>
            </div>
            {user && (user.role === "DENTIST" || user.role === "RECEPTIONIST") && (
                <OnboardingTour role={user.role} />
            )}
        </div>
    );
}
