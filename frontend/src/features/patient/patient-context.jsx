import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import patientService from "../../services/patient.service";

// Fallback seed data for instant offline rendering & testing
const fallbackBranches = [
    {
        id: "br-001",
        name: "Main Dental Clinic - Bole",
        address: "Bole Medhanialem, Suite 402, Addis Ababa",
        phone: "+251911223344",
    },
    {
        id: "br-002",
        name: "Kazanchis Executive Dental Center",
        address: "Kazanchis Business Center, 3rd Floor, Addis Ababa",
        phone: "+251922334455",
    },
    {
        id: "br-003",
        name: "Sarbet Family Dental Practice",
        address: "Sarbet Old Airport Road, Addis Ababa",
        phone: "+251933445566",
    },
];

const fallbackDentists = [
    {
        id: "dent-001",
        fullName: "Dr. Aster Worku",
        name: "Dr. Aster Worku",
        email: "aster.worku@dentalclinic.com",
        phone: "+251911001122",
        branchId: "br-001",
        branchName: "Main Dental Clinic - Bole",
    },
    {
        id: "dent-002",
        fullName: "Dr. Dawit Tadesse",
        name: "Dr. Dawit Tadesse",
        email: "dawit.tadesse@dentalclinic.com",
        phone: "+251922112233",
        branchId: "br-001",
        branchName: "Main Dental Clinic - Bole",
    },
    {
        id: "dent-003",
        fullName: "Dr. Selamawit Alemu",
        name: "Dr. Selamawit Alemu",
        email: "selamawit.alemu@dentalclinic.com",
        phone: "+251933223344",
        branchId: "br-002",
        branchName: "Kazanchis Executive Dental Center",
    },
    {
        id: "dent-004",
        fullName: "Dr. Michael Bekele",
        name: "Dr. Michael Bekele",
        email: "michael.bekele@dentalclinic.com",
        phone: "+251944334455",
        branchId: "br-003",
        branchName: "Sarbet Family Dental Practice",
    },
];

const fallbackPatients = [
    {
        id: "pat-1001",
        name: "Abebe Bikila",
        fullName: "Abebe Bikila",
        age: 34,
        contact: "+251911445566",
        serviceType: "Orthodontics",
        service_type: "Orthodontics",
        remainingFee: 1200.00,
        balance: 1200.00,
        status: "ACTIVE",
        recordStatus: "ACTIVE",
        createdDate: "2026-08-10T10:00:00.000Z",
        createdAt: "2026-08-10T10:00:00.000Z",
        branchId: "br-001",
        dentistId: "dent-001",
        branch: { id: "br-001", name: "Main Dental Clinic - Bole" },
        dentist: { id: "dent-001", fullName: "Dr. Aster Worku" },
        procedures: [
            { id: "proc-101", description: "Initial Braces Alignment & Archwire Placement", status: "ONGOING", cost: 2500.00 },
            { id: "proc-102", description: "Upper Arch Bracket Tightening & Elastic Adjustment", status: "NEXT", cost: 800.00 },
            { id: "proc-100", description: "Panoramic Dental X-Ray & Cephalometric Scan", status: "DONE", cost: 600.00 },
        ],
        appointments: [
            { id: "app-101", scheduled_date: "2026-11-05T09:00:00.000Z", status: "UPCOMING" },
        ],
        payments: [
            { id: "pay-101", amount: 1900.00, payment_date: "2026-08-10T11:30:00.000Z" },
        ],
    },
    {
        id: "pat-1002",
        name: "Fatima Zahra",
        fullName: "Fatima Zahra",
        age: 28,
        contact: "+251922556677",
        serviceType: "Root Canal Therapy",
        service_type: "Root Canal Therapy",
        remainingFee: 0.00,
        balance: 0.00,
        status: "ACTIVE",
        recordStatus: "ACTIVE",
        createdDate: "2026-09-01T11:00:00.000Z",
        createdAt: "2026-09-01T11:00:00.000Z",
        branchId: "br-001",
        dentistId: "dent-002",
        branch: { id: "br-001", name: "Main Dental Clinic - Bole" },
        dentist: { id: "dent-002", fullName: "Dr. Dawit Tadesse" },
        procedures: [
            { id: "proc-201", description: "Molar Endodontic Pulp Extirpation & Canal Cleaning", status: "ONGOING", cost: 1500.00 },
            { id: "proc-202", description: "Permanent Gutta-Percha Canal Obturation & Crown Prep", status: "NEXT", cost: 1200.00 },
        ],
        appointments: [
            { id: "app-201", scheduled_date: "2026-10-30T14:00:00.000Z", status: "UPCOMING" },
        ],
        payments: [
            { id: "pay-201", amount: 2700.00, payment_date: "2026-09-01T11:15:00.000Z" },
        ],
    },
    {
        id: "pat-1003",
        name: "Yohannes Haile",
        fullName: "Yohannes Haile",
        age: 45,
        contact: "+251933667788",
        serviceType: "Dental Implant",
        service_type: "Dental Implant",
        remainingFee: 3500.00,
        balance: 3500.00,
        status: "ACTIVE",
        recordStatus: "ACTIVE",
        createdDate: "2026-09-15T14:00:00.000Z",
        createdAt: "2026-09-15T14:00:00.000Z",
        branchId: "br-002",
        dentistId: "dent-003",
        branch: { id: "br-002", name: "Kazanchis Executive Dental Center" },
        dentist: { id: "dent-003", fullName: "Dr. Selamawit Alemu" },
        procedures: [
            { id: "proc-301", description: "Titanium Fixture Surgical Implantation", status: "ONGOING", cost: 5000.00 },
            { id: "proc-302", description: "Abutment Screw Placement & Impression", status: "NEXT", cost: 1500.00 },
        ],
        appointments: [
            { id: "app-301", scheduled_date: "2026-11-12T11:30:00.000Z", status: "UPCOMING" },
        ],
        payments: [
            { id: "pay-301", amount: 3000.00, payment_date: "2026-09-15T14:30:00.000Z" },
        ],
    },
    {
        id: "pat-1004",
        name: "Tigist Demissie",
        fullName: "Tigist Demissie",
        age: 22,
        contact: "+251944778899",
        serviceType: "Teeth Whitening",
        service_type: "Teeth Whitening",
        remainingFee: 0.00,
        balance: 0.00,
        status: "ACTIVE",
        recordStatus: "ACTIVE",
        createdDate: "2026-09-28T09:00:00.000Z",
        createdAt: "2026-09-28T09:00:00.000Z",
        branchId: "br-003",
        dentistId: "dent-004",
        branch: { id: "br-003", name: "Sarbet Family Dental Practice" },
        dentist: { id: "dent-004", fullName: "Dr. Michael Bekele" },
        procedures: [
            { id: "proc-401", description: "Laser In-Office Teeth Whitening & Enamel Fluoride Protection", status: "DONE", cost: 950.00 },
        ],
        appointments: [],
        payments: [
            { id: "pay-401", amount: 950.00, payment_date: "2026-09-28T11:05:00.000Z" },
        ],
    },
];

const PatientContext = createContext(null);

export function PatientProvider({ children }) {
    const [patients, setPatients] = useState(fallbackPatients);
    const [branches, setBranches] = useState(fallbackBranches);
    const [dentists, setDentists] = useState(fallbackDentists);
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
