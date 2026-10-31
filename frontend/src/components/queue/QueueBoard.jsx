import { useState, useEffect } from "react";
import Button from "../common/Button";
import { realtimeService } from "../../services/realtime.service";
import apiClient from "../../services/apiclient";

/**
 * SCR-12: Queue Management Board
 * 3-Column Kanban Board (WAITING, SERVING, DONE)
 * Accessible to: Receptionist (full control), Dentist (read view)
 * Per SDCIMP SRS Section 5.4, FR-REC-03 - FR-REC-07, BR-24, BR-27, BR-28.
 */
export default function QueueBoard({ readOnly = false }) {
    const [queueEntries, setQueueEntries] = useState([
        {
            id: "q-101",
            ticket: "#001",
            patientName: "Abebe Bikila",
            serviceType: "Orthodontics",
            checkInTime: "08:45 AM",
            status: "DONE",
            dentist: "Dr. Bethel",
        },
        {
            id: "q-102",
            ticket: "#002",
            patientName: "Hana Bekele",
            serviceType: "General",
            checkInTime: "09:15 AM",
            status: "SERVING",
            dentist: "Dr. Bethel",
        },
        {
            id: "q-103",
            ticket: "#003",
            patientName: "Dawit Wolde",
            serviceType: "Cosmetics",
            checkInTime: "09:30 AM",
            status: "WAITING",
            dentist: "Dr. Bethel",
        },
        {
            id: "q-104",
            ticket: "#004",
            patientName: "Tigist Assefa",
            serviceType: "Periodontics",
            checkInTime: "09:40 AM",
            status: "WAITING",
            dentist: "Dr. Bethel",
        },
    ]);
    const [actionFeedback, setActionFeedback] = useState("");

    // Real-time synchronization
    useEffect(() => {
        const unsubCall = realtimeService.subscribe("PATIENT_CALLED", (payload) => {
            const ticket = payload.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setQueueEntries((prev) =>
                    prev.map((e) => (e.ticket === ticket ? { ...e, status: "SERVING" } : e))
                );
            }
        });

        const unsubComplete = realtimeService.subscribe("VISIT_COMPLETED", (payload) => {
            const ticket = payload.queueEntry?.formattedQueueNumber || payload.ticket;
            if (ticket) {
                setQueueEntries((prev) =>
                    prev.map((e) => (e.ticket === ticket ? { ...e, status: "DONE" } : e))
                );
            }
        });

        const unsubStatus = realtimeService.subscribe("QUEUE_STATUS_CHANGED", (payload) => {
            const ticket = payload.formattedQueueNumber;
            const newStatus = payload.newStatus || payload.status;
            if (ticket && newStatus) {
                setQueueEntries((prev) =>
                    prev.map((e) => (e.ticket === ticket ? { ...e, status: newStatus } : e))
                );
            }
        });

        return () => {
            unsubCall();
            unsubComplete();
            unsubStatus();
        };
    }, []);

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
            notification: { message: `Patient ${entry.ticket} is ready.` },
        });

        setActionFeedback(`Called ${entry.patientName} (${entry.ticket}). Dentist notified.`);
        setTimeout(() => setActionFeedback(""), 4000);
    };

    // Action: Complete Visit (SERVING -> DONE, auto-advances next patient)
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
    const doneList = queueEntries.filter((e) => e.status === "DONE");

    const columns = [
        {
            id: "WAITING",
            title: "Waiting in Lobby",
            count: waitingList.length,
            items: waitingList,
            headerBg: "#fef3c7",
            headerColor: "#92400e",
            badgeBg: "#fde68a",
        },
        {
            id: "SERVING",
            title: "Serving / In Chair",
            count: servingList.length,
            items: servingList,
            headerBg: "#e0f2fe",
            headerColor: "#0369a1",
            badgeBg: "#bae6fd",
        },
        {
            id: "DONE",
            title: "Completed Today",
            count: doneList.length,
            items: doneList,
            headerBg: "#dcfce7",
            headerColor: "#166534",
            badgeBg: "#bbf7d0",
        },
    ];

    return (
        <div>
            {actionFeedback && (
                <div
                    role="alert"
                    style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#ecfdf5",
                        color: "#065f46",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                        fontWeight: "600",
                        border: "1px solid #a7f3d0",
                    }}
                >
                    ⚡ {actionFeedback}
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
                            backgroundColor: "var(--bg-card, #f8fafc)",
                            borderRadius: "10px",
                            border: "1px solid var(--border-color, #e2e8f0)",
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
                            }}
                        >
                            <span>{col.title}</span>
                            <span
                                style={{
                                    backgroundColor: col.badgeBg,
                                    borderRadius: "9999px",
                                    padding: "0.15rem 0.55rem",
                                    fontSize: "0.8rem",
                                }}
                            >
                                {col.count}
                            </span>
                        </div>

                        {/* Column Cards */}
                        <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {col.items.length === 0 ? (
                                <div
                                    style={{
                                        padding: "2rem 1rem",
                                        textAlign: "center",
                                        color: "#94a3b8",
                                        fontSize: "0.875rem",
                                        border: "1px dashed #cbd5e1",
                                        borderRadius: "8px",
                                    }}
                                >
                                    No patients currently {col.title.toLowerCase()}.
                                </div>
                            ) : (
                                col.items.map((entry) => (
                                    <div
                                        key={entry.id}
                                        style={{
                                            backgroundColor: "#ffffff",
                                            borderRadius: "8px",
                                            padding: "1rem",
                                            border: "1px solid #e2e8f0",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                                                    color: "var(--primary-color, #0284c7)",
                                                }}
                                            >
                                                {entry.ticket}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#64748b",
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
                                                color: "#1e293b",
                                            }}
                                        >
                                            {entry.patientName}
                                        </h4>
                                        <p
                                            style={{
                                                margin: "0 0 0.75rem",
                                                fontSize: "0.825rem",
                                                color: "#64748b",
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
                                            >
                                                📢 Call to Chair (Alert Dentist)
                                            </Button>
                                        )}

                                        {!readOnly && col.id === "SERVING" && (
                                            <Button
                                                variant="success"
                                                size="sm"
                                                style={{
                                                    width: "100%",
                                                    backgroundColor: "#16a34a",
                                                    color: "#ffffff",
                                                    border: "none",
                                                }}
                                                onClick={() => handleCompleteVisit(entry)}
                                            >
                                                ✓ Complete Visit & Auto-Advance
                                            </Button>
                                        )}

                                        {col.id === "DONE" && (
                                            <span
                                                style={{
                                                    display: "block",
                                                    textAlign: "center",
                                                    fontSize: "0.75rem",
                                                    color: "#166534",
                                                    fontWeight: "600",
                                                    padding: "0.25rem",
                                                    backgroundColor: "#f0fdf4",
                                                    borderRadius: "4px",
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

