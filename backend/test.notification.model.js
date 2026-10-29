const test = require("node:test");
const assert = require("node:assert/strict");
const Notification = require("./src/domain/entities/notification.entity");
const NotificationRepository = require("./src/Infrastructure/Repositories/notification.repository");
const { NotificationType } = require("./src/domain/enums/enum");

test("Task 6: Notification Model & Repository Unit Tests", async (t) => {
    await t.test("Notification entity instantiates with full schema: NotificationId, UserId, Message, CreatedAt, IsRead, Type", () => {
        const notif = new Notification({
            notificationId: "notif-100",
            userId: "usr-dentist-01",
            message: "Patient #003 is ready.",
            type: NotificationType.PATIENT_READY,
            isRead: false,
        });

        // Verify exact tree structure
        assert.equal(notif.NotificationId, "notif-100");
        assert.equal(notif.UserId, "usr-dentist-01");
        assert.equal(notif.Message, "Patient #003 is ready.");
        assert.ok(notif.CreatedAt instanceof Date);
        assert.equal(notif.IsRead, false);
        assert.equal(notif.Type, "PATIENT_READY");

        // Verify JSON serialization
        const json = notif.toJSON();
        assert.equal(json.NotificationId, "notif-100");
        assert.equal(json.UserId, "usr-dentist-01");
        assert.equal(json.Message, "Patient #003 is ready.");
        assert.equal(json.IsRead, false);
        assert.equal(json.Type, "PATIENT_READY");
    });

    await t.test("Notification markAsRead updates status correctly", () => {
        const notif = new Notification({
            userId: "usr-dentist-01",
            message: "Patient #004 is ready.",
            type: NotificationType.PATIENT_READY,
        });

        assert.equal(notif.IsRead, false);
        notif.markAsRead();
        assert.equal(notif.IsRead, true);
    });

    await t.test("Notification validates required fields: UserId and Message", () => {
        assert.throws(
            () => new Notification({ userId: "", message: "Hello" }),
            /UserId/
        );
        assert.throws(
            () => new Notification({ userId: "user-1", message: "" }),
            /message/
        );
    });

    await t.test("NotificationRepository creates, filters unread, marks read, and marks all read", async () => {
        const repo = new NotificationRepository();

        // 1. Create notification
        const created = await repo.create({
            userId: "usr-dentist-99",
            message: "Patient #007 is ready.",
            type: NotificationType.PATIENT_READY,
        });

        assert.equal(created.UserId, "usr-dentist-99");
        assert.equal(created.Message, "Patient #007 is ready.");
        assert.equal(created.IsRead, false);

        // 2. Find unread
        const unread = await repo.findUnreadByRecipientId("usr-dentist-99");
        assert.equal(unread.length, 1);
        assert.equal(unread[0].NotificationId, created.NotificationId);

        // 3. Mark single as read
        const marked = await repo.markAsRead(created.NotificationId);
        assert.equal(marked.IsRead, true);

        // 4. Create another and test markAllAsReadForUser
        await repo.create({
            userId: "usr-dentist-99",
            message: "Patient #008 is ready.",
            type: NotificationType.PATIENT_READY,
        });

        const unreadBeforeAll = await repo.findUnreadByRecipientId("usr-dentist-99");
        assert.equal(unreadBeforeAll.length, 1);

        await repo.markAllAsReadForUser("usr-dentist-99");

        const unreadAfterAll = await repo.findUnreadByRecipientId("usr-dentist-99");
        assert.equal(unreadAfterAll.length, 0);
    });
});

