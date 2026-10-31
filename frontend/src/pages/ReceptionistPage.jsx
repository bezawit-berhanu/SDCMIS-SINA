import { useState, useEffect } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import { realtimeService } from "../services/realtime.service";
import AddToQueueModal from "../components/queue/AddToQueueModal";

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
        { label: "Scheduled This Month", value: "24", change: "Per FR-REC-01 monthly metric", icon: "📅" },
        { label: "No-Shows Last Month", value: "2", change: "Missed appointments rate: 8%", icon: "⚠️" },
        { label: "Came This Month", value: "18", change: "Attended visits to date", icon: "✅" },
        { label: "Live Queue Lobby", value: "3", change: "1 serving, 2 waiting", icon: "👥" },
    ];

    const [queueList, setQueueList] = useState([
        { id: "que-003", ticket: "#003", patient: "Sara Tadesse", service: "Composite Filling", arrival: "09:30 AM", status: "SERVING", dentist: "Dr. Sara" },
        { id: "que-004", ticket: "#004", patient: "Michael Haile", service: "Orthodontic Adjustment", arrival: "09:45 AM", status: "WAITING", dentist: "Dr. Sara" },
        { id: "que-005", ticket: "#005", patient: "Dawit Yohannes", service: "Root Canal Therapy", arrival: "10:00 AM", status: "WAITING", dentist: "Dr. Abebe" },
    ]);

    const [feedback, setFeedback] = useState("");
    const [showAddQueueModal, setShowAddQueueModal] = useState(false);

    const handleQueueAdded = (newEntry) => {
        const item = {
            id: newEntry.id || `que-${Date.now()}`,
            ticket: newEntry.formattedQueueNumber || `#${String(newEntry.queueNumber || 1).padStart(3, "0")}`,
            patient: newEntry.patientName,
            service: newEntry.serviceType || "General",
            arrival: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "WAITING",
            dentist: "Dr. Bethel",
        };
        setQueueList((prev) => [...prev, item]);
        setFeedback(`Checked in ${item.patient} with Ticket ${item.ticket}.`);
        setTimeout(() => setFeedback(""), 4000);
    };

    // Real-time Gateway sync
    useEffect(() => {
        realtimeService.connect({ role: "RECEPTIONIST", userId: user?.id || "usr-receptionist-01" });

        const unsubCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setQueueList((prev) =>
                    prev.map((item) => (item.ticket === ticket ? { ...item, status: "SERVING" } : item))
                );
            }
        });

        const unsubComp = realtimeService.subscribe("VISIT_COMPLETED", (payload) => {
            const ticket = payload.queueEntry?.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setQueueList((prev) =>
                    prev.map((item) => (item.ticket === ticket ? { ...item, status: "DONE" } : item))
                );
            }
        });

        return () => {
            unsubCall();
            unsubComp();
        };
    }, [user]);

    // Task 2: Complete Visit (Receptionist / Dentist Completes Visit)
    const handleCompleteVisit = (ticketId) => {
        let completedItem = null;
        setQueueList((prev) =>
            prev.map((item) => {
                if ((!ticketId && item.status === "SERVING") || item.id === ticketId || item.ticket === ticketId) {
                    completedItem = item;
                    return { ...item, status: "DONE" };
                }
                return item;
            })
        );

        const label = completedItem ? completedItem.ticket : "current";
        setFeedback(`✓ Visit completed successfully for patient ${label}. Status transitioned to DONE.`);

        // Broadcast to real-time gateway so Dentist and Customer browsers receive it
        realtimeService.emit("VISIT_COMPLETED", {
            queueEntry: completedItem || { formattedQueueNumber: label, status: "DONE" },
        });

        setTimeout(() => setFeedback(""), 4000);
    };

    // Task 3: Auto Advance (WAITING #004 -> SERVING according to queue rules)
    const handleAutoAdvance = () => {
        const nextWaiting = queueList.find((q) => q.status === "WAITING");
        if (!nextWaiting) {
            setFeedback("Notice: No waiting patients left in queue to auto-advance.");
            setTimeout(() => setFeedback(""), 3000);
            return;
        }

        setQueueList((prev) =>
            prev.map((item) =>
                item.id === nextWaiting.id
                    ? { ...item, status: "SERVING" }
                    : item
            )
        );

        const msg = `⚡ Auto Advance: System identified next waiting patient (${nextWaiting.ticket} - ${nextWaiting.patient}). Status transitioned WAITING → SERVING.`;
        setFeedback(msg);

        // Broadcast to Real-Time Gateway so Dentist receives "Patient #004 is ready."
        realtimeService.emit("PATIENT_CALLED", {
            queueNumber: parseInt(nextWaiting.ticket.replace("#", ""), 10) || 4,
            formattedQueueNumber: nextWaiting.ticket,
            ticket: nextWaiting.ticket,
            patientName: nextWaiting.patient,
            serviceType: nextWaiting.service,
            notification: {
                message: `Patient ${nextWaiting.ticket} is ready.`,
            },
        });

        setTimeout(() => setFeedback(""), 4000);
    };

    // Call individual customer
    const handleCallCustomer = (item) => {
        setQueueList((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: "SERVING" } : q))
        );

        setFeedback(`📢 Patient ${item.ticket} (${item.patient}) called to ${item.dentist || "Operatory"}. Status: SERVING.`);

        realtimeService.emit("PATIENT_CALLED", {
            formattedQueueNumber: item.ticket,
            ticket: item.ticket,
            patientName: item.patient,
            serviceType: item.service,
            notification: {
                message: `Patient ${item.ticket} is ready.`,
            },
        });

        setTimeout(() => setFeedback(""), 4000);
    };

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
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <Button variant="primary" size="sm" onClick={() => setShowAddQueueModal(true)}>
                        + Check In (SCR-15)
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        {refreshing ? "Refreshing..." : "🔄 Refresh"}
                    </Button>
                </div>
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
                    <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 className="card__title">Active Reception Queue</h2>
                            <p className="card__subtitle">Real-time patient flow and front-desk dispatch</p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleAutoAdvance}
                                title="System identifies next waiting patient (WAITING → SERVING)"
                                style={{ backgroundColor: "#2563eb" }}
                            >
                                ⚡ Auto Advance
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCompleteVisit()}
                                title="Receptionist / Dentist completes visit"
                            >
                                ✓ Complete Visit
                            </Button>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {queueList.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "0.75rem",
                                    backgroundColor: "var(--bg-page)",
                                    borderRadius: "var(--radius-md)",
                                    border: item.status === "SERVING" ? "2px solid #2563eb" : "1px solid var(--border)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "0.875rem",
                                            backgroundColor: item.status === "SERVING" ? "#dbeafe" : item.status === "DONE" ? "#dcfce7" : "#fef3c7",
                                            color: item.status === "SERVING" ? "#1e40af" : item.status === "DONE" ? "#166534" : "#92400e",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "var(--radius-sm)",
                                        }}
                                    >
                                        {item.ticket}
                                    </span>
                                    <div>
                                        <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{item.patient}</p>
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            {item.service} • {item.dentist || "General Clinic"} • Arrived {item.arrival}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 700,
                                            color: item.status === "SERVING" ? "#1d4ed8" : item.status === "DONE" ? "#15803d" : "#b45309",
                                            backgroundColor: item.status === "SERVING" ? "#eff6ff" : item.status === "DONE" ? "#f0fdf4" : "#fffbeb",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "var(--radius-sm)",
                                            border: `1px solid ${item.status === "SERVING" ? "#bfdbfe" : item.status === "DONE" ? "#bbf7d0" : "#fde68a"}`,
                                        }}
                                    >
                                        {item.status}
                                    </span>
                                    {item.status === "WAITING" && (
                                        <button
                                            type="button"
                                            onClick={() => handleCallCustomer(item)}
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
                                            Call
                                        </button>
                                    )}
                                    {item.status === "SERVING" && (
                                        <button
                                            type="button"
                                            onClick={() => handleCompleteVisit(item.id)}
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
                                            Complete Visit
                                        </button>
                                    )}
                                </div>
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

            {showAddQueueModal && (
                <AddToQueueModal
                    onClose={() => setShowAddQueueModal(false)}
                    onQueueAdded={handleQueueAdded}
                />
            )}
        </PageContainer>
    );
}
