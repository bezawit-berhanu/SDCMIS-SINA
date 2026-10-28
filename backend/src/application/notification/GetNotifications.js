class GetNotifications {
    constructor({ notificationRepository } = {}) {
        this.notificationRepository = notificationRepository;
    }

    async execute(userId, options = {}) {
        if (!userId) {
            const error = new Error("User ID is required to fetch notifications.");
            error.statusCode = 400;
            throw error;
        }

        const notifications = await this.notificationRepository.findByRecipientId(userId, options);
        const unreadCount = notifications.filter((n) => !n.isRead).length;

        return {
            notifications,
            unreadCount,
            totalCount: notifications.length,
        };
    }
}

module.exports = GetNotifications;
