import { useState } from "react";
import {
    FiDatabase,
    FiFileText,
    FiZap,
    FiActivity,
    FiRefreshCw,
    FiFolder,
    FiLayers,
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
        { label: "Active Datasets", value: "24", change: "+3 this week", icon: <FiDatabase size={24} color="#0284c7" /> },
        { label: "Synced Records", value: "1,428", change: "99.8% accurate", icon: <FiFileText size={24} color="#16a34a" /> },
        { label: "Operational Tasks", value: "8", change: "2 pending review", icon: <FiZap size={24} color="#ca8a04" /> },
        { label: "System Health", value: "Optimal", change: "Lat: 28ms", icon: <FiActivity size={24} color="#059669" /> },
    ];

    const recentActivities = [
        { id: 1, title: "Spatial dataset #042 uploaded", time: "10 mins ago", status: "Success" },
        { id: 2, title: "Coordinate boundary validation", time: "1 hour ago", status: "Verified" },
        { id: 3, title: "Metadata schema synchronized", time: "3 hours ago", status: "Success" },
    ];

    return (
        <PageContainer
            title={currentUser ? `Welcome back, ${currentUser.fullName}` : "Dashboard Overview"}
            subtitle={
                currentUser
                    ? `Role: ${currentUser.role} | SDCMIS-SINA Spatial Management Portal`
                    : "Monitor spatial datasets, ongoing jobs, and system performance"
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
                        <h2 className="card__title">Recent System Activities</h2>
                        <p className="card__subtitle">Latest actions and operations performed</p>
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
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><FiFolder /> Manage Datasets</span>
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><FiLayers /> Inspect Clinical Records</span>
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><FiSettings /> System Configuration</span>
                        </Button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
