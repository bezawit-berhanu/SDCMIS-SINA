import { useState } from "react";
import Button from "../common/Button";
import apiClient from "../../services/apiclient";

/**
 * Start Procedure Modal (Next -> Ongoing)
 * Accessible to: Dentist
 * Implements FR-DEN-09 and enforces BR-12: At most one Ongoing procedure per patient.
 */
export default function StartProcedureModal({ patient, onClose, onStarted }) {
    const nextProc = patient?.nextProcedure;
    const existingOngoing = patient?.ongoingProcedure;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleConfirmStart = async () => {
        if (existingOngoing) {
            setError(
                `An ongoing procedure ('${existingOngoing.name}') is already active for this patient. Please complete or conclude it before starting a new procedure.`
            );
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const payload = {
                ...nextProc,
                status: "ONGOING",
                startedDate: new Date().toISOString().split("T")[0],
            };

            try {
                await apiClient.patch(`/api/v1/patients/${patient.id}/procedures/${nextProc.id}/start`, payload);
            } catch (_) {}

            if (onStarted) {
                onStarted(payload);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to start treatment.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-proc-title"
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
                    maxWidth: "460px",
                    width: "100%",
                    padding: "2rem",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 id="start-proc-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                        Start Treatment Procedure
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
                    >
                        &times;
                    </button>
                </div>

                <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1rem" }}>
                    Move planned procedure <strong>{nextProc?.name}</strong> into <strong>ONGOING</strong> status?
                </p>

                {existingOngoing && (
                    <div
                        role="alert"
                        style={{
                            padding: "0.75rem 1rem",
                            backgroundColor: "#fee2e2",
                            borderLeft: "4px solid #ef4444",
                            color: "#b91c1c",
                            fontSize: "0.85rem",
                            marginBottom: "1.25rem",
                        }}
                    >
                        <strong>Active Procedure Conflict:</strong> Patient already has '{existingOngoing.name}' in progress. A patient may have at most one active procedure at a time.
                    </div>
                )}

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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleConfirmStart}
                        disabled={submitting || Boolean(existingOngoing)}
                    >
                        {submitting ? "Starting..." : "Confirm & Start Procedure"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

