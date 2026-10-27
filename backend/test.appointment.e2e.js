const test = require("node:test");
const assert = require("node:assert/strict");
const container = require("./src/container/container");
const { AppointmentStatus, ProcedureStatus } = require("./src/domain/enums/enum");

test("Appointment & Clinical Scheduling Sprint - Comprehensive E2E Verification", async (t) => {
    let testPatientId = "pat-1001";
    let testProcedureId = null;
    let createdAppointmentId = null;

    await t.test("Task 1: Appointment Entity Model Tree", async () => {
        const apt = await container.createAppointment.execute({
            patientId: testPatientId,
            appointmentDate: new Date(Date.now() + 3 * 86400000), // 3 days ahead
            status: "UPCOMING",
            notes: "Routine checkup and clinical scaling session",
        }, { id: "usr-doc-1", fullName: "Dr. Sara" });

        assert.ok(apt.id || apt.appointmentId, "Appointment must have an AppointmentId");
        assert.equal(apt.patientId, testPatientId);
        assert.ok(apt.appointmentDate, "Appointment must have an AppointmentDate");
        assert.equal(apt.status, "UPCOMING");
        assert.equal(apt.notes, "Routine checkup and clinical scaling session");

        createdAppointmentId = apt.id || apt.appointmentId;
    });

    await t.test("Task 2: Appointment CRUD - Read, Update, Cancel, Reschedule", async () => {
        // Read
        const found = await container.getAppointmentById.execute(createdAppointmentId);
        assert.ok(found);
        assert.equal(found.patientId, testPatientId);

        // Update
        const updated = await container.updateAppointment.execute(createdAppointmentId, {
            notes: "Updated clinical notes: Patient confirmed arrival time",
        });
        assert.equal(updated.notes, "Updated clinical notes: Patient confirmed arrival time");

        // Cancel
        const cancelled = await container.cancelAppointment.execute(createdAppointmentId, {
            reason: "Patient had personal scheduling emergency",
        });
        assert.equal(cancelled.status, "CANCELLED");
        assert.ok(cancelled.notes.includes("Cancellation Reason: Patient had personal scheduling emergency"));
    });

    await t.test("Task 3: Upcoming Tasks - Dashboard Displays Patient, Procedure, Appointment Date, Status", async () => {
        const upcomingList = await container.getAppointments.execute({ view: "upcoming" });
        assert.ok(Array.isArray(upcomingList));

        if (upcomingList.length > 0) {
            const first = upcomingList[0];
            assert.ok(first.patientName, "Upcoming task must display Patient name");
            assert.ok(first.appointmentDate, "Upcoming task must display Appointment Date");
            assert.ok(first.status === "UPCOMING", "Upcoming task status must be UPCOMING");
            assert.ok(first.procedureName !== undefined, "Upcoming task must display Procedure");
        }
    });

    await t.test("Task 5: Scheduler Periodic Process Execution", async () => {
        const res = await container.detectAndSyncMissedAppointments.execute();
        assert.ok(typeof res.updatedCount === "number", "Scheduler should return count of updated missed appointments");
        assert.ok(typeof res.totalMissed === "number", "Scheduler should report total missed count");
        assert.ok(res.checkedAt, "Scheduler should timestamp the execution");
    });

    await t.test("Task 6: Missed Appointment Detection Logic (Date Passed + No Completed Visit -> Missed)", async () => {
        // Create an appointment scheduled in the past without completed visit
        const pastDate = new Date(Date.now() - 2 * 86400000); // 2 days ago
        const pastApt = await container.createAppointment.execute({
            patientId: testPatientId,
            appointmentDate: pastDate,
            status: "UPCOMING",
            notes: "Target session for restorative filling",
        });

        // Trigger detection
        const syncResult = await container.detectAndSyncMissedAppointments.execute({ currentDate: new Date() });
        const refreshedApt = await container.getAppointmentById.execute(pastApt.id);

        assert.equal(refreshedApt.status, "MISSED", "Passed appointment without completed visit must transition to MISSED");
    });

    await t.test("Task 7: Rescheduling (Dentist Selects New Appointment Date -> Missed transitions to Upcoming)", async () => {
        // Find a missed appointment
        const missedList = await container.getAppointments.execute({ view: "missed" });
        assert.ok(missedList.length > 0, "Should have at least one missed appointment to reschedule");

        const targetMissed = missedList[0];
        const newFutureDate = new Date(Date.now() + 7 * 86400000); // 1 week ahead

        const rescheduled = await container.rescheduleAppointment.execute(
            targetMissed.id,
            { newAppointmentDate: newFutureDate, notes: "Rescheduled after phone confirmation" },
            { id: "usr-dentist-01", fullName: "Dr. Sara (Dentist)" }
        );

        assert.equal(rescheduled.status, "UPCOMING", "Rescheduling must transition status from MISSED to UPCOMING");
        assert.equal(new Date(rescheduled.appointmentDate).getTime(), newFutureDate.getTime());
        assert.ok(rescheduled.notes.includes("Rescheduled by Dr. Sara (Dentist)"));
    });

    await t.test("Task 8: Missed Appointment Screen Data (Patient, Procedure, Original appointment, Missed status)", async () => {
        const missedAppointments = await container.getAppointments.execute({ view: "missed" });
        assert.ok(Array.isArray(missedAppointments));

        for (const m of missedAppointments) {
            assert.ok(m.patientName, "Screen must display Patient name");
            assert.ok(m.appointmentDate, "Screen must display Original appointment date");
            assert.equal(m.status, "MISSED", "Screen must display Missed status");
            assert.ok(m.procedureName !== undefined, "Screen must display Procedure name");
        }
    });

    await t.test("Task 9: Integration Chain (Patient -> Procedure -> Appointment -> Missed -> Rescheduled)", async () => {
        // Step 1: Patient exists
        const patient = await container.patientRepository.findById("pat-1002");
        assert.ok(patient, "Patient must exist");

        // Step 2: Create a Next Procedure for Patient
        let procedure = null;
        try {
            procedure = await container.createNextProcedure.execute({
                patientId: patient.id,
                name: "Crown Preparation",
                description: "Preparation of second molar for zirconia crown",
                cost: 350.00,
                targetDate: new Date(Date.now() + 10 * 86400000),
            });
        } catch (_) {
            const list = await container.procedureRepository.findByPatientId(patient.id);
            procedure = list[0];
        }
        assert.ok(procedure, "Procedure must be linked");

        // Step 3: Book Appointment for this procedure in the past
        const pastAppointmentDate = new Date(Date.now() - 3600000); // 1 hour ago
        const appointment = await container.createAppointment.execute({
            patientId: patient.id,
            procedureId: procedure.id,
            appointmentDate: pastAppointmentDate,
            status: "UPCOMING",
            notes: "Integration chain test appointment",
        });
        assert.equal(appointment.procedureId, procedure.id);

        // Step 4: Missed Detection triggers
        await container.detectAndSyncMissedAppointments.execute({ currentDate: new Date() });
        const evaluated = await container.getAppointmentById.execute(appointment.id);
        assert.equal(evaluated.status, "MISSED", "Chain step: Unattended past appointment becomes MISSED");

        // Step 5: Reschedule by Dentist to future date
        const futureDate = new Date(Date.now() + 4 * 86400000);
        const finalRescheduled = await container.rescheduleAppointment.execute(
            evaluated.id,
            { newAppointmentDate: futureDate, notes: "Follow-up crown fitting confirmed" },
            { id: "usr-dentist-1", fullName: "Dr. Sara" }
        );

        assert.equal(finalRescheduled.status, "UPCOMING", "Chain step: Final state is rescheduled UPCOMING");
        assert.equal(new Date(finalRescheduled.appointmentDate).getTime(), futureDate.getTime());
    });
});
