import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import { realtimeService } from "../services/realtime.service";

export default function DentistPage() {
    const { user, restoreSession } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [liveAlert, setLiveAlert] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [currentServing, setCurrentServing] = useState(null);
    const [queueItems, setQueueItems] = useState([]);
    const [procedures, setProcedures] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [actionMsg, setActionMsg] = useState("");
    const [stats, setStats] = useState([
        { label: "Today's Patients", value: "0", change: "Based on active queue", icon: "🦷" },
        { label: "In Operatory", value: "0", change: "Currently being served", icon: "⚕️" },
        { label: "Waiting in Queue", value: "0", change: "Awaiting consultation", icon: "⏳" },
        { label: "Completed Visits", value: "0", change: "Visits finalized today", icon: "✅" },
    ]);

    const fetchDentistData = useCallback(async () => {
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
                const items = qData.queue || qData.data || (Array.isArray(qData) ? qData : []);
                setQueueItems(items);

                const serving = items.find((item) => item.status === "SERVING");
                if (serving) {
                    setCurrentServing({
                        id: serving.id,
                        ticket: serving.formattedQueueNumber || `#${String(serving.queueNumber || 1).padStart(3, "0")}`,
                        patient: serving.patientName || serving.customerName || "Patient",
                        service: serving.serviceType || "Clinical Consultation",
                        status: "SERVING"
                    });
                } else {
                    setCurrentServing(null);
                }

                const waitingCount = items.filter((i) => i.status === "WAITING").length;
                const servingCount = items.filter((i) => i.status === "SERVING").length;
                const doneCount = items.filter((i) => i.status === "DONE" || i.status === "COMPLETED").length;

                setStats([
                    { label: "Today's Patients", value: String(items.length), change: "Active registrations today", icon: "🦷" },
                    { label: "In Operatory", value: String(servingCount), change: "Currently in chair", icon: "⚕️" },
                    { label: "Waiting in Queue", value: String(waitingCount), change: "Ready for call", icon: "⏳" },
                    { label: "Completed Visits", value: String(doneCount), change: "Finalized today", icon: "✅" },
                ]);
            }

            // Fetch live appointments for tasks
            const apptRes = await fetch("http://localhost:5000/api/v1/appointments", { headers });
            if (apptRes.ok) {
                const aData = await apptRes.json();
                const appts = aData.appointments || aData.data || (Array.isArray(aData) ? aData : []);
                setUpcomingTasks(appts);
            }
        } catch (err) {
            console.error("Error loading dentist portal data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDentistData();
    }, [fetchDentistData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([restoreSession(), fetchDentistData()]);
        } finally {
            setTimeout(() => setRefreshing(false), 400);
        }
    };

    // Real-time synchronization: Dentist receives live notifications & queue updates
    useEffect(() => {
        realtimeService.connect({
            role: "DENTIST",
            userId: user?.id || "usr-dentist-01",
        });

        const unsubscribeCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket || `#${String(payload.queueNumber || 1).padStart(3, "0")}`;
            const patientName = payload.patientName || payload.patient || "Patient";
            const alertMsg = payload.notification?.message || `Patient ${ticket} is ready.`;

            setLiveAlert({
                message: alertMsg,
                ticket,
                patientName,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });

            setCurrentServing({
                ticket,
                patient: patientName,
                service: payload.serviceType || "Clinical Consultation",
                status: "SERVING",
            });

            fetchDentistData();
        });

        const unsubscribeQueue = realtimeService.subscribe("QUEUE_UPDATED", () => {
            fetchDentistData();
        });

        const unsubscribeNotif = realtimeService.subscribe("NOTIFICATION_CREATED", (payload) => {
            const alertMsg = payload.message || "New patient alert received.";
            setLiveAlert({
                message: alertMsg,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });
            fetchDentistData();
        });

        return () => {
            unsubscribeCall();
            unsubscribeQueue();
            unsubscribeNotif();
        };
    }, [user, fetchDentistData]);

    // Advance Procedure
    const advanceToOngoing = (procId) => {
        setProcedures((prev) =>
            prev.map((p) => (p.id === procId ? { ...p, status: "ONGOING" } : p))
        );
        setActionMsg(`Procedure ${procId} transitioned to ONGOING.`);
        setTimeout(() => setActionMsg(""), 3000);
    };

    const markAsDone = (procId) => {
        setProcedures((prev) =>
            prev.map((p) => (p.id === procId ? { ...p, status: "DONE" } : p))
        );
        setActionMsg(`Procedure ${procId} transitioned to DONE.`);
        setTimeout(() => setActionMsg(""), 3000);
    };

    // Dentist Complete Visit
    const handleDentistCompleteVisit = async () => {
        if (!currentServing || currentServing.status === "DONE") {
            setActionMsg("Notice: No active patient in chair to complete.");
            setTimeout(() => setActionMsg(""), 3000);
            return;
        }

        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/v1/queue/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    id: currentServing.id,
                    queueNumber: currentServing.ticket?.replace("#", ""),
                    notes: "Visit completed by dentist"
                })
            });

            const patientName = currentServing.patient;
            const ticket = currentServing.ticket;

            setCurrentServing(null);
            setActionMsg(`✓ Visit completed for ${patientName} (${ticket}). Status transitioned to DONE.`);

            realtimeService.emit("VISIT_COMPLETED", {
                ticket,
                formattedQueueNumber: ticket,
                patientName,
                status: "DONE",
                dentist: user?.fullName || "Dentist",
            });

            await fetchDentistData();
        } catch (err) {
            console.error("Failed to complete visit:", err);
            setActionMsg("Error finalizing patient visit.");
        }
        setTimeout(() => setActionMsg(""), 4000);
    };

    // Dentist Auto Advance Next Waiting Patient
    const handleDentistAutoAdvance = async () => {
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

                setCurrentServing({
                    id: advanced.id,
                    ticket: nextTicket,
                    patient: nextPatient,
                    service: advanced.serviceType || "Clinical Consultation",
                    status: "SERVING",
                });

                setActionMsg(`⚡ Auto Advance: System called next waiting patient (${nextTicket} - ${nextPatient}).`);

                realtimeService.emit("PATIENT_CALLED", {
                    ticket: nextTicket,
                    formattedQueueNumber: nextTicket,
                    patientName: nextPatient,
                    serviceType: advanced.serviceType || "Clinical Consultation",
                    notification: {
                        message: `Patient ${nextTicket} is ready.`,
                    },
                });

                await fetchDentistData();
            } else {
                const err = await res.json().catch(() => ({}));
                setActionMsg(err.message || "No waiting patients available in queue.");
            }
        } catch (err) {
            console.error("Auto advance error:", err);
            setActionMsg("Failed to auto-advance queue.");
        }
        setTimeout(() => setActionMsg(""), 4000);
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
            {/* Real-Time Live Notification Alert */}
            {liveAlert && (
                <div
                    role="alert"
                    data-testid="dentist-live-alert"
                    style={{
                        padding: "14px 18px",
                        marginBottom: "1.25rem",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-card)",
                        color: "var(--primary)",
                        border: "2px solid var(--border-focus)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: "var(--shadow-sm)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.5rem" }}>🔔</span>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: 0, color: "var(--primary-hover)" }}>
                                Live Reception Alert: {liveAlert.message}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                                Received at {liveAlert.time} • Automatic live synchronization active
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setLiveAlert(null)}
                    >
                        Dismiss
                    </Button>
                </div>
            )}

            {actionMsg && (
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
                    ✓ {actionMsg}
                </div>
            )}

            {/* Metric Cards with Greenish Tint */}
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

            {/* Chairside Operatory Queue Management */}
            <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid var(--primary)", backgroundColor: "var(--bg-surface)" }}>
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Chairside Operatory — Active Patient Visit</h2>
                        <p className="card__subtitle">Complete active patient visit and auto-advance queue</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleDentistAutoAdvance}
                            title="Auto Advance to next waiting patient"
                        >
                            ⚡ Auto Advance Next Patient
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleDentistCompleteVisit}
                            disabled={!currentServing}
                        >
                            ✓ Complete Visit
                        </Button>
                    </div>
                </div>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1.25rem",
                    backgroundColor: "var(--bg-page)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{
                            fontSize: "1.25rem",
                            fontWeight: 800,
                            padding: "6px 14px",
                            borderRadius: "6px",
                            backgroundColor: currentServing ? "rgba(27, 77, 46, 0.12)" : "var(--bg-surface)",
                            color: currentServing ? "var(--primary)" : "var(--text-muted)",
                            border: "1px solid var(--border)",
                        }}>
                            {currentServing?.ticket || "#---"}
                        </span>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: "1rem", margin: 0, color: "var(--text-main)" }}>
                                {currentServing?.patient || "No patient currently in chair"}
                            </p>
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
                                {currentServing ? `${currentServing.service} • Operatory 1` : "Operatory is currently ready for next check-in or call"}
                            </p>
                        </div>
                    </div>
                    <span style={{
                        fontWeight: 700,
                        fontSize: "0.8125rem",
                        padding: "5px 12px",
                        borderRadius: "9999px",
                        backgroundColor: currentServing ? "rgba(27, 77, 46, 0.1)" : "var(--bg-surface)",
                        color: currentServing ? "var(--primary)" : "var(--text-muted)",
                        border: "1px solid var(--border)",
                    }}>
                        {currentServing ? currentServing.status : "IDLE"}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2">
                <div className="card" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <div className="card__header">
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Today's Treatment Schedule</h2>
                        <p className="card__subtitle">Scheduled clinical procedures and operations (Next → Ongoing → Done)</p>
                    </div>
                    {procedures.length === 0 ? (
                        <div style={{
                            padding: "2rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-md)",
                            border: "1px dashed var(--border)"
                        }}>
                            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>📋</span>
                            <p style={{ fontWeight: 600, margin: 0 }}>No active clinical procedures scheduled</p>
                            <p style={{ fontSize: "0.8125rem", margin: "4px 0 0 0", color: "var(--text-light)" }}>Procedures will display dynamically as patients check in</p>
                        </div>
                    ) : (
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
                                                color: "var(--primary)",
                                                backgroundColor: "rgba(27, 77, 46, 0.1)",
                                                padding: "0.25rem 0.5rem",
                                                borderRadius: "var(--radius-sm)",
                                            }}
                                        >
                                            {proc.status}
                                        </span>
                                        {proc.status === "NEXT" && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => advanceToOngoing(proc.id)}
                                            >
                                                Start (→ Ongoing)
                                            </Button>
                                        )}
                                        {proc.status === "ONGOING" && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => markAsDone(proc.id)}
                                            >
                                                Complete (→ Done)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <div className="card__header">
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Clinical Actions & Appointments</h2>
                        <p className="card__subtitle">Perform clinical workflows, visit scheduling, and recovery</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <a href="/appointments" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                                📅 View & Manage All Appointments
                            </Button>
                        </a>
                        <a href="/appointments/missed" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start", color: "#b91c1c", borderColor: "#fecaca" }}>
                                ⚠️ Review & Reschedule Missed Visits
                            </Button>
                        </a>
                        <a href="/patients" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                                📋 View Patient Clinical History
                            </Button>
                        </a>
                        <a href="/tasks/upcoming" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth style={{ justifyContent: "flex-start" }}>
                                🕒 Upcoming Clinical Tasks Dashboard
                            </Button>
                        </a>
                    </div>
                </div>
            </div>

            {/* Upcoming Clinical Tasks Dashboard Table */}
            <div className="card" style={{ marginTop: "1.5rem", backgroundColor: "var(--bg-surface)" }}>
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Upcoming Clinical Tasks Dashboard</h2>
                        <p className="card__subtitle">Displaying Patient, Procedure, Appointment Date, and Status</p>
                    </div>
                    <a href="/appointments" style={{ textDecoration: "none" }}>
                        <Button variant="outline" size="sm">
                            Open Full Calendar →
                        </Button>
                    </a>
                </div>
                <div style={{ overflowX: "auto" }}>
                    {upcomingTasks.length === 0 ? (
                        <div style={{
                            padding: "2.5rem",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-md)",
                            border: "1px dashed var(--border)",
                            margin: "0.5rem"
                        }}>
                            <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>📅</span>
                            <p style={{ fontWeight: 600, margin: 0 }}>No upcoming appointment tasks found</p>
                            <p style={{ fontSize: "0.8125rem", margin: "4px 0 0 0", color: "var(--text-light)" }}>All appointments scheduled for patients will appear here in real time</p>
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                                    <th style={{ padding: "10px 12px" }}>Patient</th>
                                    <th style={{ padding: "10px 12px" }}>Procedure / Reason</th>
                                    <th style={{ padding: "10px 12px" }}>Appointment Date</th>
                                    <th style={{ padding: "10px 12px" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {upcomingTasks.map((task) => (
                                    <tr key={task.id || task._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <td style={{ padding: "12px", fontWeight: 600 }}>{task.patientName || task.patient || "Patient"}</td>
                                        <td style={{ padding: "12px", color: "var(--text-main)" }}>{task.procedure || task.reason || "Dental Consultation"}</td>
                                        <td style={{ padding: "12px", color: "var(--primary)", fontWeight: 500 }}>
                                            {task.date || task.scheduledAt || "Scheduled"} • {task.time || task.scheduledTime || ""}
                                        </td>
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
                                                {task.status || "UPCOMING"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
