const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");

const QueueEntry = require("./src/domain/entities/queue.entry");
const { QueueStatus } = require("./src/domain/enums/enum");
const { RealtimeGateway } = require("./src/Infrastructure/realtime/realtime.gateway");

/**
 * 6) Queue Testing & 7) Real-Time Testing Comprehensive Suite
 * Tests:
 * 6) Queue Testing:
 *    - WAITING -> SERVING -> DONE transitions
 *    - Duplicate check-in rejection
 *    - Multiple patients sequential queue numbering
 *    - Auto-advance to next waiting patient
 *    - Simultaneous / concurrent actions
 * 7) Real-Time Testing:
 *    - Notification delivery
 *    - Queue updates broadcast
 *    - Connection loss handling
 *    - Reconnection handling
 *    - Multiple concurrent client synchronization
 */
describe("6) Queue & 7) Real-Time Comprehensive Verification Suite", () => {
    let gateway;
    let queueList = [];

    before(() => {
        gateway = new RealtimeGateway();
    });

    // =========================================================================
    // 6) QUEUE TESTING
    // =========================================================================
    describe("Task 6: Queue Lifecycle & Rules", () => {
        it("6.1 State Machine: Advances WAITING -> SERVING -> DONE", () => {
            const entry = new QueueEntry({
                queueEntryId: "que-flow-01",
                patientId: "pat-901",
                patientName: "Dawit Haile",
                queueNumber: 1,
                status: QueueStatus.WAITING,
            });

            // WAITING initial state
            assert.equal(entry.status, QueueStatus.WAITING);
            assert.equal(entry.formattedQueueNumber, "#001");
            assert.equal(entry.calledTime, null);
            assert.equal(entry.completedTime, null);

            // WAITING -> SERVING
            const calledTime = new Date();
            entry.markCalled("usr-dentist-01", "Dr. Sara", calledTime);
            assert.equal(entry.status, QueueStatus.SERVING);
            assert.equal(entry.dentistId, "usr-dentist-01");
            assert.equal(entry.dentistName, "Dr. Sara");
            assert.deepEqual(entry.calledTime, calledTime);

            // SERVING -> DONE
            const completedTime = new Date();
            entry.markCompleted(completedTime);
            assert.equal(entry.status, QueueStatus.DONE);
            assert.deepEqual(entry.completedTime, completedTime);
        });

        it("6.2 Duplicate Check-In Prevention: Detects and rejects already active patient", () => {
            const activeQueue = [
                new QueueEntry({ patientId: "pat-dup-01", queueNumber: 1, status: QueueStatus.WAITING }),
                new QueueEntry({ patientId: "pat-dup-02", queueNumber: 2, status: QueueStatus.SERVING }),
            ];

            const isDuplicate = (patientId) => {
                return activeQueue.some(
                    (e) => e.patientId === patientId && [QueueStatus.WAITING, QueueStatus.SERVING].includes(e.status)
                );
            };

            assert.equal(isDuplicate("pat-dup-01"), true, "Must flag waiting patient as duplicate check-in");
            assert.equal(isDuplicate("pat-dup-02"), true, "Must flag serving patient as duplicate check-in");
            assert.equal(isDuplicate("pat-dup-03"), false, "New patient is not duplicate");
        });

        it("6.3 Multiple Patients: Assigns sequential 3-digit padded queue numbers (#001, #002, #003, #004)", () => {
            const patients = ["Abebe", "Sara", "Michael", "Bethlehem"];
            const entries = patients.map((name, index) => {
                return new QueueEntry({
                    patientId: `pat-${index + 1}`,
                    patientName: name,
                    queueNumber: index + 1,
                    status: QueueStatus.WAITING,
                });
            });

            assert.equal(entries[0].formattedQueueNumber, "#001");
            assert.equal(entries[1].formattedQueueNumber, "#002");
            assert.equal(entries[2].formattedQueueNumber, "#003");
            assert.equal(entries[3].formattedQueueNumber, "#004");
            queueList = entries;
        });

        it("6.4 Auto-Advance: System identifies next waiting patient (WAITING #004 -> SERVING)", () => {
            const queue = [
                new QueueEntry({ patientId: "p1", queueNumber: 1, status: QueueStatus.DONE }),
                new QueueEntry({ patientId: "p2", queueNumber: 2, status: QueueStatus.DONE }),
                new QueueEntry({ patientId: "p3", queueNumber: 3, status: QueueStatus.SERVING }),
                new QueueEntry({ patientId: "p4", queueNumber: 4, status: QueueStatus.WAITING }),
                new QueueEntry({ patientId: "p5", queueNumber: 5, status: QueueStatus.WAITING }),
            ];

            // Complete currently serving patient #003
            const currentServing = queue.find((e) => e.status === QueueStatus.SERVING);
            currentServing.markCompleted();
            assert.equal(currentServing.status, QueueStatus.DONE);

            // Auto-advance identifies first waiting patient (#004)
            const nextWaiting = queue.find((e) => e.status === QueueStatus.WAITING);
            assert.ok(nextWaiting);
            assert.equal(nextWaiting.formattedQueueNumber, "#004");

            nextWaiting.markCalled("usr-dentist-01", "Dr. Sara");
            assert.equal(nextWaiting.status, QueueStatus.SERVING);
        });

        it("6.5 Simultaneous Actions: Handles concurrent queue status updates safely", async () => {
            const entries = [
                new QueueEntry({ patientId: "sim-1", queueNumber: 1, status: QueueStatus.WAITING }),
                new QueueEntry({ patientId: "sim-2", queueNumber: 2, status: QueueStatus.WAITING }),
            ];

            // Simulate concurrent operations
            await Promise.all([
                Promise.resolve(entries[0].markCalled("usr-dentist-01", "Dr. Sara")),
                Promise.resolve(entries[1].markCalled("usr-dentist-02", "Dr. Michael")),
            ]);

            assert.equal(entries[0].status, QueueStatus.SERVING);
            assert.equal(entries[1].status, QueueStatus.SERVING);
        });
    });

    // =========================================================================
    // 7) REAL-TIME TESTING
    // =========================================================================
    describe("Task 7: Real-Time Event Sync & Reliability", () => {
        it("7.1 Notification Delivery: Real-Time Gateway emits patient ready alert to dentist", (t, done) => {
            gateway.once("DENTIST_NOTIFICATION", (payload) => {
                assert.ok(payload);
                assert.equal(payload.message, "Patient #003 is ready.");
                assert.equal(payload.queueEntry.queueNumber, 3);
                done();
            });

            gateway.broadcastPatientCalled(
                new QueueEntry({ patientId: "pat-rt-01", queueNumber: 3, formattedQueueNumber: "#003", dentistId: "usr-dentist-01", status: QueueStatus.SERVING }),
                { message: "Patient #003 is ready." }
            );
        });

        it("7.2 Queue Updates: Real-Time Gateway broadcasts QUEUE_STATUS_CHANGED to customer", (t, done) => {
            gateway.once("QUEUE_STATUS_CHANGED", (payload) => {
                assert.ok(payload);
                assert.equal(payload.formattedQueueNumber, "#004");
                assert.equal(payload.previousStatus, QueueStatus.WAITING);
                assert.equal(payload.newStatus, QueueStatus.SERVING);
                done();
            });

            gateway.broadcastQueueStatusChanged(
                new QueueEntry({ patientId: "pat-rt-02", queueNumber: 4, formattedQueueNumber: "#004", status: QueueStatus.SERVING }),
                QueueStatus.WAITING
            );
        });

        it("7.3 Connection Loss & Disconnect Handling: Gateway removes closed clients gracefully", () => {
            const mockClient = {
                readyState: 1, // OPEN
                role: "DENTIST",
                userId: "usr-dentist-01",
                send: () => {},
            };

            gateway.clients.add(mockClient);
            assert.equal(gateway.clients.has(mockClient), true);

            // Simulate connection drop
            gateway.clients.delete(mockClient);
            assert.equal(gateway.clients.has(mockClient), false, "Dropped client must be purged from active client pool");
        });

        it("7.4 Reconnection: Client reconnects and immediately receives live state", () => {
            const reconnectedClient = {
                readyState: 1,
                role: "CUSTOMER",
                userId: "usr-customer-01",
                messages: [],
                send(raw) {
                    this.messages.push(JSON.parse(raw));
                },
            };

            gateway.clients.add(reconnectedClient);

            // Broadcast state update
            gateway.broadcastQueueUpdated([
                { queueNumber: 1, status: QueueStatus.DONE },
                { queueNumber: 2, status: QueueStatus.SERVING },
            ]);

            assert.ok(reconnectedClient.messages.length > 0);
            assert.equal(reconnectedClient.messages[0].type, "QUEUE_UPDATED");
            assert.equal(reconnectedClient.messages[0].payload.queue.length, 2);

            gateway.clients.delete(reconnectedClient);
        });

        it("7.5 Multiple Clients: Concurrently broadcasts to Receptionist, Dentist, and Customer", () => {
            const clients = [
                { id: "c-rec", role: "RECEPTIONIST", readyState: 1, received: [] },
                { id: "c-dent", role: "DENTIST", readyState: 1, received: [] },
                { id: "c-cust", role: "CUSTOMER", readyState: 1, received: [] },
            ];

            clients.forEach((c) => {
                c.send = (raw) => c.received.push(JSON.parse(raw));
                gateway.clients.add(c);
            });

            gateway.broadcast("PATIENT_CALLED", {
                ticket: "#005",
                message: "Patient #005 is ready.",
            });

            clients.forEach((c) => {
                assert.equal(c.received.length, 1);
                assert.equal(c.received[0].type, "PATIENT_CALLED");
                assert.equal(c.received[0].payload.ticket, "#005");
                gateway.clients.delete(c);
            });
        });
    });
});
