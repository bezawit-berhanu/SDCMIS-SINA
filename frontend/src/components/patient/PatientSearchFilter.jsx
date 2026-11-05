import React from "react";
import { usePatientContext } from "../../features/patient/patient-context";
import { FiX } from "react-icons/fi";

export default function PatientSearchFilter() {
    const {
        searchTerm,
        setSearchTerm,
        filters,
        setFilter,
        resetFilters,
        branches,
        dentists,
        viewMode,
        setViewMode,
        filteredPatients,
        patients,
        setIsCreateOpen,
    } = usePatientContext();

    // Dynamically available dentists for the currently selected branch (Task 10 & 11)
    const availableDentists = React.useMemo(() => {
        if (!filters.branchId) return dentists;
        return dentists.filter((d) => !d.branchId || d.branchId === filters.branchId);
    }, [dentists, filters.branchId]);

    // Unique services from existing patients
    const serviceOptions = React.useMemo(() => {
        const set = new Set();
        patients.forEach((p) => {
            const s = p.serviceType || p.service_type;
            if (s) set.add(s);
        });
        return Array.from(set);
    }, [patients]);

    const activeFilterCount = Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0);

    return (
        <div className="search-filter-card">
            {/* Top Toolbar: Search + Register Button + View Mode Switcher */}
            <div className="search-toolbar-row">
                <div className="search-input-wrapper">
                    <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        id="patient-search-input"
                        type="text"
                        className="search-input"
                        placeholder="Search by Name, Patient ID (e.g. pat-1001), or Service..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            className="clear-search-btn"
                            onClick={() => setSearchTerm("")}
                            title="Clear search"
                        >
                            <FiX />
                        </button>
                    )}
                </div>

                <div className="toolbar-actions">
                    <div className="view-mode-toggle" role="group" aria-label="View layout toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                            onClick={() => setViewMode("table")}
                            title="Table View"
                            id="view-mode-table-btn"
                        >
                            <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Table</span>
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                            onClick={() => setViewMode("cards")}
                            title="Cards View"
                            id="view-mode-cards-btn"
                        >
                            <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span>Cards</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn-primary btn-register-patient"
                        id="register-patient-btn"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        <svg className="icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Register Patient</span>
                    </button>
                </div>
            </div>

            {/* Filter Controls Row (Tasks 9, 10, 11) */}
            <div className="filter-controls-grid">
                {/* Branch Filter (Task 11) */}
                <div className="filter-group">
                    <label htmlFor="filter-branch" className="filter-label">Branch</label>
                    <select
                        id="filter-branch"
                        className="filter-select"
                        value={filters.branchId}
                        onChange={(e) => setFilter("branchId", e.target.value)}
                    >
                        <option value="">All Branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Dentist Filter (Task 11) */}
                <div className="filter-group">
                    <label htmlFor="filter-dentist" className="filter-label">Dentist</label>
                    <select
                        id="filter-dentist"
                        className="filter-select"
                        value={filters.dentistId}
                        onChange={(e) => setFilter("dentistId", e.target.value)}
                    >
                        <option value="">All Dentists</option>
                        {availableDentists.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.fullName || d.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Service Filter (Task 9) */}
                <div className="filter-group">
                    <label htmlFor="filter-service" className="filter-label">Service</label>
                    <select
                        id="filter-service"
                        className="filter-select"
                        value={filters.service}
                        onChange={(e) => setFilter("service", e.target.value)}
                    >
                        <option value="">All Services</option>
                        {serviceOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Status Filter (Task 9) */}
                <div className="filter-group">
                    <label htmlFor="filter-status" className="filter-label">Status</label>
                    <select
                        id="filter-status"
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => setFilter("status", e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                {/* Outstanding Balance Filter (Task 9) */}
                <div className="filter-group">
                    <label htmlFor="filter-balance" className="filter-label">Balance</label>
                    <select
                        id="filter-balance"
                        className="filter-select"
                        value={filters.outstandingBalance}
                        onChange={(e) => setFilter("outstandingBalance", e.target.value)}
                    >
                        <option value="">All Balances</option>
                        <option value="HAS_BALANCE">Has Outstanding Balance (&gt; $0)</option>
                        <option value="PAID">Fully Settled ($0.00)</option>
                    </select>
                </div>

                {/* Procedure State Filter (Task 9) */}
                <div className="filter-group">
                    <label htmlFor="filter-procedure-state" className="filter-label">Procedure State</label>
                    <select
                        id="filter-procedure-state"
                        className="filter-select"
                        value={filters.procedureState}
                        onChange={(e) => setFilter("procedureState", e.target.value)}
                    >
                        <option value="">All Procedures</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="NEXT">Next Scheduled</option>
                        <option value="DONE">Completed (Done)</option>
                    </select>
                </div>
            </div>

            {/* Filter Summary & Reset Bar */}
            <div className="filter-meta-bar">
                <div className="filter-counts">
                    Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
                    {activeFilterCount > 0 && (
                        <span className="active-filter-badge">({activeFilterCount} active filters)</span>
                    )}
                </div>

                {activeFilterCount > 0 && (
                    <button
                        type="button"
                        className="btn-link btn-reset-filters"
                        id="reset-filters-btn"
                        onClick={resetFilters}
                    >
                        Reset All Filters
                    </button>
                )}
            </div>
        </div>
    );
}
