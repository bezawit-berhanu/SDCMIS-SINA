const { describe, it } = require("node:test");
const assert = require("node:assert");
const patientRepository = require("./src/Infrastructure/Repositories/patient.repository");
const QueueRepository = require("./src/Infrastructure/Repositories/queue.repository");
const AppointmentRepository = require("./src/Infrastructure/Repositories/appointment.repository");
const NotificationRepository = require("./src/Infrastructure/Repositories/notification.repository");

describe("Backend Repository Cold Boot Zero State Test Suite", () => {
    it("PatientRepository initializes with zero patients on cold boot", async () => {
        assert.ok(Array.isArray(patientRepository.patients), "patients must be an array");
        assert.strictEqual(patientRepository.patients.length, 0, "Initial patient array must have length 0");
        const list = await patientRepository.findAll();
        assert.strictEqual(list.length, 0, "findAll must return empty array when no patients are created");
    });

    it("QueueRepository initializes with zero tickets on cold boot", async () => {
        const repo = new QueueRepository();
        assert.ok(Array.isArray(repo.queue), "queue must be an array");
        assert.strictEqual(repo.queue.length, 0, "Initial queue array must have length 0");
        const queueList = await repo.findTodayQueue();
        assert.strictEqual(queueList.length, 0, "findTodayQueue must return empty array initially");
    });

    it("AppointmentRepository initializes with zero appointments on cold boot", async () => {
        const repo = new AppointmentRepository();
        assert.ok(Array.isArray(repo.appointments), "appointments must be an array");
        assert.strictEqual(repo.appointments.length, 0, "Initial appointments array must have length 0");
        const list = await repo.findAll();
        assert.strictEqual(list.length, 0, "findAll must return empty array initially");
    });

    it("NotificationRepository initializes with zero notifications on cold boot", async () => {
        const repo = new NotificationRepository();
        assert.ok(Array.isArray(repo.notifications), "notifications must be an array");
        assert.strictEqual(repo.notifications.length, 0, "Initial notifications array must have length 0");
        const list = await repo.findByRecipientId("usr-dentist-01");
        assert.strictEqual(list.length, 0, "findByRecipientId must return empty array initially");
    });
});
