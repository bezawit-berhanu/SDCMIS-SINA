import React, { useState } from "react";
import { usePatientContext } from "../../features/patient/patient-context";

export default function DeletePatientModal() {
    const {
        isDeleteOpen,
        setIsDeleteOpen,
        deletingPatient,
        setDeletingPatient,
        handleDeletePatient,
    } = usePatientContext();

    const [submitting, setSubmitting] = useState(false);

    if (!isDeleteOpen || !deletingPatient) return null;

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            await handleDeletePatient(deletingPatient.id);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsDeleteOpen(false);
        setDeletingPatient(null);
    };

    const patientName = deletingPatient.name || deletingPatient.fullName || "Unnamed Patient";

    return (
        <div className="modal-backdrop" onClick={handleCancel}>
            <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="delete-header-icon-box">
                        <svg className="icon-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="modal-title">Confirm Patient Deletion</h2>
                    </div>
                    <button type="button" className="modal-close-btn" onClick={handleCancel}>
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <p className="delete-confirm-text">
                        Are you sure you want to delete patient <strong>{patientName}</strong> (ID: <code>{deletingPatient.id}</code>)?
                    </p>

                    <div className="audit-notice-box">
                        <div className="audit-notice-title">
                            <svg className="icon-tiny" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Security & Audit Policy</span>
                        </div>
                        <p className="audit-notice-desc">
                            This action will soft-delete the record and record an immutable entry in the system audit log with your actor ID and timestamp.
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn-secondary"
                        id="cancel-delete-patient-btn"
                        onClick={handleCancel}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-danger"
                        id="confirm-delete-patient-btn"
                        onClick={handleConfirm}
                        disabled={submitting}
                    >
                        {submitting ? "Deleting..." : "Delete Patient"}
                    </button>
                </div>
            </div>
        </div>
    );
}
