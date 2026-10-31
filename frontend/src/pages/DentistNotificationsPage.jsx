import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import { realtimeService } from "../services/realtime.service";
import { signalRService } from "../services/signalr.service";
import { apiClient } from "../lib/api-client";

export default function DentistNotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("ALL"); // ALL | UNREAD | PATIENT_READY | SYSTEM
    const [actionMsg, setActionMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch initial notifications strictly from live backend API
    useEffect(() => {
        let isMounted = true;
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get("/api/v1/notifications");
                if (isMounted && response?.data) {
                    const list = response.data.notifications || response.data.data || (Array.isArray(response.data) ? response.data : []);
                    setNotifications(list);
                }
            } catch (_) {
                // In offline or empty state, start with zero notifications
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchNotifications();
        return () => {
            isMounted = false;
        };
    }, []);

    // Subscribe to live real-time notifications via SignalR and realtimeService
    useEffect(() => {
        realtimeService.connect({
            role: "DENTIST",
            userId: user?.id || "usr-dentist-01",
        });

        const unsubscribeCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket || `#${String(payload.queueNumber || 1).padStart(3, "0")}`;
            const message = payload.notification?.message || `Patient ${ticket} is ready for treatment.`;

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

        const unsubscribeSignalRNotif = signalRService.on("NOTIFICATION_CREATED", (payload) => {
            const newNotif = {
                id: payload.id || `notif-sig-${Date.now()}`,
                userId: payload.userId || user?.id || "usr-dentist-01",
                message: payload.message || "Live SignalR alert received.",
                createdAt: payload.createdAt || new Date().toISOString(),
                isRead: false,
                type: payload.type || "SIGNALR_ALERT",
            };
            setNotifications((prev) => {
                if (prev.some((n) => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
            });
        });

        return () => {
            unsubscribeCall();
            unsubscribeNotif();
            unsubscribeSignalRNotif();
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
        if (filter === "SYSTEM") return n.type === "SYSTEM_ALERT" || n.type === "SIGNALR_ALERT";
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
            case "SIGNALR_ALERT":
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
                        backgroundColor: "rgba(27, 77, 46, 0.08)",
                        color: "var(--primary)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                    }}
                >
                    <span>⚡</span>
                    <span>{actionMsg}</span>
                </div>
            )}

            {/* Notification Summary Stats */}
            <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
                <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Total Notifications
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--primary)" }}>
                        {notifications.length}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-light)", marginTop: "0.5rem" }}>
                        All historical records
                    </p>
                </div>

                <div className="card" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "4px solid #ef4444", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
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

                <div className="card" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--primary)", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Patients Ready
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--primary)" }}>
                        {patientReadyCount}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--primary-hover)", marginTop: "0.5rem" }}>
                        Called by reception
                    </p>
                </div>

                <div className="card" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--accent)", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        Sync Mode
                    </p>
                    <p style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--primary)" }}>
                        SignalR Active
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                        Bidirectional WebSocket
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
                            backgroundColor: filter === tab.key ? "var(--primary)" : "transparent",
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
            <div className="card" style={{ padding: 0, overflow: "hidden", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
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
                                    backgroundColor: n.isRead ? "transparent" : "rgba(27, 77, 46, 0.04)",
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
                                                        backgroundColor: "rgba(27, 77, 46, 0.12)",
                                                        color: "var(--primary)",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: "4px 0 0 0", fontSize: "0.75rem", color: "var(--text-light)" }}>
                                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleReadStatus(n.id)}
                                    >
                                        {n.isRead ? "Mark Unread" : "Mark Read"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    );
}
