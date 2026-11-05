import { useState, useEffect, useCallback } from "react";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import appointmentService from "../services/appointment.service";
import AppointmentDetailModal from "../components/appointment/AppointmentDetailModal";
import { FiRefreshCw, FiCalendar, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function MissedAppointmentsPage() {
    const [missedList, setMissedList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [feedbackType, setFeedbackType] = useState("success");

    // Modal state for selected appointment
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Inline quick reschedule modal state
    const [rescheduleTarget, setRescheduleTarget] = useState(null);
    const [newAppointmentDate, setNewAppointmentDate] = useState(
        new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16)
    );
    const [rescheduleNotes, setRescheduleNotes] = useState("");
    const [rescheduleLoading, setRescheduleLoading] = useState(false);

    const fetchMissed = useCallback(async () => {
        setLoading(true);
        try {
            const res = await appointmentService.getMissedAppointments();
            setMissedList(res.data || []);
        } catch (err) {
            setFeedbackType("danger");
            setFeedback(err.response?.data?.error?.message || err.message || "Failed to load missed appointments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMissed();
    }, [fetchMissed]);

    // Task 5 & 6: Trigger background check on demand
    const handleSync = async () => {
        setSyncing(true);
        setFeedback("");
        try {
            const res = await appointmentService.syncMissedAppointments();
            setFeedbackType("success");
            setFeedback(`Sync completed: ${res.data?.updatedCount || 0} newly missed appointments detected and updated.`);
            await fetchMissed();
        } catch (err) {
            setFeedbackType("danger");
            setFeedback(err.response?.data?.error?.message || err.message || "Sync failed.");
        } finally {
            setSyncing(false);
        }
    };

    // Task 7: Dentist Selects: New appointment date -> Then: Missed -> Upcoming
    const handleConfirmReschedule = async (e) => {
        e.preventDefault();
        if (!rescheduleTarget) return;

        setRescheduleLoading(true);
        setFeedback("");
        try {
            await appointmentService.rescheduleAppointment(
                rescheduleTarget.id || rescheduleTarget.appointmentId,
                newAppointmentDate,
                rescheduleNotes
            );
            setFeedbackType("success");
            setFeedback(`Success: Missed appointment for ${rescheduleTarget.patientName} has been rescheduled to UPCOMING.`);
            setRescheduleTarget(null);
            setRescheduleNotes("");
            await fetchMissed();
        } catch (err) {
            setFeedbackType("danger");
            setFeedback(err.response?.data?.error?.message || err.message || "Rescheduling failed.");
        } finally {
            setRescheduleLoading(false);
        }
    };

    return (
        <PageContainer
            title="Missed Appointments & Recovery"
            subtitle="Identify unattended clinical appointments and re-engage patients with rescheduling"
            actions={
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} icon={<FiRefreshCw />}>
                        {syncing ? "Auditing..." : "Audit Missed"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={fetchMissed} disabled={loading} icon={<FiRefreshCw />}>
                        {loading ? "Refreshing..." : "Refresh"}
                    </Button>
                </div>
            }
        >
            {feedback && (
                <div style={{
                    padding: "10px 16px",
                    marginBottom: "1.25rem",
                    borderRadius: "8px",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    backgroundColor: feedbackType === "success" ? "#ecfdf5" : "#fee2e2",
                    color: feedbackType === "success" ? "#065f46" : "#991b1b",
                    border: `1px solid ${feedbackType === "success" ? "#a7f3d0" : "#fca5a5"}`
                }}>
                    {feedback}
                </div>
            )}

            {/* Statistics Row */}
            <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
                <div className="card">
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Total Missed Appointments</span>
                    <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#dc2626", margin: "4px 0 0 0" }}>
                        {missedList.length}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>Awaiting patient follow-up</p>
                </div>
                <div className="card">
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Detection Rule</span>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", margin: "4px 0 0 0" }}>
                        Automated
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>Date passed + No visit</p>
                </div>
                <div className="card">
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Rescheduling Action</span>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#2563eb", margin: "4px 0 0 0" }}>
                        Missed → Upcoming
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>Reactivates treatment plan</p>
                </div>
                <div className="card">
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Audit Status</span>
                    <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#059669", margin: "4px 0 0 0" }}>
                        Active
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>Background scheduler running</p>
                </div>
            </div>

            {/* Missed Appointment Screen (Task 8: Display Patient, Procedure, Original appointment, Missed status) */}
            <div className="card">
                <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 className="card__title">Unattended Appointment Log</h2>
                        <p className="card__subtitle">
                            Displaying Patient, Procedure, Original Appointment Date, and Missed Status
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                        Loading missed appointments...
                    </div>
                ) : missedList.length === 0 ? (
                    <div style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        backgroundColor: "var(--success-bg)",
                        borderRadius: "8px",
                        border: "1px dashed var(--border)",
                        color: "var(--primary)"
                    }}>
                        <FiCheckCircle style={{ fontSize: "2rem", display: "block", margin: "0 auto 0.5rem" }} />
                        <h3 style={{ margin: "0.5rem 0 0.25rem 0", fontWeight: 700 }}>Zero Missed Appointments</h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
                            All clinical appointments are current or have been attended/rescheduled.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                                    <th style={{ padding: "10px 12px" }}>Patient</th>
                                    <th style={{ padding: "10px 12px" }}>Procedure</th>
                                    <th style={{ padding: "10px 12px" }}>Original Appointment</th>
                                    <th style={{ padding: "10px 12px" }}>Status</th>
                                    <th style={{ padding: "10px 12px" }}>Notes</th>
                                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {missedList.map((apt) => (
                                    <tr key={apt.id || apt.appointmentId} style={{ borderBottom: "1px solid var(--border)" }}>
                                        {/* 1. Patient */}
                                        <td style={{ padding: "12px" }}>
                                            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                                {apt.patientName || `Patient ${apt.patientId}`}
                                            </div>
                                            {apt.patientContact && (
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                    {apt.patientContact}
                                                </div>
                                            )}
                                        </td>

                                        {/* 2. Procedure */}
                                        <td style={{ padding: "12px" }}>
                                            <div style={{ fontWeight: 600, color: "#1e293b" }}>
                                                {apt.procedureName || "Dental Consultation"}
                                            </div>
                                            {apt.procedureCost > 0 && (
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                    Cost: ${Number(apt.procedureCost).toFixed(2)}
                                                </div>
                                            )}
                                        </td>

                                        {/* 3. Original Appointment */}
                                        <td style={{ padding: "12px" }}>
                                            <div style={{ fontWeight: 600, color: "#dc2626", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <FiCalendar />
                                                <span>{new Date(apt.appointmentDate || apt.scheduledDate).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                {new Date(apt.appointmentDate || apt.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </td>

                                        {/* 4. Missed Status */}
                                        <td style={{ padding: "12px" }}>
                                            <span style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                padding: "4px 8px",
                                                borderRadius: "9999px",
                                                backgroundColor: "#fee2e2",
                                                color: "#991b1b",
                                                border: "1px solid #fca5a5",
                                            }}>
                                                MISSED
                                            </span>
                                        </td>

                                        {/* Notes */}
                                        <td style={{ padding: "12px", color: "var(--text-muted)", maxWidth: "200px" }}>
                                            <span style={{ display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                                                {apt.notes || "No notes"}
                                            </span>
                                        </td>

                                        {/* Actions (Reschedule Missed -> Upcoming) */}
                                        <td style={{ padding: "12px", textAlign: "right" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setRescheduleTarget(apt);
                                                        setNewAppointmentDate(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16));
                                                    }}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "6px",
                                                        backgroundColor: "var(--primary)",
                                                        color: "white",
                                                        border: "none",
                                                        fontWeight: 600,
                                                        fontSize: "0.8125rem",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                >
                                                    <FiCalendar />
                                                    <span>Reschedule</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedAppointment(apt)}
                                                    style={{
                                                        padding: "6px 10px",
                                                        borderRadius: "6px",
                                                        backgroundColor: "var(--bg-page)",
                                                        color: "var(--text-main)",
                                                        border: "1px solid var(--border)",
                                                        fontWeight: 600,
                                                        fontSize: "0.8125rem",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reschedule Modal (Dentist Selects New Date -> Missed transitions to Upcoming) */}
            {rescheduleTarget && (
                <div className="modal-backdrop" onClick={() => setRescheduleTarget(null)} style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "1rem"
                }}>
                    <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        maxWidth: "480px",
                        width: "100%",
                        padding: "1.5rem",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                    }}>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                            Reschedule Missed Appointment
                        </h3>
                        <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: "0 0 1rem 0" }}>
                            Patient: <strong>{rescheduleTarget.patientName}</strong> • Procedure: <strong>{rescheduleTarget.procedureName}</strong>
                        </p>

                        <form onSubmit={handleConfirmReschedule} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Select New Appointment Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={newAppointmentDate}
                                    onChange={(e) => setNewAppointmentDate(e.target.value)}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Dentist Consultation Notes / Follow-up Details
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="e.g. Rescheduled after patient phone call. Confirmed attendance."
                                    value={rescheduleNotes}
                                    onChange={(e) => setRescheduleNotes(e.target.value)}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setRescheduleTarget(null)}
                                    style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={rescheduleLoading}
                                    style={{
                                        padding: "8px 18px",
                                        borderRadius: "6px",
                                        border: "none",
                                        backgroundColor: "var(--primary)",
                                        color: "white",
                                        cursor: "pointer",
                                        fontWeight: 600
                                    }}
                                >
                                    {rescheduleLoading ? "Rescheduling..." : "Confirm Reschedule"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
                <AppointmentDetailModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                    onRefresh={fetchMissed}
                />
            )}
        </PageContainer>
    );
}
