const test = require("node:test");
const assert = require("node:assert/strict");
const MissedAppointmentDetector = require("./src/domain/services/missed.appointment.detector");
const Appointment = require("./src/domain/entities/appointment");
const { AppointmentStatus, ProcedureStatus } = require("./src/domain/enums/enum");

test("MissedAppointmentDetector - Domain Logic Verification", async (t) => {
    const referenceNow = new Date("2026-10-27T12:00:00.000Z");

    await t.test("rule: appointment date passed + no completed visit => MISSED (true)", () => {
        const pastDate = new Date("2026-10-26T10:00:00.000Z");
        const apt = new Appointment({
            appointmentId: "apt-1",
            patientId: "pat-1001",
            appointmentDate: pastDate,
            status: AppointmentStatus.UPCOMING,
        });

        const isMissed = MissedAppointmentDetector.shouldBeMarkedMissed(apt, {
            currentDate: referenceNow,
            completedVisit: false,
            procedureStatus: ProcedureStatus.ONGOING,
        });

        assert.equal(isMissed, true, "Expired upcoming appointment without completed visit must be marked missed");
    });

    await t.test("rule: future appointment => NOT MISSED (false)", () => {
        const futureDate = new Date("2026-10-30T10:00:00.000Z");
        const apt = new Appointment({
            appointmentId: "apt-2",
            patientId: "pat-1001",
            appointmentDate: futureDate,
            status: AppointmentStatus.UPCOMING,
        });

        const isMissed = MissedAppointmentDetector.shouldBeMarkedMissed(apt, {
            currentDate: referenceNow,
            completedVisit: false,
        });

        assert.equal(isMissed, false, "Future appointments cannot be missed");
    });

    await t.test("rule: appointment date passed BUT has completed visit => NOT MISSED (false)", () => {
        const pastDate = new Date("2026-10-25T09:00:00.000Z");
        const apt = new Appointment({
            appointmentId: "apt-3",
            patientId: "pat-1001",
            appointmentDate: pastDate,
            status: AppointmentStatus.UPCOMING,
        });

        const isMissed = MissedAppointmentDetector.shouldBeMarkedMissed(apt, {
            currentDate: referenceNow,
            completedVisit: true,
        });

        assert.equal(isMissed, false, "Appointment with confirmed completed visit is not missed");
    });

    await t.test("rule: appointment date passed BUT linked procedure is DONE => NOT MISSED (false)", () => {
        const pastDate = new Date("2026-10-25T14:00:00.000Z");
        const apt = new Appointment({
            appointmentId: "apt-4",
            patientId: "pat-1001",
            procedureId: "proc-99",
            appointmentDate: pastDate,
            status: AppointmentStatus.UPCOMING,
        });

        const isMissed = MissedAppointmentDetector.shouldBeMarkedMissed(apt, {
            currentDate: referenceNow,
            procedureStatus: ProcedureStatus.DONE,
        });

        assert.equal(isMissed, false, "Appointment whose procedure is completed (DONE) is not missed");
    });

    await t.test("rule: already ATTENDED or CANCELLED appointments are never marked missed", () => {
        const pastDate = new Date("2026-10-20T10:00:00.000Z");
        const attendedApt = new Appointment({
            appointmentId: "apt-5",
            patientId: "pat-1001",
            appointmentDate: pastDate,
            status: AppointmentStatus.ATTENDED,
        });

        const cancelledApt = new Appointment({
            appointmentId: "apt-6",
            patientId: "pat-1001",
            appointmentDate: pastDate,
            status: AppointmentStatus.CANCELLED,
        });

        assert.equal(MissedAppointmentDetector.shouldBeMarkedMissed(attendedApt, { currentDate: referenceNow }), false);
        assert.equal(MissedAppointmentDetector.shouldBeMarkedMissed(cancelledApt, { currentDate: referenceNow }), false);
    });

    await t.test("batch detection: filters and detects all qualifying missed appointments in collection", () => {
        const list = [
            new Appointment({
                appointmentId: "m-1",
                patientId: "pat-1",
                appointmentDate: new Date("2026-10-20"),
                status: AppointmentStatus.UPCOMING,
            }),
            new Appointment({
                appointmentId: "m-2",
                patientId: "pat-2",
                appointmentDate: new Date("2026-10-29"),
                status: AppointmentStatus.UPCOMING,
            }),
            new Appointment({
                appointmentId: "m-3",
                patientId: "pat-3",
                appointmentDate: new Date("2026-10-21"),
                status: AppointmentStatus.CANCELLED,
            }),
            new Appointment({
                appointmentId: "m-4",
                patientId: "pat-4",
                appointmentDate: new Date("2026-10-22"),
                status: AppointmentStatus.UPCOMING,
            }),
        ];

        const detected = MissedAppointmentDetector.detectMissed(list, { currentDate: referenceNow });
        assert.equal(detected.length, 2);
        assert.deepEqual(detected.map((d) => d.id), ["m-1", "m-4"]);
    });
});
