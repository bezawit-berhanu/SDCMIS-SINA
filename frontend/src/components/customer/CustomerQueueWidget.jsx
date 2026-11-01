import { useState, useEffect } from "react";
import customerService from "../../services/customer.service";
import { signalRService } from "../../services/signalr.service";

/**
 * CustomerQueueWidget (SCR-13)
 * Displays authenticated patient's real-time queue status:
 * - Your Queue Number: #...
 * - Position: ...
 * - Status: WAITING / SERVING / DONE
 *
 * Real-time updates:
 * - When receptionist calls customer: WAITING -> SERVING
 * - When visit completes: SERVING -> DONE
 */
export default function CustomerQueueWidget({ initialQueue = null, patientId = null }) {
    const [queue, setQueue] = useState(initialQueue);
    const [liveCalled, setLiveCalled] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchPosition = async () => {
            if (patientId) {
                const pos = await customerService.getMyQueuePosition(patientId);
                if (isMounted && pos && (pos.inQueue || pos.queueNumber)) {
                    setQueue(pos);
                }
            }
        };

        if (!initialQueue) {
            fetchPosition();
        }

        // Subscribe to live queue updates
        const unsubscribe = customerService.subscribeLiveQueueUpdates((payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket;
            const myTicket = queue?.formattedQueueNumber;

            if (payload.newStatus === "SERVING" && (ticket === myTicket || !myTicket)) {
                setQueue((prev) => (prev ? {
                    ...prev,
                    status: "SERVING",
                    position: 0,
                    dentist: payload.dentist || prev.dentist || "Dr. Assigned Dentist",
                } : null));
                setLiveCalled(true);
            } else if (payload.status === "DONE" && (ticket === myTicket)) {
                setQueue((prev) => (prev ? {
                    ...prev,
                    status: "DONE",
                    position: 0,
                } : null));
            } else if (payload.position !== undefined && ticket === myTicket) {
                setQueue((prev) => (prev ? {
                    ...prev,
                    position: payload.position,
                    status: payload.status || prev.status,
                } : null));
            }
        });

        const unsubSignalR = signalRService.on("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket;
            if (ticket && queue?.formattedQueueNumber === ticket) {
                setLiveCalled(true);
                setQueue((prev) => (prev ? { ...prev, status: "SERVING", position: 0 } : null));
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
            unsubSignalR();
        };
    }, [patientId, initialQueue, queue?.formattedQueueNumber]);

    if (!queue || (!queue.inQueue && !queue.queueNumber && !queue.formattedQueueNumber)) {
        return (
            <div
                className="card"
                data-testid="customer-queue-widget"
                style={{
                    marginBottom: "1.5rem",
                    border: "1px dashed var(--border)",
                    backgroundColor: "var(--bg-surface)",
                    padding: "1.25rem",
                    textAlign: "center",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-muted)" }}>
                    <span style={{ fontSize: "1.25rem" }}>⏳</span>
                    <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: "var(--text-main)" }}>
                            Not Checked into Today's Clinic Queue
                        </p>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                            Upon arriving at Sina Dental Clinic, the reception desk will check you in and allocate your live ticket number.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isServing = queue.status === "SERVING";
    const isWaiting = queue.status === "WAITING";
    const isDone = queue.status === "DONE" || queue.status === "COMPLETED";

    return (
        <div
            className="card"
            data-testid="customer-queue-widget"
            style={{
                marginBottom: "1.5rem",
                border: isServing ? "2px solid var(--primary)" : "1px solid var(--border)",
                backgroundColor: isServing ? "rgba(27, 77, 46, 0.04)" : "var(--bg-surface)",
                boxShadow: isServing ? "var(--shadow-md)" : "var(--shadow-sm)",
                transition: "all 0.3s ease",
            }}
        >
            {liveCalled && (
                <div
                    style={{
                        padding: "8px 12px",
                        marginBottom: "12px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(27, 77, 46, 0.1)",
                        color: "var(--primary)",
                        border: "1px solid var(--border)",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>📢</span>
                    <span>It is your turn! Please proceed to Chairside Operatory.</span>
                </div>
            )}

            <div className="card__header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 className="card__title" style={{ color: "var(--primary)" }}>
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
                        backgroundColor: isServing ? "rgba(27, 77, 46, 0.15)" : isDone ? "rgba(100, 116, 139, 0.1)" : "rgba(234, 179, 8, 0.12)",
                        color: isServing ? "var(--primary)" : isDone ? "var(--text-muted)" : "#b45309",
                        border: "1px solid var(--border)",
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
                        {queue.formattedQueueNumber || `#${String(queue.queueNumber || 1).padStart(3, "0")}`}
                    </p>
                </div>

                <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                        Position
                    </p>
                    <p data-testid="queue-position-value" style={{ fontSize: "1.75rem", fontWeight: 800, color: isServing ? "var(--primary)" : "var(--text-main)", marginTop: "4px" }}>
                        {isServing ? "Serving Now" : isDone ? "Completed" : queue.position !== null ? queue.position : "1"}
                    </p>
                    {isWaiting && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                            {queue.position > 1 ? `${queue.position - 1} ahead of you` : "You are next in line"}
                        </span>
                    )}
                </div>

                <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-page)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                        Status
                    </p>
                    <p data-testid="queue-status-text" style={{ fontSize: "1.75rem", fontWeight: 800, color: isServing ? "var(--primary)" : "#b45309", marginTop: "4px" }}>
                        {queue.status}
                    </p>
                </div>
            </div>
        </div>
    );
}
