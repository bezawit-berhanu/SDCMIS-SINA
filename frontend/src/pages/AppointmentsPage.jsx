import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiRefreshCw, FiCalendar, FiX, FiClipboard } from "react-icons/fi";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import appointmentService from "../services/appointment.service";
import patientService from "../services/patient.service";
import AppointmentCalendar from "../components/appointment/AppointmentCalendar";
import AppointmentDetailModal from "../components/appointment/AppointmentDetailModal";

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming", "all", "calendar"
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [feedback, setFeedback] = useState("");
    const [feedbackType, setFeedbackType] = useState("success");

    // Book Appointment Modal State
    const [showBookModal, setShowBookModal] = useState(false);
    const [bookForm, setBookForm] = useState({
        patientId: "",
        procedureId: "",
        appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        notes: "",
    });
    const [bookLoading, setBookLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [aptRes, patRes] = await Promise.all([
                appointmentService.getAppointments(),
                patientService.getPatients().catch(() => ({ data: [] })),
            ]);
            setAppointments(aptRes.data || []);
            setPatients(patRes.data || []);
            if (patRes.data?.length > 0 && !bookForm.patientId) {
                setBookForm((prev) => ({ ...prev, patientId: patRes.data[0].id }));
            }
        } catch (err) {
            setFeedbackType("danger");
            setFeedback(err.response?.data?.error?.message || err.message || "Failed to load appointments.");
        } finally {
            setLoading(false);
        }
    }, [bookForm.patientId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        setBookLoading(true);
        setFeedback("");
        try {
            const created = await appointmentService.createAppointment({
                patientId: bookForm.patientId,
                procedureId: bookForm.procedureId || null,
                appointmentDate: bookForm.appointmentDate,
                notes: bookForm.notes,
            });
            setFeedbackType("success");
            setFeedback(`Appointment booked successfully for ${created.data?.patientName || "patient"}.`);
            setShowBookModal(false);
            setBookForm({
                patientId: patients[0]?.id || "",
                procedureId: "",
                appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                notes: "",
            });
            await loadData();
        } catch (err) {
            setFeedbackType("danger");
            setFeedback(err.response?.data?.error?.message || err.message || "Failed to book appointment.");
        } finally {
            setBookLoading(false);
        }
    };

    // Filter appointments by tab and selected date
    const displayedAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate || apt.scheduledDate);

        // Date filter if user selected a date in calendar
        if (selectedDate) {
            const sel = new Date(selectedDate);
            const matchesDay = aptDate.getFullYear() === sel.getFullYear() &&
                              aptDate.getMonth() === sel.getMonth() &&
                              aptDate.getDate() === sel.getDate();
            if (!matchesDay) return false;
        }

        if (activeTab === "upcoming") {
            return apt.status === "UPCOMING";
        }
        if (activeTab === "missed") {
            return apt.status === "MISSED";
        }
        return true;
    });

    const upcomingCount = appointments.filter((a) => a.status === "UPCOMING").length;
    const missedCount = appointments.filter((a) => a.status === "MISSED").length;

    const selectedPatientProcedures = (
        patients.find((p) => String(p.id) === String(bookForm.patientId))?.procedures || []
    );

    return (
        <PageContainer
            title="Clinical Appointments & Scheduling"
            subtitle="Manage patient appointments, upcoming task queues, calendar scheduling, and visit records"
            actions={
                <div style={{ display: "flex", gap: "8px" }}>
                    <Link to="/appointments/missed">
                        <Button variant="outline" size="sm" style={{ color: "#dc2626", borderColor: "#fca5a5", display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <FiAlertTriangle /> Missed Appointments ({missedCount})
                        </Button>
                    </Link>
                    <Button variant="primary" size="sm" onClick={() => setShowBookModal(true)}>
                        + Book Appointment
                    </Button>
                    <Button variant="secondary" size="sm" onClick={loadData} disabled={loading}>
                        {loading ? "Refreshing..." : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FiRefreshCw /> Refresh</span>}
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

            {/* Top Quick Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
                <div className="card" onClick={() => { setActiveTab("upcoming"); setSelectedDate(null); }} style={{ cursor: "pointer" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Upcoming Tasks</span>
                    <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2563eb", margin: "4px 0 0 0" }}>
                        {upcomingCount}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>Scheduled clinical sessions</p>
                </div>

                <div className="card" onClick={() => { setActiveTab("missed"); setSelectedDate(null); }} style={{ cursor: "pointer" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Missed Visits</span>
                    <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "#dc2626", margin: "4px 0 0 0" }}>
                        {missedCount}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>Need dentist rescheduling</p>
                </div>

                <div className="card" onClick={() => { setActiveTab("all"); setSelectedDate(null); }} style={{ cursor: "pointer" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Total Bookings</span>
                    <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-main)", margin: "4px 0 0 0" }}>
                        {appointments.length}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>All status records</p>
                </div>

                <div className="card" onClick={() => setActiveTab("calendar")} style={{ cursor: "pointer" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>Calendar View</span>
                    <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#059669", margin: "6px 0 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <FiCalendar /> Day & Month
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "4px" }}>Interactive date selection</p>
                </div>
            </div>

            {/* Layout Grid: Left (List / Upcoming Tasks), Right (Calendar / Date Selector) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.5rem" }}>
                {/* Left Panel: Appointment List & Upcoming Tasks Dashboard */}
                <div className="card">
                    <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h2 className="card__title">
                                {activeTab === "upcoming" ? "Upcoming Tasks Dashboard" : (activeTab === "missed" ? "Missed Appointments" : "Appointment List")}
                            </h2>
                            <p className="card__subtitle">
                                {selectedDate
                                    ? `Showing visits for ${new Date(selectedDate).toLocaleDateString()}`
                                    : "Displaying: Patient, Procedure, Appointment Date, and Status"}
                            </p>
                        </div>

                        {/* Filter Tabs */}
                        <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                            <button
                                type="button"
                                onClick={() => { setActiveTab("upcoming"); }}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    backgroundColor: activeTab === "upcoming" ? "white" : "transparent",
                                    color: activeTab === "upcoming" ? "#2563eb" : "#64748b",
                                    boxShadow: activeTab === "upcoming" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                                }}
                            >
                                Upcoming
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab("all"); }}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    backgroundColor: activeTab === "all" ? "white" : "transparent",
                                    color: activeTab === "all" ? "#2563eb" : "#64748b",
                                    boxShadow: activeTab === "all" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                                }}
                            >
                                All ({appointments.length})
                            </button>
                            {selectedDate && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(null)}
                                    style={{
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        border: "none",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        backgroundColor: "#fee2e2",
                                        color: "#991b1b",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <FiX /> Clear Date
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Task 3 & 4: Upcoming Tasks Dashboard / Appointment List */}
                    {displayedAppointments.length === 0 ? (
                        <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#64748b" }}>
                            <FiClipboard size={32} color="#94a3b8" />
                            <p style={{ margin: "8px 0 0 0", fontWeight: 600 }}>No appointments found for the selected view.</p>
                            <p style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>Try selecting another date or click "+ Book Appointment".</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                                        <th style={{ padding: "10px 12px" }}>Patient</th>
                                        <th style={{ padding: "10px 12px" }}>Procedure</th>
                                        <th style={{ padding: "10px 12px" }}>Appointment Date</th>
                                        <th style={{ padding: "10px 12px" }}>Status</th>
                                        <th style={{ padding: "10px 12px", textAlign: "right" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedAppointments.map((apt) => (
                                        <tr key={apt.id || apt.appointmentId} style={{ borderBottom: "1px solid var(--border)" }}>
                                            {/* Patient */}
                                            <td style={{ padding: "10px 12px" }}>
                                                <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                                                    {apt.patientName || `Patient ${apt.patientId}`}
                                                </div>
                                                {apt.patientContact && (
                                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                        {apt.patientContact}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Procedure */}
                                            <td style={{ padding: "10px 12px" }}>
                                                <div style={{ fontWeight: 600, color: "#334155" }}>
                                                    {apt.procedureName || "Dental Consultation"}
                                                </div>
                                                {apt.procedureCost > 0 && (
                                                    <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 500 }}>
                                                        ${Number(apt.procedureCost).toFixed(2)}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Appointment Date */}
                                            <td style={{ padding: "10px 12px" }}>
                                                <div style={{ fontWeight: 600, color: "#1e40af" }}>
                                                    {new Date(apt.appointmentDate || apt.scheduledDate).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                    {new Date(apt.appointmentDate || apt.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: "10px 12px" }}>
                                                <span style={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    padding: "3px 8px",
                                                    borderRadius: "9999px",
                                                    backgroundColor: apt.status === "UPCOMING" ? "#e0e7ff" : (apt.status === "MISSED" ? "#fee2e2" : "#d1fae5"),
                                                    color: apt.status === "UPCOMING" ? "#3730a3" : (apt.status === "MISSED" ? "#991b1b" : "#065f46"),
                                                    border: `1px solid ${apt.status === "UPCOMING" ? "#c7d2fe" : (apt.status === "MISSED" ? "#fca5a5" : "#a7f3d0")}`
                                                }}>
                                                    {apt.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedAppointment(apt)}
                                                    style={{
                                                        padding: "5px 10px",
                                                        borderRadius: "6px",
                                                        border: "1px solid #cbd5e1",
                                                        backgroundColor: "white",
                                                        color: "#2563eb",
                                                        fontWeight: 600,
                                                        fontSize: "0.8125rem",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right Panel: Task 4 Calendar & Date Selection Component */}
                <div>
                    <AppointmentCalendar
                        selectedDate={selectedDate}
                        onDateSelect={(d) => setSelectedDate(d)}
                        appointments={appointments}
                    />

                    {/* Missed Quick Box */}
                    <div style={{
                        marginTop: "1.25rem",
                        padding: "1.25rem",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "12px"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#991b1b" }}>
                                Missed Appointments Tracker
                            </h4>
                            <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#b91c1c" }}>
                                {missedCount}
                            </span>
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "#7f1d1d", margin: "6px 0 12px 0" }}>
                            Appointments whose scheduled time passed without an attended clinical visit.
                        </p>
                        <Link to="/appointments/missed" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth size="sm" style={{ backgroundColor: "white", color: "#b91c1c", borderColor: "#fca5a5" }}>
                                View Missed Log & Reschedule →
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Book Appointment Modal */}
            {showBookModal && (
                <div className="modal-backdrop" onClick={() => setShowBookModal(false)} style={{
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
                        maxWidth: "500px",
                        width: "100%",
                        padding: "1.5rem",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                    }}>
                        <h3 style={{ margin: "0 0 12px 0", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
                            Book Dental Appointment
                        </h3>

                        <form onSubmit={handleBookAppointment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {/* Patient Select */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Select Patient *
                                </label>
                                <select
                                    required
                                    value={bookForm.patientId}
                                    onChange={(e) => setBookForm({ ...bookForm, patientId: e.target.value, procedureId: "" })}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    {patients.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name || p.fullName} ({p.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Procedure Select */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Link Clinical Procedure (Optional)
                                </label>
                                <select
                                    value={bookForm.procedureId}
                                    onChange={(e) => setBookForm({ ...bookForm, procedureId: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="">General Dental Consultation / Exam</option>
                                    {selectedPatientProcedures.map((proc) => (
                                        <option key={proc.id} value={proc.id}>
                                            {proc.name || proc.description} (${Number(proc.cost || 0).toFixed(2)}) [{proc.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Appointment Date */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Appointment Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={bookForm.appointmentDate}
                                    onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Notes & Instructions
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="e.g. Needs x-ray imaging prior to restoration"
                                    value={bookForm.notes}
                                    onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowBookModal(false)}
                                    style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookLoading}
                                    style={{ padding: "8px 18px", borderRadius: "6px", border: "none", backgroundColor: "#2563eb", color: "white", cursor: "pointer", fontWeight: 600 }}
                                >
                                    {bookLoading ? "Booking..." : "Confirm Booking"}
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
                    onRefresh={loadData}
                />
            )}
        </PageContainer>
    );
}
