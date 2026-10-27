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

    const [procedures, setProcedures] = useState([
        { id: "PROC-101", patient: "Abebe Kebede", type: "Root Canal Therapy (Molar)", time: "09:30 AM", status: "NEXT" },
        { id: "PROC-102", patient: "Sara Tadesse", type: "Composite Filling & Polish", time: "11:00 AM", status: "ONGOING" },
        { id: "PROC-103", patient: "Michael Haile", type: "Orthodontic Adjustment", time: "02:15 PM", status: "NEXT" },
        { id: "PROC-104", patient: "Bethlehem Alemu", type: "Full Dental Prophylaxis", time: "04:00 PM", status: "DONE" },
    ]);
    const [actionMsg, setActionMsg] = useState("");

    const advanceToOngoing = (procId) => {
        setProcedures((prev) =>
            prev.map((p) => (p.id === procId ? { ...p, status: "ONGOING" } : p))
        );
        setActionMsg(`Procedure ${procId} transitioned from NEXT to ONGOING.`);
        setTimeout(() => setActionMsg(""), 3000);
    };

    const markAsDone = (procId) => {
        setProcedures((prev) =>
            prev.map((p) => (p.id === procId ? { ...p, status: "DONE" } : p))
        );
        setActionMsg(`Procedure ${procId} transitioned from ONGOING to DONE.`);
        setTimeout(() => setActionMsg(""), 3000);
    };

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
            {actionMsg && (
                <div style={{
                    padding: "10px 16px",
                    marginBottom: "1rem",
                    borderRadius: "6px",
                    backgroundColor: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    fontWeight: 500,
                    fontSize: "0.875rem"
                }}>
                    ✓ {actionMsg}
                </div>
            )}

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
                        <p className="card__subtitle">Scheduled clinical procedures and operations (Next → Ongoing → Done)</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {procedures.map((proc) => (
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
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: proc.status === "ONGOING" ? "#0284c7" : proc.status === "NEXT" ? "#4f46e5" : "#059669",
                                            backgroundColor: proc.status === "ONGOING" ? "#e0f2fe" : proc.status === "NEXT" ? "#e0e7ff" : "#d1fae5",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "var(--radius-sm)",
                                        }}
                                    >
                                        {proc.status}
                                    </span>
                                    {proc.status === "NEXT" && (
                                        <button
                                            type="button"
                                            onClick={() => advanceToOngoing(proc.id)}
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                border: "1px solid #2563eb",
                                                backgroundColor: "#2563eb",
                                                color: "white",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Start (→ Ongoing)
                                        </button>
                                    )}
                                    {proc.status === "ONGOING" && (
                                        <button
                                            type="button"
                                            onClick={() => markAsDone(proc.id)}
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                border: "1px solid #059669",
                                                backgroundColor: "#059669",
                                                color: "white",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Complete (→ Done)
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Clinical Actions & Appointments</h2>
                        <p className="card__subtitle">Perform clinical workflows, visit scheduling, and recovery</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <a href="/appointments" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start", color: "#2563eb", borderColor: "#bfdbfe" }}>
                                📅 View & Manage All Appointments
                            </Button>
                        </a>
                        <a href="/appointments/missed" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start", color: "#dc2626", borderColor: "#fecaca" }}>
                                ⚠️ Review & Reschedule Missed Visits
                            </Button>
                        </a>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            📋 View Patient Clinical History
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            ➕ Log Completed Procedure
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            🦷 Update Dental Charting & X-Rays
                        </Button>
                    </div>
                </div>
            </div>

            {/* Task 3: Upcoming Tasks Dashboard */}
            <div className="card" style={{ marginTop: "1.5rem" }}>
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 className="card__title">Upcoming Clinical Tasks Dashboard</h2>
                        <p className="card__subtitle">Displaying Patient, Procedure, Appointment Date, and Status</p>
                    </div>
                    <a href="/appointments" style={{ textDecoration: "none" }}>
                        <Button variant="outline" size="sm">
                            Open Full Calendar →
                        </Button>
                    </a>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                                <th style={{ padding: "10px 12px" }}>Patient</th>
                                <th style={{ padding: "10px 12px" }}>Procedure</th>
                                <th style={{ padding: "10px 12px" }}>Appointment Date</th>
                                <th style={{ padding: "10px 12px" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: "12px", fontWeight: 600 }}>Abebe Kebede</td>
                                <td style={{ padding: "12px", color: "#334155" }}>Root Canal Therapy (Molar)</td>
                                <td style={{ padding: "12px", color: "#1d4ed8", fontWeight: 500 }}>Oct 28, 2026 • 09:30 AM</td>
                                <td style={{ padding: "12px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "9999px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                                        UPCOMING
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "12px", fontWeight: 600 }}>Sara Tadesse</td>
                                <td style={{ padding: "12px", color: "#334155" }}>Composite Filling & Polish</td>
                                <td style={{ padding: "12px", color: "#1d4ed8", fontWeight: 500 }}>Oct 28, 2026 • 11:00 AM</td>
                                <td style={{ padding: "12px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "9999px", backgroundColor: "#e0f2fe", color: "#0369a1" }}>
                                        ONGOING
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: "12px", fontWeight: 600 }}>Michael Haile</td>
                                <td style={{ padding: "12px", color: "#334155" }}>Orthodontic Adjustment</td>
                                <td style={{ padding: "12px", color: "#1d4ed8", fontWeight: 500 }}>Oct 29, 2026 • 02:15 PM</td>
                                <td style={{ padding: "12px" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "3px 8px", borderRadius: "9999px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                                        UPCOMING
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </PageContainer>
    );
}
