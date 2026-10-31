import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import { realtimeService } from "../services/realtime.service";
import { signalRService } from "../services/signalr.service";
import AddToQueueModal from "../components/queue/AddToQueueModal";

export default function ReceptionistPage() {
    const { user, restoreSession } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [realtimeConnected, setRealtimeConnected] = useState(false);

    const [stats, setStats] = useState([
        { label: "Patients in Queue", value: "0", change: "Active in clinic lobby", icon: "👥" },
        { label: "Currently Serving", value: "0", change: "In operatory chair", icon: "🦷" },
        { label: "Waiting for Call", value: "0", change: "Awaiting consultation", icon: "⏳" },
        { label: "Completed Today", value: "0", change: "Finished clinical visits", icon: "✅" },
    ]);

    const [queueList, setQueueList] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [feedback, setFeedback] = useState("");
    const [showAddQueueModal, setShowAddQueueModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        patientId: "",
        patientName: "",
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        recordedBy: "Receptionist",
    });

    const fetchReceptionData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            };

            // Fetch live queue
            const queueRes = await fetch("http://localhost:5000/api/v1/queue", { headers });
            if (queueRes.ok) {
                const qData = await queueRes.json();
                const rawItems = qData.queue || qData.data || (Array.isArray(qData) ? qData : []);
                const items = rawItems.map((item) => ({
                    id: item.id,
                    ticket: item.formattedQueueNumber || `#${String(item.queueNumber || 1).padStart(3, "0")}`,
                    patient: item.patientName || item.customerName || "Patient",
                    service: item.serviceType || "Clinical Consultation",
                    arrival: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
                    status: item.status || "WAITING",
                    dentist: item.dentistName || "Dr. Staff",
                }));
                setQueueList(items);

                const servingCount = items.filter((i) => i.status === "SERVING").length;
                const waitingCount = items.filter((i) => i.status === "WAITING").length;
                const doneCount = items.filter((i) => i.status === "DONE" || i.status === "COMPLETED").length;

                setStats([
                    { label: "Patients in Queue", value: String(items.length), change: "Active in clinic lobby", icon: "👥" },
                    { label: "Currently Serving", value: String(servingCount), change: "In operatory chair", icon: "🦷" },
                    { label: "Waiting for Call", value: String(waitingCount), change: "Awaiting consultation", icon: "⏳" },
                    { label: "Completed Today", value: String(doneCount), change: "Finished clinical visits", icon: "✅" },
                ]);
            }

            // Fetch payments
            const payRes = await fetch("http://localhost:5000/api/v1/payments", { headers });
            if (payRes.ok) {
                const pData = await payRes.json();
                const rawPays = pData.payments || pData.data || (Array.isArray(pData) ? pData : []);
                setPaymentHistory(rawPays);
            }
        } catch (err) {
            console.error("Error loading receptionist portal data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReceptionData();
    }, [fetchReceptionData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([restoreSession(), fetchReceptionData()]);
        } finally {
            setTimeout(() => setRefreshing(false), 400);
        }
    };

    const handleQueueAdded = async (newEntry) => {
        await fetchReceptionData();
        const ticket = newEntry.formattedQueueNumber || `#${String(newEntry.queueNumber || 1).padStart(3, "0")}`;
        setFeedback(`✓ Checked in ${newEntry.patientName || "patient"} with Ticket ${ticket}.`);
        setTimeout(() => setFeedback(""), 4000);
    };

    // Real-time Gateway sync via SignalR and WebSocket
    useEffect(() => {
        realtimeService.connect({ role: "RECEPTIONIST", userId: user?.id || "usr-receptionist-01" });

        const unsubCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            fetchReceptionData();
            const ticket = payload.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setFeedback(`📢 Notification: Patient ${ticket} called to operatory.`);
                setTimeout(() => setFeedback(""), 4000);
            }
        });

        const unsubComp = realtimeService.subscribe("VISIT_COMPLETED", (payload) => {
            fetchReceptionData();
            const ticket = payload.queueEntry?.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setFeedback(`✓ Visit completed for ticket ${ticket}.`);
                setTimeout(() => setFeedback(""), 4000);
            }
        });

        const unsubQueueUpdated = realtimeService.subscribe("QUEUE_UPDATED", () => {
            fetchReceptionData();
        });

        const unsubSignalRQueue = signalRService.on("QUEUE_UPDATED", () => {
            fetchReceptionData();
        });

        const unsubSignalRStatusChanged = signalRService.on("QUEUE_STATUS_CHANGED", () => {
            fetchReceptionData();
        });

        const unsubSignalRStatus = signalRService.on("STATUS_CHANGED", (data) => {
            setRealtimeConnected(data.status === "CONNECTED");
        });

        setRealtimeConnected(signalRService.isConnected || true);

        return () => {
            unsubCall();
            unsubComp();
            unsubQueueUpdated();
            unsubSignalRQueue();
            unsubSignalRStatusChanged();
            unsubSignalRStatus();
        };
    }, [user, fetchReceptionData]);

    // Complete Visit API call
    const handleCompleteVisit = async (ticketId) => {
        const target = queueList.find((q) => q.id === ticketId || q.ticket === ticketId || q.status === "SERVING");
        const ticket = target ? target.ticket : ticketId;

        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            await fetch("http://localhost:5000/api/v1/queue/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    id: target?.id,
                    queueNumber: ticket?.replace("#", ""),
                    notes: "Visit completed by receptionist"
                })
            });

            setFeedback(`✓ Visit completed successfully for patient ${ticket}. Status transitioned to DONE.`);

            realtimeService.emit("VISIT_COMPLETED", {
                ticket,
                formattedQueueNumber: ticket,
                patientName: target?.patient || "Patient",
                status: "DONE",
            });

            await fetchReceptionData();
        } catch (err) {
            console.error("Failed to complete visit:", err);
            setFeedback("Error completing visit on server.");
        }
        setTimeout(() => setFeedback(""), 4000);
    };

    // Auto Advance (Call next WAITING patient -> SERVING)
    const handleAutoAdvance = async () => {
        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/v1/queue/auto-advance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                const data = await res.json();
                const advanced = data.serving || data.data || data;
                const nextTicket = advanced.formattedQueueNumber || `#${String(advanced.queueNumber || 1).padStart(3, "0")}`;
                const nextPatient = advanced.patientName || advanced.customerName || "Patient";

                const msg = `⚡ Auto Advance: System identified next waiting patient (${nextTicket} - ${nextPatient}). Status transitioned WAITING → SERVING.`;
                setFeedback(msg);

                realtimeService.emit("PATIENT_CALLED", {
                    queueNumber: advanced.queueNumber || 1,
                    formattedQueueNumber: nextTicket,
                    ticket: nextTicket,
                    patientName: nextPatient,
                    serviceType: advanced.serviceType || "Clinical Consultation",
                    notification: {
                        message: `Patient ${nextTicket} is ready.`,
                    },
                });

                await fetchReceptionData();
            } else {
                setFeedback("Notice: No waiting patients left in queue to auto-advance.");
            }
        } catch (err) {
            console.error("Auto advance error:", err);
            setFeedback("Failed to auto-advance queue.");
        }
        setTimeout(() => setFeedback(""), 4000);
    };

    // Call individual customer
    const handleCallCustomer = async (item) => {
        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            await fetch("http://localhost:5000/api/v1/queue/call", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    id: item.id,
                    queueNumber: item.ticket?.replace("#", "")
                })
            });

            setFeedback(`📢 Patient ${item.ticket} (${item.patient}) called to operatory. Status: SERVING.`);

            realtimeService.emit("PATIENT_CALLED", {
                formattedQueueNumber: item.ticket,
                ticket: item.ticket,
                patientName: item.patient,
                serviceType: item.service,
                notification: {
                    message: `Patient ${item.ticket} is ready.`,
                },
            });

            await fetchReceptionData();
        } catch (err) {
            console.error("Error calling patient:", err);
            setFeedback(`Failed to dispatch call alert for ${item.ticket}.`);
        }
        setTimeout(() => setFeedback(""), 4000);
    };

    // Record Payment
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        const amt = Number(paymentForm.amount);
        if (Number.isNaN(amt) || amt <= 0) {
            setFeedback("Error: Payment amount must be greater than zero.");
            return;
        }

        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/v1/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    patientId: paymentForm.patientId || `pat-${Date.now()}`,
                    patientName: paymentForm.patientName,
                    amount: amt,
                    paymentDate: paymentForm.paymentDate,
                    method: "CASH",
                    recordedBy: `${paymentForm.recordedBy} (${user?.fullName || "Staff"})`
                })
            });

            if (res.ok) {
                setFeedback(`✓ Success: Payment of ${amt.toFixed(2)} ETB recorded for ${paymentForm.patientName}.`);
                setShowPaymentModal(false);
                setPaymentForm({
                    patientId: "",
                    patientName: "",
                    amount: "",
                    paymentDate: new Date().toISOString().split("T")[0],
                    recordedBy: "Receptionist",
                });
                await fetchReceptionData();
            } else {
                setFeedback("Failed to record payment on server.");
            }
        } catch (err) {
            console.error("Error saving payment:", err);
            setFeedback("Network error saving payment.");
        }
        setTimeout(() => setFeedback(""), 4000);
    };

    return (
        <PageContainer
            title={user ? `Receptionist Portal — ${user.fullName}` : "Receptionist Portal"}
            subtitle="Queue management, check-in lobby, payment records, and patient dispatch"
            actions={
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--primary)",
                        backgroundColor: "rgba(27, 77, 46, 0.08)",
                        border: "1px solid var(--border)",
                        borderRadius: "9999px",
                        padding: "4px 10px",
                    }}>
                        <span style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: realtimeConnected ? "#10b981" : "#f59e0b",
                            display: "inline-block",
                        }} />
                        {realtimeConnected ? "SignalR Live" : "Syncing..."}
                    </span>
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
                    backgroundColor: "rgba(27, 77, 46, 0.08)",
                    color: "var(--primary)",
                    border: "1px solid var(--border)",
                    fontWeight: 600,
                    fontSize: "0.875rem"
                }}>
                    {feedback}
                </div>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--primary)" }}>
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

            {/* Queue Management Card */}
            <div className="card" style={{ marginBottom: "1.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Clinic Queue Lobby & Real-Time Dispatch</h2>
                        <p className="card__subtitle">Monitor waiting and serving patients, call next tickets, and mark completions</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAutoAdvance}
                            title="Auto Advance to next waiting patient (WAITING -> SERVING)"
                        >
                            ⚡ Auto Advance
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCompleteVisit()}
                            title="Mark current serving patient visit as DONE"
                        >
                            ✓ Complete Visit
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowAddQueueModal(true)}
                        >
                            + Check In Patient
                        </Button>
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    {queueList.length === 0 ? (
                        <div style={{
                            padding: "3rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-md)",
                            border: "1px dashed var(--border)",
                            margin: "0.5rem"
                        }}>
                            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>👥</span>
                            <p style={{ fontWeight: 600, margin: 0 }}>No patients currently in the queue lobby</p>
                            <p style={{ fontSize: "0.8125rem", margin: "4px 0 0 0", color: "var(--text-light)" }}>
                                Click "+ Check In Patient" to register a patient upon clinic arrival
                            </p>
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "var(--bg-page)" }}>
                                    <th style={{ padding: "10px 12px" }}>Ticket</th>
                                    <th style={{ padding: "10px 12px" }}>Patient Name</th>
                                    <th style={{ padding: "10px 12px" }}>Service</th>
                                    <th style={{ padding: "10px 12px" }}>Arrival</th>
                                    <th style={{ padding: "10px 12px" }}>Assigned Operatory</th>
                                    <th style={{ padding: "10px 12px" }}>Status</th>
                                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queueList.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: "12px", fontWeight: 700, color: "var(--primary)" }}>{item.ticket}</td>
                                        <td style={{ padding: "12px", fontWeight: 600 }}>{item.patient}</td>
                                        <td style={{ padding: "12px", color: "var(--text-main)" }}>{item.service}</td>
                                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>{item.arrival}</td>
                                        <td style={{ padding: "12px", color: "var(--text-main)" }}>{item.dentist}</td>
                                        <td style={{ padding: "12px" }}>
                                            <span style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                padding: "3px 8px",
                                                borderRadius: "9999px",
                                                backgroundColor: item.status === "SERVING" ? "rgba(27, 77, 46, 0.15)" : item.status === "WAITING" ? "rgba(234, 179, 8, 0.12)" : "rgba(100, 116, 139, 0.1)",
                                                color: item.status === "SERVING" ? "var(--primary)" : item.status === "WAITING" ? "#b45309" : "#475569",
                                                border: "1px solid var(--border)"
                                            }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "right" }}>
                                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                                {item.status === "WAITING" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCallCustomer(item)}
                                                    >
                                                        📢 Call
                                                    </Button>
                                                )}
                                                {item.status === "SERVING" && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleCompleteVisit(item.id)}
                                                    >
                                                        ✓ Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Payment Ledger Card */}
            <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Recent Payment Transactions</h2>
                        <p className="card__subtitle">Verified front-desk collections and customer payment history</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <a href="/customers/fees" style={{ textDecoration: "none" }}>
                            <Button variant="outline" size="sm">
                                📊 Customer Fee Ledger →
                            </Button>
                        </a>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowPaymentModal(true)}
                        >
                            💳 Record Payment
                        </Button>
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    {paymentHistory.length === 0 ? (
                        <div style={{
                            padding: "3rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-md)",
                            border: "1px dashed var(--border)",
                            margin: "0.5rem"
                        }}>
                            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>💳</span>
                            <p style={{ fontWeight: 600, margin: 0 }}>No payments recorded yet</p>
                            <p style={{ fontSize: "0.8125rem", margin: "4px 0 0 0", color: "var(--text-light)" }}>
                                Click "Record Payment" to log patient fees and receipts
                            </p>
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "var(--bg-page)" }}>
                                    <th style={{ padding: "10px 12px" }}>Receipt ID</th>
                                    <th style={{ padding: "10px 12px" }}>Patient</th>
                                    <th style={{ padding: "10px 12px" }}>Amount Paid</th>
                                    <th style={{ padding: "10px 12px" }}>Date</th>
                                    <th style={{ padding: "10px 12px" }}>Recorded By</th>
                                    <th style={{ padding: "10px 12px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentHistory.map((pay) => (
                                    <tr key={pay.id || pay._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: "12px", fontFamily: "monospace", fontWeight: 600 }}>{pay.receipt || pay.id}</td>
                                        <td style={{ padding: "12px", fontWeight: 600 }}>{pay.patient || pay.patientName}</td>
                                        <td style={{ padding: "12px", color: "var(--primary)", fontWeight: 700 }}>{Number(pay.amount || 0).toFixed(2)} ETB</td>
                                        <td style={{ padding: "12px", color: "var(--text-muted)" }}>{pay.dueDate || pay.date || pay.paymentDate}</td>
                                        <td style={{ padding: "12px", color: "var(--text-main)" }}>{pay.recordedBy || "Receptionist"}</td>
                                        <td style={{ padding: "12px" }}>
                                            <span style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                padding: "3px 8px",
                                                borderRadius: "9999px",
                                                backgroundColor: "rgba(27, 77, 46, 0.1)",
                                                color: "var(--primary)",
                                                border: "1px solid var(--border)"
                                            }}>
                                                {pay.status || "VERIFIED"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add to Queue Modal */}
            {showAddQueueModal && (
                <AddToQueueModal
                    isOpen={showAddQueueModal}
                    onClose={() => setShowAddQueueModal(false)}
                    onSuccess={handleQueueAdded}
                />
            )}

            {/* Record Payment Modal */}
            {showPaymentModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "1rem"
                }}>
                    <div className="card" style={{ maxWidth: "480px", width: "100%", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
                        <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 className="card__title" style={{ color: "var(--primary)" }}>Record Patient Payment</h3>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-muted)" }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "4px" }}>
                                    Patient Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Hana Bekele"
                                    value={paymentForm.patientName}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, patientName: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border)",
                                        backgroundColor: "var(--bg-card)",
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "4px" }}>
                                    Amount (ETB)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="0.00"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border)",
                                        backgroundColor: "var(--bg-card)",
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "4px" }}>
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={paymentForm.paymentDate}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border)",
                                        backgroundColor: "var(--bg-card)",
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                >
                                    Save Payment
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
