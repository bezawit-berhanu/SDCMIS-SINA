const { describe, it } = require("node:test");
const assert = require("node:assert");

const Procedure = require("./src/domain/entities/procedure");
const { ProcedureStatus, RecordStatus } = require("./src/domain/enums/enum");

describe("Procedure Model - Comprehensive Verification Suite", () => {
    // ----------------------------------------------------
    // 1. Model Structure & Attribute Tree Verification
    // ----------------------------------------------------
    describe("Model Structure: Procedure Tree Verification", () => {
        it("instantiates Procedure with all required tree attributes (ProcedureId, PatientId, Name, Description, Cost, Status, TargetDate, CompletedDate)", () => {
            const target = new Date("2026-11-15T09:00:00Z");
            const completed = new Date("2026-11-15T10:30:00Z");

            const procedure = new Procedure({
                ProcedureId: "proc-001",
                PatientId: "pat-1001",
                Name: "Dental Crown Preparation",
                Description: "Tooth preparation and temporary crown placement for upper molar",
                Cost: 1200.50,
                Status: ProcedureStatus.DONE,
                TargetDate: target,
                CompletedDate: completed,
            });

            // Exact Model Tree Attribute Assertions (PascalCase)
            assert.strictEqual(procedure.ProcedureId, "proc-001");
            assert.strictEqual(procedure.PatientId, "pat-1001");
            assert.strictEqual(procedure.Name, "Dental Crown Preparation");
            assert.strictEqual(procedure.Description, "Tooth preparation and temporary crown placement for upper molar");
            assert.strictEqual(procedure.Cost, 1200.50);
            assert.strictEqual(procedure.Status, ProcedureStatus.DONE);
            assert.deepStrictEqual(procedure.TargetDate, target);
            assert.deepStrictEqual(procedure.CompletedDate, completed);

            // Canonical camelCase Accessors
            assert.strictEqual(procedure.procedureId, "proc-001");
            assert.strictEqual(procedure.id, "proc-001");
            assert.strictEqual(procedure.patientId, "pat-1001");
            assert.strictEqual(procedure.name, "Dental Crown Preparation");
            assert.strictEqual(procedure.description, "Tooth preparation and temporary crown placement for upper molar");
            assert.strictEqual(procedure.cost, 1200.50);
            assert.strictEqual(procedure.status, ProcedureStatus.DONE);
            assert.deepStrictEqual(procedure.targetDate, target);
            assert.deepStrictEqual(procedure.completedDate, completed);
        });

        it("serializes to safe object containing both tree definitions and canonical JSON properties", () => {
            const procedure = new Procedure({
                procedureId: "proc-002",
                patientId: "pat-1002",
                name: "Cavity Restoration",
                description: "Composite filling on premolar occlusal surface",
                cost: 350.00,
                status: ProcedureStatus.ONGOING,
                targetDate: "2026-11-20T14:00:00Z",
                completedDate: null,
            });

            const safe = procedure.toSafeObject();

            assert.strictEqual(safe.ProcedureId, "proc-002");
            assert.strictEqual(safe.procedureId, "proc-002");
            assert.strictEqual(safe.id, "proc-002");

            assert.strictEqual(safe.PatientId, "pat-1002");
            assert.strictEqual(safe.patientId, "pat-1002");

            assert.strictEqual(safe.Name, "Cavity Restoration");
            assert.strictEqual(safe.name, "Cavity Restoration");

            assert.strictEqual(safe.Description, "Composite filling on premolar occlusal surface");
            assert.strictEqual(safe.description, "Composite filling on premolar occlusal surface");

            assert.strictEqual(safe.Cost, 350.00);
            assert.strictEqual(safe.cost, 350.00);

            assert.strictEqual(safe.Status, ProcedureStatus.ONGOING);
            assert.strictEqual(safe.status, ProcedureStatus.ONGOING);

            assert.ok(safe.TargetDate instanceof Date);
            assert.ok(safe.targetDate instanceof Date);

            assert.strictEqual(safe.CompletedDate, null);
            assert.strictEqual(safe.completedDate, null);
        });
    });

    // ----------------------------------------------------
    // 2. Name Attribute Validation
    // ----------------------------------------------------
    describe("Name Attribute Validation", () => {
        it("rejects empty or whitespace-only procedure name", () => {
            assert.throws(() => {
                new Procedure({
                    name: "   ",
                    description: "Valid description",
                });
            }, /Procedure name must contain between 1 and 120 characters/);
        });

        it("rejects procedure name exceeding 120 characters", () => {
            assert.throws(() => {
                new Procedure({
                    name: "A".repeat(125),
                    description: "Valid description",
                });
            }, /Procedure name must contain between 1 and 120 characters/);
        });

        it("gracefully adopts first 120 chars of description as name when name is omitted", () => {
            const procedure = new Procedure({
                description: "Orthodontic Archwire Activation and Bracket Inspection",
            });
            assert.strictEqual(procedure.Name, "Orthodontic Archwire Activation and Bracket Inspection");
            assert.strictEqual(procedure.name, "Orthodontic Archwire Activation and Bracket Inspection");
        });
    });

    // ----------------------------------------------------
    // 3. Description Attribute Validation
    // ----------------------------------------------------
    describe("Description Attribute Validation", () => {
        it("rejects empty description when neither name nor description is provided", () => {
            assert.throws(() => {
                new Procedure({});
            }, /Procedure name must contain between 1 and 120 characters/);
        });

        it("rejects description exceeding 500 characters", () => {
            assert.throws(() => {
                new Procedure({
                    name: "Root Canal",
                    description: "D".repeat(505),
                });
            }, /Procedure description must contain between 1 and 500 characters/);
        });
    });

    // ----------------------------------------------------
    // 4. Cost Attribute Validation
    // ----------------------------------------------------
    describe("Cost Attribute Validation", () => {
        it("formats cost to 2 decimal places and handles string numbers", () => {
            const proc = new Procedure({
                name: "Teeth Cleaning",
                description: "Full mouth ultrasonic prophylaxis",
                cost: "450.758",
            });
            assert.strictEqual(proc.Cost, 450.76);
            assert.strictEqual(proc.cost, 450.76);
        });

        it("rejects negative procedure cost", () => {
            assert.throws(() => {
                new Procedure({
                    name: "Teeth Cleaning",
                    description: "Full mouth ultrasonic prophylaxis",
                    cost: -100,
                });
            }, /Procedure cost cannot be negative/);
        });

        it("rejects non-numeric cost values", () => {
            assert.throws(() => {
                new Procedure({
                    name: "Teeth Cleaning",
                    description: "Full mouth ultrasonic prophylaxis",
                    cost: "invalid-cost",
                });
            }, /Procedure cost cannot be negative/);
        });
    });

    // ----------------------------------------------------
    // 5. Status Attribute & Lifecycle Verification
    // ----------------------------------------------------
    describe("Status Attribute & Lifecycle", () => {
        it("defaults status to NEXT when omitted", () => {
            const proc = new Procedure({
                name: "Dental Examination",
                description: "Routine checkup and bitewing radiographs",
            });
            assert.strictEqual(proc.Status, ProcedureStatus.NEXT);
            assert.strictEqual(proc.status, ProcedureStatus.NEXT);
        });

        it("rejects invalid procedure status", () => {
            assert.throws(() => {
                new Procedure({
                    name: "Dental Examination",
                    description: "Routine checkup",
                    status: "INVALID_STATUS",
                });
            }, /Invalid procedure status/);
        });

        it("transitions procedure status from NEXT to ONGOING (Task 4)", () => {
            const proc = new Procedure({
                name: "Dental Examination",
                description: "Routine checkup and bitewing radiographs",
                status: ProcedureStatus.NEXT,
            });

            assert.strictEqual(proc.isNext(), true);
            assert.strictEqual(proc.isOngoing(), false);

            proc.transitionToOngoing();

            assert.strictEqual(proc.status, ProcedureStatus.ONGOING);
            assert.strictEqual(proc.Status, ProcedureStatus.ONGOING);
            assert.strictEqual(proc.isOngoing(), true);
            assert.strictEqual(proc.isNext(), false);
        });

        it("marks procedure completed and updates CompletedDate (Task 5)", () => {
            const proc = new Procedure({
                name: "Extraction",
                description: "Simple extraction of wisdom tooth",
                status: ProcedureStatus.ONGOING,
            });

            assert.strictEqual(proc.Status, ProcedureStatus.ONGOING);
            assert.strictEqual(proc.CompletedDate, null);
            assert.strictEqual(proc.isDone(), false);

            const completionTime = new Date("2026-10-23T11:00:00Z");
            proc.markCompleted(completionTime);

            assert.strictEqual(proc.Status, ProcedureStatus.DONE);
            assert.strictEqual(proc.status, ProcedureStatus.DONE);
            assert.strictEqual(proc.isDone(), true);
            assert.deepStrictEqual(proc.CompletedDate, completionTime);
            assert.deepStrictEqual(proc.completedDate, completionTime);
        });

        it("prevents transitioning a DONE procedure back to ONGOING", () => {
            const proc = new Procedure({
                name: "Extraction",
                description: "Completed procedure",
                status: ProcedureStatus.DONE,
            });

            assert.throws(() => {
                proc.transitionToOngoing();
            }, /Cannot transition a completed procedure back to ongoing/);
        });
    });

    // ----------------------------------------------------
    // 6. TargetDate and CompletedDate Validation
    // ----------------------------------------------------
    describe("TargetDate and CompletedDate Validation", () => {
        it("parses target date string into valid Date object", () => {
            const proc = new Procedure({
                name: "Gingivectomy",
                description: "Periodontal soft tissue contouring",
                targetDate: "2026-12-10T15:30:00Z",
            });
            assert.ok(proc.TargetDate instanceof Date);
            assert.strictEqual(proc.TargetDate.toISOString(), "2026-12-10T15:30:00.000Z");
        });

        it("rejects invalid target date", () => {
            assert.throws(() => {
                new Procedure({
                    name: "Gingivectomy",
                    description: "Periodontal soft tissue contouring",
                    targetDate: "not-a-valid-date",
                });
            }, /Invalid procedure target date/);
        });

        it("rejects invalid completed date", () => {
            assert.throws(() => {
                new Procedure({
                    name: "Gingivectomy",
                    description: "Periodontal soft tissue contouring",
                    completedDate: "not-a-valid-date",
                });
            }, /Invalid procedure completed date/);
        });
    });
});
