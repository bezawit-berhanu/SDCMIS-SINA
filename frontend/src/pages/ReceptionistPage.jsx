import { useState } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";

export default function ReceptionistPage() {
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
        { label: "Patients in Queue", value: "4", change: "2 currently waiting", icon: "👥" },
        { label: "Today's Appointments", value: "16", change: "6 attended, 10 pending", icon: "📋" },
        { label: "Payments Collected", value: "$1,850", change: "5 transactions today", icon: "💳" },
        { label: "Front Desk Status", value: "Open", change: "Queue serving smoothly", icon: "🟢" },
    ];

    const currentQueue = [
        { ticket: "Q-01", patient: "Dawit Yohannes", service: "Routine Cleaning", arrival: "09:10 AM", status: "SERVING" },
        { ticket: "Q-02", patient: "Hellen Bekele", service: "Emergency Toothache", arrival: "09:25 AM", status: "WAITING" },
        { ticket: "Q-03", patient: "Amanuel Girma", service: "Consultation & Exam", arrival: "09:40 AM", status: "WAITING" },
        { ticket: "Q-04", patient: "Selamawit Desta", service: "Crown Placement", arrival: "10:00 AM", status: "WAITING" },
    ];

    return (
        <PageContainer
            title={user ? `Reception Desk — ${user.fullName}` : "Reception Desk Portal"}
            subtitle="Patient check-in, queue management, appointment scheduling, and fee collection"
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
                        <h2 className="card__title">Active Reception Queue</h2>
                        <p className="card__subtitle">Patients currently checked-in and awaiting service</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {currentQueue.map((item) => (
                            <div
                                key={item.ticket}
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
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "0.875rem",
                                            backgroundColor: "var(--primary-light)",
                                            color: "var(--primary)",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "var(--radius-sm)",
                                        }}
                                    >
                                        {item.ticket}
                                    </span>
                                    <div>
                                        <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.patient}</p>
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            {item.service} • Arrived {item.arrival}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        color: item.status === "SERVING" ? "var(--primary)" : "var(--secondary)",
                                        backgroundColor: item.status === "SERVING" ? "var(--primary-light)" : "var(--secondary-light)",
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
                        <h2 className="card__title">Desk Operations</h2>
                        <p className="card__subtitle">Front office tasks and quick administrative shortcuts</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            🎟️ Issue New Queue Ticket & Check In
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            📅 Schedule Patient Appointment
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            💰 Record Payment & Issue Receipt
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            👤 Search or Register New Patient
                        </Button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
