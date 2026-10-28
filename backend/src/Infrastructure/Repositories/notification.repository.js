const crypto = require("node:crypto");
const INotificationRepository = require("../../domain/repositories/notification.repository.interface");

class NotificationRepository extends INotificationRepository {
    constructor({ prisma } = {}) {
        super();
        this.prisma = prisma;

        // Seed notifications
        this.notifications = [
            {
                id: "notif-001",
                recipientUserId: "usr-dentist-01",
                message: "Patient #002 (Hana Bekele) is ready in Operatory 1.",
                relatedQueueEntryId: "que-002",
                isRead: true,
                createdAt: new Date(Date.now() - 40 * 60000),
                updatedAt: new Date(Date.now() - 35 * 60000),
            },
        ];
    }

    async create(notificationData) {
        const id = notificationData.id || `notif-${crypto.randomUUID()}`;
        const record = {
            id,
            recipientUserId: String(notificationData.recipientUserId),
            message: String(notificationData.message),
            relatedQueueEntryId: notificationData.relatedQueueEntryId ? String(notificationData.relatedQueueEntryId) : null,
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Try Prisma
        try {
            if (this.prisma?.notification?.create) {
                await this.prisma.notification.create({
                    data: {
                        id: record.id,
                        recipient_user_id: record.recipientUserId,
                        message: record.message,
                        related_queue_entry_id: record.relatedQueueEntryId,
                        is_read: record.isRead,
                        created_at: record.createdAt,
                        updated_at: record.updatedAt,
                    },
                });
            }
        } catch (_) {}

        this.notifications.unshift(record);
        return { ...record };
    }

    async findById(id) {
        const item = this.notifications.find((n) => n.id === id);
        return item ? { ...item } : null;
    }

    async findByRecipientId(recipientUserId, options = {}) {
        let results = this.notifications.filter(
            (n) => n.recipientUserId === recipientUserId || recipientUserId === "all"
        );
        if (options.unreadOnly) {
            results = results.filter((n) => !n.isRead);
        }
        return results.map((n) => ({ ...n }));
    }

    async findUnreadByRecipientId(recipientUserId) {
        return this.findByRecipientId(recipientUserId, { unreadOnly: true });
    }

    async markAsRead(id) {
        const item = this.notifications.find((n) => n.id === id);
        if (!item) return null;
        item.isRead = true;
        item.updatedAt = new Date();

        try {
            if (this.prisma?.notification?.update) {
                await this.prisma.notification.update({
                    where: { id },
                    data: { is_read: true, updated_at: item.updatedAt },
                });
            }
        } catch (_) {}

        return { ...item };
    }

    async markAllAsReadForUser(recipientUserId) {
        this.notifications.forEach((n) => {
            if (n.recipientUserId === recipientUserId || recipientUserId === "all") {
                n.isRead = true;
                n.updatedAt = new Date();
            }
        });
        return true;
    }
}

module.exports = NotificationRepository;
