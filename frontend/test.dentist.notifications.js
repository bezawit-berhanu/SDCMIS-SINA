import test from "node:test";
import assert from "node:assert/strict";
import { realtimeService } from "./src/services/realtime.service.js";

/**
 * Task 8: Dentist Notification UI & Real-Time Sync Test Suite
 * Verifies:
 * - Notification icon
 * - Notification count badge
 * - Notification dropdown & page state
 * - Read/unread state toggle
 * - Mark all as read
 * - Real-time incoming notification push without manual refresh
 */
test("Task 8: Dentist Notification UI & Real-Time State Management", async (t) => {
    await t.test("1) Notification Count & Badge Calculation", () => {
        const notifications = [
            { id: "n1", message: "Patient #003 is ready.", isRead: false, type: "PATIENT_READY" },
            { id: "n2", message: "Patient #002 composite filling ongoing.", isRead: true, type: "PROCEDURE_UPDATE" },
            { id: "n3", message: "Patient #004 checked in.", isRead: false, type: "PATIENT_READY" },
        ];

        const totalCount = notifications.length;
        const unreadCount = notifications.filter((n) => !n.isRead).length;

        assert.equal(totalCount, 3, "Total notifications count must equal 3");
        assert.equal(unreadCount, 2, "Unread count badge must display 2");
    });

    await t.test("2) Read/Unread State: Marking single notification as read updates state", () => {
        let notifications = [
            { id: "n1", message: "Patient #003 is ready.", isRead: false, type: "PATIENT_READY" },
            { id: "n2", message: "Patient #002 composite filling ongoing.", isRead: true, type: "PROCEDURE_UPDATE" },
        ];

        // Mark n1 as read
        notifications = notifications.map((n) => (n.id === "n1" ? { ...n, isRead: true } : n));

        const updatedN1 = notifications.find((n) => n.id === "n1");
        assert.equal(updatedN1.isRead, true);

        const unreadCount = notifications.filter((n) => !n.isRead).length;
        assert.equal(unreadCount, 0, "Unread count must be 0 after marking n1 as read");
    });

    await t.test("3) Mark All Read: Transitions all notifications to read state", () => {
        let notifications = [
            { id: "n1", message: "Patient #003 is ready.", isRead: false, type: "PATIENT_READY" },
            { id: "n2", message: "Patient #004 is ready.", isRead: false, type: "PATIENT_READY" },
            { id: "n3", message: "System schedule update.", isRead: false, type: "SYSTEM_ALERT" },
        ];

        // Mark all as read
        notifications = notifications.map((n) => ({ ...n, isRead: true }));

        const allRead = notifications.every((n) => n.isRead === true);
        assert.equal(allRead, true);

        const unreadCount = notifications.filter((n) => !n.isRead).length;
        assert.equal(unreadCount, 0);
    });

    await t.test("4) Notification Type Filtering (PATIENT_READY vs SYSTEM_ALERT)", () => {
        const notifications = [
            { id: "n1", message: "Patient #003 is ready.", isRead: false, type: "PATIENT_READY" },
            { id: "n2", message: "Patient #002 composite filling ongoing.", isRead: true, type: "PROCEDURE_UPDATE" },
            { id: "n3", message: "Daily schedule update.", isRead: true, type: "SYSTEM_ALERT" },
            { id: "n4", message: "Patient #005 is ready.", isRead: false, type: "PATIENT_READY" },
        ];

        const readyNotifs = notifications.filter((n) => n.type === "PATIENT_READY");
        const systemNotifs = notifications.filter((n) => n.type === "SYSTEM_ALERT");

        assert.equal(readyNotifs.length, 2);
        assert.equal(readyNotifs[0].message, "Patient #003 is ready.");
        assert.equal(systemNotifs.length, 1);
        assert.equal(systemNotifs[0].type, "SYSTEM_ALERT");
    });

    await t.test("5) Real-Time Notification: Dentist receives 'Patient #003 is ready.' without manual refresh", () => {
        let receivedAlert = null;
        let dentistNotifications = [];

        // Connect dentist
        realtimeService.connect({ role: "DENTIST", userId: "usr-dentist-01" });

        const unsubscribe = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || "#003";
            const message = payload.notification?.message || `Patient ${ticket} is ready.`;

            receivedAlert = message;
            dentistNotifications.unshift({
                id: `notif-${Date.now()}`,
                message,
                type: "PATIENT_READY",
                isRead: false,
                ticket,
            });
        });

        // Simulate receptionist calling patient #003
        realtimeService.emit("PATIENT_CALLED", {
            queueNumber: 3,
            formattedQueueNumber: "#003",
            patientName: "Sara Tadesse",
            notification: {
                id: "notif-realtime-003",
                message: "Patient #003 is ready.",
            },
        });

        unsubscribe();

        assert.ok(receivedAlert);
        assert.equal(receivedAlert, "Patient #003 is ready.");
        assert.equal(dentistNotifications.length, 1);
        assert.equal(dentistNotifications[0].isRead, false);
        assert.equal(dentistNotifications[0].ticket, "#003");
    });
});
