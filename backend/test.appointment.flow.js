const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const Appointment = require("./src/domain/entities/appointment");
const MissedAppointmentDetector = require("./src/domain/services/missed.appointment.detector");
const { AppointmentStatus, ProcedureStatus } = require("./src/domain/enums/enum");

/**
 * 5) Appointment Testing Suite
 * Tests:
 * - Upcoming appointments
 * - Missed appointments
 * - Scheduler (detection logic)
 * - Rescheduling
 */
describe("5) Appointment Testing Suite — Schedule & Missed Visits", () => {
    const patientId = "pat-apt-101";
    const dentistId = "usr-dentist-01";
    let appointment;

    it("5.1 Upcoming Appointments: Successfully books and initializes appointment in UPCOMING status", () => {
        const appointmentDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days in future
        appointment = new Appointment({
            appointmentId: "apt-upc-01",
            patientId,
            dentistId,
            appointmentDate,
            status: AppointmentStatus.UPCOMING,
            notes: "Routine examination and prophylaxis",
        });

        assert.equal(appointment.status, AppointmentStatus.UPCOMING);
        assert.equal(appointment.isMissed(new Date()), false, "Future appointment must not be missed");
        assert.equal(appointment.patientId, patientId);
    });

    it("5.2 Missed Appointments: Identifies expired past appointment with no completed visit", () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        const pastAppointment = new Appointment({
            appointmentId: "apt-miss-01",
            patientId,
            dentistId,
            appointmentDate: pastDate,
            status: AppointmentStatus.UPCOMING,
        });

        const shouldMarkMissed = MissedAppointmentDetector.shouldBeMarkedMissed(pastAppointment, {
            currentDate: new Date(),
            completedVisit: false,
        });

        assert.equal(shouldMarkMissed, true, "Past unvisited appointment must be flagged as missed");
        pastAppointment.markMissed();
        assert.equal(pastAppointment.status, AppointmentStatus.MISSED);
    });

    it("5.3 Scheduler: Correctly filters attended visits so they are never marked missed", () => {
        const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const attendedAppointment = new Appointment({
            appointmentId: "apt-att-01",
            patientId,
            appointmentDate: pastDate,
            status: AppointmentStatus.UPCOMING,
        });

        // Patient completed clinical visit
        const shouldMarkMissed = MissedAppointmentDetector.shouldBeMarkedMissed(attendedAppointment, {
            currentDate: new Date(),
            completedVisit: true,
        });

        assert.equal(shouldMarkMissed, false, "Attended appointment with confirmed visit must not be marked missed");
    });

    it("5.4 Rescheduling: Reschedules MISSED appointment back to UPCOMING with audit trail", () => {
        const missedApt = new Appointment({
            appointmentId: "apt-resched-01",
            patientId,
            appointmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: AppointmentStatus.MISSED,
            notes: "Missed appointment",
        });

        const rescheduledDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
        missedApt.reschedule(rescheduledDate, "Rescheduled after patient called clinic");

        assert.equal(missedApt.status, AppointmentStatus.UPCOMING);
        assert.deepEqual(missedApt.appointmentDate, rescheduledDate);
        assert.ok(missedApt.notes.includes("Rescheduled from"));
        assert.ok(missedApt.notes.includes("Rescheduled after patient called clinic"));
    });
});
