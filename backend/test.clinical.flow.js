const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const Procedure = require("./src/domain/entities/procedure");
const { ProcedureStatus } = require("./src/domain/enums/enum");

/**
 * 3) Clinical Testing Suite
 * Tests:
 * NEXT
 *  ↓
 * ONGOING
 *  ↓
 * DONE
 */
describe("3) Clinical Testing Suite — Procedure Lifecycle Flow", () => {
    let procedure;
    const testPatientId = "pat-clinical-001";

    it("3.1 Initial Clinical State: Procedure starts in NEXT status", () => {
        procedure = new Procedure({
            ProcedureId: "proc-cl-101",
            PatientId: testPatientId,
            Name: "Root Canal Therapy (Molar)",
            Description: "Endodontic access and canal instrumentation",
            Cost: 1500.00,
            TargetDate: new Date(),
        });

        assert.equal(procedure.status, ProcedureStatus.NEXT);
        assert.equal(procedure.isNext(), true);
        assert.equal(procedure.isOngoing(), false);
        assert.equal(procedure.isDone(), false);
        assert.equal(procedure.completedDate, null);
    });

    it("3.2 Transition to ONGOING: Procedure advances NEXT -> ONGOING", () => {
        procedure.transitionToOngoing();

        assert.equal(procedure.status, ProcedureStatus.ONGOING);
        assert.equal(procedure.isNext(), false);
        assert.equal(procedure.isOngoing(), true);
        assert.equal(procedure.isDone(), false);
        assert.equal(procedure.completedDate, null);
    });

    it("3.3 Transition to DONE: Procedure completes ONGOING -> DONE and sets CompletedDate", () => {
        const completedAt = new Date();
        procedure.markCompleted(completedAt);

        assert.equal(procedure.status, ProcedureStatus.DONE);
        assert.equal(procedure.isNext(), false);
        assert.equal(procedure.isOngoing(), false);
        assert.equal(procedure.isDone(), true);
        assert.deepEqual(procedure.completedDate, completedAt);
        assert.deepEqual(procedure.CompletedDate, completedAt);
    });

    it("3.4 Terminal State Integrity: Completed procedure cannot be reverted to ONGOING", () => {
        assert.throws(
            () => {
                procedure.transitionToOngoing();
            },
            /Cannot transition a completed procedure back to ongoing/i
        );
        assert.equal(procedure.status, ProcedureStatus.DONE);
    });
});
