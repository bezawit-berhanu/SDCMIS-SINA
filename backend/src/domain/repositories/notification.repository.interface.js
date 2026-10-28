/**
 * Domain Repository Interface for Notification management.
 * Specifies the contract for creating notifications (e.g. dentist alert when customer is called),
 * querying unread notifications for a user, and marking notifications as read.
 */
class INotificationRepository {
    async create(notificationData) {
        throw new Error("Method create() must be implemented.");
    }

    async findById(id) {
        throw new Error("Method findById() must be implemented.");
    }

    async findByRecipientId(recipientUserId, options = {}) {
        throw new Error("Method findByRecipientId() must be implemented.");
    }

    async findUnreadByRecipientId(recipientUserId) {
        throw new Error("Method findUnreadByRecipientId() must be implemented.");
    }

    async markAsRead(id) {
        throw new Error("Method markAsRead() must be implemented.");
    }

    async markAllAsReadForUser(recipientUserId) {
        throw new Error("Method markAllAsReadForUser() must be implemented.");
    }
}

module.exports = INotificationRepository;
