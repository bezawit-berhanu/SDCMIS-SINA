import { useState, useEffect } from "react";
import customerService from "../../services/customer.service";

/**
 * CustomerQueueWidget
 * Displays:
 * Your Queue Number: #007
 * Position: 2
 * Status: WAITING
 *
 * Real-time updates:
 * When receptionist calls customer:
 * WAITING -> SERVING
 */
export default function CustomerQueueWidget({ initialQueue = null, patientId = null }) {
    const [queue, setQueue] = useState(
        initialQueue || {
            queueNumber: 7,
            formattedQueueNumber: "#007",
            position: 2,
            status: "WAITING",
        }
    );
    const [liveCalled, setLiveCalled] = useState(false);

    useEffect(() => {
        // Subscribe to live queue updates
        const unsubscribe = customerService.subscribeLiveQueueUpdates((payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket;
            const myTicket = queue.formattedQueueNumber || "#007";

            // If this event is for my ticket or broadcast
            if (payload.newStatus === "SERVING" && (ticket === myTicket || !payload.formattedQueueNumber)) {
                setQueue((prev) => ({
                    ...prev,
                    status: "SERVING",
                    position: 0,
                    dentist: payload.dentist || prev.dentist || "Dr. Sara",
                }));
                setLiveCalled(true);
            } else if (payload.status === "DONE" && (ticket === myTicket)) {
                setQueue((prev) => ({
                    ...prev,
                    status: "DONE",
                    position: 0,
                }));
            } else if (payload.position !== undefined && ticket === myTicket) {
                setQueue((prev) => ({
                    ...prev,
                    position: payload.position,
                    status: payload.status || prev.status,
                }));
            }
        });

        return () => {
            unsubscribe();
        };
    }, [queue.formattedQueueNumber]);

    const isServing = queue.status === "SERVING";
    const isWaiting = queue.status === "WAITING";
    const isDone = queue.status === "DONE";

    return (
        <div
            className="card"
            data-testid="customer-queue-widget"
            style={{
                marginBottom: "1.5rem",
                border: isServing ? "2px solid #059669" : "1px solid var(--border)",
                backgroundColor: isServing ? "#f0fdf4" : "var(--bg-card)",
                boxShadow: isServing ? "0 4px 16px rgba(16, 185, 129, 0.2)" : undefined,
                transition: "all 0.3s ease",
            }}
        >
            {liveCalled && (
                <div
                    style={{
                        padding: "8px 12px",
                        marginBottom: "12px",
                        borderRadius: "6px",
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        border: "1px solid #6ee7b7",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>📢</span>
                    <span>It is your turn! Please proceed to Chairside Operatory (Dr. Sara).</span>
                </div>
            )}

            <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 className="card__title" style={{ color: isServing ? "#065f46" : undefined }}>
                        Live Dental Queue Status
                    </h2>
                    <p className="card__subtitle">Your real-time arrival check-in and waiting position</p>
                </div>
                <span
                    data-testid="queue-status-badge"
                    style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        backgroundColor: isServing ? "#d1fae5" : isDone ? "#e2e8f0" : "#eff6ff",
                        color: isServing ? "#047857" : isDone ? "#475569" : "#1d4ed8",
                        border: `1px solid ${isServing ? "#a7f3d0" : isDone ? "#cbd5e1" : "#bfdbfe"}`,
                    }}
                >
                    {queue.status}
                </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                        Your Queue Number
                    </p>
                    <p data-testid="queue-number-value" style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
                        {queue.formattedQueueNumber || `#${String(queue.queueNumber || 7).padStart(3, "0")}`}
                    </p>
                </div>

                <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                        Position
                    </p>
                    <p data-testid="queue-position-value" style={{ fontSize: "1.75rem", fontWeight: 800, color: isServing ? "#059669" : "#1e293b", marginTop: "4px" }}>
                        {isServing ? "Serving Now" : isDone ? "Completed" : queue.position !== null ? queue.position : "2"}
                    </p>
                </div>

                <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                        Status
                    </p>
                    <p data-testid="queue-status-text" style={{ fontSize: "1.75rem", fontWeight: 800, color: isServing ? "#059669" : "#2563eb", marginTop: "4px" }}>
                        {queue.status}
                    </p>
                </div>
            </div>
        </div>
    );
}
