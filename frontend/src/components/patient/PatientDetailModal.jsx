import React, { useState, useEffect, useCallback } from "react";
import { usePatientContext } from "../../features/patient/patient-context";
import patientService from "../../services/patient.service";
import procedureService from "../../services/procedure.service";
import paymentService from "../../services/payment.service";

export default function PatientDetailModal() {
    const {
        isDetailOpen,
        setIsDetailOpen,
        detailPatient,
        openEdit,
        fetchPatients,
    } = usePatientContext();

    const [fullDetail, setFullDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const [feedbackType, setFeedbackType] = useState("success");

    // Next Procedure Modal Form State
    const [showNextProcForm, setShowNextProcForm] = useState(false);
    const [nextProcForm, setNextProcForm] = useState({
        name: "",
        description: "",
        cost: "",
        targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    });

    // Record Payment Modal Form State
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        recordedBy: "Front Desk Staff",
    });

    const refreshPatientDetails = useCallback(async () => {
        if (!detailPatient?.id) return;
        setLoading(true);
        try {
            const res = await patientService.getPatientById(detailPatient.id);
            setFullDetail(res.data || res);
            if (fetchPatients) fetchPatients();
        } catch (_) {
            // Keep existing state
        } finally {
            setLoading(false);
        }
    }, [detailPatient?.id, fetchPatients]);

    useEffect(() => {
        if (detailPatient?.id && isDetailOpen) {
            refreshPatientDetails();
        }
    }, [detailPatient?.id, isDetailOpen, refreshPatientDetails]);

    // Task 4: Next -> Ongoing transition
    const handleStartOngoing = async (procId) => {
        setActionLoading(true);
        setFeedbackMsg("");
        try {
            await procedureService.startOngoingProcedure(procId, detailPatient?.id);
            setFeedbackType("success");
            setFeedbackMsg("Procedure transitioned to ONGOING status successfully.");
            await refreshPatientDetails();
        } catch (err) {
            setFeedbackType("danger");
            setFeedbackMsg(err.response?.data?.error?.message || err.message || "Failed to start ongoing procedure.");
        } finally {
            setActionLoading(false);
        }
    };

    // Task 5: Ongoing -> Done transition
    const handleCompleteProcedure = async (procId) => {
        setActionLoading(true);
        setFeedbackMsg("");
        try {
            await procedureService.completeProcedure(procId, new Date(), detailPatient?.id);
            setFeedbackType("success");
            setFeedbackMsg("Procedure marked as COMPLETED (DONE) successfully.");
            await refreshPatientDetails();
        } catch (err) {
            setFeedbackType("danger");
            setFeedbackMsg(err.response?.data?.error?.message || err.message || "Failed to complete procedure.");
        } finally {
            setActionLoading(false);
        }
    };

    // Task 2: Schedule Next Procedure (Only one next procedure per patient)
    const handleScheduleNextProcedure = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setFeedbackMsg("");
        try {
            await procedureService.createNextProcedure(detailPatient?.id, {
                name: nextProcForm.name || nextProcForm.description.slice(0, 50),
                description: nextProcForm.description,
                cost: Number(nextProcForm.cost) || 0,
                targetDate: nextProcForm.targetDate,
            });
            setFeedbackType("success");
            setFeedbackMsg("Next procedure scheduled successfully.");
            setShowNextProcForm(false);
            setNextProcForm({
                name: "",
                description: "",
                cost: "",
                targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            });
            await refreshPatientDetails();
        } catch (err) {
            setFeedbackType("danger");
            setFeedbackMsg(err.response?.data?.error?.message || err.message || "Failed to schedule next procedure.");
        } finally {
            setActionLoading(false);
        }
    };

    // Task 7: Record Payment (Receptionist / Dentist Can record payment)
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setFeedbackMsg("");
        try {
            const amt = Number(paymentForm.amount);
            if (Number.isNaN(amt) || amt <= 0) {
                throw new Error("Payment amount must be greater than zero.");
            }
            await paymentService.recordPayment({
                patientId: detailPatient?.id,
                amount: amt,
                paymentDate: paymentForm.paymentDate,
                recordedBy: paymentForm.recordedBy,
            });
            setFeedbackType("success");
            setFeedbackMsg(`Payment of $${amt.toFixed(2)} recorded successfully.`);
            setShowPaymentForm(false);
            setPaymentForm({
                amount: "",
                paymentDate: new Date().toISOString().split("T")[0],
                recordedBy: "Front Desk Staff",
            });
            await refreshPatientDetails();
        } catch (err) {
            setFeedbackType("danger");
            setFeedbackMsg(err.response?.data?.error?.message || err.message || "Failed to record payment.");
        } finally {
            setActionLoading(false);
        }
    };

    if (!isDetailOpen || !detailPatient) return null;

    const patient = fullDetail?.patient || detailPatient;
    const clinical = fullDetail?.clinicalOverview || {};

    const currentProc = clinical.currentProcedure ||
        (patient.procedures || []).find((p) => p.status === "ONGOING") || null;

    const nextProc = clinical.nextProcedure ||
        (patient.procedures || []).find((p) => p.status === "NEXT") || null;

    const procHistory = clinical.procedureHistory ||
        (patient.procedures || []).filter((p) => p.status === "DONE" || (p.id !== currentProc?.id && p.id !== nextProc?.id));

    const payments = clinical.paymentInformation?.payments || patient.payments || [];
    const remainingBalance = Number(patient.remainingFee !== undefined ? patient.remainingFee : patient.balance || 0);
    const totalPaid = (payments).reduce((acc, p) => acc + Number(p.amount || 0), 0);
    const appointments = clinical.appointments || patient.appointments || [];

    const branchName = patient.branch?.name || "Unassigned Branch";
    const branchAddress = patient.branch?.address || "Address not specified";
    const branchPhone = patient.branch?.phone || "No phone listed";

    const dentistName = patient.dentist?.fullName || patient.dentist?.name || "Unassigned Dentist";
    const dentistEmail = patient.dentist?.email || "Email not listed";
    const dentistPhone = patient.dentist?.phone || "Phone not listed";

    return (
        <div className="modal-backdrop" onClick={() => setIsDetailOpen(false)}>
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <div className="meta-badge-row">
                            <span className="id-badge-lg">{patient.id}</span>
                            <span className={`status-pill ${patient.status?.toLowerCase() || "active"}`}>
                                {patient.status || "ACTIVE"}
                            </span>
                        </div>
                        <h2 className="modal-title">{patient.name || patient.fullName}</h2>
                        <p className="modal-subtitle">Comprehensive Clinical Journey & Treatment Overview</p>
                    </div>
                    <div className="modal-header-actions">
                        <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => {
                                setIsDetailOpen(false);
                                openEdit(patient);
                            }}
                        >
                            Edit Patient
                        </button>
                        <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setIsDetailOpen(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="modal-body detail-flow-container">
                    {feedbackMsg && (
                        <div style={{
                            padding: "10px 16px",
                            marginBottom: "16px",
                            borderRadius: "8px",
                            fontWeight: 500,
                            backgroundColor: feedbackType === "success" ? "#d1fae5" : "#fee2e2",
                            color: feedbackType === "success" ? "#065f46" : "#991b1b",
                            border: `1px solid ${feedbackType === "success" ? "#a7f3d0" : "#fca5a5"}`
                        }}>
                            {feedbackMsg}
                        </div>
                    )}

                    {loading && <div className="detail-loading-banner">Refreshing clinical records...</div>}

                    {/* STAGE 1: PATIENT INFORMATION */}
                    <section className="clinical-stage-card stage-patient-info" id="stage-patient-information">
                        <div className="stage-header">
                            <div className="stage-number-circle">1</div>
                            <div className="stage-header-text">
                                <h3 className="stage-title">Patient Information</h3>
                                <p className="stage-subtitle">Demographics, Facility Location & Assigned Clinician</p>
                            </div>
                        </div>

                        <div className="stage-content-grid info-grid-4">
                            <div className="info-stat-card">
                                <span className="stat-label">Age</span>
                                <span className="stat-value">{patient.age} years</span>
                            </div>
                            <div className="info-stat-card">
                                <span className="stat-label">Contact</span>
                                <span className="stat-value font-mono">{patient.contact || patient.contact_info}</span>
                            </div>
                            <div className="info-stat-card">
                                <span className="stat-label">Primary Service</span>
                                <span className="stat-value font-semibold text-primary">{patient.serviceType || patient.service_type || "General Dentistry"}</span>
                            </div>
                            <div className="info-stat-card">
                                <span className="stat-label">Outstanding Balance (Remaining Fee)</span>
                                <span className={`stat-value font-bold ${remainingBalance > 0 ? "text-danger" : "text-success"}`}>
                                    ${remainingBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Branch & Dentist Registration Details */}
                        <div className="facility-dentist-row">
                            <div className="facility-card">
                                <div className="facility-title-row">
                                    <svg className="icon-small text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="font-semibold">Registration Branch</span>
                                </div>
                                <div className="facility-name">{branchName}</div>
                                <div className="facility-meta">{branchAddress}</div>
                                <div className="facility-meta font-mono">{branchPhone}</div>
                            </div>

                            <div className="facility-card">
                                <div className="facility-title-row">
                                    <svg className="icon-small text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="font-semibold">Treating Dentist</span>
                                </div>
                                <div className="facility-name">{dentistName}</div>
                                <div className="facility-meta">{dentistEmail}</div>
                                <div className="facility-meta font-mono">{dentistPhone}</div>
                            </div>
                        </div>
                    </section>

                    {/* DOWNWARD ARROW INDICATOR */}
                    <div className="flow-arrow-separator">
                        <div className="arrow-line"></div>
                        <span className="arrow-glyph">↓</span>
                        <div className="arrow-line"></div>
                    </div>

                    {/* STAGE 2: CURRENT PROCEDURE (ONGOING) */}
                    <section className="clinical-stage-card stage-current-procedure" id="stage-current-procedure">
                        <div className="stage-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div className="stage-number-circle active-circle">2</div>
                                <div className="stage-header-text">
                                    <div className="stage-title-row">
                                        <h3 className="stage-title">Current Procedure</h3>
                                        <span className="procedure-state-pill ongoing">ONGOING</span>
                                    </div>
                                    <p className="stage-subtitle">Active clinical intervention currently in progress</p>
                                </div>
                            </div>
                            {currentProc && (
                                <button
                                    type="button"
                                    className="btn-sm"
                                    style={{
                                        backgroundColor: "#059669",
                                        color: "white",
                                        padding: "8px 14px",
                                        borderRadius: "6px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        border: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                    disabled={actionLoading}
                                    onClick={() => handleCompleteProcedure(currentProc.id)}
                                >
                                    ✓ Complete Procedure (Ongoing → Done)
                                </button>
                            )}
                        </div>

                        {currentProc ? (
                            <div className="procedure-detail-box active-procedure">
                                <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "#1f2937", marginBottom: "4px" }}>
                                    {currentProc.name || currentProc.description}
                                </div>
                                <div className="proc-desc-title">{currentProc.description}</div>
                                <div className="proc-meta-tags">
                                    <span className="meta-tag">
                                        Cost: <strong>${Number(currentProc.cost || 0).toFixed(2)}</strong>
                                    </span>
                                    {currentProc.targetDate && (
                                        <span className="meta-tag">
                                            Target: {new Date(currentProc.targetDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="meta-tag" style={{ color: "#0284c7" }}>
                                        Status: <strong>ONGOING</strong>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="stage-empty-state">
                                No active ongoing procedure currently recorded for this patient.
                            </div>
                        )}
                    </section>

                    {/* DOWNWARD ARROW INDICATOR */}
                    <div className="flow-arrow-separator">
                        <div className="arrow-line"></div>
                        <span className="arrow-glyph">↓</span>
                        <div className="arrow-line"></div>
                    </div>

                    {/* STAGE 3: NEXT PROCEDURE (NEXT) */}
                    <section className="clinical-stage-card stage-next-procedure" id="stage-next-procedure">
                        <div className="stage-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div className="stage-number-circle next-circle">3</div>
                                <div className="stage-header-text">
                                    <div className="stage-title-row">
                                        <h3 className="stage-title">Next Procedure</h3>
                                        <span className="procedure-state-pill next">UPCOMING NEXT</span>
                                    </div>
                                    <p className="stage-subtitle">Upcoming sequence scheduled in patient's treatment plan (1 max)</p>
                                </div>
                            </div>
                            <div>
                                {nextProc ? (
                                    <button
                                        type="button"
                                        className="btn-sm"
                                        style={{
                                            backgroundColor: "#2563eb",
                                            color: "white",
                                            padding: "8px 14px",
                                            borderRadius: "6px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            border: "none",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}
                                        disabled={actionLoading}
                                        onClick={() => handleStartOngoing(nextProc.id)}
                                    >
                                        ▶ Start Procedure (Next → Ongoing)
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-sm"
                                        style={{
                                            backgroundColor: showNextProcForm ? "#6b7280" : "#4f46e5",
                                            color: "white",
                                            padding: "8px 14px",
                                            borderRadius: "6px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            border: "none"
                                        }}
                                        onClick={() => setShowNextProcForm(!showNextProcForm)}
                                    >
                                        {showNextProcForm ? "Cancel" : "+ Schedule Next Procedure"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Inline form to Schedule Next Procedure */}
                        {showNextProcForm && !nextProc && (
                            <form onSubmit={handleScheduleNextProcedure} style={{
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "16px",
                                marginBottom: "16px"
                            }}>
                                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: "600", color: "#1e293b" }}>
                                    Define & Schedule Next Clinical Procedure
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Procedure Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={nextProcForm.name}
                                            onChange={(e) => setNextProcForm({ ...nextProcForm, name: e.target.value })}
                                            placeholder="e.g. Composite Restoration"
                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Estimated Cost ($) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={nextProcForm.cost}
                                            onChange={(e) => setNextProcForm({ ...nextProcForm, cost: e.target.value })}
                                            placeholder="e.g. 150.00"
                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Clinical Description *</label>
                                        <input
                                            type="text"
                                            required
                                            value={nextProcForm.description}
                                            onChange={(e) => setNextProcForm({ ...nextProcForm, description: e.target.value })}
                                            placeholder="e.g. Tooth #14 composite resin restoration"
                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>Target Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={nextProcForm.targetDate}
                                            onChange={(e) => setNextProcForm({ ...nextProcForm, targetDate: e.target.value })}
                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowNextProcForm(false)}
                                        style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "white", fontWeight: "600", cursor: "pointer" }}
                                    >
                                        {actionLoading ? "Saving..." : "Save Next Procedure"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {nextProc ? (
                            <div className="procedure-detail-box next-procedure">
                                <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "#1f2937", marginBottom: "4px" }}>
                                    {nextProc.name || nextProc.description}
                                </div>
                                <div className="proc-desc-title">{nextProc.description}</div>
                                <div className="proc-meta-tags">
                                    <span className="meta-tag">
                                        Estimated Cost: <strong>${Number(nextProc.cost || 0).toFixed(2)}</strong>
                                    </span>
                                    {nextProc.targetDate && (
                                        <span className="meta-tag">
                                            Scheduled Date: {new Date(nextProc.targetDate).toLocaleDateString()}
                                        </span>
                                    )}
                                    <span className="meta-tag" style={{ color: "#6366f1" }}>
                                        Status: <strong>NEXT</strong>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            !showNextProcForm && (
                                <div className="stage-empty-state">
                                    No pending subsequent procedure scheduled yet. (Only one next procedure permitted).
                                </div>
                            )
                        )}
                    </section>

                    {/* DOWNWARD ARROW INDICATOR */}
                    <div className="flow-arrow-separator">
                        <div className="arrow-line"></div>
                        <span className="arrow-glyph">↓</span>
                        <div className="arrow-line"></div>
                    </div>

                    {/* STAGE 4: PROCEDURE HISTORY (DONE) */}
                    <section className="clinical-stage-card stage-procedure-history" id="stage-procedure-history">
                        <div className="stage-header">
                            <div className="stage-number-circle done-circle">4</div>
                            <div className="stage-header-text">
                                <h3 className="stage-title">Procedure History</h3>
                                <p className="stage-subtitle">Chronological ledger of completed interventions</p>
                            </div>
                        </div>

                        {procHistory.length > 0 ? (
                            <div className="procedure-history-list">
                                {procHistory.map((item, idx) => (
                                    <div key={item.id || idx} className="history-item-row">
                                        <div className="history-check-circle">✓</div>
                                        <div className="history-details">
                                            <div style={{ fontWeight: "600", color: "#111827" }}>
                                                {item.name || item.description}
                                            </div>
                                            <div className="history-item-desc">{item.description}</div>
                                            <div className="history-item-meta">
                                                <span>Cost: ${Number(item.cost || 0).toFixed(2)}</span>
                                                {item.completedDate && (
                                                    <span>Completed: {new Date(item.completedDate).toLocaleDateString()}</span>
                                                )}
                                                <span style={{ color: "#059669", fontWeight: "600" }}>Status: DONE</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="stage-empty-state">
                                No completed historical procedures on file.
                            </div>
                        )}
                    </section>

                    {/* DOWNWARD ARROW INDICATOR */}
                    <div className="flow-arrow-separator">
                        <div className="arrow-line"></div>
                        <span className="arrow-glyph">↓</span>
                        <div className="arrow-line"></div>
                    </div>

                    {/* STAGE 5: PAYMENT INFORMATION & HISTORY */}
                    <section className="clinical-stage-card stage-payment-info" id="stage-payment-information">
                        <div className="stage-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div className="stage-number-circle payment-circle">5</div>
                                <div className="stage-header-text">
                                    <h3 className="stage-title">Payment Information & History</h3>
                                    <p className="stage-subtitle">Financial accounting, billing history & ledger transactions</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-sm"
                                style={{
                                    backgroundColor: showPaymentForm ? "#6b7280" : "#059669",
                                    color: "white",
                                    padding: "8px 14px",
                                    borderRadius: "6px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    border: "none"
                                }}
                                onClick={() => setShowPaymentForm(!showPaymentForm)}
                            >
                                {showPaymentForm ? "Cancel" : "+ Record Payment"}
                            </button>
                        </div>

                        {/* Inline Form to Record Payment */}
                        {showPaymentForm && (
                            <form onSubmit={handleRecordPayment} style={{
                                backgroundColor: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "8px",
                                padding: "16px",
                                marginBottom: "16px"
                            }}>
                                <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", fontWeight: "600", color: "#166534" }}>
                                    Record Patient Payment (Receptionist / Dentist)
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                                            Payment Amount ($) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0.01"
                                            step="0.01"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            placeholder="e.g. 50.00"
                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                                            Due / Payment Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={paymentForm.paymentDate}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                                            Recorded By *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={paymentForm.recordedBy}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, recordedBy: e.target.value })}
                                            placeholder="e.g. Dr. Sara / Receptionist"
                                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentForm(false)}
                                        style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#059669", color: "white", fontWeight: "600", cursor: "pointer" }}
                                    >
                                        {actionLoading ? "Processing..." : "Confirm & Record Payment"}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="payment-summary-bar">
                            <div className="payment-stat-box">
                                <span className="stat-label">Total Amount Paid</span>
                                <span className="stat-value text-success font-bold">${totalPaid.toFixed(2)}</span>
                            </div>
                            <div className="payment-stat-box">
                                <span className="stat-label">Remaining Fee (Balance)</span>
                                <span className={`stat-value font-bold ${remainingBalance > 0 ? "text-danger" : "text-success"}`}>
                                    ${remainingBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Payment History Table (Task 9: Display Amount, Due Date, Recorded by) */}
                        {payments.length > 0 ? (
                            <div className="table-mini-wrapper">
                                <table className="table-mini">
                                    <thead>
                                        <tr>
                                            <th>Receipt ID</th>
                                            <th>Amount</th>
                                            <th>Due / Payment Date</th>
                                            <th>Recorded By</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p, idx) => (
                                            <tr key={p.id || p.paymentId || idx}>
                                                <td className="font-mono">{p.id || p.paymentId || `RCP-${idx + 1}`}</td>
                                                <td className="font-semibold text-success">
                                                    ${Number(p.amount).toFixed(2)}
                                                </td>
                                                <td>
                                                    {new Date(p.paymentDate || p.payment_date || p.dueDate || p.createdAt || Date.now()).toLocaleDateString()}
                                                </td>
                                                <td className="font-medium text-slate-700">
                                                    {p.recordedBy || p.recorded_by || "Receptionist / Dentist"}
                                                </td>
                                                <td><span className="badge-mini-paid">VERIFIED</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="stage-empty-state">
                                No payments recorded yet. Total outstanding balance is ${remainingBalance.toFixed(2)}.
                            </div>
                        )}
                    </section>

                    {/* DOWNWARD ARROW INDICATOR */}
                    <div className="flow-arrow-separator">
                        <div className="arrow-line"></div>
                        <span className="arrow-glyph">↓</span>
                        <div className="arrow-line"></div>
                    </div>

                    {/* STAGE 6: APPOINTMENT */}
                    <section className="clinical-stage-card stage-appointment-info" id="stage-appointment-information">
                        <div className="stage-header">
                            <div className="stage-number-circle appointment-circle">6</div>
                            <div className="stage-header-text">
                                <h3 className="stage-title">Appointments</h3>
                                <p className="stage-subtitle">Scheduled clinical visits and consultations</p>
                            </div>
                        </div>

                        {appointments.length > 0 ? (
                            <div className="appointments-list">
                                {appointments.map((app, idx) => (
                                    <div key={app.id || idx} className="appointment-item-card">
                                        <div className="app-calendar-box">
                                            <span className="cal-month">
                                                {new Date(app.scheduled_date || app.scheduledDate).toLocaleString("default", { month: "short" })}
                                            </span>
                                            <span className="cal-day">
                                                {new Date(app.scheduled_date || app.scheduledDate).getDate()}
                                            </span>
                                        </div>
                                        <div className="app-details">
                                            <div className="app-title">Scheduled Clinical Session</div>
                                            <div className="app-time">
                                                {new Date(app.scheduled_date || app.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Branch: {branchName}
                                            </div>
                                        </div>
                                        <span className={`status-pill ${app.status?.toLowerCase() || "upcoming"}`}>
                                            {app.status || "UPCOMING"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="stage-empty-state">
                                No future appointments scheduled.
                            </div>
                        )}
                    </section>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setIsDetailOpen(false)}
                    >
                        Close Detail View
                    </button>
                </div>
            </div>
        </div>
    );
}
