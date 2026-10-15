import { useState } from "react";
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
        { label: "Active Datasets", value: "24", change: "+3 this week", icon: "🗺️" },
        { label: "Synced Records", value: "1,428", change: "99.8% accurate", icon: "📑" },
        { label: "Operational Tasks", value: "8", change: "2 pending review", icon: "⚡" },
        { label: "System Health", value: "Optimal", change: "Lat: 28ms", icon: "🟢" },
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
                    {refreshing ? "Refreshing..." : "🔄 Refresh"}
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
                            <span style={{ fontSize: "1.5rem" }}>{stat.icon}</span>
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
                            📁 Manage Datasets
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            🛰️ Inspect Spatial Layers
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            ⚙️ System Configuration
                        </Button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
