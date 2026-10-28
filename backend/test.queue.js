const test = require("node:test");
const assert = require("node:assert/strict");
const QueueEntry = require("./src/domain/entities/queue.entry");
const { QueueStatus } = require("./src/domain/enums/enum");

test("QueueEntry Entity - Model Tree Definition & Lifecycle", async (t) => {
    await t.test("successfully creates a QueueEntry with all defined model tree attributes", () => {
        const checkIn = new Date("2026-10-28T09:00:00.000Z");
        const entry = new QueueEntry({
            queueEntryId: "que-001",
            patientId: "pat-1001",
            queueNumber: 1,
            status: QueueStatus.WAITING,
            checkInTime: checkIn,
            dentistId: "usr-dentist-01",
            dentistName: "Dr. Sara",
            patientName: "Abebe Kebede",
            serviceType: "Routine Dental Cleaning",
        });

        // 1) Queue Model Tree Check
        assert.equal(entry.queueEntryId, "que-001");
        assert.equal(entry.id, "que-001");
        assert.equal(entry.patientId, "pat-1001");
        assert.equal(entry.queueNumber, 1);
        assert.equal(entry.status, QueueStatus.WAITING);
        assert.equal(entry.checkInTime.getTime(), checkIn.getTime());
        assert.equal(entry.calledTime, null);
        assert.equal(entry.completedTime, null);
        assert.equal(entry.formattedQueueNumber, "#001");

        const safeObj = entry.toSafeObject();
        assert.equal(safeObj.queueEntryId, "que-001");
        assert.equal(safeObj.patientId, "pat-1001");
        assert.equal(safeObj.queueNumber, 1);
        assert.equal(safeObj.formattedQueueNumber, "#001");
        assert.equal(safeObj.status, QueueStatus.WAITING);
        assert.equal(safeObj.calledTime, null);
        assert.equal(safeObj.completedTime, null);
    });

    await t.test("formats queue number with 3 digits padding (#001, #002, #003, #004)", () => {
        const e1 = new QueueEntry({ patientId: "pat-1", queueNumber: 1 });
        const e2 = new QueueEntry({ patientId: "pat-2", queueNumber: 2 });
        const e3 = new QueueEntry({ patientId: "pat-3", queueNumber: 3 });
        const e4 = new QueueEntry({ patientId: "pat-4", queueNumber: 4 });
        const e100 = new QueueEntry({ patientId: "pat-5", queueNumber: 100 });

        assert.equal(e1.formattedQueueNumber, "#001");
        assert.equal(e2.formattedQueueNumber, "#002");
        assert.equal(e3.formattedQueueNumber, "#003");
        assert.equal(e4.formattedQueueNumber, "#004");
        assert.equal(e100.formattedQueueNumber, "#100");
    });

    await t.test("throws error when patientId is missing", () => {
        assert.throws(() => {
            new QueueEntry({ queueNumber: 1 });
        }, /PatientId is required/);
    });

    await t.test("throws error when status is invalid", () => {
        assert.throws(() => {
            new QueueEntry({
                patientId: "pat-1001",
                status: "UNKNOWN_STATUS",
            });
        }, /Invalid queue status/);
    });

    await t.test("throws error when queueNumber is negative or zero", () => {
        assert.throws(() => {
            new QueueEntry({
                patientId: "pat-1001",
                queueNumber: 0,
            });
        }, /QueueNumber must be a positive integer/);

        assert.throws(() => {
            new QueueEntry({
                patientId: "pat-1001",
                queueNumber: -5,
            });
        }, /QueueNumber must be a positive integer/);
    });

    await t.test("throws error when checkInTime format is invalid", () => {
        assert.throws(() => {
            new QueueEntry({
                patientId: "pat-1001",
                checkInTime: "invalid-time-string",
            });
        }, /Invalid check-in time format/);
    });

    await t.test("lifecycle: transitions WAITING -> SERVING on call() and records calledTime", () => {
        const entry = new QueueEntry({
            queueEntryId: "que-003",
            patientId: "pat-1003",
            queueNumber: 3,
            status: QueueStatus.WAITING,
        });

        assert.equal(entry.status, QueueStatus.WAITING);
        assert.equal(entry.isWaiting(), true);
        assert.equal(entry.isServing(), false);

        entry.call("usr-dentist-01", "Dr. Sara");

        assert.equal(entry.status, QueueStatus.SERVING);
        assert.equal(entry.isWaiting(), false);
        assert.equal(entry.isServing(), true);
        assert.ok(entry.calledTime instanceof Date);
        assert.equal(entry.dentistId, "usr-dentist-01");
        assert.equal(entry.dentistName, "Dr. Sara");
    });

    await t.test("lifecycle: transitions SERVING -> DONE on complete() and records completedTime", () => {
        const entry = new QueueEntry({
            queueEntryId: "que-002",
            patientId: "pat-1002",
            queueNumber: 2,
            status: QueueStatus.SERVING,
            calledTime: new Date(),
        });

        assert.equal(entry.status, QueueStatus.SERVING);
        assert.equal(entry.isDone(), false);

        entry.complete();

        assert.equal(entry.status, QueueStatus.DONE);
        assert.equal(entry.isServing(), false);
        assert.equal(entry.isDone(), true);
        assert.ok(entry.completedTime instanceof Date);
    });

    await t.test("lifecycle guard: prevents calling already DONE queue entry", () => {
        const entry = new QueueEntry({
            queueEntryId: "que-001",
            patientId: "pat-1001",
            queueNumber: 1,
            status: QueueStatus.DONE,
        });

        assert.throws(() => {
            entry.call();
        }, /Cannot call a patient whose visit is already DONE/);
    });

    await t.test("lifecycle guard: prevents completing already DONE queue entry", () => {
        const entry = new QueueEntry({
            queueEntryId: "que-001",
            patientId: "pat-1001",
            queueNumber: 1,
            status: QueueStatus.DONE,
        });

        assert.throws(() => {
            entry.complete();
        }, /already completed/);
    });
});
