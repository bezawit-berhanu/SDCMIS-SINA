import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { realtimeService } from "../../services/realtime.service.js";
import { apiClient } from "../../lib/api-client.js";

/**
 * Task 8: Dentist Notification UI
 * Create:
 * - Notification icon (🔔)
 * - Notification count badge
 * - Notification dropdown/page
 * - Read/unread state & Mark all read
 */
export default function DentistNotificationDropdown({ userId = "usr-dentist-01" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        {
            id: "notif-init-01",
            NotificationId: "notif-init-01",
            message: "Patient #003 is ready.",
            type: "PATIENT_READY",
            createdAt: new Date().toISOString(),
            isRead: false,
            time: "Just now",
        },
        {
            id: "notif-init-02",
            NotificationId: "notif-init-02",
            message: "Patient #002 (Hana Bekele) completed composite filling.",
            type: "VISIT_COMPLETED",
            createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
            isRead: true,
            time: "25m ago",
        },
    ]);
    const dropdownRef = useRef(null);

    // Fetch initial notifications from API
    useEffect(() => {
        let isMounted = true;
        const fetchNotifications = async () => {
            try {
                const res = await apiClient.get(`/api/v1/notifications?userId=${encodeURIComponent(userId)}`);
                if (isMounted && res?.data?.data && Array.isArray(res.data.data)) {
                    setNotifications(res.data.data);
                }
            } catch (_) {}
        };

        fetchNotifications();

        // Real-time synchronization: Notification appears without manual refresh
        const unsubCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket || `#${String(payload.queueNumber || 3).padStart(3, "0")}`;
            const alertMsg = payload.notification?.message || `Patient ${ticket} is ready.`;
            const newNotif = {
                id: payload.notification?.NotificationId || payload.notification?.id || `notif-${Date.now()}`,
                NotificationId: payload.notification?.NotificationId || `notif-${Date.now()}`,
                message: alertMsg,
                type: "PATIENT_READY",
                createdAt: new Date().toISOString(),
                isRead: false,
                time: "Just now",
            };

            setNotifications((prev) => [newNotif, ...prev]);
        });

        const unsubNotif = realtimeService.subscribe("NOTIFICATION_CREATED", (payload) => {
            const newNotif = {
                id: payload.NotificationId || payload.id || `notif-${Date.now()}`,
                NotificationId: payload.NotificationId || payload.id || `notif-${Date.now()}`,
                message: payload.Message || payload.message || "New clinic alert.",
                type: payload.Type || payload.type || "PATIENT_READY",
                createdAt: new Date().toISOString(),
                isRead: false,
                time: "Just now",
            };

            setNotifications((prev) => [newNotif, ...prev]);
        });

        return () => {
            isMounted = false;
            unsubCall();
            unsubNotif();
        };
    }, [userId]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter((n) => !n.isRead && !n.IsRead).length;

    const handleMarkAsRead = async (id, e) => {
        e?.stopPropagation();
        setNotifications((prev) =>
            prev.map((n) => (n.id === id || n.NotificationId === id ? { ...n, isRead: true, IsRead: true } : n))
        );

        try {
            await apiClient.post(`/api/v1/notifications/${id}/read`, { userId });
        } catch (_) {}
    };

    const handleMarkAllRead = async (e) => {
        e?.stopPropagation();
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true, IsRead: true }))
        );

        try {
            await apiClient.post("/api/v1/notifications/mark-all-read", { userId });
        } catch (_) {}
    };

    return (
        <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
            {/* Notification Bell Icon & Count Badge */}
            <button
                type="button"
                data-testid="notification-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "relative",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    transition: "background-color 0.2s",
                }}
                aria-label={`Notifications (${unreadCount} unread)`}
            >
                <span>🔔</span>
                {unreadCount > 0 && (
                    <span
                        data-testid="notification-count-badge"
                        style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            backgroundColor: "#dc2626",
                            color: "white",
                            fontSize: "0.6875rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "9999px",
                            minWidth: "18px",
                            height: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid white",
                            boxShadow: "0 2px 4px rgba(220, 38, 38, 0.4)",
                        }}
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown Panel */}
            {isOpen && (
                <div
                    data-testid="notification-dropdown-panel"
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        width: "360px",
                        maxHeight: "440px",
                        overflowY: "auto",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        border: "1px solid #e2e8f0",
                        zIndex: 1000,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f1f5f9",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#f8fafc",
                            borderTopLeftRadius: "8px",
                            borderTopRightRadius: "8px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#1e293b" }}>
                                Dentist Notifications
                            </span>
                            {unreadCount > 0 && (
                                <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 700 }}>
                                    ({unreadCount} new)
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                data-testid="mark-all-read-btn"
                                onClick={handleMarkAllRead}
                                style={{
                                    border: "none",
                                    background: "none",
                                    color: "#2563eb",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    padding: "2px 6px",
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
                                No notifications right now.
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const isUnread = !notif.isRead && !notif.IsRead;
                                const id = notif.id || notif.NotificationId;
                                return (
                                    <div
                                        key={id}
                                        data-testid={`notification-item-${id}`}
                                        onClick={(e) => isUnread && handleMarkAsRead(id, e)}
                                        style={{
                                            padding: "12px 16px",
                                            borderBottom: "1px solid #f1f5f9",
                                            backgroundColor: isUnread ? "#f0fdf4" : "white",
                                            cursor: isUnread ? "pointer" : "default",
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "flex-start",
                                            transition: "background-color 0.15s",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                backgroundColor: isUnread ? "#2563eb" : "transparent",
                                                marginTop: "6px",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <p
                                                style={{
                                                    fontSize: "0.875rem",
                                                    fontWeight: isUnread ? 700 : 500,
                                                    color: isUnread ? "#0f172a" : "#475569",
                                                    margin: 0,
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {notif.Message || notif.message}
                                            </p>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                                                <span
                                                    style={{
                                                        fontSize: "0.6875rem",
                                                        fontWeight: 700,
                                                        color: "#0369a1",
                                                        backgroundColor: "#e0f2fe",
                                                        padding: "1px 6px",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    {notif.Type || notif.type || "PATIENT_READY"}
                                                </span>
                                                <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>
                                                    {notif.time || "Recent"}
                                                </span>
                                            </div>
                                        </div>
                                        {isUnread && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleMarkAsRead(id, e)}
                                                title="Mark as read"
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#94a3b8",
                                                    fontSize: "0.75rem",
                                                    cursor: "pointer",
                                                    padding: "2px",
                                                }}
                                            >
                                                ✓
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div
                        style={{
                            padding: "8px 12px",
                            backgroundColor: "#f8fafc",
                            borderTop: "1px solid #e2e8f0",
                            textAlign: "center",
                        }}
                    >
                        <Link
                            to="/dentist/notifications"
                            onClick={() => setIsOpen(false)}
                            style={{
                                fontSize: "0.8125rem",
                                color: "#2563eb",
                                textDecoration: "none",
                                fontWeight: 600,
                            }}
                        >
                            View all notifications →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

