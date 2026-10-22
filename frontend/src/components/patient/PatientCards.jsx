import React from "react";
import { usePatientContext } from "../../features/patient/patient-context";

export default function PatientCards() {
    const { filteredPatients, openDetail, openEdit, openDelete } = usePatientContext();

    if (filteredPatients.length === 0) {
        return null; // Empty state handled by parent container
    }

    return (
        <div className="patient-cards-grid">
            {filteredPatients.map((patient) => {
                const balance = Number(patient.remainingFee !== undefined ? patient.remainingFee : patient.balance || 0);
                const branchName = patient.branch?.name || "Unassigned Branch";
                const dentistName = patient.dentist?.fullName || patient.dentist?.name || "Unassigned Dentist";
                const serviceName = patient.serviceType || patient.service_type || "General Dentistry";
                const status = patient.status || patient.recordStatus || "ACTIVE";

                return (
                    <div key={patient.id} className="patient-card">
                        <div className="patient-card-header">
                            <div className="card-avatar-wrap">
                                <div className="card-avatar">
                                    {(patient.name || patient.fullName || "P")[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="card-patient-name">{patient.name || patient.fullName}</h3>
                                    <span className="card-patient-id">{patient.id}</span>
                                </div>
                            </div>
                            <span className={`status-pill ${status.toLowerCase()}`}>
                                {status}
                            </span>
                        </div>

                        <div className="patient-card-body">
                            <div className="card-info-row">
                                <span className="info-label">Age & Contact</span>
                                <span className="info-value">{patient.age} yrs • {patient.contact || patient.contact_info}</span>
                            </div>

                            <div className="card-info-row">
                                <span className="info-label">Service</span>
                                <span className="service-pill">{serviceName}</span>
                            </div>

                            <div className="card-info-row">
                                <span className="info-label">Branch</span>
                                <div className="meta-inline">
                                    <svg className="icon-tiny" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="info-value">{branchName}</span>
                                </div>
                            </div>

                            <div className="card-info-row">
                                <span className="info-label">Treating Dentist</span>
                                <div className="meta-inline">
                                    <svg className="icon-tiny" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="info-value">{dentistName}</span>
                                </div>
                            </div>

                            <div className="card-balance-box">
                                <span className="balance-label">Outstanding Balance:</span>
                                <span className={`card-balance-value ${balance > 0 ? "balance-unpaid" : "balance-paid"}`}>
                                    ${balance.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="patient-card-footer">
                            <button
                                type="button"
                                className="btn-card-action btn-view"
                                onClick={() => openDetail(patient)}
                            >
                                Details
                            </button>
                            <button
                                type="button"
                                className="btn-card-action btn-edit"
                                onClick={() => openEdit(patient)}
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                className="btn-card-action btn-delete"
                                onClick={() => openDelete(patient)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
