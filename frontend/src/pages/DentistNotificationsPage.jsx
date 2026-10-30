import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import { realtimeService } from "../services/realtime.service";
import { apiClient } from "../lib/api-client";

export default function DentistNotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([
        {
            id: "notif-001",
            userId: user?.id || "usr-dentist-01",
            message: "Patient #003 (Sara Tadesse) is ready for examination in Operatory 1.",
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            isRead: false,
            type: "PATIENT_READY",
            ticket: "#003",
        },
        {
            id: "notif-002",
            userId: user?.id || "usr-dentist-01",
            message: "Patient #002 (Hana Bekele) composite restoration procedure ongoing.",
            createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
            isRead: true,
            type: "PROCEDURE_UPDATE",
            ticket: "#002",
        },
        {
            id: "notif-003",
            userId: user?.id || "usr-dentist-01",
            message: "Patient #001 (Abebe Kebede) completed visit and checked out at reception.",
            createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            isRead: true,
            type: "VISIT_COMPLETED",
            ticket: "#001",
        },
        {
            id: "notif-004",
            userId: user?.id || "usr-dentist-01",
            message: "Daily schedule update: 3 afternoon appointments confirmed.",
            createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
            isRead: true,
            type: "SYSTEM_ALERT",
        },
    ]);

    const [filter, setFilter] = useState("ALL"); // ALL | UNREAD | PATIENT_READY | SYSTEM
    const [actionMsg, setActionMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch initial notifications from API if available
    useEffect(() => {
        let isMounted = true;
        const fetchNotifications = async () => {
            try {
                const response = await apiClient.get("/api/v1/notifications");
                if (isMounted && response?.data && Array.isArray(response.data.notifications)) {
                    setNotifications(response.data.notifications);
                }
            } catch (_) {
                // Keep default state in offline or mockup mode
            }
        };
        fetchNotifications();
        return () => {
            isMounted = false;
        };
    }, []);

    // Subscribe to live real-time notifications
    useEffect(() => {
        realtimeService.connect({
            role: "DENTIST",
            userId: user?.id || "usr-dentist-01",
        });

        const unsubscribeCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket || `#${String(payload.queueNumber || 3).padStart(3, "0")}`;
            const message = payload.notification?.message || `Patient ${ticket} is ready.`;

            const newNotif = {
                id: payload.notification?.id || `notif-${Date.now()}`,
                userId: user?.id || "usr-dentist-01",
                message,
                createdAt: new Date().toISOString(),
                isRead: false,
                type: "PATIENT_READY",
                ticket,
            };

            setNotifications((prev) => [newNotif, ...prev]);
            setActionMsg(`🔔 Live Notification: ${message}`);
            setTimeout(() => setActionMsg(""), 5000);
        });

        const unsubscribeNotif = realtimeService.subscribe("NOTIFICATION_CREATED", (payload) => {
            const newNotif = {
                id: payload.id || `notif-${Date.now()}`,
                userId: payload.userId || user?.id || "usr-dentist-01",
                message: payload.message || "New clinical alert received.",
                createdAt: payload.createdAt || new Date().toISOString(),
                isRead: false,
                type: payload.type || "CLINICAL_ALERT",
            };

            setNotifications((prev) => [newNotif, ...prev]);
            setActionMsg(`🔔 Alert: ${newNotif.message}`);
            setTimeout(() => setActionMsg(""), 4000);
        });

        return () => {
            unsubscribeCall();
            unsubscribeNotif();
        };
    }, [user]);

    // Mark single notification as read / unread
    const toggleReadStatus = async (notifId) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notifId ? { ...n, isRead: !n.isRead } : n))
        );

        try {
            await apiClient.post(`/api/v1/notifications/${notifId}/read`);
        } catch (_) {}
    };

    // Mark all as read
    const markAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setActionMsg("✓ All notifications marked as read.");
        setTimeout(() => setActionMsg(""), 3000);

        try {
            await apiClient.post("/api/v1/notifications/mark-all-read");
        } catch (_) {}
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const patientReadyCount = notifications.filter((n) => n.type === "PATIENT_READY").length;

    const filteredNotifications = notifications.filter((n) => {
        if (filter === "UNREAD") return !n.isRead;
        if (filter === "PATIENT_READY") return n.type === "PATIENT_READY";
        if (filter === "SYSTEM") return n.type === "SYSTEM_ALERT";
        return true;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case "PATIENT_READY":
                return "🦷";
            case "PROCEDURE_UPDATE":
                return "⚕️";
            case "VISIT_COMPLETED":
                return "✅";
            case "SYSTEM_ALERT":
                return "📢";
            default:
                return "🔔";
        }
    };

    return (
        <PageContainer
            title="Dentist Notifications Center"
            subtitle="Real-time patient alerts, queue callouts, and clinical status updates"
            actions={
                <div style={{ display: "flex", gap: "8px" }}>
                    <Link to="/dentist">
                        <Button variant="secondary" size="sm">
                            ← Return to Operatory
                        </Button>
                    </Link>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={markAllRead}
                        disabled={unreadCount === 0}
                    >
                        Mark All as Read
                    </Button>
                </div>
            }
        >
            {/* Live Notification Banner */}
            {actionMsg && (
                <div
                    style={{
                        padding: "12px 18px",
                        marginBottom: "1.25rem",
                        borderRadius: "8px",
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)",
                    }}
                >
                    <span>⚡</span>
                    <span>{actionMsg}</span>
                </div>
            )}

            {/* Notification Summary Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
                <div className="card">
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Total Notifications
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--text-main)" }}>
                        {notifications.length}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.5rem" }}>
                        All historical records
                    </p>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Unread Alerts
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "#dc2626" }}>
                        {unreadCount}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#b91c1c", marginTop: "0.5rem" }}>
                        Requiring clinical attention
                    </p>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #3b82f6" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Patients Ready
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "#2563eb" }}>
                        {patientReadyCount}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#1d4ed8", marginTop: "0.5rem" }}>
                        Called by reception
                    </p>
                </div>

                <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Sync Mode
                    </p>
                    <p style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem", color: "#059669" }}>
                        Live Real-Time
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#047857", marginTop: "0.5rem" }}>
                        WebSocket / SSE active
                    </p>
                </div>
            </div>

            {/* Notification Filter Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "1rem",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "8px",
                }}
            >
                {[
                    { key: "ALL", label: `All (${notifications.length})` },
                    { key: "UNREAD", label: `Unread (${unreadCount})` },
                    { key: "PATIENT_READY", label: `Patient Ready (${patientReadyCount})` },
                    { key: "SYSTEM", label: "System Updates" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilter(tab.key)}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: filter === tab.key ? "#2563eb" : "transparent",
                            color: filter === tab.key ? "#ffffff" : "var(--text-muted)",
                            fontWeight: filter === tab.key ? 600 : 500,
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {filteredNotifications.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                        <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>📭</span>
                        <p style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}>No notifications found</p>
                        <p style={{ fontSize: "0.875rem", marginTop: "4px" }}>
                            {filter === "UNREAD" ? "You're all caught up! No unread notifications." : "There are no notifications in this category."}
                        </p>
                    </div>
                ) : (
                    <div>
                        {filteredNotifications.map((n, idx) => (
                            <div
                                key={n.id || idx}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "1rem 1.25rem",
                                    borderBottom: idx < filteredNotifications.length - 1 ? "1px solid var(--border)" : "none",
                                    backgroundColor: n.isRead ? "transparent" : "rgba(37, 99, 235, 0.04)",
                                    transition: "background-color 0.2s ease",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                                    <span style={{ fontSize: "1.5rem", marginTop: "2px" }}>
                                        {getTypeIcon(n.type)}
                                    </span>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: "0.9375rem",
                                                    fontWeight: n.isRead ? 500 : 700,
                                                    color: "var(--text-main)",
                                                }}
                                            >
                                                {n.message}
                                            </p>
                                            {!n.isRead && (
                                                <span
                                                    style={{
                                                        padding: "2px 6px",
                                                        fontSize: "0.6875rem",
                                                        fontWeight: 700,
                                                        backgroundColor: "#dbeafe",
                                                        color: "#1d4ed8",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: "12px", marginTop: "4px", fontSize: "0.75rem", color: "var(--text-light)" }}>
                                            <span>
                                                {new Date(n.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                            {n.ticket && (
                                                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                                                    Ticket {n.ticket}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    {n.ticket && (
                                        <Link to="/dentist">
                                            <Button variant="secondary" size="sm">
                                                View Operatory
                                            </Button>
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => toggleReadStatus(n.id)}
                                        style={{
                                            border: "none",
                                            background: "none",
                                            cursor: "pointer",
                                            color: n.isRead ? "var(--text-muted)" : "#2563eb",
                                            fontSize: "0.8125rem",
                                            fontWeight: 600,
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                        }}
                                        title={n.isRead ? "Mark as unread" : "Mark as read"}
                                    >
                                        {n.isRead ? "Mark Unread" : "Mark Read"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
