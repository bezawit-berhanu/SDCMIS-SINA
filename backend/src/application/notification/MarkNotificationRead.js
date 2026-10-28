class MarkNotificationRead {
    constructor({ notificationRepository } = {}) {
        this.notificationRepository = notificationRepository;
    }

    async execute(notificationId, userId = null) {
        if (!notificationId) {
            const error = new Error("Notification ID is required.");
            error.statusCode = 400;
            throw error;
        }

        if (notificationId === "all" && userId) {
            await this.notificationRepository.markAllAsReadForUser(userId);
            return { success: true, message: "All notifications marked as read." };
        }

        const updated = await this.notificationRepository.markAsRead(notificationId);
        if (!updated) {
            const error = new Error(`Notification ${notificationId} not found.`);
            error.statusCode = 404;
            throw error;
        }

        return {
            success: true,
            notification: updated,
            message: "Notification marked as read.",
        };
    }
}

module.exports = MarkNotificationRead;
