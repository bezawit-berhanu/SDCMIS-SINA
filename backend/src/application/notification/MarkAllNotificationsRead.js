class MarkAllNotificationsRead {
    constructor({ notificationRepository } = {}) {
        this.notificationRepository = notificationRepository;
    }

    async execute(userId) {
        if (!userId) {
            const error = new Error("User ID is required to mark all notifications as read.");
            error.statusCode = 400;
            throw error;
        }

        const result = await this.notificationRepository.markAllAsReadForUser(userId);

        return {
            success: true,
            updatedCount: result.updatedCount !== undefined ? result.updatedCount : 0,
            message: "All notifications marked as read successfully.",
        };
    }
}

module.exports = MarkAllNotificationsRead;

