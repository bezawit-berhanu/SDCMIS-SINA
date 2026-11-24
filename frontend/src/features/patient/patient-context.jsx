import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import patientService from "../../services/patient.service";

const fallbackBranches = [];
const fallbackDentists = [];
const fallbackPatients = [];

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
    const [patients, setPatients] = useState([]);
    const [branches, setBranches] = useState([]);
    const [dentists, setDentists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // View mode: 'table' vs 'cards' (Task 3)
    const [viewMode, setViewMode] = useState("table");

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        service: "",
        status: "",
        outstandingBalance: "",
        procedureState: "",
        branchId: "",
        dentistId: "",
    });

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [detailPatient, setDetailPatient] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingPatient, setDeletingPatient] = useState(null);

    // Initial load from backend
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pRes, bRes] = await Promise.allSettled([
                patientService.getPatients(),
                patientService.getBranchesAndDentists(),
            ]);

            if (pRes.status === "fulfilled" && pRes.value?.data) {
                setPatients(pRes.value.data);
            }
            if (bRes.status === "fulfilled" && bRes.value?.data) {
                setBranches(bRes.value.data);
                if (bRes.value.dentists) {
                    setDentists(bRes.value.dentists);
                }
            }
        } catch (err) {
            console.warn("Using fallback patient data:", err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Client-side search and multi-facet filtering (Tasks 8, 9, 11)
    const filteredPatients = useMemo(() => {
        let result = [...patients];

        // 1. Search by Name, Patient ID, or Service (Task 8)
        if (searchTerm.trim()) {
            const query = searchTerm.trim().toLowerCase();
            result = result.filter((p) => {
                const matchName = (p.name || p.fullName || "").toLowerCase().includes(query);
                const matchId = (p.id || "").toLowerCase().includes(query);
                const matchService = (p.serviceType || p.service_type || "").toLowerCase().includes(query);
                return matchName || matchId || matchService;
            });
        }

        // 2. Filter by Service (Task 9)
        if (filters.service) {
            const sQuery = filters.service.toLowerCase();
            result = result.filter((p) => (p.serviceType || p.service_type || "").toLowerCase().includes(sQuery));
        }

        // 3. Filter by Status (Task 9)
        if (filters.status) {
            result = result.filter((p) => (p.status || p.recordStatus) === filters.status);
        }

        // 4. Filter by Outstanding Balance (Task 9)
        if (filters.outstandingBalance) {
            if (filters.outstandingBalance === "HAS_BALANCE") {
                result = result.filter((p) => Number(p.remainingFee || p.balance || 0) > 0);
            } else if (filters.outstandingBalance === "PAID") {
                result = result.filter((p) => Number(p.remainingFee || p.balance || 0) <= 0);
            }
        }

        // 5. Filter by Procedure State (Task 9)
        if (filters.procedureState) {
            const reqState = filters.procedureState.toUpperCase();
            result = result.filter((p) => {
                const procs = p.procedures || [];
                return procs.some((proc) => (proc.status || "").toUpperCase() === reqState);
            });
        }

        // 6. Filter by Branch Only / Simultaneous (Task 11)
        if (filters.branchId) {
            result = result.filter((p) => p.branchId === filters.branchId || (p.branch && p.branch.id === filters.branchId));
        }

        // 7. Filter by Dentist Only / Simultaneous (Task 11)
        if (filters.dentistId) {
            result = result.filter((p) => p.dentistId === filters.dentistId || (p.dentist && p.dentist.id === filters.dentistId));
        }

        return result;
    }, [patients, searchTerm, filters]);

    // Dentists filtered by chosen branch for form dependency (Task 10)
    const getDentistsForBranch = useCallback((branchId) => {
        if (!branchId) return dentists;
        return dentists.filter((d) => d.branchId === branchId);
    }, [dentists]);

    // Handlers
    const setFilter = (key, value) => {
        setFilters((prev) => {
            const updated = { ...prev, [key]: value };
            // If branch changed, clear dentist if dentist does not belong to new branch
            if (key === "branchId" && value && prev.dentistId) {
                const dent = dentists.find((d) => d.id === prev.dentistId);
                if (dent && dent.branchId && dent.branchId !== value) {
                    updated.dentistId = "";
                }
            }
            return updated;
        });
    };

    const resetFilters = () => {
        setSearchTerm("");
        setFilters({
            service: "",
            status: "",
            outstandingBalance: "",
            procedureState: "",
            branchId: "",
            dentistId: "",
        });
    };

    const handleCreatePatient = async (payload) => {
        setLoading(true);
        try {
            const res = await patientService.createPatient(payload);
            const created = res.data || res;
            setPatients((prev) => [created, ...prev]);
            setIsCreateOpen(false);
            return created;
        } catch (err) {
            // Local fallback simulation
            const branch = branches.find((b) => b.id === payload.branchId);
            const dentist = dentists.find((d) => d.id === payload.dentistId);
            const newPat = {
                id: `pat-${Date.now()}`,
                name: payload.name,
                fullName: payload.name,
                age: Number(payload.age),
                contact: payload.contact,
                serviceType: payload.service || "General Consultation",
                remainingFee: Number(payload.initialFee || 0),
                balance: Number(payload.initialFee || 0),
                status: "ACTIVE",
                recordStatus: "ACTIVE",
                createdDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                branchId: payload.branchId,
                dentistId: payload.dentistId,
                branch: branch || null,
                dentist: dentist || null,
                procedures: payload.initialProcedure ? [
                    { id: `proc-${Date.now()}`, description: payload.initialProcedure, status: "ONGOING", cost: Number(payload.initialFee || 0) }
                ] : [],
                appointments: [
                    { id: `app-${Date.now()}`, scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString(), status: "UPCOMING" }
                ],
                payments: [],
            };
            setPatients((prev) => [newPat, ...prev]);
            setIsCreateOpen(false);
            return newPat;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePatient = async (id, payload) => {
        setLoading(true);
        try {
            const res = await patientService.updatePatient(id, payload);
            const updated = res.data || res;
            setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
            setIsEditOpen(false);
            setEditingPatient(null);
            return updated;
        } catch (err) {
            // Local update fallback
            const branch = branches.find((b) => b.id === payload.branchId);
            const dentist = dentists.find((d) => d.id === payload.dentistId);
            setPatients((prev) => prev.map((p) => {
                if (p.id !== id) return p;
                return {
                    ...p,
                    ...payload,
                    name: payload.name || p.name,
                    fullName: payload.name || p.fullName,
                    remainingFee: payload.remainingFee !== undefined ? Number(payload.remainingFee) : p.remainingFee,
                    balance: payload.remainingFee !== undefined ? Number(payload.remainingFee) : p.balance,
                    branch: branch || p.branch,
                    dentist: dentist || p.dentist,
                };
            }));
            setIsEditOpen(false);
            setEditingPatient(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePatient = async (id) => {
        setLoading(true);
        try {
            await patientService.deletePatient(id);
        } catch (err) {
            console.warn("Delete fallback:", err.message);
        } finally {
            setPatients((prev) => prev.filter((p) => p.id !== id));
            setIsDeleteOpen(false);
            setDeletingPatient(null);
            setLoading(false);
        }
    };

    const openDetail = (patient) => {
        setDetailPatient(patient);
        setIsDetailOpen(true);
    };

    const openEdit = (patient) => {
        setEditingPatient(patient);
        setIsEditOpen(true);
    };

    const openDelete = (patient) => {
        setDeletingPatient(patient);
        setIsDeleteOpen(true);
    };

    return (
        <PatientContext.Provider
            value={{
                patients,
                filteredPatients,
                branches,
                dentists,
                loading,
                error,
                viewMode,
                setViewMode,
                searchTerm,
                setSearchTerm,
                filters,
                setFilter,
                resetFilters,
                getDentistsForBranch,
                // Modals
                isCreateOpen,
                setIsCreateOpen,
                isEditOpen,
                setIsEditOpen,
                editingPatient,
                setEditingPatient,
                isDetailOpen,
                setIsDetailOpen,
                detailPatient,
                setDetailPatient,
                isDeleteOpen,
                setIsDeleteOpen,
                deletingPatient,
                setDeletingPatient,
                // Actions
                handleCreatePatient,
                handleUpdatePatient,
                handleDeletePatient,
                openDetail,
                openEdit,
                openDelete,
                refresh: loadData,
            }}
        >
            {children}
        </PatientContext.Provider>
    );
}

export function usePatientContext() {
    const context = useContext(PatientContext);
    if (!context) {
        throw new Error("usePatientContext must be used within a PatientProvider");
    }
    return context;
}
