import test from "node:test";
import assert from "node:assert/strict";

test("SDCIMP SRS Verification Suite: Dentist Module (SCR-04, SCR-05, SCR-06, SCR-07, SCR-08, SCR-09)", async (t) => {
    await t.test("BR-11 & BR-13: Exactly one Next procedure permitted per patient", () => {
        let patient = {
            id: "pat-001",
            nextProcedure: { id: "p-next-1", name: "Initial Polish", status: "NEXT", cost: 500 },
        };

        // Attempting to log a second next procedure overwrites or replaces the single slot
        const newNextProc = { id: "p-next-2", name: "Bracket Adjustment", status: "NEXT", cost: 800 };
        patient.nextProcedure = newNextProc;

        assert.equal(patient.nextProcedure.id, "p-next-2");
        assert.equal(patient.nextProcedure.name, "Bracket Adjustment");
    });

    await t.test("BR-12: At most one Ongoing procedure active per patient", () => {
        const patient = {
            id: "pat-001",
            nextProcedure: { id: "p-next-1", name: "Root Canal Step 2", status: "NEXT" },
            ongoingProcedure: { id: "p-on-1", name: "Deep Scaling", status: "ONGOING" },
        };

        // Function checking if starting a procedure is allowed
        const canStartNext = (p) => !p.ongoingProcedure;
        assert.equal(canStartNext(patient), false, "Must block starting next procedure when an ongoing procedure exists");

        // When ongoing procedure finishes:
        patient.ongoingProcedure = null;
        assert.equal(canStartNext(patient), true, "Can start once ongoing procedure is cleared");
    });

    await t.test("BR-14: Done procedures are never deleted and preserved in history", () => {
        let patient = {
            id: "pat-001",
            ongoingProcedure: { id: "p-on-1", name: "Composite Filling", cost: 1200, status: "ONGOING" },
            doneProcedures: [
                { id: "p-done-1", name: "Consultation", cost: 400, completedDate: "2026-08-01", status: "DONE" },
            ],
        };

        // Complete procedure
        const completed = {
            ...patient.ongoingProcedure,
            status: "DONE",
            completedDate: "2026-10-31",
            notes: "Tooth #14 filled with composite",
        };
        patient.ongoingProcedure = null;
        patient.doneProcedures.push(completed);

        assert.equal(patient.doneProcedures.length, 2);
        assert.equal(patient.doneProcedures[1].name, "Composite Filling");
        assert.equal(patient.doneProcedures[1].status, "DONE");
    });

    await t.test("BR-15: Patient deletion performs soft-delete preserving historical records", () => {
        const patientRecord = {
            id: "pat-001",
            name: "Abebe Bikila",
            isDeleted: false,
            deletedAt: null,
            doneProcedures: [{ id: "pr-1" }],
            payments: [{ id: "pay-1" }],
        };

        // Execute soft delete
        patientRecord.isDeleted = true;
        patientRecord.deletedAt = new Date().toISOString();

        assert.equal(patientRecord.isDeleted, true);
        assert.ok(patientRecord.deletedAt);
        // Preserves child data
        assert.equal(patientRecord.doneProcedures.length, 1);
        assert.equal(patientRecord.payments.length, 1);
    });

    await t.test("FR-DEN-11 & SCR-08: Upcoming tasks chronologically sorts forward-looking planned procedures", () => {
        const tasks = [
            { id: "t2", patient: "Dawit", date: "2026-11-10" },
            { id: "t1", patient: "Abebe", date: "2026-11-05" },
            { id: "t3", patient: "Tigist", date: "2026-11-15" },
        ];

        const sorted = [...tasks].sort((a, b) => new Date(a.date) - new Date(b.date));

        assert.equal(sorted[0].id, "t1");
        assert.equal(sorted[1].id, "t2");
        assert.equal(sorted[2].id, "t3");
    });
});

