const test = require("node:test");
const assert = require("node:assert/strict");
const container = require("./src/container/container");
const QueueEntry = require("./src/domain/entities/queue.entry");
const { QueueStatus } = require("./src/domain/enums/enum");

test("Task 5: Live Queue Updates — WAITING -> SERVING Transition", async (t) => {
    const { queueRepository, callCustomer, realtimeGateway, getCustomerQueuePosition } = container;

    await t.test("Customer receives live status update (WAITING -> SERVING) when receptionist calls patient", async () => {
        // Step 1: Initialize patient in queue with WAITING status
        const today = new Date();
        const testEntry = new QueueEntry({
            queueEntryId: "que-live-007",
            patientId: "pat-live-customer",
            patientName: "Dawit Customer",
            queueNumber: 7,
            status: QueueStatus.WAITING,
            queueDate: today,
        });

        // Add to in-memory queue
        queueRepository.queue = queueRepository.queue.filter((q) => q.id !== "que-live-007");
        queueRepository.queue.push(testEntry);

        // Verify initial state: WAITING
        const initialPosition = await getCustomerQueuePosition.execute("pat-live-customer");
        assert.equal(initialPosition.status, QueueStatus.WAITING);
        assert.equal(initialPosition.formattedQueueNumber, "#007");

        // Step 2: Customer browser attaches live listener on Realtime Gateway
        let liveUpdateEvent = null;
        const liveListener = (payload) => {
            if (payload.patientId === "pat-live-customer" || payload.formattedQueueNumber === "#007") {
                liveUpdateEvent = payload;
            }
        };
        realtimeGateway.on("QUEUE_STATUS_CHANGED", liveListener);

        // Step 3: Receptionist clicks CALL on patient #007
        const callResult = await callCustomer.execute({
            queueEntryId: "que-live-007",
            dentistId: "usr-dentist-01",
            dentistName: "Dr. Sara",
        });

        assert.equal(callResult.success, true);
        assert.equal(callResult.queueEntry.status, QueueStatus.SERVING);

        // Step 4: Verify real-time event was received by customer client
        assert.ok(liveUpdateEvent, "Customer must receive live QUEUE_STATUS_CHANGED broadcast");
        assert.equal(liveUpdateEvent.previousStatus, QueueStatus.WAITING);
        assert.equal(liveUpdateEvent.newStatus, QueueStatus.SERVING);
        assert.equal(liveUpdateEvent.formattedQueueNumber, "#007");
        assert.equal(liveUpdateEvent.dentist, "Dr. Sara");

        // Step 5: Verify customer's queue position now reflects SERVING
        const updatedPosition = await getCustomerQueuePosition.execute("pat-live-customer");
        assert.equal(updatedPosition.status, QueueStatus.SERVING);
        assert.equal(updatedPosition.positionText, "Now Serving");

        // Cleanup
        realtimeGateway.off("QUEUE_STATUS_CHANGED", liveListener);
    });

    t.after(() => {
        setTimeout(() => process.exit(0), 100);
    });
});
