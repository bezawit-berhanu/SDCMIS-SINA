import { useState } from "react";
import Button from "../common/Button";
import apiClient from "../../services/apiclient";

/**
 * Log Next Procedure Modal
 * Accessible to: Dentist
 * Enforces BR-11 & BR-13: Exactly one Next procedure per patient.
 */
export default function LogNextProcedureModal({ patient, onClose, onSaved }) {
    const existingNext = patient?.nextProcedure;

    const [name, setName] = useState(existingNext?.name || "");
    const [cost, setCost] = useState(existingNext ? String(existingNext.cost) : "");
    const [plannedDate, setPlannedDate] = useState(
        existingNext?.plannedDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
    );
    const [notes, setNotes] = useState(existingNext?.notes || "");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Procedure name is required.");
            return;
        }

        const parsedCost = parseFloat(cost);
        if (isNaN(parsedCost) || parsedCost < 0) {
            setError("Procedure cost must be 0 or a positive number.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                id: existingNext?.id || `proc-next-${Date.now()}`,
                name: name.trim(),
                cost: parsedCost,
                plannedDate,
                status: "NEXT",
                notes: notes.trim() || undefined,
            };

            try {
                await apiClient.post(`/api/v1/patients/${patient.id}/procedures`, payload);
            } catch (_) {}

            if (onSaved) {
                onSaved(payload);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to log next procedure.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-next-title"
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
                    <h2 id="log-next-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                        {existingNext ? "Update Planned Next Procedure" : "Log Next Planned Procedure"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            color: "#64748b",
                        }}
                    >
                        &times;
                    </button>
                </div>

                {existingNext && (
                    <div
                        style={{
                            padding: "0.75rem 1rem",
                            backgroundColor: "#fef3c7",
                            borderRadius: "6px",
                            borderLeft: "4px solid #f59e0b",
                            marginBottom: "1rem",
                            fontSize: "0.85rem",
                            color: "#92400e",
                        }}
                    >
                        A patient may have exactly one Next procedure. Saving will update the existing planned procedure '{existingNext.name}'.
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

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            htmlFor="proc-name"
                            style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                        >
                            Procedure Name *
                        </label>
                        <input
                            id="proc-name"
                            type="text"
                            required
                            placeholder="e.g. Composite Filling - Tooth #16"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "1rem",
                            }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                            <label
                                htmlFor="proc-cost"
                                style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                            >
                                Estimated Cost (ETB) *
                            </label>
                            <input
                                id="proc-cost"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="e.g. 1200.00"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.65rem 0.75rem",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                }}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="proc-date"
                                style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                            >
                                Planned Date
                            </label>
                            <input
                                id="proc-date"
                                type="date"
                                value={plannedDate}
                                onChange={(e) => setPlannedDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.65rem 0.75rem",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <label
                            htmlFor="proc-notes"
                            style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                        >
                            Clinical Notes & Instructions
                        </label>
                        <textarea
                            id="proc-notes"
                            rows={2}
                            placeholder="e.g. Patient requested local anesthesia; check occlusion"
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
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? "Saving..." : "Save Next Procedure"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

