import React from "react";
import { Link } from "react-router-dom";
import { usePatientContext } from "../../features/patient/patient-context";

export default function PatientTable() {
    const { filteredPatients, openDetail, openEdit, openDelete } = usePatientContext();

    if (filteredPatients.length === 0) {
        return null; // Empty state handled by parent container
    }

    return (
        <div className="patient-table-wrapper">
            <table className="patient-table">
                <thead>
                    <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Contact</th>
                        <th>Service</th>
                        <th>Branch</th>
                        <th>Dentist</th>
                        <th>Outstanding Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPatients.map((patient) => {
                        const balance = Number(patient.remainingFee !== undefined ? patient.remainingFee : patient.balance || 0);
                        const branchName = patient.branch?.name || "Unassigned";
                        const dentistName = patient.dentist?.fullName || patient.dentist?.name || "Unassigned";
                        const serviceName = patient.serviceType || patient.service_type || "General";
                        const status = patient.status || patient.recordStatus || "ACTIVE";

                        return (
                            <tr key={patient.id} className="patient-table-row">
                                <td className="patient-id-cell">
                                    <span className="id-badge">{patient.id}</span>
                                </td>
                                <td className="patient-name-cell">
                                    <div className="name-container">
                                        <div className="avatar-circle">
                                            {(patient.name || patient.fullName || "P")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <Link to={`/patients/${patient.id}`} style={{ textDecoration: "none" }}>
                                                <span className="font-semibold text-primary">{patient.name || patient.fullName}</span>
                                            </Link>
                                            <div className="text-xs text-muted">Reg: {new Date(patient.createdDate || patient.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{patient.age} yrs</td>
                                <td className="contact-cell">
                                    <span className="contact-text">{patient.contact || patient.contact_info}</span>
                                </td>
                                <td>
                                    <span className="service-pill">{serviceName}</span>
                                </td>
                                <td>
                                    <div className="branch-tag">
                                        <svg className="icon-tiny" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span>{branchName}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="dentist-tag">
                                        <svg className="icon-tiny" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{dentistName}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`balance-badge ${balance > 0 ? "balance-unpaid" : "balance-paid"}`}>
                                        ${balance.toFixed(2)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-indicator ${status.toLowerCase()}`}>
                                        {status}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <div className="action-button-group">
                                        <Link to={`/patients/${patient.id}`}>
                                            <button
                                                type="button"
                                                className="btn-action btn-view"
                                                title="View Clinical Details"
                                            >
                                                View
                                            </button>
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn-action btn-edit"
                                            title="Edit Patient"
                                            onClick={() => openEdit(patient)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-action btn-delete"
                                            title="Delete Patient"
                                            onClick={() => openDelete(patient)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
