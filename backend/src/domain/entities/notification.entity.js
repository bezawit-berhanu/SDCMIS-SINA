const crypto = require("node:crypto");
const { NotificationType } = require("../enums/enum");

/**
 * Notification Domain Entity
 *
 * Notification
 * ├── NotificationId
 * ├── UserId
 * ├── Message
 * ├── CreatedAt
 * ├── IsRead
 * └── Type
 */
class Notification {
    constructor({
        notificationId,
        NotificationId,
        id,
        userId,
        UserId,
        recipientUserId,
        message,
        Message,
        createdAt,
        CreatedAt,
        isRead = false,
        IsRead = false,
        type = NotificationType.SYSTEM,
        Type,
        relatedQueueEntryId = null,
    } = {}) {
        this.notificationId = String(notificationId || NotificationId || id || `notif-${crypto.randomUUID()}`);
        this.userId = String(userId || UserId || recipientUserId || "");
        this.message = String(message || Message || "").trim();
        this.createdAt = createdAt || CreatedAt ? new Date(createdAt || CreatedAt) : new Date();
        this.isRead = Boolean(isRead !== undefined ? isRead : IsRead);
        this.type = String(type || Type || NotificationType.SYSTEM).toUpperCase();
        this.relatedQueueEntryId = relatedQueueEntryId ? String(relatedQueueEntryId) : null;

        this.validate();
    }

    validate() {
        if (!this.userId) {
            const error = new Error("Notification requires a valid UserId.");
            error.statusCode = 400;
            throw error;
        }
        if (!this.message) {
            const error = new Error("Notification message cannot be empty.");
            error.statusCode = 400;
            throw error;
        }
    }

    // PascalCase getters matching required specification
    get NotificationId() {
        return this.notificationId;
    }

    get UserId() {
        return this.userId;
    }

    get Message() {
        return this.message;
    }

    get CreatedAt() {
        return this.createdAt;
    }

    get IsRead() {
        return this.isRead;
    }

    get Type() {
        return this.type;
    }

    // Backwards-compatible ID getter
    get id() {
        return this.notificationId;
    }

    get recipientUserId() {
        return this.userId;
    }

    markAsRead() {
        this.isRead = true;
        return this;
    }

    toJSON() {
        return {
            NotificationId: this.notificationId,
            UserId: this.userId,
            Message: this.message,
            CreatedAt: this.createdAt.toISOString(),
            IsRead: this.isRead,
            Type: this.type,
            // standard camelCase aliases for JSON consumers
            id: this.notificationId,
            userId: this.userId,
            recipientUserId: this.userId,
            message: this.message,
            createdAt: this.createdAt,
            isRead: this.isRead,
            type: this.type,
            relatedQueueEntryId: this.relatedQueueEntryId,
        };
    }

    static create(payload) {
        return new Notification(payload);
    }
}

module.exports = Notification;

