class QueueController {
    constructor(container) {
        this.container = container;

        this.getQueue = this.getQueue.bind(this);
        this.checkIn = this.checkIn.bind(this);
        this.callCustomer = this.callCustomer.bind(this);
        this.completeVisit = this.completeVisit.bind(this);
        this.autoAdvance = this.autoAdvance.bind(this);
        this.getNotifications = this.getNotifications.bind(this);
        this.getUnreadNotifications = this.getUnreadNotifications.bind(this);
        this.markNotificationRead = this.markNotificationRead.bind(this);
        this.markAllNotificationsRead = this.markAllNotificationsRead.bind(this);
        this.getMyQueuePosition = this.getMyQueuePosition.bind(this);
    }

    async getQueue(req, res) {
        try {
            const result = await this.container.getLiveQueue.execute(req.query);
            return res.status(200).json({
                success: true,
                data: result.queue,
                summary: result.summary,
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to retrieve live queue.",
            });
        }
    }

    async checkIn(req, res) {
        try {
            const payload = {
                ...req.body,
                createdByUserId: req.user?.id || req.body.createdByUserId || "usr-receptionist-01",
            };
            const queueEntry = await this.container.checkInPatient.execute(payload);
            return res.status(201).json({
                success: true,
                data: queueEntry,
                message: `Patient ${queueEntry.formattedQueueNumber} checked in successfully.`,
            });
        } catch (error) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to check in patient.",
                activeEntry: error.activeEntry || null,
            });
        }
    }

    async callCustomer(req, res) {
        try {
            const queueEntryId = req.params.id || req.body.queueEntryId;
            const payload = {
                queueEntryId,
                dentistId: req.body.dentistId,
                dentistName: req.body.dentistName,
                callerUserId: req.user?.id || "usr-receptionist-01",
            };
            const result = await this.container.callCustomer.execute(payload);
            return res.status(200).json({
                success: true,
                data: result.queueEntry,
                notification: result.notification,
                message: result.message,
            });
        } catch (error) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to call customer.",
            });
        }
    }

    async completeVisit(req, res) {
        try {
            const queueEntryId = req.params.id || req.body.queueEntryId;
            const payload = {
                queueEntryId,
                autoAdvance: req.body.autoAdvance === true || req.body.autoAdvance === "true",
                notes: req.body.notes,
            };
            const result = await this.container.completeVisit.execute(payload);
            return res.status(200).json({
                success: true,
                data: result.queueEntry,
                nextWaiting: result.nextWaiting,
                message: result.message,
            });
        } catch (error) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to complete visit.",
            });
        }
    }

    async autoAdvance(req, res) {
        try {
            const result = await this.container.autoAdvanceQueue.execute(req.body);
            return res.status(200).json({
                success: true,
                advanced: result.advanced,
                data: result.queueEntry,
                notification: result.notification,
                message: result.message,
            });
        } catch (error) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to auto-advance queue.",
            });
        }
    }

    async getMyQueuePosition(req, res) {
        try {
            const patientId = req.query.patientId || req.user?.linkedPatientId || req.user?.patientId || req.user?.id;
            if (!patientId) {
                return res.status(400).json({
                    success: false,
                    message: "Patient ID is required to determine queue position.",
                });
            }
            const result = await this.container.getCustomerQueuePosition.execute(patientId);
            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to retrieve queue position.",
            });
        }
    }

    async getNotifications(req, res) {
        try {
            const targetUserId = req.query.userId || req.user?.id || "usr-dentist-01";
            const result = await this.container.getNotifications.execute(targetUserId, req.query);
            return res.status(200).json({
                success: true,
                data: result.notifications,
                unreadCount: result.unreadCount,
                totalCount: result.totalCount,
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to retrieve notifications.",
            });
        }
    }

    async getUnreadNotifications(req, res) {
        try {
            const targetUserId = req.query.userId || req.user?.id || "usr-dentist-01";
            const result = await this.container.getUnreadNotifications.execute(targetUserId);
            return res.status(200).json({
                success: true,
                data: result.notifications,
                unreadCount: result.unreadCount,
            });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Failed to retrieve unread notifications.",
            });
        }
    }

    async markNotificationRead(req, res) {
        try {
            const notificationId = req.params.id;
            const result = await this.container.markNotificationRead.execute(
                notificationId,
                req.user?.id || req.body.userId || "usr-dentist-01"
            );
            return res.status(200).json({
                success: true,
                data: result.notification,
                message: result.message,
            });
        } catch (error) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to update notification.",
            });
        }
    }

    async markAllNotificationsRead(req, res) {
        try {
            const targetUserId = req.body.userId || req.query.userId || req.user?.id || "usr-dentist-01";
            const result = await this.container.markAllNotificationsRead.execute(targetUserId);
            return res.status(200).json({
                success: true,
                updatedCount: result.updatedCount,
                message: result.message,
            });
        } catch (error) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message || "Failed to mark all notifications as read.",
            });
        }
    }
}

module.exports = QueueController;
