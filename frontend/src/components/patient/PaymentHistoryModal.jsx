import { FiX } from "react-icons/fi";
import Button from "../common/Button";

/**
 * SCR-16b: Payment Audit History Modal
 * Accessible to: Dentist, Receptionist
 * Implements FR-DEN-15: Historical payment transaction ledger and balance reconciliation.
 */
export default function PaymentHistoryModal({ patient, onClose }) {
    const payments = patient?.payments || [];
    const totalPaid = Number(patient?.totalPaid || 0);
    const totalCost = Number(patient?.totalCost || 0);
    const remainingFee = Number(patient?.remainingFee || 0);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-history-title"
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "1rem",
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    maxWidth: "560px",
                    width: "100%",
                    padding: "2rem",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <div>
                        <h2 id="payment-history-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                            Payment Audit Ledger
                        </h2>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                            Patient: <strong>{patient?.name}</strong> (ID: {patient?.id})
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#64748b", display: "inline-flex", alignItems: "center" }}
                    >
                        <FiX />
                    </button>
                </div>

                {/* Financial Summary */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "0.5rem",
                        padding: "0.85rem",
                        backgroundColor: "#f8fafc",
                        borderRadius: "8px",
                        marginBottom: "1.25rem",
                        textAlign: "center",
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Total Charges</span>
                        <strong style={{ fontSize: "0.95rem", color: "#334155" }}>{totalCost.toFixed(2)} ETB</strong>
                    </div>
                    <div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Total Settled</span>
                        <strong style={{ fontSize: "0.95rem", color: "#166534" }}>{totalPaid.toFixed(2)} ETB</strong>
                    </div>
                    <div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Remaining</span>
                        <strong style={{ fontSize: "0.95rem", color: remainingFee > 0 ? "#b91c1c" : "#166534" }}>
                            {remainingFee.toFixed(2)} ETB
                        </strong>
                    </div>
                </div>

                {/* Payments Table */}
                <div style={{ overflowY: "auto", flex: "1 1 auto", marginBottom: "1.5rem" }}>
                    {payments.length === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                            No payment transactions have been recorded for this patient yet.
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left", backgroundColor: "#f8fafc" }}>
                                    <th style={{ padding: "0.5rem 0.75rem", color: "#475569" }}>Receipt / ID</th>
                                    <th style={{ padding: "0.5rem 0.75rem", color: "#475569" }}>Date</th>
                                    <th style={{ padding: "0.5rem 0.75rem", color: "#475569" }}>Method</th>
                                    <th style={{ padding: "0.5rem 0.75rem", color: "#475569", textAlign: "right" }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p, idx) => (
                                    <tr key={p.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "0.6rem 0.75rem", fontFamily: "monospace", color: "#64748b" }}>
                                            {p.receipt || p.id}
                                        </td>
                                        <td style={{ padding: "0.6rem 0.75rem", color: "#334155" }}>
                                            {p.date}
                                        </td>
                                        <td style={{ padding: "0.6rem 0.75rem" }}>
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: "600",
                                                    padding: "0.15rem 0.45rem",
                                                    borderRadius: "4px",
                                                    backgroundColor: "#e0f2fe",
                                                    color: "#0369a1",
                                                }}
                                            >
                                                {p.method}
                                            </span>
                                        </td>
                                        <td style={{ padding: "0.6rem 0.75rem", textAlign: "right", fontWeight: "700", color: "#166534" }}>
                                            +{Number(p.amount || 0).toFixed(2)} ETB
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button variant="secondary" onClick={onClose}>
                        Close Ledger
                    </Button>
                </div>
            </div>
        </div>
    );
}

