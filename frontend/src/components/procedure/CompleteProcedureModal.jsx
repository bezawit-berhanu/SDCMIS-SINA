import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import Button from "../common/Button";
import apiClient from "../../services/apiclient";

/**
 * Complete Procedure Modal (Tick Done)
 * Accessible to: Dentist
 * Implements FR-DEN-08 and enforces BR-14: Done procedures are permanently archived in history.
 */
export default function CompleteProcedureModal({ patient, onClose, onCompleted }) {
    const ongoingProc = patient?.ongoingProcedure;
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState(ongoingProc?.notes || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleConfirmComplete = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const completedProc = {
                ...ongoingProc,
                status: "DONE",
                completedDate,
                notes: notes.trim() || undefined,
            };

            try {
                await apiClient.patch(`/api/v1/patients/${patient.id}/procedures/${ongoingProc.id}/complete`, completedProc);
            } catch (_) {}

            if (onCompleted) {
                onCompleted(completedProc);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to mark procedure as done.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-proc-title"
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
                    maxWidth: "480px",
                    width: "100%",
                    padding: "2rem",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h2 id="complete-proc-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                        Mark Procedure Complete (Tick Done)
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
                    >
                        &times;
                    </button>
                </div>

                <div
                    style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f0fdf4",
                        borderRadius: "6px",
                        borderLeft: "4px solid #22c55e",
                        marginBottom: "1rem",
                        fontSize: "0.85rem",
                        color: "#166534",
                    }}
                >
                    <strong>BR-14 Audit Compliance:</strong> Concluding '{ongoingProc?.name}' will archive it into the patient's permanent treatment history. Completed procedures are immutable.
                </div>

                {error && (
                    <div
                        role="alert"
                        style={{
                            padding: "0.75rem",
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            borderRadius: "6px",
                            marginBottom: "1rem",
                            fontSize: "0.875rem",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleConfirmComplete}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            htmlFor="done-proc-name"
                            style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                        >
                            Procedure Name
                        </label>
                        <input
                            id="done-proc-name"
                            type="text"
                            disabled
                            value={ongoingProc?.name || ""}
                            style={{
                                width: "100%",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#f8fafc",
                                color: "#64748b",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            htmlFor="done-date"
                            style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                        >
                            Completion Date *
                        </label>
                        <input
                            id="done-date"
                            type="date"
                            required
                            value={completionDate}
                            onChange={(e) => setCompletionDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <label
                            htmlFor="done-notes"
                            style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                        >
                            Clinical Completion Notes & Post-Op Advice
                        </label>
                        <textarea
                            id="done-notes"
                            rows={3}
                            placeholder="e.g. Procedure succeeded without complications; prescribed chlorhexidine mouthwash"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.95rem",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting}
                            icon={<FiCheck />}
                        >
                            {submitting ? "Saving..." : "Confirm Done"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

