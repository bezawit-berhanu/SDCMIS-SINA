import React, { useState, useEffect } from "react";
import { usePatientContext } from "../../features/patient/patient-context";

export default function EditPatientModal() {
    const {
        isEditOpen,
        setIsEditOpen,
        editingPatient,
        setEditingPatient,
        branches,
        dentists,
        handleUpdatePatient,
        getDentistsForBranch,
    } = usePatientContext();

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        contact: "",
        service: "",
        branchId: "",
        dentistId: "",
        remainingFee: "",
        status: "ACTIVE",
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editingPatient) {
            setFormData({
                name: editingPatient.name || editingPatient.fullName || "",
                age: editingPatient.age !== undefined ? String(editingPatient.age) : "",
                contact: editingPatient.contact || editingPatient.contact_info || "",
                service: editingPatient.serviceType || editingPatient.service_type || "General Consultation",
                branchId: editingPatient.branchId || editingPatient.branch?.id || "",
                dentistId: editingPatient.dentistId || editingPatient.dentist?.id || "",
                remainingFee: editingPatient.remainingFee !== undefined ? String(editingPatient.remainingFee) : "0",
                status: editingPatient.status || editingPatient.recordStatus || "ACTIVE",
            });
            setErrors({});
        }
    }, [editingPatient]);

    if (!isEditOpen || !editingPatient) return null;

    const availableDentists = getDentistsForBranch(formData.branchId);

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) {
            errs.name = "Patient name is required.";
        } else if (formData.name.trim().length > 120) {
            errs.name = "Name must not exceed 120 characters.";
        }

        const ageNum = Number(formData.age);
        if (formData.age === "" || Number.isNaN(ageNum)) {
            errs.age = "Valid age is required.";
        } else if (ageNum < 0 || ageNum > 150) {
            errs.age = "Age must be between 0 and 150.";
        }

        if (!formData.contact.trim()) {
            errs.contact = "Contact information is required.";
        } else if (formData.contact.trim().length < 3) {
            errs.contact = "Contact information must be at least 3 characters.";
        }

        const fee = Number(formData.remainingFee);
        if (Number.isNaN(fee) || fee < 0) {
            errs.remainingFee = "Remaining balance cannot be negative.";
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            if (name === "branchId" && value) {
                const curDentist = dentists.find((d) => d.id === prev.dentistId);
                if (curDentist && curDentist.branchId && curDentist.branchId !== value) {
                    next.dentistId = "";
                }
            }
            return next;
        });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleCancel = () => {
        setIsEditOpen(false);
        setEditingPatient(null);
        setErrors({});
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await handleUpdatePatient(editingPatient.id, {
                name: formData.name.trim(),
                age: Number(formData.age),
                contact: formData.contact.trim(),
                service: formData.service.trim(),
                branchId: formData.branchId || null,
                dentistId: formData.dentistId || null,
                remainingFee: Number(formData.remainingFee),
                status: formData.status,
            });
        } catch (err) {
            setErrors({ form: err.message || "Failed to save patient changes." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleCancel}>
            <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Edit Patient Record</h2>
                        <p className="modal-subtitle">Modifying record for #{editingPatient.id}</p>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={handleCancel}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSave} noValidate>
                    <div className="modal-body form-grid">
                        {errors.form && <div className="form-alert-error">{errors.form}</div>}

                        {/* Name (Task 6) */}
                        <div className="form-field full-width">
                            <label htmlFor="edit-patient-name" className="field-label required">
                                Full Name
                            </label>
                            <input
                                id="edit-patient-name"
                                name="name"
                                type="text"
                                className={`field-input ${errors.name ? "has-error" : ""}`}
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && <span className="field-error-text">{errors.name}</span>}
                        </div>

                        {/* Age (Task 6) */}
                        <div className="form-field">
                            <label htmlFor="edit-patient-age" className="field-label required">
                                Age (Years)
                            </label>
                            <input
                                id="edit-patient-age"
                                name="age"
                                type="number"
                                min="0"
                                max="150"
                                className={`field-input ${errors.age ? "has-error" : ""}`}
                                value={formData.age}
                                onChange={handleChange}
                            />
                            {errors.age && <span className="field-error-text">{errors.age}</span>}
                        </div>

                        {/* Contact (Task 6) */}
                        <div className="form-field">
                            <label htmlFor="edit-patient-contact" className="field-label required">
                                Contact Information
                            </label>
                            <input
                                id="edit-patient-contact"
                                name="contact"
                                type="text"
                                className={`field-input ${errors.contact ? "has-error" : ""}`}
                                value={formData.contact}
                                onChange={handleChange}
                            />
                            {errors.contact && <span className="field-error-text">{errors.contact}</span>}
                        </div>

                        {/* Service Type */}
                        <div className="form-field full-width">
                            <label htmlFor="edit-patient-service" className="field-label">
                                Service Type
                            </label>
                            <input
                                id="edit-patient-service"
                                name="service"
                                type="text"
                                className="field-input"
                                value={formData.service}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Branch (Task 10) */}
                        <div className="form-field">
                            <label htmlFor="edit-patient-branch" className="field-label">
                                Clinic Branch
                            </label>
                            <select
                                id="edit-patient-branch"
                                name="branchId"
                                className="field-select"
                                value={formData.branchId}
                                onChange={handleChange}
                            >
                                <option value="">Select Branch...</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dentist (Task 10) */}
                        <div className="form-field">
                            <label htmlFor="edit-patient-dentist" className="field-label">
                                Treating Dentist
                            </label>
                            <select
                                id="edit-patient-dentist"
                                name="dentistId"
                                className="field-select"
                                value={formData.dentistId}
                                onChange={handleChange}
                            >
                                <option value="">Select Dentist...</option>
                                {availableDentists.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.fullName || d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Outstanding Balance */}
                        <div className="form-field">
                            <label htmlFor="edit-patient-fee" className="field-label">
                                Outstanding Balance ($)
                            </label>
                            <input
                                id="edit-patient-fee"
                                name="remainingFee"
                                type="number"
                                min="0"
                                step="0.01"
                                className={`field-input ${errors.remainingFee ? "has-error" : ""}`}
                                value={formData.remainingFee}
                                onChange={handleChange}
                            />
                            {errors.remainingFee && <span className="field-error-text">{errors.remainingFee}</span>}
                        </div>

                        {/* Status */}
                        <div className="form-field">
                            <label htmlFor="edit-patient-status" className="field-label">
                                Record Status
                            </label>
                            <select
                                id="edit-patient-status"
                                name="status"
                                className="field-select"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            id="cancel-edit-patient-btn"
                            onClick={handleCancel}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            id="save-edit-patient-btn"
                            disabled={submitting}
                        >
                            {submitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
