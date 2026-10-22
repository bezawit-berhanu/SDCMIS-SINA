const { describe, it, after } = require("node:test");
const assert = require("node:assert");

const Patient = require("./src/domain/entities/patient");
const Branch = require("./src/domain/entities/branch");
const Procedure = require("./src/domain/entities/procedure");
const container = require("./src/container/container");
const { RecordStatus, ProcedureStatus, AppointmentStatus, AuditAction, AuditEntityType } = require("./src/domain/enums/enum");

describe("Patient Management System - Comprehensive Verification Suite", () => {
    after(async () => {
        try {
            if (container.prisma?.$disconnect) {
                await container.prisma.$disconnect();
            }
        } catch (_) {}
        setTimeout(() => process.exit(0), 100);
    });
    // ----------------------------------------------------
    // Task 1: Check for patient entity and attributes
    // ----------------------------------------------------
    describe("Task 1: Patient Entity Attributes Verification", () => {
        it("instantiates patient entity with all required attributes (name, age, contact, service type, status, created date, dentistid, branchID)", () => {
            const patient = new Patient({
                name: "Solomon Teklu",
                age: 30,
                contact: "+251911002233",
                service: "Dental Cleaning",
                status: RecordStatus.ACTIVE,
                createdDate: new Date("2026-05-01"),
                dentistid: "dent-001",
                branchID: "br-001",
                balance: 450.00,
            });

            assert.strictEqual(patient.name, "Solomon Teklu");
            assert.strictEqual(patient.full_name, "Solomon Teklu");
            assert.strictEqual(patient.age, 30);
            assert.strictEqual(patient.contact, "+251911002233");
            assert.strictEqual(patient.serviceType, "Dental Cleaning");
            assert.strictEqual(patient.status, RecordStatus.ACTIVE);
            assert.strictEqual(patient.dentistId, "dent-001");
            assert.strictEqual(patient.dentistid, "dent-001");
            assert.strictEqual(patient.branchId, "br-001");
            assert.strictEqual(patient.branchID, "br-001");
            assert.strictEqual(patient.balance, 450.00);
            assert.strictEqual(patient.remainingFee, 450.00);
            assert.ok(patient.createdAt instanceof Date);
        });

        it("validates that patient name cannot be empty or exceed 120 characters", () => {
            assert.throws(() => {
                new Patient({ name: "", age: 25, contact: "+251911000000" });
            }, /Patient name must contain between 1 and 120 characters/);

            assert.throws(() => {
                new Patient({ name: "A".repeat(125), age: 25, contact: "+251911000000" });
            }, /Patient name must contain between 1 and 120 characters/);
        });

        it("validates age range 0-150", () => {
            assert.throws(() => {
                new Patient({ name: "Kid", age: -5, contact: "+251911000000" });
            }, /Patient age must be a valid number between 0 and 150/);

            assert.throws(() => {
                new Patient({ name: "Ancient", age: 160, contact: "+251911000000" });
            }, /Patient age must be a valid number between 0 and 150/);
        });
    });

    // ----------------------------------------------------
    // Task 2: Check for Patient API & Use Cases (CRUD)
    // ----------------------------------------------------
    describe("Task 2: Patient API Operations (CRUD)", () => {
        let createdPatientId;

        it("POST /patients - registers a new patient with initial procedure and fee", async () => {
            const result = await container.createPatient.execute({
                name: "Bethlehem Assefa",
                age: 26,
                contact: "+251912345678",
                service: "Crown & Bridge",
                initialProcedure: "Porcelain Crown Preparation & Temporary Placement",
                initialFee: 1800.00,
                branchId: "br-001",
                dentistId: "dent-001",
                createdByUserId: "usr-admin-01",
            });

            assert.ok(result.patient);
            assert.strictEqual(result.patient.name, "Bethlehem Assefa");
            assert.strictEqual(result.patient.serviceType, "Crown & Bridge");
            assert.strictEqual(result.patient.remainingFee, 1800.00);
            assert.strictEqual(result.patient.branchId, "br-001");
            assert.strictEqual(result.patient.dentistId, "dent-001");
            assert.strictEqual(result.patient.procedures.length, 1);
            assert.strictEqual(result.patient.procedures[0].status, ProcedureStatus.ONGOING);

            createdPatientId = result.patient.id;
        });

        it("GET /patients - lists active patients including the newly created patient", async () => {
            const result = await container.getPatients.execute({});
            assert.ok(Array.isArray(result.patients));
            assert.ok(result.total >= 1);
            const found = result.patients.find((p) => p.id === createdPatientId);
            assert.ok(found);
            assert.strictEqual(found.name, "Bethlehem Assefa");
        });

        it("GET /patients/:id - returns patient details with structured clinical overview", async () => {
            const result = await container.getPatientById.execute({ patientId: createdPatientId });
            assert.ok(result.patient);
            assert.strictEqual(result.patient.id, createdPatientId);
            assert.ok(result.clinicalOverview);
            assert.ok(result.clinicalOverview.currentProcedure);
            assert.strictEqual(result.clinicalOverview.currentProcedure.description, "Porcelain Crown Preparation & Temporary Placement");
            assert.ok(result.clinicalOverview.paymentInformation);
            assert.strictEqual(result.clinicalOverview.paymentInformation.remainingFee, 1800.00);
        });

        it("PUT /patients/:id - updates patient details with validation", async () => {
            const result = await container.updatePatient.execute({
                patientId: createdPatientId,
                name: "Bethlehem Assefa (Updated)",
                age: 27,
                contact: "+251999887766",
                remainingFee: 1500.00,
            });

            assert.strictEqual(result.patient.name, "Bethlehem Assefa (Updated)");
            assert.strictEqual(result.patient.age, 27);
            assert.strictEqual(result.patient.contact, "+251999887766");
            assert.strictEqual(result.patient.remainingFee, 1500.00);
        });

        it("DELETE /patients/:id - soft deletes patient and records audit log", async () => {
            const result = await container.deletePatient.execute({
                patientId: createdPatientId,
                actorUserId: "usr-admin-01",
            });

            assert.strictEqual(result.success, true);
            assert.strictEqual(result.auditLogged, true);

            // Verifying patient is no longer in active query
            const listAfter = await container.getPatients.execute({});
            const found = listAfter.patients.find((p) => p.id === createdPatientId);
            assert.strictEqual(found, undefined);

            // Audit log verification (Task 7)
            const auditLogs = container.patientRepository.getAuditLogs(createdPatientId);
            assert.ok(auditLogs.length > 0);
            assert.strictEqual(auditLogs[0].action, AuditAction.DELETE);
        });
    });

    // ----------------------------------------------------
    // Task 8: Search Patient
    // ----------------------------------------------------
    describe("Task 8: Search Patient Functionality", () => {
        it("searches patients by Name", async () => {
            const result = await container.getPatients.execute({ search: "Abebe" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.ok(p.name.toLowerCase().includes("abebe"));
            });
        });

        it("searches patients by Patient ID", async () => {
            const result = await container.getPatients.execute({ search: "pat-1002" });
            assert.strictEqual(result.patients.length, 1);
            assert.strictEqual(result.patients[0].id, "pat-1002");
        });

        it("searches patients by Service", async () => {
            const result = await container.getPatients.execute({ search: "Implant" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.ok(p.serviceType.toLowerCase().includes("implant"));
            });
        });
    });

    // ----------------------------------------------------
    // Task 9: Filter Patient
    // ----------------------------------------------------
    describe("Task 9: Multi-Facet Patient Filtering", () => {
        it("filters patients by Service", async () => {
            const result = await container.getPatients.execute({ service: "Orthodontics" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.strictEqual(p.serviceType, "Orthodontics");
            });
        });

        it("filters patients by Outstanding Balance (HAS_BALANCE)", async () => {
            const result = await container.getPatients.execute({ outstandingBalance: "HAS_BALANCE" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.ok(Number(p.remainingFee) > 0);
            });
        });

        it("filters patients by Outstanding Balance (PAID / ZERO_BALANCE)", async () => {
            const result = await container.getPatients.execute({ outstandingBalance: "PAID" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.strictEqual(Number(p.remainingFee), 0);
            });
        });

        it("filters patients by Procedure State (ONGOING)", async () => {
            const result = await container.getPatients.execute({ procedureState: "ONGOING" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                const hasOngoing = (p.procedures || []).some((proc) => proc.status === ProcedureStatus.ONGOING);
                assert.ok(hasOngoing);
            });
        });

        it("filters patients by Procedure State (DONE)", async () => {
            const result = await container.getPatients.execute({ procedureState: "DONE" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                const hasDone = (p.procedures || []).some((proc) => proc.status === ProcedureStatus.DONE);
                assert.ok(hasDone);
            });
        });
    });

    // ----------------------------------------------------
    // Tasks 10 & 11: Branch and Dentist Management & Filtering
    // ----------------------------------------------------
    describe("Tasks 10 & 11: Branch and Dentist Management and Filtering", () => {
        it("retrieves all branches and associated dentists", async () => {
            const result = await container.getBranchesAndDentists.execute();
            assert.ok(result.branches.length >= 3);
            assert.ok(result.dentists.length >= 4);

            // Verifies dentist has associated branch
            const firstDentist = result.dentists[0];
            assert.ok(firstDentist.branchId);
            assert.ok(firstDentist.branchName);
        });

        it("filters patients by Branch only", async () => {
            const result = await container.getPatients.execute({ branchId: "br-001" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.strictEqual(p.branchId, "br-001");
            });
        });

        it("filters patients by Dentist only", async () => {
            const result = await container.getPatients.execute({ dentistId: "dent-001" });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.strictEqual(p.dentistId, "dent-001");
            });
        });

        it("filters patients simultaneously by Branch and Dentist", async () => {
            const result = await container.getPatients.execute({
                branchId: "br-001",
                dentistId: "dent-001",
            });
            assert.ok(result.patients.length > 0);
            result.patients.forEach((p) => {
                assert.strictEqual(p.branchId, "br-001");
                assert.strictEqual(p.dentistId, "dent-001");
            });
        });

        it("ensures search works together with Branch and Dentist filters", async () => {
            const result = await container.getPatients.execute({
                search: "Abebe",
                branchId: "br-001",
                dentistId: "dent-001",
            });
            assert.strictEqual(result.patients.length, 1);
            assert.strictEqual(result.patients[0].name, "Abebe Bikila");
        });

        it("returns empty list ('No patients found') when filters yield no matches", async () => {
            const result = await container.getPatients.execute({
                branchId: "br-003",
                dentistId: "dent-001", // dent-001 belongs to br-001, not br-003
            });
            assert.strictEqual(result.patients.length, 0);
        });
    });
});
