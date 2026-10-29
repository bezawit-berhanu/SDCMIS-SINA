const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("./app");
const container = require("./src/container/container");
const { NotificationType } = require("./src/domain/enums/enum");

function request(server, { method, path, body = null, headers = {} }) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const req = http.request(
            {
                hostname: "127.0.0.1",
                port: address.port,
                path,
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...headers,
                },
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    let json = null;
                    try {
                        json = JSON.parse(data);
                    } catch (_) {}
                    resolve({ status: res.statusCode, body: json, text: data });
                });
            }
        );
        req.on("error", reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

test("Task 7: Notification API Endpoints Verification", async (t) => {
    let server;

    t.before(() => {
        return new Promise((resolve) => {
            server = http.createServer(app);
            server.listen(0, "127.0.0.1", () => resolve());
        });
    });

    t.after(() => {
        return new Promise((resolve) => {
            server.close(() => {
                resolve();
                setTimeout(() => process.exit(0), 100);
            });
        });
    });

    await t.test("GET /api/v1/notifications returns notifications for user", async () => {
        // Seed a test notification
        await container.notificationRepository.create({
            userId: "usr-dentist-test",
            message: "Patient #003 is ready.",
            type: NotificationType.PATIENT_READY,
        });

        const res = await request(server, {
            method: "GET",
            path: "/api/v1/notifications?userId=usr-dentist-test",
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        assert.ok(res.body.data.length >= 1);
        assert.ok(res.body.unreadCount >= 1);
    });

    await t.test("GET /api/v1/notifications/unread returns only unread items", async () => {
        const res = await request(server, {
            method: "GET",
            path: "/api/v1/notifications/unread?userId=usr-dentist-test",
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        assert.ok(res.body.data.every((n) => n.IsRead === false || n.isRead === false));
    });

    await t.test("POST /api/v1/notifications/:id/read marks notification as read", async () => {
        const notif = await container.notificationRepository.create({
            userId: "usr-dentist-test",
            message: "Patient #004 is ready.",
            type: NotificationType.PATIENT_READY,
        });

        const id = notif.NotificationId || notif.id;

        const res = await request(server, {
            method: "POST",
            path: `/api/v1/notifications/${id}/read`,
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.IsRead, true);
    });

    await t.test("POST /api/v1/notifications/mark-all-read marks all user notifications as read", async () => {
        await container.notificationRepository.create({
            userId: "usr-dentist-bulk",
            message: "Bulk 1",
            type: NotificationType.PATIENT_READY,
        });
        await container.notificationRepository.create({
            userId: "usr-dentist-bulk",
            message: "Bulk 2",
            type: NotificationType.PATIENT_READY,
        });

        const res = await request(server, {
            method: "POST",
            path: "/api/v1/notifications/mark-all-read",
            body: { userId: "usr-dentist-bulk" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);

        // Verify unread is now 0
        const check = await request(server, {
            method: "GET",
            path: "/api/v1/notifications/unread?userId=usr-dentist-bulk",
        });
        assert.equal(check.body.unreadCount, 0);
    });
});
