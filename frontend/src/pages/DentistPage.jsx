import { useState } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";

export default function DentistPage() {
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
        { label: "Today's Patients", value: "7", change: "3 scheduled this morning", icon: "🦷" },
        { label: "Ongoing Procedures", value: "4", change: "In operatory 1 & 2", icon: "⚕️" },
        { label: "Next Follow-Ups", value: "9", change: "Within next 48 hrs", icon: "📅" },
        { label: "Clinical Status", value: "Active", change: "All suites ready", icon: "🟢" },
    ];

    const upcomingProcedures = [
        { id: "PROC-101", patient: "Abebe Kebede", type: "Root Canal Therapy (Molar)", time: "09:30 AM", status: "NEXT" },
        { id: "PROC-102", patient: "Sara Tadesse", type: "Composite Filling & Polish", time: "11:00 AM", status: "ONGOING" },
        { id: "PROC-103", patient: "Michael Haile", type: "Orthodontic Adjustment", time: "02:15 PM", status: "SCHEDULED" },
        { id: "PROC-104", patient: "Bethlehem Alemu", type: "Full Dental Prophylaxis", time: "04:00 PM", status: "SCHEDULED" },
    ];

    return (
        <PageContainer
            title={user ? `Dentist Clinic Portal — Dr. ${user.fullName}` : "Dentist Clinic Portal"}
            subtitle="Clinical schedule, diagnostic procedures, and patient treatment management"
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
                        <h2 className="card__title">Today's Treatment Schedule</h2>
                        <p className="card__subtitle">Scheduled clinical procedures and operations</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {upcomingProcedures.map((proc) => (
                            <div
                                key={proc.id}
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
                                    <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{proc.patient}</p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                        {proc.type} • {proc.time}
                                    </p>
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: proc.status === "ONGOING" ? "var(--primary)" : "var(--success)",
                                        backgroundColor: proc.status === "ONGOING" ? "var(--primary-light)" : "var(--success-bg)",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "var(--radius-sm)",
                                    }}
                                >
                                    {proc.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Clinical Actions</h2>
                        <p className="card__subtitle">Perform clinical workflows and update records</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            📋 View Patient Clinical History
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            ➕ Log Completed Procedure
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            📝 Prescribe Dental Treatment Plan
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            🦷 Update Dental Charting & X-Rays
                        </Button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
