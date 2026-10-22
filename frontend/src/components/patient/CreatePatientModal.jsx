import React, { useState } from "react";
import { usePatientContext } from "../../features/patient/patient-context";

export default function CreatePatientModal() {
    const {
        isCreateOpen,
        setIsCreateOpen,
        branches,
        dentists,
        handleCreatePatient,
        getDentistsForBranch,
    } = usePatientContext();

    const [formData, setFormData] = useState({
        name: "",
        age: "",
        contact: "",
        service: "General Consultation",
        initialProcedure: "",
        initialFee: "",
        branchId: branches[0]?.id || "",
        dentistId: "",
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Available dentists filtered by selected branch
    const branchDentists = getDentistsForBranch(formData.branchId);

    if (!isCreateOpen) return null;

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) {
            errs.name = "Patient name is required.";
        } else if (formData.name.trim().length > 120) {
            errs.name = "Name must not exceed 120 characters.";
        }

        const ageNum = Number(formData.age);
        if (!formData.age || Number.isNaN(ageNum)) {
            errs.age = "Age is required.";
        } else if (ageNum < 0 || ageNum > 150) {
            errs.age = "Age must be between 0 and 150.";
        }

        if (!formData.contact.trim()) {
            errs.contact = "Contact information is required.";
        } else if (formData.contact.trim().length < 3) {
            errs.contact = "Contact info must be at least 3 characters.";
        }

        if (formData.initialFee !== "" && formData.initialFee !== null) {
            const fee = Number(formData.initialFee);
            if (Number.isNaN(fee) || fee < 0) {
                errs.initialFee = "Initial fee must be a non-negative number.";
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            // If branch changed, auto-adjust dentist if dentist does not belong to new branch
            if (name === "branchId" && value) {
                const curDentist = dentists.find((d) => d.id === prev.dentistId);
                if (curDentist && curDentist.branchId && curDentist.branchId !== value) {
                    next.dentistId = "";
                }
            }
            // If dentist changed and dentist has a branch, associate branch
            if (name === "dentistId" && value) {
                const selectedDent = dentists.find((d) => d.id === value);
                if (selectedDent?.branchId) {
                    next.branchId = selectedDent.branchId;
                }
            }
            return next;
        });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await handleCreatePatient({
                name: formData.name.trim(),
                age: Number(formData.age),
                contact: formData.contact.trim(),
                service: formData.service.trim(),
                initialProcedure: formData.initialProcedure.trim(),
                initialFee: formData.initialFee ? Number(formData.initialFee) : 0,
                branchId: formData.branchId || null,
                dentistId: formData.dentistId || null,
            });
            // Reset form on success
            setFormData({
                name: "",
                age: "",
                contact: "",
                service: "General Consultation",
                initialProcedure: "",
                initialFee: "",
                branchId: branches[0]?.id || "",
                dentistId: "",
            });
        } catch (err) {
            setErrors({ form: err.message || "Failed to register patient." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
            <div className="modal-dialog modal-md" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Register New Patient</h2>
                        <p className="modal-subtitle">Add patient demographics, branch registration, and clinical assignment.</p>
                    </div>
                    <button
                        type="button"
                        className="modal-close-btn"
                        onClick={() => setIsCreateOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="modal-body form-grid">
                        {errors.form && <div className="form-alert-error">{errors.form}</div>}

                        {/* Name (Task 4) */}
                        <div className="form-field full-width">
                            <label htmlFor="create-patient-name" className="field-label required">
                                Full Name
                            </label>
                            <input
                                id="create-patient-name"
                                name="name"
                                type="text"
                                className={`field-input ${errors.name ? "has-error" : ""}`}
                                placeholder="e.g. Bethlehem Assefa"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && <span className="field-error-text">{errors.name}</span>}
                        </div>

                        {/* Age (Task 4) */}
                        <div className="form-field">
                            <label htmlFor="create-patient-age" className="field-label required">
                                Age (Years)
                            </label>
                            <input
                                id="create-patient-age"
                                name="age"
                                type="number"
                                min="0"
                                max="150"
                                className={`field-input ${errors.age ? "has-error" : ""}`}
                                placeholder="e.g. 28"
                                value={formData.age}
                                onChange={handleChange}
                            />
                            {errors.age && <span className="field-error-text">{errors.age}</span>}
                        </div>

                        {/* Contact (Task 4) */}
                        <div className="form-field">
                            <label htmlFor="create-patient-contact" className="field-label required">
                                Contact (Phone / Email)
                            </label>
                            <input
                                id="create-patient-contact"
                                name="contact"
                                type="text"
                                className={`field-input ${errors.contact ? "has-error" : ""}`}
                                placeholder="e.g. +251 91 123 4567"
                                value={formData.contact}
                                onChange={handleChange}
                            />
                            {errors.contact && <span className="field-error-text">{errors.contact}</span>}
                        </div>

                        {/* Service (Task 4) */}
                        <div className="form-field full-width">
                            <label htmlFor="create-patient-service" className="field-label">
                                Service Type
                            </label>
                            <select
                                id="create-patient-service"
                                name="service"
                                className="field-select"
                                value={formData.service}
                                onChange={handleChange}
                            >
                                <option value="General Consultation">General Consultation</option>
                                <option value="Orthodontics">Orthodontics (Braces & Aligners)</option>
                                <option value="Root Canal Therapy">Root Canal Therapy (Endodontics)</option>
                                <option value="Dental Implant">Dental Implant & Prosthetics</option>
                                <option value="Teeth Whitening">Cosmetic Teeth Whitening</option>
                                <option value="Crown & Bridge">Crown & Bridge Restorations</option>
                                <option value="Periodontics">Periodontics & Deep Gum Scaling</option>
                                <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                            </select>
                        </div>

                        {/* Branch Registration (Task 10) */}
                        <div className="form-field">
                            <label htmlFor="create-patient-branch" className="field-label">
                                Registration Branch
                            </label>
                            <select
                                id="create-patient-branch"
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
                            <span className="field-helper">Associates patient with a clinic facility.</span>
                        </div>

                        {/* Treating Dentist Assignment (Task 10) */}
                        <div className="form-field">
                            <label htmlFor="create-patient-dentist" className="field-label">
                                Treating Dentist
                            </label>
                            <select
                                id="create-patient-dentist"
                                name="dentistId"
                                className="field-select"
                                value={formData.dentistId}
                                onChange={handleChange}
                            >
                                <option value="">Select Dentist...</option>
                                {branchDentists.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.fullName || d.name} ({d.branchName || "Staff"})
                                    </option>
                                ))}
                            </select>
                            <span className="field-helper">Associated with chosen branch.</span>
                        </div>

                        {/* Initial Procedure (Task 4) */}
                        <div className="form-field full-width">
                            <label htmlFor="create-patient-procedure" className="field-label">
                                Initial Clinical Procedure
                            </label>
                            <input
                                id="create-patient-procedure"
                                name="initialProcedure"
                                type="text"
                                className="field-input"
                                placeholder="e.g. Initial Diagnostic Scan & Bracket Placement"
                                value={formData.initialProcedure}
                                onChange={handleChange}
                            />
                            <span className="field-helper">Initiates the patient's ongoing clinical procedure pipeline.</span>
                        </div>

                        {/* Initial Fee (Task 4) */}
                        <div className="form-field full-width">
                            <label htmlFor="create-patient-fee" className="field-label">
                                Initial Fee / Estimated Cost ($)
                            </label>
                            <input
                                id="create-patient-fee"
                                name="initialFee"
                                type="number"
                                min="0"
                                step="0.01"
                                className={`field-input ${errors.initialFee ? "has-error" : ""}`}
                                placeholder="0.00"
                                value={formData.initialFee}
                                onChange={handleChange}
                            />
                            {errors.initialFee && <span className="field-error-text">{errors.initialFee}</span>}
                            <span className="field-helper">Records initial outstanding treatment fee balance.</span>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setIsCreateOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            id="submit-register-patient-btn"
                            disabled={submitting}
                        >
                            {submitting ? "Registering..." : "Register Patient"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
