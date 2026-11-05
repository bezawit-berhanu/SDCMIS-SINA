import { useState } from "react";
import { Link } from "react-router-dom";
import {
    FiUsers,
    FiCalendar,
    FiCheckSquare,
    FiActivity,
    FiRefreshCw,
    FiList,
    FiSettings,
} from "react-icons/fi";
import { useAuth } from "../features/auth/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";

export default function DashboardPage() {
    const { user: currentUser, restoreSession } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await restoreSession();
        } finally {
            setTimeout(() => setRefreshing(false), 500);
        }
    };

    const stats = [
        { label: "Active Patients", value: "142", change: "+12 this month", icon: <FiUsers size={24} color="#2563eb" /> },
        { label: "Scheduled Visits", value: "28", change: "Today's schedule", icon: <FiCalendar size={24} color="#16a34a" /> },
        { label: "Pending Procedures", value: "9", change: "In queue & ongoing", icon: <FiCheckSquare size={24} color="#ca8a04" /> },
        { label: "Clinic System", value: "Online", change: "Real-time sync active", icon: <FiActivity size={24} color="#2563eb" /> },
    ];

    const recentActivities = [
        { id: 1, title: "Patient check-in recorded", time: "5 mins ago", status: "Serving" },
        { id: 2, title: "Composite restoration concluded", time: "25 mins ago", status: "Completed" },
        { id: 3, title: "Follow-up appointment booked", time: "1 hour ago", status: "Scheduled" },
    ];

    return (
        <PageContainer
            title={currentUser ? `Welcome back, ${currentUser.fullName}` : "Clinic Overview"}
            subtitle={
                currentUser
                    ? `Role: ${currentUser.role} | Sina Dental Clinic Management Platform`
                    : "Real-time clinical dental operations and patient record management"
            }
            actions={
                <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? "Refreshing..." : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiRefreshCw /> Refresh</span>}
                </Button>
            }
        >
            <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--text-main)" }}>
                                    {stat.value}
                                </p>
                            </div>
                            <span>{stat.icon}</span>
                        </div>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.5rem" }}>
                            {stat.change}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2">
                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Recent Clinical Activities</h2>
                        <p className="card__subtitle">Latest actions and operations performed across clinic</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {recentActivities.map((act) => (
                            <div
                                key={act.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.625rem 0.75rem",
                                    backgroundColor: "var(--bg-page)",
                                    borderRadius: "var(--radius-md)",
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>{act.title}</p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{act.time}</p>
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: "var(--success)",
                                        backgroundColor: "var(--success-bg)",
                                        padding: "0.2rem 0.5rem",
                                        borderRadius: "var(--radius-sm)",
                                    }}
                                >
                                    {act.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Quick Operations</h2>
                        <p className="card__subtitle">Common shortcuts and administrative tools</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <Link to="/patients" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><FiUsers /> Patient Directory</span>
                            </Button>
                        </Link>
                        <Link to="/receptionist" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><FiList /> Live Queue Desk</span>
                            </Button>
                        </Link>
                        <Link to="/settings" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><FiSettings /> Account Settings</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
