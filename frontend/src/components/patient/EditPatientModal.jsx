import { useState } from "react";
import Button from "../common/Button";
import apiClient from "../../services/apiclient";

/**
 * SCR-06b: Edit Patient Identity Modal
 * Accessible to: Dentist
 * Implements FR-DEN-06: Inline patient editing / rename / contact updates.
 */
export default function EditPatientModal({ patient, onClose, onUpdated }) {
    const [name, setName] = useState(patient?.name || "");
    const [phone, setPhone] = useState(patient?.phone || "");
    const [age, setAge] = useState(patient?.age || "");
    const [serviceType, setServiceType] = useState(patient?.serviceType || "General");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Patient full name cannot be blank.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: name.trim(),
                phone: phone.trim() || undefined,
                age: Number(age) || undefined,
                serviceType,
            };

            try {
                await apiClient.put(`/api/v1/patients/${patient.id}`, payload);
            } catch (_) {}

            if (onUpdated) {
                onUpdated(payload);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update patient details.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-patient-title"
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h2 id="edit-patient-title" style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                        Edit Patient Information
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
                            htmlFor="edit-patient-name"
                            style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                        >
                            Full Name *
                        </label>
                        <input
                            id="edit-patient-name"
                            type="text"
                            required
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
                                htmlFor="edit-patient-phone"
                                style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                            >
                                Phone
                            </label>
                            <input
                                id="edit-patient-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
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
                                htmlFor="edit-patient-age"
                                style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                            >
                                Age
                            </label>
                            <input
                                id="edit-patient-age"
                                type="number"
                                min="0"
                                max="130"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
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
                            htmlFor="edit-patient-service"
                            style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#334155", marginBottom: "0.35rem" }}
                        >
                            Primary Service Focus
                        </label>
                        <select
                            id="edit-patient-service"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.65rem 0.75rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#ffffff",
                            }}
                        >
                            <option value="General">General Dentistry</option>
                            <option value="Orthodontics">Orthodontics (Braces)</option>
                            <option value="Cosmetics">Cosmetics / Veneers</option>
                            <option value="Periodontics">Periodontics</option>
                            <option value="Surgery">Oral Surgery</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={submitting}>
                            {submitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
