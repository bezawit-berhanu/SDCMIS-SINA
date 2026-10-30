const crypto = require("node:crypto");
const INotificationRepository = require("../../domain/repositories/notification.repository.interface");
const Notification = require("../../domain/entities/notification.entity");
const { NotificationType } = require("../../domain/enums/enum");

class NotificationRepository extends INotificationRepository {
    constructor({ prisma } = {}) {
        super();
        this.prisma = prisma;

        // Seed initial notification
        const initialNotif = new Notification({
            notificationId: "notif-001",
            userId: "usr-dentist-01",
            message: "Patient #002 (Hana Bekele) is ready in Operatory 1.",
            relatedQueueEntryId: "que-002",
            isRead: true,
            type: NotificationType.PATIENT_READY,
            createdAt: new Date(Date.now() - 40 * 60000),
        });

        this.notifications = [initialNotif];
    }

    async create(notificationData) {
        const notif = notificationData instanceof Notification
            ? notificationData
            : new Notification({
                notificationId: notificationData.notificationId || notificationData.NotificationId || notificationData.id,
                userId: notificationData.userId || notificationData.UserId || notificationData.recipientUserId,
                message: notificationData.message || notificationData.Message,
                type: notificationData.type || notificationData.Type || NotificationType.PATIENT_READY,
                isRead: notificationData.isRead || notificationData.IsRead || false,
                relatedQueueEntryId: notificationData.relatedQueueEntryId,
                createdAt: notificationData.createdAt || notificationData.CreatedAt || new Date(),
            });

        // Try Prisma if available
        try {
            if (this.prisma?.notification?.create) {
                await this.prisma.notification.create({
                    data: {
                        id: notif.notificationId,
                        recipient_user_id: notif.userId,
                        message: notif.message,
                        related_queue_entry_id: notif.relatedQueueEntryId,
                        is_read: notif.isRead,
                        created_at: notif.createdAt,
                        updated_at: new Date(),
                    },
                });
            }
        } catch (_) {}

        this.notifications.unshift(notif);
        return notif.toJSON();
    }

    async findById(id) {
        const item = this.notifications.find((n) => n.notificationId === id || n.id === id);
        return item ? item.toJSON() : null;
    }

    async findByRecipientId(recipientUserId, options = {}) {
        let results = this.notifications.filter(
            (n) => n.userId === recipientUserId || recipientUserId === "all" || n.recipientUserId === recipientUserId
        );
        if (options.unreadOnly) {
            results = results.filter((n) => !n.isRead);
        }
        if (options.type) {
            const searchType = String(options.type).toUpperCase();
            results = results.filter((n) => n.type === searchType);
        }
        return results.map((n) => (typeof n.toJSON === "function" ? n.toJSON() : { ...n }));
    }

    async findUnreadByRecipientId(recipientUserId) {
        return this.findByRecipientId(recipientUserId, { unreadOnly: true });
    }

    async findUnreadByUserId(userId) {
        return this.findUnreadByRecipientId(userId);
    }

    async markAsRead(id) {
        const item = this.notifications.find((n) => n.notificationId === id || n.id === id);
        if (!item) return null;

        if (typeof item.markAsRead === "function") {
            item.markAsRead();
        } else {
            item.isRead = true;
        }

        try {
            if (this.prisma?.notification?.update) {
                await this.prisma.notification.update({
                    where: { id },
                    data: { is_read: true, updated_at: new Date() },
                });
            }
        } catch (_) {}

        return typeof item.toJSON === "function" ? item.toJSON() : { ...item };
    }

    async markAllAsReadForUser(recipientUserId) {
        let updatedCount = 0;
        this.notifications.forEach((n) => {
            if (n.userId === recipientUserId || n.recipientUserId === recipientUserId || recipientUserId === "all") {
                if (!n.isRead) {
                    if (typeof n.markAsRead === "function") {
                        n.markAsRead();
                    } else {
                        n.isRead = true;
                    }
                    updatedCount++;
                }
            }
        });

        try {
            if (this.prisma?.notification?.updateMany) {
                await this.prisma.notification.updateMany({
                    where: recipientUserId === "all" ? {} : { recipient_user_id: recipientUserId },
                    data: { is_read: true, updated_at: new Date() },
                });
            }
        } catch (_) {}

        return { success: true, updatedCount };
    }
}

module.exports = NotificationRepository;
