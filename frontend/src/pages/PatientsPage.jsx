import React from "react";
import { PatientProvider, usePatientContext } from "../features/patient/patient-context";
import PatientSearchFilter from "../components/patient/PatientSearchFilter";
import PatientTable from "../components/patient/PatientTable";
import PatientCards from "../components/patient/PatientCards";
import CreatePatientModal from "../components/patient/CreatePatientModal";
import EditPatientModal from "../components/patient/EditPatientModal";
import DeletePatientModal from "../components/patient/DeletePatientModal";
import PatientDetailModal from "../components/patient/PatientDetailModal";

function PatientsContent() {
    const {
        patients,
        filteredPatients,
        branches,
        dentists,
        viewMode,
        loading,
        resetFilters,
        setIsCreateOpen,
    } = usePatientContext();

    const patientsWithBalance = patients.filter((p) => Number(p.remainingFee || p.balance || 0) > 0).length;

    return (
        <div className="patients-page-container">
            {/* Top Stat Overview Bar */}
            <header className="page-header-section">
                <div>
                    <h1 className="page-main-heading">Patient Management</h1>
                    <p className="page-main-subheading">
                        Centralized clinical directory, treatment pipelines, branch assignments, and billing balances.
                    </p>
                </div>
            </header>

            {/* Quick Metrics Bar */}
            <div className="metrics-summary-grid">
                <div className="metric-card">
                    <span className="metric-label">Total Patients</span>
                    <span className="metric-value">{patients.length}</span>
                    <span className="metric-sub">Registered across all locations</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Outstanding Balances</span>
                    <span className={`metric-value ${patientsWithBalance > 0 ? "text-amber" : "text-success"}`}>
                        {patientsWithBalance}
                    </span>
                    <span className="metric-sub">Patients with pending fees</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Active Branches</span>
                    <span className="metric-value">{branches.length}</span>
                    <span className="metric-sub">Operational dental clinics</span>
                </div>
                <div className="metric-card">
                    <span className="metric-label">Treating Dentists</span>
                    <span className="metric-value">{dentists.length}</span>
                    <span className="metric-sub">Specialist clinical practitioners</span>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <PatientSearchFilter />

            {/* Main Content Area */}
            <main className="patient-list-area">
                {loading && (
                    <div className="loading-state-container">
                        <div className="spinner"></div>
                        <p>Loading patient directory...</p>
                    </div>
                )}

                {/* Empty State: Display "No patients found" (Task 11) */}
                {!loading && filteredPatients.length === 0 && (
                    <div className="empty-state-card" id="no-patients-found-state">
                        <div className="empty-icon-wrap">
                            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="empty-title">No patients found</h2>
                        <p className="empty-desc">
                            No matching patient records were found for the current search query or applied filters.
                        </p>
                        <div className="empty-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={resetFilters}
                            >
                                Clear All Filters
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setIsCreateOpen(true)}
                            >
                                Register New Patient
                            </button>
                        </div>
                    </div>
                )}

                {/* Patient Views */}
                {!loading && filteredPatients.length > 0 && (
                    <>
                        {viewMode === "table" ? <PatientTable /> : <PatientCards />}
                    </>
                )}
            </main>

            {/* Modals */}
            <CreatePatientModal />
            <EditPatientModal />
            <DeletePatientModal />
            <PatientDetailModal />
        </div>
    );
}

export default function PatientsPage() {
    return (
        <PatientProvider>
            <PatientsContent />
        </PatientProvider>
    );
}
