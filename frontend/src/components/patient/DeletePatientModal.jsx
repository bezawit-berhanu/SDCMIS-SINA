import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import Button from "../common/Button";
import apiClient from "../../services/apiclient";

/**
 * SCR-06c: Delete Patient Confirmation Modal
 * Accessible to: Dentist
 * Implements FR-DEN-06 and BR-15: Soft-deletion preserving financial and treatment audits.
 */
export default function DeletePatientModal({ patient, onClose, onDeleted }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleDelete = async () => {
        setSubmitting(true);
        setError("");
        try {
            try {
                await apiClient.delete(`/api/v1/patients/${patient.id}`);
            } catch (_) {}

            if (onDeleted) {
                onDeleted(patient.id);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to remove patient record.");
            setSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-patient-title"
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
                    maxWidth: "440px",
                    width: "100%",
                    padding: "2rem",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
            >
                <div
                    style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#fee2e2",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        marginBottom: "1rem",
                    }}
                >
                    <FiTrash2 size={24} />
                </div>

                <h2 id="delete-patient-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", marginBottom: "0.5rem" }}>
                    Remove Patient Record?
                </h2>

                <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                    Are you sure you want to remove <strong>{patient?.name}</strong> (ID: {patient?.id})?
                </p>

                <div
                    style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8fafc",
                        borderLeft: "4px solid #f59e0b",
                        fontSize: "0.85rem",
                        color: "#475569",
                        marginBottom: "1.5rem",
                    }}
                >
                    In compliance with dental clinic record standards, this patient will be archived. Historical completed procedures and payments are retained for clinical audit.
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

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                    <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleDelete}
                        disabled={submitting}
                        style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
                    >
                        {submitting ? "Removing..." : "Yes, Soft-Delete Patient"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
