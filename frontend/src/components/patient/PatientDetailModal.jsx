import React, { useState, useEffect } from "react";
import { usePatientContext } from "../../features/patient/patient-context";
import patientService from "../../services/patient.service";

export default function PatientDetailModal() {
    const {
        isDetailOpen,
        setIsDetailOpen,
        detailPatient,
        openEdit,
    } = usePatientContext();

    const [fullDetail, setFullDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (detailPatient?.id && isDetailOpen) {
            setLoading(true);
            patientService.getPatientById(detailPatient.id)
                .then((res) => {
                    if (isMounted) {
                        setFullDetail(res.data || res);
                    }
                })
                .catch(() => {
                    if (isMounted) {
                        // Fall back to detailPatient already in state
                        setFullDetail({
                            patient: detailPatient,
                            clinicalOverview: {
                                currentProcedure: (detailPatient.procedures || []).find((p) => p.status === "ONGOING") || null,
                                nextProcedure: (detailPatient.procedures || []).find((p) => p.status === "NEXT") || null,
                                procedureHistory: (detailPatient.procedures || []).filter((p) => p.status === "DONE"),
                                paymentInformation: {
                                    remainingFee: detailPatient.remainingFee || detailPatient.balance || 0,
                                    balance: detailPatient.remainingFee || detailPatient.balance || 0,
                                    payments: detailPatient.payments || [],
                                    totalPaid: (detailPatient.payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0),
                                },
                                appointments: detailPatient.appointments || [],
                                branch: detailPatient.branch,
                                dentist: detailPatient.dentist,
                            },
                        });
                    }
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        }
        return () => { isMounted = false; };
    }, [detailPatient, isDetailOpen]);

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
                                <span className="stat-label">Outstanding Balance</span>
                                <span className={`stat-value font-bold ${remainingBalance > 0 ? "text-danger" : "text-success"}`}>
                                    ${remainingBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Branch & Dentist Registration Details (Task 10) */}
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

                    {/* STAGE 2: CURRENT PROCEDURE */}
                    <section className="clinical-stage-card stage-current-procedure" id="stage-current-procedure">
                        <div className="stage-header">
                            <div className="stage-number-circle active-circle">2</div>
                            <div className="stage-header-text">
                                <div className="stage-title-row">
                                    <h3 className="stage-title">Current Procedure</h3>
                                    <span className="procedure-state-pill ongoing">ONGOING</span>
                                </div>
                                <p className="stage-subtitle">Active clinical intervention currently in progress</p>
                            </div>
                        </div>

                        {currentProc ? (
                            <div className="procedure-detail-box active-procedure">
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

                    {/* STAGE 3: NEXT PROCEDURE */}
                    <section className="clinical-stage-card stage-next-procedure" id="stage-next-procedure">
                        <div className="stage-header">
                            <div className="stage-number-circle next-circle">3</div>
                            <div className="stage-header-text">
                                <div className="stage-title-row">
                                    <h3 className="stage-title">Next Procedure</h3>
                                    <span className="procedure-state-pill next">UPCOMING NEXT</span>
                                </div>
                                <p className="stage-subtitle">Upcoming sequence scheduled in patient's treatment plan</p>
                            </div>
                        </div>

                        {nextProc ? (
                            <div className="procedure-detail-box next-procedure">
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
                                </div>
                            </div>
                        ) : (
                            <div className="stage-empty-state">
                                No pending subsequent procedure scheduled yet.
                            </div>
                        )}
                    </section>

                    {/* DOWNWARD ARROW INDICATOR */}
                    <div className="flow-arrow-separator">
                        <div className="arrow-line"></div>
                        <span className="arrow-glyph">↓</span>
                        <div className="arrow-line"></div>
                    </div>

                    {/* STAGE 4: PROCEDURE HISTORY */}
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
                                            <div className="history-item-desc">{item.description}</div>
                                            <div className="history-item-meta">
                                                <span>Cost: ${Number(item.cost || 0).toFixed(2)}</span>
                                                {item.completedDate && (
                                                    <span>Completed: {new Date(item.completedDate).toLocaleDateString()}</span>
                                                )}
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

                    {/* STAGE 5: PAYMENT INFORMATION */}
                    <section className="clinical-stage-card stage-payment-info" id="stage-payment-information">
                        <div className="stage-header">
                            <div className="stage-number-circle payment-circle">5</div>
                            <div className="stage-header-text">
                                <h3 className="stage-title">Payment Information</h3>
                                <p className="stage-subtitle">Financial accounting, billing history & ledger transactions</p>
                            </div>
                        </div>

                        <div className="payment-summary-bar">
                            <div className="payment-stat-box">
                                <span className="stat-label">Total Amount Paid</span>
                                <span className="stat-value text-success font-bold">${totalPaid.toFixed(2)}</span>
                            </div>
                            <div className="payment-stat-box">
                                <span className="stat-label">Remaining Balance</span>
                                <span className={`stat-value font-bold ${remainingBalance > 0 ? "text-danger" : "text-success"}`}>
                                    ${remainingBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {payments.length > 0 ? (
                            <div className="table-mini-wrapper">
                                <table className="table-mini">
                                    <thead>
                                        <tr>
                                            <th>Receipt ID</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p, idx) => (
                                            <tr key={p.id || idx}>
                                                <td className="font-mono">{p.id || `RCP-${idx + 1}`}</td>
                                                <td>{new Date(p.payment_date || p.createdAt || Date.now()).toLocaleDateString()}</td>
                                                <td className="font-semibold">${Number(p.amount).toFixed(2)}</td>
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
