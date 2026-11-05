import { useState } from "react";
import { FiX, FiCheck, FiCalendar, FiAlertCircle } from "react-icons/fi";
import appointmentService from "../../services/appointment.service";

export default function AppointmentDetailModal({ appointment, onClose, onRefresh }) {
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");

    // Cancel state
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    // Reschedule state (Task 7: Dentist Selects: New appointment date -> Missed transitions to Upcoming)
    const [showRescheduleForm, setShowRescheduleForm] = useState(false);
    const [newDate, setNewDate] = useState(
        new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16)
    );
    const [rescheduleNotes, setRescheduleNotes] = useState("");

    if (!appointment) return null;

    const aptId = appointment.id || appointment.appointmentId;
    const formattedDate = new Date(appointment.appointmentDate || appointment.scheduledDate).toLocaleString();

    const handleCancel = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setActionError("");
        try {
            await appointmentService.cancelAppointment(aptId, cancelReason);
            setActionSuccess("Appointment has been cancelled successfully.");
            setShowCancelForm(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            setActionError(err.response?.data?.error?.message || err.message || "Failed to cancel appointment.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReschedule = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setActionError("");
        try {
            await appointmentService.rescheduleAppointment(aptId, newDate, rescheduleNotes);
            setActionSuccess("Appointment rescheduled successfully. Status updated to UPCOMING.");
            setShowRescheduleForm(false);
            if (onRefresh) onRefresh();
        } catch (err) {
            setActionError(err.response?.data?.error?.message || err.message || "Failed to reschedule appointment.");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch ((status || "").toUpperCase()) {
            case "UPCOMING":
                return { backgroundColor: "#e0e7ff", color: "#3730a3", border: "1px solid #c7d2fe" };
            case "MISSED":
                return { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" };
            case "ATTENDED":
                return { backgroundColor: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" };
            case "CANCELLED":
                return { backgroundColor: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb" };
            default:
                return { backgroundColor: "#f1f5f9", color: "#334155" };
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{
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
            <div
                className="modal-dialog"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    maxWidth: "580px",
                    width: "100%",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden"
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    backgroundColor: "#f8fafc"
                }}>
                    <div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.75rem", fontFamily: "monospace", padding: "2px 6px", backgroundColor: "#e2e8f0", borderRadius: "4px", fontWeight: 700 }}>
                                {aptId}
                            </span>
                            <span style={{
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                ...getStatusStyle(appointment.status)
                            }}>
                                {appointment.status}
                            </span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                            Clinical Appointment Details
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ border: "none", background: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b", display: "inline-flex", alignItems: "center" }}
                    >
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: "1.5rem" }}>
                    {actionSuccess && (
                        <div style={{ padding: "10px 14px", marginBottom: "1rem", borderRadius: "6px", backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <FiCheck /> {actionSuccess}
                        </div>
                    )}
                    {actionError && (
                        <div style={{ padding: "10px 14px", marginBottom: "1rem", borderRadius: "6px", backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <FiAlertCircle /> {actionError}
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "1.25rem" }}>
                        <div style={{ padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Patient</span>
                            <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{appointment.patientName || `Patient ${appointment.patientId}`}</strong>
                            {appointment.patientContact && (
                                <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                                    {appointment.patientContact}
                                </span>
                            )}
                        </div>

                        <div style={{ padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Procedure</span>
                            <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{appointment.procedureName || "General Consultation"}</strong>
                            {appointment.procedureCost > 0 && (
                                <span style={{ display: "block", fontSize: "0.75rem", color: "#059669", fontWeight: 600, marginTop: "2px" }}>
                                    Fee: ${Number(appointment.procedureCost).toFixed(2)}
                                </span>
                            )}
                        </div>

                        <div style={{ padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9", gridColumn: "span 2" }}>
                            <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Scheduled Date & Time</span>
                            <strong style={{ fontSize: "1rem", color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <FiCalendar /> {formattedDate}
                            </strong>
                        </div>
                    </div>

                    {/* Clinical Notes */}
                    <div style={{ marginBottom: "1.25rem" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                            Clinical & Scheduling Notes
                        </label>
                        <div style={{
                            padding: "10px",
                            backgroundColor: "#fdfdfd",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            color: "#334155",
                            minHeight: "48px"
                        }}>
                            {appointment.notes || "No notes recorded for this visit."}
                        </div>
                    </div>

                    {/* Reschedule Form (Task 7) */}
                    {showRescheduleForm && (
                        <form onSubmit={handleReschedule} style={{
                            backgroundColor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: "8px",
                            padding: "14px",
                            marginBottom: "1rem"
                        }}>
                            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e40af" }}>
                                Select New Appointment Date (Dentist Rescheduling)
                            </h4>
                            <div style={{ marginBottom: "8px" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#1e3a8a", marginBottom: "4px" }}>
                                    New Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #93c5fd" }}
                                />
                            </div>
                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#1e3a8a", marginBottom: "4px" }}>
                                    Rescheduling Reason / Notes
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Patient rescheduled after follow-up phone call"
                                    value={rescheduleNotes}
                                    onChange={(e) => setRescheduleNotes(e.target.value)}
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #93c5fd" }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowRescheduleForm(false)}
                                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "0.8125rem" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}
                                >
                                    {actionLoading ? "Updating..." : "Confirm Reschedule (→ Upcoming)"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Cancel Form */}
                    {showCancelForm && (
                        <form onSubmit={handleCancel} style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "14px",
                            marginBottom: "1rem"
                        }}>
                            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.875rem", fontWeight: 700, color: "#991b1b" }}>
                                Cancel Appointment
                            </h4>
                            <div style={{ marginBottom: "10px" }}>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#7f1d1d", marginBottom: "4px" }}>
                                    Cancellation Reason *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Patient requested cancellation"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #fca5a5" }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCancelForm(false)}
                                    style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontSize: "0.8125rem" }}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{ padding: "6px 14px", borderRadius: "6px", border: "none", background: "#dc2626", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.8125rem" }}
                                >
                                    {actionLoading ? "Cancelling..." : "Confirm Cancellation"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Action Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {appointment.status !== "CANCELLED" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRescheduleForm(!showRescheduleForm);
                                        setShowCancelForm(false);
                                    }}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: "6px",
                                        backgroundColor: "#2563eb",
                                        color: "white",
                                        border: "none",
                                        fontWeight: 600,
                                        fontSize: "0.8125rem",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <FiCalendar /> Reschedule
                                </button>
                            )}

                            {appointment.status === "UPCOMING" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCancelForm(!showCancelForm);
                                        setShowRescheduleForm(false);
                                    }}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: "6px",
                                        backgroundColor: "white",
                                        color: "#dc2626",
                                        border: "1px solid #fca5a5",
                                        fontWeight: 600,
                                        fontSize: "0.8125rem",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    <FiX /> Cancel
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "6px",
                                backgroundColor: "#f1f5f9",
                                color: "#334155",
                                border: "1px solid #cbd5e1",
                                fontWeight: 600,
                                fontSize: "0.8125rem",
                                cursor: "pointer"
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
