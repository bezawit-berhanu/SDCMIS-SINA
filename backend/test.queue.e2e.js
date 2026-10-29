const test = require("node:test");
const assert = require("node:assert/strict");
const container = require("./src/container/container");
const { QueueStatus } = require("./src/domain/enums/enum");

test("Live Queue & Receptionist Sprint - Comprehensive E2E Verification", async (t) => {
    const {
        queueRepository,
        notificationRepository,
        realtimeGateway,
        checkInPatient,
        getLiveQueue,
        callCustomer,
        completeVisit,
        autoAdvanceQueue,
        getNotifications,
    } = container;

    await t.test("1) Queue Display: Returns seed queue (#001 Abebe DONE, #002 Hana SERVING, #003 Sara WAITING, #004 Meron WAITING)", async () => {
        const result = await getLiveQueue.execute();
        assert.ok(Array.isArray(result.queue));
        assert.ok(result.queue.length >= 4);

        const q1 = result.queue.find((e) => e.queueNumber === 1);
        const q2 = result.queue.find((e) => e.queueNumber === 2);
        const q3 = result.queue.find((e) => e.queueNumber === 3);
        const q4 = result.queue.find((e) => e.queueNumber === 4);

        assert.equal(q1.formattedQueueNumber, "#001");
        assert.equal(q1.status, QueueStatus.DONE);
        assert.ok(q1.patientName.includes("Abebe"));

        assert.equal(q2.formattedQueueNumber, "#002");
        assert.equal(q2.status, QueueStatus.SERVING);
        assert.ok(q2.patientName.includes("Hana"));

        assert.equal(q3.formattedQueueNumber, "#003");
        assert.equal(q3.status, QueueStatus.WAITING);
        assert.ok(q3.patientName.includes("Sara"));

        assert.equal(q4.formattedQueueNumber, "#004");
        assert.equal(q4.status, QueueStatus.WAITING);
        assert.ok(q4.patientName.includes("Meron"));

        assert.ok(result.summary.waitingCount >= 2);
        assert.ok(result.summary.servingCount >= 1);
    });

    await t.test("2) Check-In: Receptionist checks in a patient, assigns next sequential #005, status WAITING", async () => {
        let broadcastReceived = false;
        const testListener = (payload) => {
            if (payload.queueEntry?.queueNumber === 5) {
                broadcastReceived = true;
            }
        };
        realtimeGateway.once("PATIENT_CHECKED_IN", testListener);

        const newEntry = await checkInPatient.execute({
            patientId: "pat-1005",
            patientName: "Dawit Yohannes",
            serviceType: "Dental Crown Fitting",
            dentistId: "usr-dentist-01",
        });

        assert.equal(newEntry.queueNumber, 5);
        assert.equal(newEntry.formattedQueueNumber, "#005");
        assert.equal(newEntry.status, QueueStatus.WAITING);
        assert.equal(newEntry.patientName, "Dawit Yohannes");
        assert.ok(newEntry.checkInTime instanceof Date);
        assert.equal(broadcastReceived, true, "Realtime gateway must broadcast PATIENT_CHECKED_IN event");
    });

    await t.test("2b) Check-In Guard: Rejects duplicate check-in if patient is already active in queue", async () => {
        await assert.rejects(
            async () => {
                await checkInPatient.execute({
                    patientId: "pat-1005",
                    patientName: "Dawit Yohannes",
                });
            },
            {
                statusCode: 409,
            }
        );
    });

    await t.test("3) Call Customer: Receptionist clicks CALL on #003 Sara -> transitions WAITING to SERVING, identifies dentist, sends dentist notification", async () => {
        let callBroadcast = null;
        const callListener = (payload) => {
            callBroadcast = payload;
        };
        realtimeGateway.once("PATIENT_CALLED", callListener);

        const callResult = await callCustomer.execute({
            queueEntryId: "que-003",
            dentistId: "usr-dentist-01",
            dentistName: "Dr. Sara",
        });

        assert.equal(callResult.success, true);
        assert.equal(callResult.queueEntry.status, QueueStatus.SERVING);
        assert.equal(callResult.queueEntry.formattedQueueNumber, "#003");
        assert.ok(callResult.queueEntry.calledTime instanceof Date);
        assert.equal(callResult.queueEntry.dentistId, "usr-dentist-01");

        // Notification created: "Patient #003 is ready."
        assert.ok(callResult.notification);
        assert.equal(callResult.notification.recipientUserId, "usr-dentist-01");
        assert.equal(callResult.notification.message, "Patient #003 is ready.");

        // Realtime event broadcast
        assert.ok(callBroadcast);
        assert.equal(callBroadcast.message, "Patient #003 is ready.");
        assert.equal(callBroadcast.queueEntry.status, QueueStatus.SERVING);
    });

    await t.test("4) Dentist Notification: Notification appears in dentist list without manual refresh", async () => {
        const notifResult = await getNotifications.execute("usr-dentist-01");
        assert.ok(notifResult.notifications.length > 0);

        const foundNotif = notifResult.notifications.find((n) => n.message.includes("Patient #003 is ready."));
        assert.ok(foundNotif, "Dentist notification list must contain 'Patient #003 is ready.'");
        assert.equal(foundNotif.isRead, false);
    });

    await t.test("5) Complete Visit: Receptionist/Dentist completes visit -> transitions SERVING to DONE", async () => {
        let visitCompletedBroadcast = false;
        realtimeGateway.once("VISIT_COMPLETED", () => {
            visitCompletedBroadcast = true;
        });

        const completeResult = await completeVisit.execute({
            queueEntryId: "que-003",
            notes: "Filling completed smoothly under local anesthesia.",
        });

        assert.equal(completeResult.success, true);
        assert.equal(completeResult.queueEntry.status, QueueStatus.DONE);
        assert.ok(completeResult.queueEntry.completedTime instanceof Date);
        assert.equal(visitCompletedBroadcast, true);
    });

    await t.test("6) Auto Advance: System identifies next waiting patient (WAITING #004 -> SERVING)", async () => {
        let autoAdvanceBroadcast = null;
        realtimeGateway.once("PATIENT_CALLED", (payload) => {
            autoAdvanceBroadcast = payload;
        });

        // Current next waiting should be #004 (Meron)
        const advanceResult = await autoAdvanceQueue.execute();

        assert.equal(advanceResult.advanced, true);
        assert.equal(advanceResult.queueEntry.formattedQueueNumber, "#004");
        assert.equal(advanceResult.queueEntry.status, QueueStatus.SERVING);
        assert.equal(advanceResult.notification.message, "Patient #004 is ready.");
        assert.ok(autoAdvanceBroadcast);
        assert.equal(autoAdvanceBroadcast.queueEntry.queueNumber, 4);
    });

    await t.test("7) Real-Time Sync Pipeline: Receptionist -> API -> Realtime Gateway -> Dentist & Customer browsers", async () => {
        // Step A: Setup simulated Dentist Browser and Customer Browser listeners on Realtime Gateway
        let dentistReceived = null;
        let customerReceived = null;

        const dentistBrowserListener = (payload) => {
            dentistReceived = payload;
        };

        const customerBrowserListener = (payload) => {
            customerReceived = payload;
        };

        realtimeGateway.on("PATIENT_CALLED", dentistBrowserListener);
        realtimeGateway.on("QUEUE_UPDATED", customerBrowserListener);

        // Step B: Receptionist triggers CALL via container use-case (simulating API call)
        const callResult = await callCustomer.execute({
            queueEntryId: "que-005",
            dentistId: "usr-dentist-01",
            dentistName: "Dr. Sara",
        });

        assert.equal(callResult.success, true);
        assert.equal(callResult.queueEntry.status, QueueStatus.SERVING);

        // Step C: Verify Dentist Browser received the instant notification without manual refresh
        assert.ok(dentistReceived, "Dentist browser must receive real-time PATIENT_CALLED event");
        assert.equal(dentistReceived.message, "Patient #005 is ready.");
        assert.equal(dentistReceived.queueEntry.formattedQueueNumber, "#005");

        // Step D: Verify Customer Browser received real-time queue update
        assert.ok(customerReceived, "Customer browser must receive real-time QUEUE_UPDATED broadcast");
        assert.ok(Array.isArray(customerReceived.queue));

        // Cleanup
        realtimeGateway.off("PATIENT_CALLED", dentistBrowserListener);
        realtimeGateway.off("QUEUE_UPDATED", customerBrowserListener);
    });
});
