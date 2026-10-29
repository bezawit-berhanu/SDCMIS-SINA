class GetUnreadNotifications {
    constructor({ notificationRepository } = {}) {
        this.notificationRepository = notificationRepository;
    }

    async execute(userId) {
        if (!userId) {
            const error = new Error("User ID is required to fetch unread notifications.");
            error.statusCode = 400;
            throw error;
        }

        const unreadList = await this.notificationRepository.findUnreadByRecipientId(userId);

        return {
            success: true,
            notifications: unreadList,
            unreadCount: unreadList.length,
        };
    }
}

module.exports = GetUnreadNotifications;

