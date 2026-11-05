import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Button from "../components/common/Button";
import LogNextProcedureModal from "../components/procedure/LogNextProcedureModal";
import StartProcedureModal from "../components/procedure/StartProcedureModal";
import CompleteProcedureModal from "../components/procedure/CompleteProcedureModal";
import RecordPaymentModal from "../components/payment/RecordPaymentModal";
import EditPatientModal from "../components/patient/EditPatientModal";
import DeletePatientModal from "../components/patient/DeletePatientModal";
import PaymentHistoryModal from "../components/patient/PaymentHistoryModal";
import apiClient from "../services/apiclient";
import {
    FiArrowLeft,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiPlay,
    FiCreditCard,
    FiFileText
} from "react-icons/fi";

/**
 * SCR-06: Patient Detail Screen
 * Accessible to: Dentist (full access), Customer (own record read-only via SCR-13)
 * Implements FR-DEN-05 through FR-DEN-10, FR-DEN-15, and BR-11 through BR-18.
 */
export default function PatientDetailPage({ readOnly = false }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState("");

    // Modal state controllers
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLogNextModal, setShowLogNextModal] = useState(false);
    const [showStartModal, setShowStartModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);

    // Fetch patient record strictly from backend API
    useEffect(() => {
        let isMounted = true;
        const fetchPatient = async () => {
            if (!id) {
                if (isMounted) {
                    setError("No patient ID provided.");
                    setLoading(false);
                }
                return;
            }
            try {
                const res = await apiClient.get(`/api/v1/patients/${id}`);
                if (isMounted) {
                    if (res.data?.data) {
                        setPatient(res.data.data);
                    } else if (res.data?.patient) {
                        setPatient(res.data.patient);
                    } else {
                        setError("Patient record not found.");
                        setPatient(null);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.response?.data?.message || "Failed to load patient record from clinical database.");
                    setPatient(null);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPatient();
        return () => { isMounted = false; };
    }, [id]);

    const showNotice = (msg) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(""), 4000);
    };

    if (loading) {
        return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading patient details...</div>;
    }

    if (error || !patient) {
        return (
            <div style={{ maxWidth: "600px", margin: "3rem auto", padding: "2rem", textAlign: "center" }} className="card">
                <h2 style={{ color: "#b91c1c" }}>Patient Not Found</h2>
                <p style={{ color: "#64748b", margin: "1rem 0" }}>The requested patient record could not be loaded or was removed.</p>
                <Link to="/patients">
                    <Button variant="primary">Return to Patient Directory</Button>
                </Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
            {/* Top Breadcrumb & Action Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Link to="/patients" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <FiArrowLeft />
                        <span>Patients Directory</span>
                    </Link>
                    <span style={{ color: "#cbd5e1" }}>/</span>
                    <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.9rem" }}>{patient.name}</span>
                </div>

                {!readOnly && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)} icon={<FiEdit2 />}>
                            Edit Identity
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} icon={<FiTrash2 />}>
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {feedback && (
                <div
                    role="alert"
                    style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        borderRadius: "8px",
                        marginBottom: "1.25rem",
                        fontWeight: "600",
                        border: "1px solid #a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                    }}
                >
                    <FiCheck />
                    <span>{feedback}</span>
                </div>
            )}

            {/* Patient Header Card */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary)", margin: 0 }}>
                                {patient.name}
                            </h1>
                            <span
                                style={{
                                    fontSize: "0.8rem",
                                    fontWeight: "700",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "9999px",
                                    backgroundColor: "rgba(27, 77, 46, 0.1)",
                                    color: "var(--primary)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                {patient.serviceType || "General Dentistry"}
                            </span>
                        </div>
                        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
                            ID: <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{patient.id}</span> • {patient.gender}, {patient.age} yrs • Phone: {patient.phone}
                        </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Next Appointment</span>
                        <strong style={{ fontSize: "1.1rem", color: "var(--primary)" }}>
                            {patient.nextAppointment || "None scheduled"}
                        </strong>
                    </div>
                </div>
            </div>

            {/* Two-Column Grid: Clinical Procedures (Left) & Financial Balance (Right) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
                {/* Left Column: Procedures Management per BR-11, BR-12, BR-13, BR-14 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Next Procedure Card */}
                    <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--primary)", backgroundColor: "var(--bg-surface)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--primary)", margin: 0 }}>
                                1. Next Procedure (Planned)
                            </h3>
                            {!readOnly && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowLogNextModal(true)}
                                >
                                    {patient.nextProcedure ? "Edit Next" : "+ Log Next"}
                                </Button>
                            )}
                        </div>

                        {patient.nextProcedure ? (
                            <div>
                                <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", color: "var(--text-main)" }}>
                                    {patient.nextProcedure.name}
                                </h4>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
                                    Est. Cost: <strong>{Number(patient.nextProcedure.cost || 0).toFixed(2)} ETB</strong> • Planned: {patient.nextProcedure.plannedDate}
                                    {patient.nextProcedure.notes && ` • Notes: ${patient.nextProcedure.notes}`}
                                </p>
                                {!readOnly && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setShowStartModal(true)}
                                        icon={<FiPlay />}
                                    >
                                        Start Treatment
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                                No upcoming procedure planned. Click '+ Log Next' to record one (BR-11).
                            </p>
                        )}
                    </div>

                    {/* Ongoing Procedure Card */}
                    <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--accent)", backgroundColor: "var(--bg-surface)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                                2. Ongoing Procedure (In Progress)
                            </h3>
                            {patient.ongoingProcedure && (
                                <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--primary)", backgroundColor: "rgba(27, 77, 46, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                                    ACTIVE
                                </span>
                            )}
                        </div>

                        {patient.ongoingProcedure ? (
                            <div>
                                <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", color: "var(--text-main)" }}>
                                    {patient.ongoingProcedure.name}
                                </h4>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 0.75rem" }}>
                                    Cost: <strong>{Number(patient.ongoingProcedure.cost || 0).toFixed(2)} ETB</strong> • Started: {patient.ongoingProcedure.startedDate}
                                    {patient.ongoingProcedure.notes && ` • Notes: ${patient.ongoingProcedure.notes}`}
                                </p>
                                {!readOnly && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setShowCompleteModal(true)}
                                        icon={<FiCheck />}
                                    >
                                        Mark Complete
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                                No procedure currently ongoing (BR-12).
                            </p>
                        )}
                    </div>

                    {/* Done Procedures History (Permanent Record per BR-14) */}
                    <div className="card" style={{ padding: "1.25rem", backgroundColor: "var(--bg-surface)" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.75rem" }}>
                            3. Done Procedures History ({patient.doneProcedures?.length || 0})
                        </h3>
                        {!patient.doneProcedures || patient.doneProcedures.length === 0 ? (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                                No completed procedures on file yet.
                            </p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {patient.doneProcedures.map((proc) => (
                                    <li
                                        key={proc.id}
                                        style={{
                                            padding: "0.75rem",
                                            backgroundColor: "var(--bg-page)",
                                            borderRadius: "6px",
                                            border: "1px solid var(--border)",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <strong style={{ color: "var(--text-main)", fontSize: "0.9rem" }}>{proc.name}</strong>
                                            <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--primary)" }}>
                                                {Number(proc.cost || 0).toFixed(2)} ETB
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                            Completed: {proc.completedDate} {proc.notes && `• ${proc.notes}`}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right Column: Financial Balance & Payments per BR-17, BR-18 */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="card" style={{ padding: "1.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--primary)", marginBottom: "1rem" }}>
                            Financial Balance & Ledger (BR-17, BR-18)
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ color: "var(--text-muted)" }}>Total Procedure Costs:</span>
                                <strong style={{ color: "var(--text-main)" }}>{Number(patient.totalCost || 0).toFixed(2)} ETB</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ color: "var(--text-muted)" }}>Total Recorded Payments:</span>
                                <strong style={{ color: "var(--primary)" }}>- {Number(patient.totalPaid || 0).toFixed(2)} ETB</strong>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "0.75rem 1rem",
                                    backgroundColor: Number(patient.remainingFee || 0) > 0 ? "rgba(220, 38, 38, 0.08)" : "rgba(27, 77, 46, 0.08)",
                                    borderRadius: "8px",
                                    marginTop: "0.5rem",
                                    border: `1px solid ${Number(patient.remainingFee || 0) > 0 ? "#fca5a5" : "var(--border)"}`,
                                }}
                            >
                                <strong style={{ color: Number(patient.remainingFee || 0) > 0 ? "#991b1b" : "var(--primary)" }}>
                                    Remaining Fee Balance:
                                </strong>
                                <strong style={{ fontSize: "1.25rem", color: Number(patient.remainingFee || 0) > 0 ? "#991b1b" : "var(--primary)" }}>
                                    {Number(patient.remainingFee || 0).toFixed(2)} ETB
                                </strong>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {!readOnly && (
                                <Button
                                    variant="primary"
                                    onClick={() => setShowPaymentModal(true)}
                                    style={{ width: "100%" }}
                                    icon={<FiCreditCard />}
                                >
                                    Record New Payment
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                onClick={() => setShowPaymentHistoryModal(true)}
                                style={{ width: "100%" }}
                                icon={<FiFileText />}
                            >
                                View Payment History ({patient.payments?.length || 0})
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditPatientModal
                    patient={patient}
                    onClose={() => setShowEditModal(false)}
                    onUpdated={(updated) => {
                        setPatient((prev) => ({ ...prev, ...updated }));
                        showNotice("Patient details updated successfully.");
                        setShowEditModal(false);
                    }}
                />
            )}

            {showDeleteModal && (
                <DeletePatientModal
                    patient={patient}
                    onClose={() => setShowDeleteModal(false)}
                    onDeleted={() => {
                        navigate("/patients");
                    }}
                />
            )}

            {showLogNextModal && (
                <LogNextProcedureModal
                    patient={patient}
                    onClose={() => setShowLogNextModal(false)}
                    onSaved={(nextProc) => {
                        setPatient((prev) => ({
                            ...prev,
                            nextProcedure: nextProc,
                            totalCost: Number(prev.totalCost || 0) + Number(nextProc.cost || 0),
                            remainingFee: Math.max(0, Number(prev.remainingFee || 0) + Number(nextProc.cost || 0)),
                        }));
                        showNotice(`Next procedure '${nextProc.name}' logged.`);
                        setShowLogNextModal(false);
                    }}
                />
            )}

            {showStartModal && (
                <StartProcedureModal
                    patient={patient}
                    onClose={() => setShowStartModal(false)}
                    onStarted={(ongoingProc) => {
                        setPatient((prev) => ({
                            ...prev,
                            nextProcedure: null,
                            ongoingProcedure: ongoingProc,
                        }));
                        showNotice(`Started treatment '${ongoingProc.name}'. Moved to Ongoing.`);
                        setShowStartModal(false);
                    }}
                />
            )}

            {showCompleteModal && (
                <CompleteProcedureModal
                    patient={patient}
                    onClose={() => setShowCompleteModal(false)}
                    onCompleted={(doneProc) => {
                        setPatient((prev) => ({
                            ...prev,
                            ongoingProcedure: null,
                            doneProcedures: [doneProc, ...(prev.doneProcedures || [])],
                        }));
                        showNotice(`Completed procedure '${doneProc.name}'. Archived in permanent history.`);
                        setShowCompleteModal(false);
                    }}
                />
            )}

            {showPaymentModal && (
                <RecordPaymentModal
                    patient={patient}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={(payment) => {
                        const newPaid = Number(patient.totalPaid || 0) + Number(payment.amount);
                        const newFee = Math.max(0, Number(patient.totalCost || 0) - newPaid);
                        setPatient((prev) => ({
                            ...prev,
                            totalPaid: newPaid,
                            remainingFee: newFee,
                            payments: [
                                {
                                    id: payment.paymentId || `pay-${Date.now()}`,
                                    amount: payment.amount,
                                    method: payment.method,
                                    date: new Date().toISOString().split("T")[0],
                                    receipt: `REC-${Date.now().toString().slice(-4)}`,
                                },
                                ...(prev.payments || []),
                            ],
                        }));
                        showNotice(`Recorded payment of ${Number(payment.amount).toFixed(2)} ETB.`);
                        setShowPaymentModal(false);
                    }}
                />
            )}

            {showPaymentHistoryModal && (
                <PaymentHistoryModal
                    patient={patient}
                    onClose={() => setShowPaymentHistoryModal(false)}
                />
            )}
        </div>
    );
}

