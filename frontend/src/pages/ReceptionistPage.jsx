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

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        patientId: "pat-1001",
        patientName: "Dawit Yohannes",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        recordedBy: "Receptionist",
    });
    const [paymentHistory, setPaymentHistory] = useState([
        { id: "RCP-201", patient: "Dawit Yohannes", amount: 150.00, dueDate: "2026-10-26", recordedBy: "Receptionist - Bethlehem", status: "VERIFIED" },
        { id: "RCP-202", patient: "Hellen Bekele", amount: 75.00, dueDate: "2026-10-25", recordedBy: "Receptionist - Bethlehem", status: "VERIFIED" },
        { id: "RCP-203", patient: "Michael Haile", amount: 200.00, dueDate: "2026-10-24", recordedBy: "Dr. Sara (Dentist)", status: "VERIFIED" },
    ]);
    const [feedback, setFeedback] = useState("");

    const handleRecordPayment = (e) => {
        e.preventDefault();
        const amt = Number(paymentForm.amount);
        if (Number.isNaN(amt) || amt <= 0) {
            setFeedback("Error: Payment amount must be greater than zero.");
            return;
        }

        const newPayment = {
            id: `RCP-${Math.floor(100 + Math.random() * 900)}`,
            patient: paymentForm.patientName,
            amount: amt,
            dueDate: paymentForm.paymentDate,
            recordedBy: `${paymentForm.recordedBy} (${user?.fullName || "Staff"})`,
            status: "VERIFIED",
        };

        setPaymentHistory([newPayment, ...paymentHistory]);
        setFeedback(`Success: Payment of $${amt.toFixed(2)} recorded for ${paymentForm.patientName}.`);
        setShowPaymentModal(false);
        setPaymentForm({
            patientId: "pat-1001",
            patientName: "Dawit Yohannes",
            amount: "",
            paymentDate: new Date().toISOString().split("T")[0],
            recordedBy: "Receptionist",
        });
        setTimeout(() => setFeedback(""), 4000);
    };

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
            {feedback && (
                <div style={{
                    padding: "10px 16px",
                    marginBottom: "1rem",
                    borderRadius: "6px",
                    backgroundColor: feedback.startsWith("Error") ? "#fee2e2" : "#ecfdf5",
                    color: feedback.startsWith("Error") ? "#991b1b" : "#065f46",
                    border: `1px solid ${feedback.startsWith("Error") ? "#fca5a5" : "#a7f3d0"}`,
                    fontWeight: 500,
                    fontSize: "0.875rem"
                }}>
                    {feedback}
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

            <div className="grid grid-cols-2" style={{ marginBottom: "1.5rem" }}>
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
                    <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 className="card__title">Desk Operations</h2>
                            <p className="card__subtitle">Front office tasks and financial transactions</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <Button
                            variant="primary"
                            fullWidth
                            style={{ justifyContent: "flex-start", backgroundColor: "#059669" }}
                            onClick={() => setShowPaymentModal(true)}
                        >
                            💰 Record Payment & Issue Receipt
                        </Button>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            🎟️ Issue New Queue Ticket & Check In
                        </Button>
                        <a href="/appointments" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start", color: "#2563eb", borderColor: "#bfdbfe" }}>
                                📅 Schedule & Manage Patient Appointments
                            </Button>
                        </a>
                        <a href="/appointments/missed" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start", color: "#dc2626", borderColor: "#fecaca" }}>
                                ⚠️ Review Missed Appointments & Reschedule
                            </Button>
                        </a>
                        <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                            👤 Search or Register New Patient
                        </Button>
                    </div>

                    {showPaymentModal && (
                        <div style={{
                            marginTop: "1.25rem",
                            padding: "1rem",
                            borderRadius: "var(--radius-md)",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0"
                        }}>
                            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#166534", marginBottom: "0.75rem" }}>
                                Record Patient Fee Payment
                            </h3>
                            <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                                        Select Patient *
                                    </label>
                                    <select
                                        value={paymentForm.patientName}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, patientName: e.target.value })}
                                        style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                                    >
                                        <option value="Dawit Yohannes">Dawit Yohannes (pat-1001)</option>
                                        <option value="Hellen Bekele">Hellen Bekele (pat-1002)</option>
                                        <option value="Amanuel Girma">Amanuel Girma (pat-1003)</option>
                                        <option value="Selamawit Desta">Selamawit Desta (pat-1004)</option>
                                    </select>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                                            Amount ($) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            placeholder="e.g. 50.00"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                                            Payment Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={paymentForm.paymentDate}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                            style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: "6px 14px", borderRadius: "4px", border: "none", backgroundColor: "#059669", color: "white", fontWeight: 600, cursor: "pointer" }}
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Task 9: Payment History Table */}
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Recent Payment History & Receipts</h2>
                    <p className="card__subtitle">Displaying verified transactions with Amount, Due/Payment Date, and Recorded by</p>
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                                <th style={{ padding: "8px 12px" }}>Receipt ID</th>
                                <th style={{ padding: "8px 12px" }}>Patient</th>
                                <th style={{ padding: "8px 12px" }}>Amount</th>
                                <th style={{ padding: "8px 12px" }}>Due / Payment Date</th>
                                <th style={{ padding: "8px 12px" }}>Recorded By</th>
                                <th style={{ padding: "8px 12px" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentHistory.map((p) => (
                                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 600 }}>{p.id}</td>
                                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.patient}</td>
                                    <td style={{ padding: "10px 12px", color: "#059669", fontWeight: 700 }}>${p.amount.toFixed(2)}</td>
                                    <td style={{ padding: "10px 12px" }}>{new Date(p.dueDate).toLocaleDateString()}</td>
                                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{p.recordedBy}</td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <span style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            backgroundColor: "#d1fae5",
                                            color: "#065f46"
                                        }}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </PageContainer>
    );
}
