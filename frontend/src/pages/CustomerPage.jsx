import { useState } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";

export default function CustomerPage() {
    const { user, restoreSession } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await restoreSession();
        } finally {
            setTimeout(() => setRefreshing(false), 400);
        }
    };

    const stats = [
        { label: "Next Appointment", value: "Oct 24", change: "10:30 AM with Dr. Sina", icon: "🗓️" },
        { label: "Outstanding Balance", value: "$45.00", change: "Due by next visit", icon: "💳" },
        { label: "Completed Treatments", value: "4", change: "Last visit 2 weeks ago", icon: "🦷" },
        { label: "Patient Status", value: "Active", change: "Records up to date", icon: "🟢" },
    ];

    const pastTreatments = [
        { id: "TRT-01", description: "Comprehensive Oral Examination & Cleaning", date: "Oct 10, 2026", cost: "$120.00", status: "COMPLETED" },
        { id: "TRT-02", description: "Digital Dental Bitewing X-Rays (4 Views)", date: "Oct 10, 2026", cost: "$65.00", status: "COMPLETED" },
        { id: "TRT-03", description: "Composite Resin Restoration (Upper Right)", date: "Aug 15, 2026", cost: "$150.00", status: "COMPLETED" },
    ];

    return (
        <PageContainer
            title={user ? `Patient Portal — Welcome, ${user.fullName}` : "Patient Customer Portal"}
            subtitle="View your upcoming dental appointments, treatment history, and account summary"
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
                        <h2 className="card__title">Recent Dental Care History</h2>
                        <p className="card__subtitle">Your past procedures and diagnostic treatments</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {pastTreatments.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.75rem",
                                    backgroundColor: "var(--bg-page)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <div>
                                    <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.description}</p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        {item.date} • {item.cost}
                                    </p>
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: "var(--success)",
                                        backgroundColor: "var(--success-bg)",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "var(--radius-sm)",
                                    }}
                                >
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Patient Self-Service</h2>
                        <p className="card__subtitle">Manage your dental care and contact preferences</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            📅 Request New Appointment Date
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            💳 Pay Outstanding Balance Online
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            📄 Download Dental Records Summary
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            🔔 Communication & Reminder Preferences
                        </Button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
