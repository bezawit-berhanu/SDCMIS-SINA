const test = require("node:test");
const assert = require("node:assert/strict");
const container = require("./src/container/container");
const QueueEntry = require("./src/domain/entities/queue.entry");
const { QueueStatus } = require("./src/domain/enums/enum");

test("Task 4: Customer Queue Position Resolution Unit & Integration Tests", async (t) => {
    const { queueRepository, getCustomerQueuePosition } = container;

    await t.test("Calculates correct sequential position for WAITING customer (#007, Position: 2)", async () => {
        const today = new Date();
        queueRepository.queue = [
            new QueueEntry({
                queueEntryId: "que-005",
                patientId: "pat-serving",
                patientName: "Serving Patient",
                queueNumber: 5,
                status: QueueStatus.SERVING,
                queueDate: today,
            }),
            new QueueEntry({
                queueEntryId: "que-006",
                patientId: "pat-ahead",
                patientName: "Patient Ahead",
                queueNumber: 6,
                status: QueueStatus.WAITING,
                queueDate: today,
            }),
            new QueueEntry({
                queueEntryId: "que-007",
                patientId: "pat-customer-007",
                patientName: "Target Customer",
                queueNumber: 7,
                status: QueueStatus.WAITING,
                queueDate: today,
            }),
        ];

        const result = await getCustomerQueuePosition.execute("pat-customer-007");

        assert.equal(result.inQueue, true);
        assert.equal(result.queueNumber, 7);
        assert.equal(result.formattedQueueNumber, "#007");
        assert.equal(result.position, 2, "Customer #007 should be 2nd in waiting line");
        assert.equal(result.status, QueueStatus.WAITING);

        // Verify exact display fields required by prompt
        assert.equal(result.display.ticket, "#007");
        assert.equal(result.display.position, 2);
        assert.equal(result.display.status, "WAITING");
    });

    await t.test("Position shifts to 1 when preceding patient is served", async () => {
        const item6 = queueRepository.queue.find((q) => q.queueNumber === 6);
        item6.status = QueueStatus.SERVING;

        const result = await getCustomerQueuePosition.execute("pat-customer-007");
        assert.equal(result.position, 1, "Customer #007 is now next in line (Position: 1)");
        assert.equal(result.status, QueueStatus.WAITING);
    });

    await t.test("Status changes to SERVING when receptionist calls customer", async () => {
        const item7 = queueRepository.queue.find((q) => q.queueNumber === 7);
        item7.status = QueueStatus.SERVING;
        item7.dentistName = "Dr. Sara";

        const result = await getCustomerQueuePosition.execute("pat-customer-007");
        assert.equal(result.status, QueueStatus.SERVING);
        assert.equal(result.position, 0);
        assert.equal(result.positionText, "Now Serving");
        assert.equal(result.dentist, "Dr. Sara");
    });

    await t.test("Returns inQueue: false when patient is not in queue", async () => {
        const result = await getCustomerQueuePosition.execute("pat-unknown-999");
        assert.equal(result.inQueue, false);
        assert.equal(result.position, null);
    });
});
