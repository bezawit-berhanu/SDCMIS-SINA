const prisma = require("../prisma");
const Patient = require("../../domain/entities/patient");
const Procedure = require("../../domain/entities/procedure");
const Appointment = require("../../domain/entities/appointment");
const Payment = require("../../domain/entities/payment");
const branchRepository = require("./branch.repository");
const { RecordStatus, ProcedureStatus, AppointmentStatus, AuditAction, AuditEntityType } = require("../../domain/enums/enum");

// Seed initial in-memory data for tests and offline resilience
const initialSeedPatients = [
    {
        id: "pat-1001",
        full_name: "Abebe Bikila",
        age: 34,
        contact_info: "+251911445566",
        service_type: "Orthodontics",
        remaining_fee: 1200.00,
        next_appointment_date: new Date("2026-11-05T09:00:00Z"),
        created_by_user_id: "usr-admin-01",
        dentistId: "dent-001",
        branchId: "br-001",
        record_status: RecordStatus.ACTIVE,
        created_at: new Date("2026-08-10T10:00:00Z"),
        updated_at: new Date("2026-08-10T10:00:00Z"),
        deletedAt: null,
        procedures: [
            {
                id: "proc-101",
                procedureId: "proc-101",
                patientId: "pat-1001",
                name: "Braces Alignment",
                description: "Initial Braces Alignment & Archwire Placement",
                status: ProcedureStatus.ONGOING,
                cost: 2500.00,
                targetDate: new Date("2026-08-15T09:00:00Z"),
                completedDate: null,
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-08-10T10:00:00Z"),
                updatedAt: new Date("2026-08-10T10:00:00Z"),
            },
            {
                id: "proc-102",
                procedureId: "proc-102",
                patientId: "pat-1001",
                name: "Bracket Tightening",
                description: "Upper Arch Bracket Tightening & Elastic Adjustment",
                status: ProcedureStatus.NEXT,
                cost: 800.00,
                targetDate: new Date("2026-11-05T09:00:00Z"),
                completedDate: null,
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-08-10T10:00:00Z"),
                updatedAt: new Date("2026-08-10T10:00:00Z"),
            },
            {
                id: "proc-100",
                procedureId: "proc-100",
                patientId: "pat-1001",
                name: "Dental X-Ray",
                description: "Panoramic Dental X-Ray & Cephalometric Scan",
                status: ProcedureStatus.DONE,
                cost: 600.00,
                targetDate: new Date("2026-08-10T10:30:00Z"),
                completedDate: new Date("2026-08-10T11:00:00Z"),
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-08-10T10:00:00Z"),
                updatedAt: new Date("2026-08-10T11:00:00Z"),
            },
        ],
        appointments: [
            {
                id: "app-101",
                patient_id: "pat-1001",
                procedure_id: "proc-102",
                scheduled_date: new Date("2026-11-05T09:00:00Z"),
                status: AppointmentStatus.UPCOMING,
                created_by_user_id: "usr-admin-01",
                record_status: RecordStatus.ACTIVE,
                created_at: new Date("2026-08-10T10:00:00Z"),
                updated_at: new Date("2026-08-10T10:00:00Z"),
            },
        ],
        payments: [
            {
                id: "pay-101",
                patient_id: "pat-1001",
                amount: 1900.00,
                recorded_by_user_id: "usr-admin-01",
                payment_date: new Date("2026-08-10T11:30:00Z"),
                record_status: RecordStatus.ACTIVE,
                created_at: new Date("2026-08-10T11:30:00Z"),
                updated_at: new Date("2026-08-10T11:30:00Z"),
            },
        ],
    },
    {
        id: "pat-1002",
        full_name: "Fatima Zahra",
        age: 28,
        contact_info: "+251922556677",
        service_type: "Root Canal Therapy",
        remaining_fee: 0.00,
        next_appointment_date: new Date("2026-10-30T14:00:00Z"),
        created_by_user_id: "usr-admin-01",
        dentistId: "dent-002",
        branchId: "br-001",
        record_status: RecordStatus.ACTIVE,
        created_at: new Date("2026-09-01T11:00:00Z"),
        updated_at: new Date("2026-09-01T11:00:00Z"),
        deletedAt: null,
        procedures: [
            {
                id: "proc-201",
                procedureId: "proc-201",
                patientId: "pat-1002",
                name: "Endodontic Pulp Extirpation",
                description: "Molar Endodontic Pulp Extirpation & Canal Cleaning",
                status: ProcedureStatus.ONGOING,
                cost: 1500.00,
                targetDate: new Date("2026-09-05T14:00:00Z"),
                completedDate: null,
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-09-01T11:00:00Z"),
                updatedAt: new Date("2026-09-01T11:00:00Z"),
            },
            {
                id: "proc-202",
                procedureId: "proc-202",
                patientId: "pat-1002",
                name: "Canal Obturation",
                description: "Permanent Gutta-Percha Canal Obturation & Crown Prep",
                status: ProcedureStatus.NEXT,
                cost: 1200.00,
                targetDate: new Date("2026-10-30T14:00:00Z"),
                completedDate: null,
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-09-01T11:00:00Z"),
                updatedAt: new Date("2026-09-01T11:00:00Z"),
            },
        ],
        appointments: [
            {
                id: "app-201",
                patient_id: "pat-1002",
                procedure_id: "proc-202",
                scheduled_date: new Date("2026-10-30T14:00:00Z"),
                status: AppointmentStatus.UPCOMING,
                created_by_user_id: "usr-admin-01",
                record_status: RecordStatus.ACTIVE,
                created_at: new Date("2026-09-01T11:00:00Z"),
                updated_at: new Date("2026-09-01T11:00:00Z"),
            },
        ],
        payments: [
            {
                id: "pay-201",
                patient_id: "pat-1002",
                amount: 2700.00,
                recorded_by_user_id: "usr-admin-01",
                payment_date: new Date("2026-09-01T11:15:00Z"),
                record_status: RecordStatus.ACTIVE,
                created_at: new Date("2026-09-01T11:15:00Z"),
                updated_at: new Date("2026-09-01T11:15:00Z"),
            },
        ],
    },
    {
        id: "pat-1003",
        full_name: "Yohannes Haile",
        age: 45,
        contact_info: "+251933667788",
        service_type: "Dental Implant",
        remaining_fee: 3500.00,
        next_appointment_date: new Date("2026-11-12T11:30:00Z"),
        created_by_user_id: "usr-admin-01",
        dentistId: "dent-003",
        branchId: "br-002",
        record_status: RecordStatus.ACTIVE,
        created_at: new Date("2026-09-15T14:00:00Z"),
        updated_at: new Date("2026-09-15T14:00:00Z"),
        deletedAt: null,
        procedures: [
            {
                id: "proc-301",
                procedureId: "proc-301",
                patientId: "pat-1003",
                name: "Surgical Implantation",
                description: "Titanium Fixture Surgical Implantation",
                status: ProcedureStatus.ONGOING,
                cost: 5000.00,
                targetDate: new Date("2026-09-20T11:30:00Z"),
                completedDate: null,
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-09-15T14:00:00Z"),
                updatedAt: new Date("2026-09-15T14:00:00Z"),
            },
            {
                id: "proc-302",
                procedureId: "proc-302",
                patientId: "pat-1003",
                name: "Abutment Screw Placement",
                description: "Abutment Screw Placement & Impression",
                status: ProcedureStatus.NEXT,
                cost: 1500.00,
                targetDate: new Date("2026-11-12T11:30:00Z"),
                completedDate: null,
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-09-15T14:00:00Z"),
                updatedAt: new Date("2026-09-15T14:00:00Z"),
            },
        ],
        appointments: [
            {
                id: "app-301",
                patient_id: "pat-1003",
                procedure_id: "proc-302",
                scheduled_date: new Date("2026-11-12T11:30:00Z"),
                status: AppointmentStatus.UPCOMING,
                created_by_user_id: "usr-admin-01",
                record_status: RecordStatus.ACTIVE,
                created_at: new Date("2026-09-15T14:00:00Z"),
                updated_at: new Date("2026-09-15T14:00:00Z"),
            },
        ],
        payments: [
            {
                id: "pay-301",
                patient_id: "pat-1003",
                amount: 3000.00,
                recorded_by_user_id: "usr-admin-01",
                payment_date: new Date("2026-09-15T14:30:00Z"),
                record_status: RecordStatus.ACTIVE,
                created_at: new Date("2026-09-15T14:30:00Z"),
                updated_at: new Date("2026-09-15T14:30:00Z"),
            },
        ],
    },
    {
        id: "pat-1004",
        full_name: "Tigist Demissie",
        age: 22,
        contact_info: "+251944778899",
        service_type: "Teeth Whitening",
        remaining_fee: 0.00,
        next_appointment_date: new Date("2026-12-01T15:00:00Z"),
        created_by_user_id: "usr-admin-01",
        dentistId: "dent-004",
        branchId: "br-003",
        record_status: RecordStatus.ACTIVE,
        created_at: new Date("2026-09-28T09:00:00Z"),
        updated_at: new Date("2026-09-28T09:00:00Z"),
        deletedAt: null,
        procedures: [
            {
                id: "proc-401",
                procedureId: "proc-401",
                patientId: "pat-1004",
                name: "Laser Teeth Whitening",
                description: "Laser In-Office Teeth Whitening & Enamel Fluoride Protection",
                status: ProcedureStatus.DONE,
                cost: 950.00,
                targetDate: new Date("2026-09-28T10:00:00Z"),
                completedDate: new Date("2026-09-28T11:00:00Z"),
                createdByUserId: "usr-admin-01",
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date("2026-09-28T09:00:00Z"),
                updatedAt: new Date("2026-09-28T11:00:00Z"),
            },
        ],
        appointments: [],
        payments: [
            {
                id: "pay-401",
                patient_id: "pat-1004",
                amount: 950.00,
                recorded_by_user_id: "usr-admin-01",
                payment_date: new Date("2026-09-28T11:05:00Z"),
                record_status: RecordStatus.ACTIVE,
                created_at: new Date("2026-09-28T11:05:00Z"),
                updated_at: new Date("2026-09-28T11:05:00Z"),
            },
        ],
    },
];

class PatientRepository {
    constructor() {
        this.patients = JSON.parse(JSON.stringify(initialSeedPatients)).map((p) => ({
            ...p,
            created_at: new Date(p.created_at),
            updated_at: new Date(p.updated_at),
            next_appointment_date: new Date(p.next_appointment_date),
            procedures: p.procedures.map((proc) => ({
                ...proc,
                procedureId: proc.procedureId || proc.id,
                name: proc.name || (proc.description ? proc.description.slice(0, 120) : "Dental Procedure"),
                targetDate: new Date(proc.targetDate),
                completedDate: proc.completedDate ? new Date(proc.completedDate) : null,
                createdAt: new Date(proc.createdAt),
                updatedAt: new Date(proc.updatedAt),
            })),
            appointments: p.appointments.map((a) => ({
                ...a,
                scheduled_date: new Date(a.scheduled_date),
                created_at: new Date(a.created_at),
                updated_at: new Date(a.updated_at),
            })),
            payments: p.payments.map((pay) => ({
                ...pay,
                payment_date: new Date(pay.payment_date),
                created_at: new Date(pay.created_at),
                updated_at: new Date(pay.updated_at),
            })),
        }));
        this.auditLogs = [];
    }

    async _enrichPatient(rawPatient) {
        if (!rawPatient) return null;
        const branch = rawPatient.branchId ? await branchRepository.findById(rawPatient.branchId) : null;
        const dentist = rawPatient.dentistId ? await branchRepository.findDentistById(rawPatient.dentistId) : null;

        return new Patient({
            ...rawPatient,
            branch: branch ? branch.toSafeObject() : null,
            dentist: dentist || null,
        });
    }

    async findAll(filters = {}) {
        const {
            search = "",
            service = "",
            status = "",
            outstandingBalance = "",
            procedureState = "",
            branchId = "",
            dentistId = "",
        } = filters;

        // In-memory querying with full rich relations and filtering
        const activePatients = this.patients.filter((p) => {
            if (status) {
                return p.record_status === status && !p.deletedAt;
            }
            return p.record_status !== RecordStatus.DELETED && !p.deletedAt;
        });

        const enrichedList = await Promise.all(activePatients.map((p) => this._enrichPatient(p)));
        return this._applyFilters(enrichedList, { search, service, status, outstandingBalance, procedureState, branchId, dentistId });
    }

    _applyFilters(list, { search, service, outstandingBalance, procedureState, branchId, dentistId }) {
        let filtered = [...list];

        // 1. Search by Name, Patient ID, or Service (Task 8)
        if (search && search.trim().length > 0) {
            const query = search.trim().toLowerCase();
            filtered = filtered.filter((p) => {
                const matchName = (p.name || p.full_name || "").toLowerCase().includes(query);
                const matchId = (p.id || "").toLowerCase().includes(query);
                const matchService = (p.serviceType || p.service_type || "").toLowerCase().includes(query);
                return matchName || matchId || matchService;
            });
        }

        // 2. Filter by Service (Task 9)
        if (service && service.trim().length > 0) {
            const sQuery = service.trim().toLowerCase();
            filtered = filtered.filter((p) => (p.serviceType || p.service_type || "").toLowerCase().includes(sQuery));
        }

        // 3. Filter by Outstanding Balance (Task 9)
        if (outstandingBalance) {
            if (outstandingBalance === "HAS_BALANCE" || outstandingBalance === "UNPAID") {
                filtered = filtered.filter((p) => Number(p.remainingFee || p.balance) > 0);
            } else if (outstandingBalance === "PAID" || outstandingBalance === "ZERO_BALANCE") {
                filtered = filtered.filter((p) => Number(p.remainingFee || p.balance) <= 0);
            }
        }

        // 4. Filter by Procedure State (Task 9)
        if (procedureState) {
            const stateQuery = procedureState.trim().toUpperCase();
            filtered = filtered.filter((p) => {
                const procs = p.procedures || [];
                return procs.some((proc) => (proc.status || "").toUpperCase() === stateQuery);
            });
        }

        // 5. Filter by Branch Only / Simultaneous (Task 11)
        if (branchId) {
            filtered = filtered.filter((p) => p.branchId === branchId || (p.branch && p.branch.id === branchId));
        }

        // 6. Filter by Dentist Only / Simultaneous (Task 11)
        if (dentistId) {
            filtered = filtered.filter((p) => p.dentistId === dentistId || (p.dentist && p.dentist.id === dentistId));
        }

        return filtered;
    }

    async findById(id) {
        if (!id) return null;

        // Try Prisma DB first
        try {
            if (prisma?.patient?.findUnique) {
                const p = await prisma.patient.findUnique({
                    where: { id },
                    include: {
                        procedures: { where: { record_status: "ACTIVE" } },
                        appointments: { where: { record_status: "ACTIVE" } },
                        payments: { where: { record_status: "ACTIVE" } },
                        branch: true,
                        dentist: { select: { id: true, fullname: true, email: true, phone: true, branchId: true } },
                    },
                });
                if (p) {
                    return new Patient({
                        ...p,
                        name: p.full_name,
                        contact: p.contact_info,
                        serviceType: p.service_type,
                        remainingFee: Number(p.remaining_fee),
                        dentist: p.dentist ? { id: p.dentist.id, fullName: p.dentist.fullname, name: p.dentist.fullname } : null,
                        branch: p.branch,
                    });
                }
            }
        } catch (_) {
            // Fall through
        }

        const found = this.patients.find((p) => p.id === id && p.record_status !== RecordStatus.DELETED && !p.deletedAt);
        if (!found) return null;
        return this._enrichPatient(found);
    }

    async create(data, actorUserId = "system") {
        const id = data.id || `pat-${Date.now()}`;
        const name = (data.name || data.full_name || data.fullName || "").trim();
        const contact = (data.contact || data.contact_info || data.contactInfo || "").trim();
        const age = Number(data.age);
        const serviceType = (data.service || data.serviceType || data.service_type || "").trim();
        const initialFee = data.initialFee !== undefined && data.initialFee !== null ? Number(data.initialFee) : (data.remainingFee || 0);
        const dentistId = data.dentistId || data.dentistid || null;
        const branchId = data.branchId || data.branchID || null;
        const createdByUserId = data.createdByUserId || actorUserId || "usr-receptionist";
        const initialProcedure = data.initialProcedure || data.initial_procedure || null;
        const initialProcedureName = data.initialProcedureName || data.name || (initialProcedure ? initialProcedure.slice(0, 120) : "Clinical Procedure");

        const procedures = [];
        if (initialProcedure && typeof initialProcedure === "string" && initialProcedure.trim().length > 0) {
            const procDesc = initialProcedure.trim();
            const procName = (data.initialProcedureName || procDesc.split("&")[0] || procDesc).trim().slice(0, 120);
            procedures.push({
                id: `proc-${Date.now()}-1`,
                procedureId: `proc-${Date.now()}-1`,
                patientId: id,
                name: procName,
                description: procDesc,
                status: ProcedureStatus.ONGOING,
                cost: initialFee,
                targetDate: new Date(),
                completedDate: null,
                createdByUserId,
                recordStatus: RecordStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        const appointments = [];
        const nextAppointmentDate = data.nextAppointmentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        appointments.push({
            id: `app-${Date.now()}-1`,
            patient_id: id,
            procedure_id: procedures.length > 0 ? procedures[0].id : null,
            scheduled_date: nextAppointmentDate instanceof Date ? nextAppointmentDate : new Date(nextAppointmentDate),
            status: AppointmentStatus.UPCOMING,
            created_by_user_id: createdByUserId,
            record_status: RecordStatus.ACTIVE,
            created_at: new Date(),
            updated_at: new Date(),
        });

        const newPatientRecord = {
            id,
            full_name: name,
            age,
            contact_info: contact,
            service_type: serviceType,
            serviceTypeId: null,
            remaining_fee: initialFee,
            next_appointment_date: nextAppointmentDate instanceof Date ? nextAppointmentDate : new Date(nextAppointmentDate),
            created_by_user_id: createdByUserId,
            dentistId,
            branchId,
            record_status: RecordStatus.ACTIVE,
            created_at: new Date(),
            updated_at: new Date(),
            deletedAt: null,
            procedures,
            appointments,
            payments: [],
        };

        // Try Prisma create
        try {
            if (prisma?.patient?.create) {
                await prisma.patient.create({
                    data: {
                        id,
                        full_name: name,
                        age,
                        contact_info: contact,
                        service_type: serviceType,
                        remaining_fee: initialFee,
                        next_appointment_date: nextAppointmentDate,
                        created_by_user_id: createdByUserId,
                        dentistId,
                        branchId,
                    },
                });
            }
        } catch (_) {
            // Fall through
        }

        this.patients.unshift(newPatientRecord);

        // Audit Logging (Task 7)
        this.recordAuditLog({
            actorUserId,
            entityType: AuditEntityType.PATIENT,
            entityId: id,
            action: AuditAction.CREATE,
            changeSummary: {
                action: "CREATE_PATIENT",
                patientId: id,
                name,
                branchId,
                dentistId,
                serviceType,
                initialFee,
            },
        });

        return this._enrichPatient(newPatientRecord);
    }

    async update(id, updateData, actorUserId = "system") {
        const patientIndex = this.patients.findIndex((p) => p.id === id && p.record_status !== RecordStatus.DELETED && !p.deletedAt);
        if (patientIndex === -1) {
            throw new Error(`Patient with ID '${id}' not found.`);
        }

        const existing = this.patients[patientIndex];
        const changes = {};

        if (updateData.name || updateData.full_name || updateData.fullName) {
            const newName = (updateData.name || updateData.full_name || updateData.fullName).trim();
            if (newName.length < 1 || newName.length > 120) {
                throw new Error("Patient name must contain between 1 and 120 characters.");
            }
            changes.full_name = { old: existing.full_name, new: newName };
            existing.full_name = newName;
        }

        if (updateData.age !== undefined && updateData.age !== null) {
            const newAge = Number(updateData.age);
            if (Number.isNaN(newAge) || newAge < 0 || newAge > 150) {
                throw new Error("Patient age must be a valid number between 0 and 150.");
            }
            changes.age = { old: existing.age, new: newAge };
            existing.age = newAge;
        }

        if (updateData.contact || updateData.contact_info || updateData.contactInfo) {
            const newContact = (updateData.contact || updateData.contact_info || updateData.contactInfo).trim();
            if (newContact.length < 3 || newContact.length > 255) {
                throw new Error("Patient contact information must be provided (between 3 and 255 characters).");
            }
            changes.contact_info = { old: existing.contact_info, new: newContact };
            existing.contact_info = newContact;
        }

        if (updateData.service || updateData.serviceType || updateData.service_type) {
            const newService = (updateData.service || updateData.serviceType || updateData.service_type).trim();
            changes.service_type = { old: existing.service_type, new: newService };
            existing.service_type = newService;
        }

        if (updateData.dentistId !== undefined || updateData.dentistid !== undefined) {
            const newDentistId = updateData.dentistId !== undefined ? updateData.dentistId : updateData.dentistid;
            changes.dentistId = { old: existing.dentistId, new: newDentistId };
            existing.dentistId = newDentistId;
        }

        if (updateData.branchId !== undefined || updateData.branchID !== undefined) {
            const newBranchId = updateData.branchId !== undefined ? updateData.branchId : updateData.branchID;
            changes.branchId = { old: existing.branchId, new: newBranchId };
            existing.branchId = newBranchId;
        }

        if (updateData.remainingFee !== undefined || updateData.balance !== undefined) {
            const newFee = Number(updateData.remainingFee !== undefined ? updateData.remainingFee : updateData.balance);
            if (Number.isNaN(newFee) || newFee < 0) {
                throw new Error("Remaining fee/balance cannot be negative.");
            }
            changes.remaining_fee = { old: existing.remaining_fee, new: newFee };
            existing.remaining_fee = newFee;
        }

        if (updateData.status || updateData.recordStatus || updateData.record_status) {
            const newStatus = updateData.status || updateData.recordStatus || updateData.record_status;
            if (!Object.values(RecordStatus).includes(newStatus)) {
                throw new Error("Invalid record status.");
            }
            changes.record_status = { old: existing.record_status, new: newStatus };
            existing.record_status = newStatus;
        }

        existing.updated_at = new Date();

        // Audit Logging (Task 7)
        this.recordAuditLog({
            actorUserId,
            entityType: AuditEntityType.PATIENT,
            entityId: id,
            action: AuditAction.UPDATE,
            changeSummary: {
                action: "UPDATE_PATIENT",
                patientId: id,
                changes,
            },
        });

        return this._enrichPatient(existing);
    }

    async softDelete(id, actorUserId = "system") {
        const patientIndex = this.patients.findIndex((p) => p.id === id && p.record_status !== RecordStatus.DELETED && !p.deletedAt);
        if (patientIndex === -1) {
            throw new Error(`Patient with ID '${id}' not found or already deleted.`);
        }

        const patient = this.patients[patientIndex];
        patient.record_status = RecordStatus.DELETED;
        patient.deletedAt = new Date();
        patient.updated_at = new Date();

        // Try Prisma update
        try {
            if (prisma?.patient?.update) {
                await prisma.patient.update({
                    where: { id },
                    data: {
                        record_status: RecordStatus.DELETED,
                        deletedAt: new Date(),
                    },
                });
            }
        } catch (_) {
            // Fall through
        }

        // Audit Logging (Task 7)
        this.recordAuditLog({
            actorUserId,
            entityType: AuditEntityType.PATIENT,
            entityId: id,
            action: AuditAction.DELETE,
            changeSummary: {
                action: "DELETE_PATIENT",
                patientId: id,
                patientName: patient.full_name,
                deletedAt: patient.deletedAt,
            },
        });

        return {
            success: true,
            id,
            message: `Patient '${patient.full_name}' was successfully deleted.`,
            auditLogged: true,
        };
    }

    recordAuditLog(entry) {
        const audit = {
            id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            actorUserId: entry.actorUserId || "system",
            entityType: entry.entityType || AuditEntityType.PATIENT,
            entityId: entry.entityId,
            action: entry.action,
            changeSummary: entry.changeSummary || {},
            createdAt: new Date(),
            recordStatus: RecordStatus.ACTIVE,
        };
        this.auditLogs.unshift(audit);

        // Try Prisma AuditLog create
        try {
            if (prisma?.auditLog?.create) {
                prisma.auditLog.create({
                    data: {
                        actorUserId: audit.actorUserId,
                        entityType: audit.entityType,
                        entityId: audit.entityId,
                        action: audit.action,
                        changeSummary: audit.changeSummary,
                    },
                }).catch(() => {});
            }
        } catch (_) {
            // Ignore background error
        }

        return audit;
    }

    getAuditLogs(patientId = null) {
        if (!patientId) return [...this.auditLogs];
        return this.auditLogs.filter((a) => a.entityId === patientId || a.changeSummary?.patientId === patientId);
    }
}

module.exports = new PatientRepository();
