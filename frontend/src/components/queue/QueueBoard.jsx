import { useState, useEffect, useCallback } from "react";
import { FiBell, FiCheckCircle, FiInfo } from "react-icons/fi";
import Button from "../common/Button";
import { realtimeService } from "../../services/realtime.service";
import { signalRService } from "../../services/signalr.service";
import apiClient from "../../services/apiclient";

/**
 * SCR-12: Queue Management Board
 * 3-Column Kanban Board (WAITING, SERVING, DONE)
 * Accessible to: Receptionist (full control), Dentist (read view)
 * Per SDCIMP SRS Section 5.4, FR-REC-03 - FR-REC-07, BR-24, BR-27, BR-28.
 */
export default function QueueBoard({ readOnly = false }) {
    const [queueEntries, setQueueEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFeedback, setActionFeedback] = useState("");

    const fetchLiveQueue = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiClient.get("/api/v1/queue");
            if (res.data?.queue && Array.isArray(res.data.queue)) {
                const formatted = res.data.queue.map((item) => ({
                    id: item.id,
                    ticket: item.formattedQueueNumber || `#${String(item.queueNumber || 1).padStart(3, "0")}`,
                    patientName: item.patientName || item.customerName || "Patient",
                    serviceType: item.serviceType || "Clinical Consultation",
                    checkInTime: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
                    status: item.status || "WAITING",
                    dentist: item.dentistName || "Dr. Staff",
                }));
                setQueueEntries(formatted);
            } else if (Array.isArray(res.data?.data)) {
                const formatted = res.data.data.map((item) => ({
                    id: item.id,
                    ticket: item.formattedQueueNumber || `#${String(item.queueNumber || 1).padStart(3, "0")}`,
                    patientName: item.patientName || item.customerName || "Patient",
                    serviceType: item.serviceType || "Clinical Consultation",
                    checkInTime: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today",
                    status: item.status || "WAITING",
                    dentist: item.dentistName || "Dr. Staff",
                }));
                setQueueEntries(formatted);
            } else {
                setQueueEntries([]);
            }
        } catch (_) {
            setQueueEntries([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch & Real-time synchronization
    useEffect(() => {
        fetchLiveQueue();

        const unsubCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            fetchLiveQueue();
            const ticket = payload.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setActionFeedback(`Patient ${ticket} called to operatory.`);
                setTimeout(() => setActionFeedback(""), 4000);
            }
        });

        const unsubComplete = realtimeService.subscribe("VISIT_COMPLETED", (payload) => {
            fetchLiveQueue();
            const ticket = payload.queueEntry?.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setActionFeedback(`Visit completed for ${ticket}.`);
                setTimeout(() => setActionFeedback(""), 4000);
            }
        });

        const unsubStatus = realtimeService.subscribe("QUEUE_STATUS_CHANGED", () => {
            fetchLiveQueue();
        });

        const unsubQueueUpdated = realtimeService.subscribe("QUEUE_UPDATED", () => {
            fetchLiveQueue();
        });

        const unsubSignalRQueue = signalRService.on("QUEUE_UPDATED", () => {
            fetchLiveQueue();
        });

        return () => {
            unsubCall();
            unsubComplete();
            unsubStatus();
            unsubQueueUpdated();
            unsubSignalRQueue();
        };
    }, [fetchLiveQueue]);

    // Action: Call Patient (WAITING -> SERVING, sends Dentist push notification)
    const handleCallPatient = async (entry) => {
        try {
            await apiClient.post(`/api/v1/queue/${entry.id}/call`);
        } catch (_) {}

        setQueueEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, status: "SERVING" } : e))
        );

        realtimeService.publish("PATIENT_CALLED", {
            ticket: entry.ticket,
            formattedQueueNumber: entry.ticket,
            patientName: entry.patientName,
            serviceType: entry.serviceType,
            notification: { message: `Patient ${entry.ticket} is ready.` },
        });

        setActionFeedback(`Called ${entry.patientName} (${entry.ticket}). Dentist notified.`);
        setTimeout(() => setActionFeedback(""), 4000);
    };

    // Action: Complete Visit (SERVING -> DONE, auto-advances next patient per BR-28)
    const handleCompleteVisit = async (entry) => {
        try {
            await apiClient.post(`/api/v1/queue/${entry.id}/complete`);
        } catch (_) {}

        let nextPatient = null;
        setQueueEntries((prev) => {
            const updated = prev.map((e) => (e.id === entry.id ? { ...e, status: "DONE" } : e));
            // Find next waiting patient for auto-advance per BR-28
            const nextWaiting = updated.find((e) => e.status === "WAITING");
            if (nextWaiting && !readOnly) {
                nextPatient = nextWaiting;
                return updated.map((e) => (e.id === nextWaiting.id ? { ...e, status: "SERVING" } : e));
            }
            return updated;
        });

        realtimeService.publish("VISIT_COMPLETED", {
            ticket: entry.ticket,
            queueEntry: { formattedQueueNumber: entry.ticket, status: "DONE" },
        });

        if (nextPatient) {
            realtimeService.publish("PATIENT_CALLED", {
                ticket: nextPatient.ticket,
                formattedQueueNumber: nextPatient.ticket,
                patientName: nextPatient.patientName,
                serviceType: nextPatient.serviceType,
                notification: { message: `Auto-Advanced: Patient ${nextPatient.ticket} is ready.` },
            });
            setActionFeedback(`Visit completed for ${entry.patientName}. Auto-advanced ${nextPatient.patientName} (${nextPatient.ticket}) to SERVING.`);
        } else {
            setActionFeedback(`Visit completed for ${entry.patientName} (${entry.ticket}).`);
        }
        setTimeout(() => setActionFeedback(""), 4000);
    };

    const waitingList = queueEntries.filter((e) => e.status === "WAITING");
    const servingList = queueEntries.filter((e) => e.status === "SERVING");
    const doneList = queueEntries.filter((e) => e.status === "DONE" || e.status === "COMPLETED");

    const columns = [
        {
            id: "WAITING",
            title: "Waiting in Lobby",
            count: waitingList.length,
            items: waitingList,
            headerBg: "rgba(234, 179, 8, 0.1)",
            headerColor: "#b45309",
            badgeBg: "#fef3c7",
        },
        {
            id: "SERVING",
            title: "Serving / In Chair",
            count: servingList.length,
            items: servingList,
            headerBg: "#e8f5e9",
            headerColor: "#2e7d32",
            badgeBg: "#c8e6c9",
        },
        {
            id: "DONE",
            title: "Completed Today",
            count: doneList.length,
            items: doneList,
            headerBg: "#f3f4f6",
            headerColor: "#374151",
            badgeBg: "#e5e7eb",
        },
    ];

    return (
        <div>
            {actionFeedback && (
                <div
                    role="alert"
                    style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#e8f5e9",
                        color: "#2e7d32",
                        borderRadius: "6px",
                        marginBottom: "1rem",
                        fontWeight: "500",
                        border: "1px solid #c8e6c9",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <FiInfo />
                    <span>{actionFeedback}</span>
                </div>
            )}

            {/* 3-Column Kanban Board per SCR-12 */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.25rem",
                    alignItems: "start",
                }}
            >
                {columns.map((col) => (
                    <div
                        key={col.id}
                        style={{
                            backgroundColor: "var(--bg-surface)",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                            overflow: "hidden",
                        }}
                    >
                        {/* Column Header */}
                        <div
                            style={{
                                padding: "0.85rem 1rem",
                                backgroundColor: col.headerBg,
                                color: col.headerColor,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontWeight: "700",
                                fontSize: "0.95rem",
                                borderBottom: "1px solid var(--border)",
                            }}
                        >
                            <span>{col.title}</span>
                            <span
                                style={{
                                    backgroundColor: col.badgeBg,
                                    borderRadius: "9999px",
                                    padding: "0.15rem 0.55rem",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                }}
                            >
                                {col.count}
                            </span>
                        </div>

                        {/* Column Cards */}
                        <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {loading ? (
                                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                    Loading queue...
                                </div>
                            ) : col.items.length === 0 ? (
                                <div
                                    style={{
                                        padding: "2rem 1rem",
                                        textAlign: "center",
                                        color: "var(--text-muted)",
                                        fontSize: "0.875rem",
                                        border: "1px dashed var(--border)",
                                        borderRadius: "8px",
                                        backgroundColor: "var(--bg-page)",
                                    }}
                                >
                                    No patients currently {col.title.toLowerCase()}.
                                </div>
                            ) : (
                                col.items.map((entry) => (
                                    <div
                                        key={entry.id}
                                        style={{
                                            backgroundColor: "var(--bg-card)",
                                            borderRadius: "8px",
                                            padding: "1rem",
                                            border: "1px solid var(--border)",
                                            boxShadow: "var(--shadow-sm)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "0.5rem",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontFamily: "monospace",
                                                    fontWeight: "800",
                                                    fontSize: "1.1rem",
                                                    color: "var(--primary)",
                                                }}
                                            >
                                                {entry.ticket}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {entry.checkInTime}
                                            </span>
                                        </div>

                                        <h4
                                            style={{
                                                margin: "0 0 0.25rem",
                                                fontSize: "0.95rem",
                                                fontWeight: "600",
                                                color: "var(--text-main)",
                                            }}
                                        >
                                            {entry.patientName}
                                        </h4>
                                        <p
                                            style={{
                                                margin: "0 0 0.75rem",
                                                fontSize: "0.825rem",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            {entry.serviceType} • {entry.dentist}
                                        </p>

                                        {/* Actions based on State */}
                                        {!readOnly && col.id === "WAITING" && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                style={{ width: "100%" }}
                                                onClick={() => handleCallPatient(entry)}
                                                icon={<FiBell />}
                                            >
                                                Call Patient
                                            </Button>
                                        )}

                                        {!readOnly && col.id === "SERVING" && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                style={{
                                                    width: "100%",
                                                }}
                                                onClick={() => handleCompleteVisit(entry)}
                                                icon={<FiCheckCircle />}
                                            >
                                                Complete Visit
                                            </Button>
                                        )}

                                        {col.id === "DONE" && (
                                            <span
                                                style={{
                                                    display: "block",
                                                    textAlign: "center",
                                                    fontSize: "0.75rem",
                                                    color: "var(--primary)",
                                                    fontWeight: "600",
                                                    padding: "0.25rem",
                                                    backgroundColor: "rgba(27, 77, 46, 0.08)",
                                                    borderRadius: "4px",
                                                    border: "1px solid var(--border)",
                                                }}
                                            >
                                                Visit Concluded
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
