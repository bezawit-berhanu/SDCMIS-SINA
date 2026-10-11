import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

export default function DashboardLayout() {
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
        </div>
    );
}
