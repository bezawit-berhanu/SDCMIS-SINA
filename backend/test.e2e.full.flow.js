const test = require("node:test");
const assert = require("node:assert/strict");
const container = require("./src/container/container");
const { QueueStatus, NotificationType } = require("./src/domain/enums/enum");

/**
 * Task 9: End-to-End Integration Test
 * Verifies full architectural chain:
 * Receptionist
 *      ↓
 * CALL
 *      ↓
 * API
 *      ↓
 * Database
 *      ↓
 * Notification
 *      ↓
 * Real-Time Gateway
 *      ↓
 * Dentist + Customer
 */
test("Task 9: End-to-End Full Flow Integration Test", async (t) => {
    const {
        queueRepository,
        notificationRepository,
        realtimeGateway,
        callCustomer,
        getNotifications,
        getUnreadNotifications,
        markNotificationRead,
    } = container;

    // Reset / ensure initial queue state
    const entryToCall = await queueRepository.findNextWaiting();
    assert.ok(entryToCall, "Must have a waiting patient in queue");
    assert.equal(entryToCall.status, QueueStatus.WAITING);

    const initialQueueNumber = entryToCall.queueNumber;
    const initialFormattedNumber = entryToCall.formattedQueueNumber;
    const patientId = entryToCall.patientId;
    const dentistId = "usr-dentist-01";

    let dentistReceivedEvent = null;
    let customerReceivedEvent = null;
    let gatewayBroadcastEvent = null;

    // 1. Subscribe Dentist and Customer listeners to Real-Time Gateway
    const dentistListener = (payload) => {
        dentistReceivedEvent = payload;
    };
    const customerListener = (payload) => {
        customerReceivedEvent = payload;
    };
    const broadcastListener = (payload) => {
        gatewayBroadcastEvent = payload;
    };

    realtimeGateway.once("PATIENT_CALLED", broadcastListener);
    realtimeGateway.once("DENTIST_NOTIFICATION", dentistListener);
    realtimeGateway.once("QUEUE_STATUS_CHANGED", customerListener);

    await t.test("Step 1 & 2: Receptionist triggers CALL via API/Use Case", async () => {
        // Receptionist calls the waiting patient
        const result = await callCustomer.execute({
            queueEntryId: entryToCall.id,
            dentistId,
            dentistName: "Dr. Sara",
            callerUserId: "usr-receptionist-01",
        });

        assert.equal(result.success, true);
        const entry = result.queueEntry || result.entry;
        assert.ok(entry);
        assert.equal(entry.status, QueueStatus.SERVING);
        assert.equal(entry.dentistId, dentistId);
        assert.ok(entry.calledTime instanceof Date);
    });

    await t.test("Step 3: Database updates QueueEntry status (WAITING -> SERVING)", async () => {
        // Query Database directly
        const dbEntry = await queueRepository.findById(entryToCall.id);
        assert.ok(dbEntry);
        assert.equal(dbEntry.status, QueueStatus.SERVING, "Database queue status must be updated to SERVING");
        assert.equal(dbEntry.formattedQueueNumber, initialFormattedNumber);
        assert.ok(dbEntry.calledTime);
    });

    await t.test("Step 4: Database creates Notification record with full schema", async () => {
        // Query Notification Repository
        const unreadList = await notificationRepository.findUnreadByUserId(dentistId);
        assert.ok(Array.isArray(unreadList));
        assert.ok(unreadList.length > 0);

        const targetNotification = unreadList.find((n) =>
            n.message.includes(initialFormattedNumber) || n.Message?.includes(initialFormattedNumber)
        );

        assert.ok(targetNotification, `Must find notification for ticket ${initialFormattedNumber}`);
        assert.equal(targetNotification.isRead || targetNotification.IsRead, false);
        assert.ok(
            targetNotification.message.includes("is ready.") ||
            targetNotification.Message?.includes("is ready.")
        );
    });

    await t.test("Step 5 & 6: Real-Time Gateway delivers notification to Dentist browser", async () => {
        // Dentist receives real-time alert without manual refresh
        assert.ok(broadcastListener, "Broadcast event must be dispatched");
        assert.ok(dentistReceivedEvent, "Dentist must receive targeted real-time notification");
        assert.equal(
            dentistReceivedEvent.message,
            `Patient ${initialFormattedNumber} is ready.`
        );
        assert.equal(dentistReceivedEvent.queueEntry.status, QueueStatus.SERVING);
    });

    await t.test("Step 7: Real-Time Gateway delivers live status update to Customer browser", async () => {
        // Customer receives QUEUE_STATUS_CHANGED event
        assert.ok(customerReceivedEvent, "Customer must receive live status update");
        assert.equal(customerReceivedEvent.formattedQueueNumber, initialFormattedNumber);
        assert.equal(customerReceivedEvent.previousStatus, QueueStatus.WAITING);
        assert.equal(customerReceivedEvent.newStatus, QueueStatus.SERVING);
        assert.equal(customerReceivedEvent.status, QueueStatus.SERVING);
    });

    await t.test("Step 8: Dentist acknowledges and marks notification as read", async () => {
        const unreadRes = await getUnreadNotifications.execute({ userId: dentistId });
        const unreadList = Array.isArray(unreadRes) ? unreadRes : (unreadRes.notifications || []);
        const targetNotif = unreadList.find((n) =>
            (n.message || n.Message || "").includes(initialFormattedNumber)
        );
        assert.ok(targetNotif, "Must find notification in dentist unread list");

        const notifId = targetNotif.id || targetNotif.NotificationId;
        const markResult = await markNotificationRead.execute(notifId);
        const updated = markResult.notification || markResult;
        assert.equal(updated.isRead || updated.IsRead, true);

        // Verify it is no longer in unread list
        const updatedRes = await getUnreadNotifications.execute({ userId: dentistId });
        const updatedUnread = Array.isArray(updatedRes) ? updatedRes : (updatedRes.notifications || []);
        const stillUnread = updatedUnread.some((n) => (n.id || n.NotificationId) === notifId);
        assert.equal(stillUnread, false, "Notification must no longer appear in unread list");
    });
});
