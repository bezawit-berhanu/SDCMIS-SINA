const test = require("node:test");
const assert = require("node:assert/strict");
const Appointment = require("./src/domain/entities/appointment");
const { AppointmentStatus } = require("./src/domain/enums/enum");

test("Appointment Entity - Model Tree Definition & Lifecycle", async (t) => {
    await t.test("successfully creates an Appointment with all defined model tree attributes", () => {
        const targetDate = new Date("2026-11-15T10:00:00.000Z");
        const apt = new Appointment({
            appointmentId: "apt-101",
            patientId: "pat-1001",
            procedureId: "proc-501",
            appointmentDate: targetDate,
            status: AppointmentStatus.UPCOMING,
            notes: "Initial consultation and dental imaging",
        });

        assert.equal(apt.appointmentId, "apt-101");
        assert.equal(apt.id, "apt-101");
        assert.equal(apt.patientId, "pat-1001");
        assert.equal(apt.procedureId, "proc-501");
        assert.equal(apt.appointmentDate.getTime(), targetDate.getTime());
        assert.equal(apt.status, AppointmentStatus.UPCOMING);
        assert.equal(apt.notes, "Initial consultation and dental imaging");

        const safeObj = apt.toSafeObject();
        assert.equal(safeObj.appointmentId, "apt-101");
        assert.equal(safeObj.patientId, "pat-1001");
        assert.equal(safeObj.procedureId, "proc-501");
        assert.equal(safeObj.status, AppointmentStatus.UPCOMING);
        assert.equal(safeObj.notes, "Initial consultation and dental imaging");
    });

    await t.test("throws error when patientId is missing", () => {
        assert.throws(() => {
            new Appointment({
                procedureId: "proc-501",
                appointmentDate: new Date(),
            });
        }, /PatientId is required/);
    });

    await t.test("throws error when status is invalid", () => {
        assert.throws(() => {
            new Appointment({
                patientId: "pat-1001",
                status: "NOT_A_VALID_STATUS",
            });
        }, /Invalid appointment status/);
    });

    await t.test("throws error when appointmentDate is invalid format", () => {
        assert.throws(() => {
            new Appointment({
                patientId: "pat-1001",
                appointmentDate: "invalid-date-string",
            });
        }, /Invalid appointment date format/);
    });

    await t.test("lifecycle: marks appointment as MISSED", () => {
        const apt = new Appointment({
            patientId: "pat-1001",
            appointmentDate: new Date("2026-10-01"),
            status: AppointmentStatus.UPCOMING,
        });

        apt.markMissed();
        assert.equal(apt.status, AppointmentStatus.MISSED);
    });

    await t.test("lifecycle: marks appointment as ATTENDED", () => {
        const apt = new Appointment({
            patientId: "pat-1001",
            appointmentDate: new Date(),
            status: AppointmentStatus.UPCOMING,
        });

        apt.markAttended();
        assert.equal(apt.status, AppointmentStatus.ATTENDED);
    });

    await t.test("lifecycle: cancels appointment with reason", () => {
        const apt = new Appointment({
            patientId: "pat-1001",
            appointmentDate: new Date("2026-12-01"),
            status: AppointmentStatus.UPCOMING,
            notes: "Routine checkup",
        });

        apt.cancel("Patient requested cancellation due to travel");
        assert.equal(apt.status, AppointmentStatus.CANCELLED);
        assert.ok(apt.notes.includes("Cancellation Reason: Patient requested cancellation due to travel"));
    });

    await t.test("lifecycle: reschedules MISSED appointment back to UPCOMING with new date", () => {
        const originalDate = new Date("2026-10-10T09:00:00.000Z");
        const apt = new Appointment({
            patientId: "pat-1001",
            appointmentDate: originalDate,
            status: AppointmentStatus.MISSED,
            notes: "Missed appointment",
        });

        const newDate = new Date("2026-11-20T14:30:00.000Z");
        apt.reschedule(newDate, "Rescheduled by Dentist Dr. Sara");

        assert.equal(apt.status, AppointmentStatus.UPCOMING);
        assert.equal(apt.appointmentDate.getTime(), newDate.getTime());
        assert.ok(apt.notes.includes("Rescheduled from"));
        assert.ok(apt.notes.includes("Rescheduled by Dentist Dr. Sara"));
    });

    await t.test("detection: isMissed correctly identifies passed dates", () => {
        const pastDate = new Date("2026-10-01T10:00:00.000Z");
        const futureDate = new Date("2026-12-01T10:00:00.000Z");
        const evaluationTime = new Date("2026-10-27T12:00:00.000Z");

        const pastApt = new Appointment({
            patientId: "pat-1001",
            appointmentDate: pastDate,
            status: AppointmentStatus.UPCOMING,
        });

        const futureApt = new Appointment({
            patientId: "pat-1001",
            appointmentDate: futureDate,
            status: AppointmentStatus.UPCOMING,
        });

        assert.equal(pastApt.isMissed(evaluationTime), true);
        assert.equal(futureApt.isMissed(evaluationTime), false);

        pastApt.markAttended();
        assert.equal(pastApt.isMissed(evaluationTime), false, "Attended appointments should never be missed");
    });
});
