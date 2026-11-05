/**
 * StatusBadge Component
 * Implements SRS NFR-USE-03:
 * "Status indicators (queue status, procedure status) shall always pair a color cue with a text label,
 * never color alone, to remain usable for color-blind users."
 */

const STATUS_CONFIGS = {
    // Queue Statuses
    WAITING: {
        label: "Waiting",
        color: "#b45309",
        bg: "#fef3c7",
        border: "#fde68a",
    },
    SERVING: {
        label: "Serving",
        color: "#2e7d32",
        bg: "#e8f5e9",
        border: "#a5d6a7",
    },
    DONE: {
        label: "Done",
        color: "#374151",
        bg: "#f3f4f6",
        border: "#e5e7eb",
    },
    // Procedure Statuses
    NEXT: {
        label: "Next Procedure",
        color: "#b45309",
        bg: "#fef3c7",
        border: "#fde68a",
    },
    ONGOING: {
        label: "Ongoing Treatment",
        color: "#1565c0",
        bg: "#e3f2fd",
        border: "#90caf9",
    },
    // Appointment Statuses
    UPCOMING: {
        label: "Upcoming",
        color: "#2e7d32",
        bg: "#e8f5e9",
        border: "#a5d6a7",
    },
    MISSED: {
        label: "Missed / No-Show",
        color: "#c62828",
        bg: "#ffebee",
        border: "#ffcdd2",
    },
    ATTENDED: {
        label: "Attended",
        color: "#2e7d32",
        bg: "#e8f5e9",
        border: "#a5d6a7",
    },
};

export default function StatusBadge({ status, text, size = "md" }) {
    if (!status) return null;

    const normalized = String(status).toUpperCase();
    const config = STATUS_CONFIGS[normalized] || {
        label: status,
        color: "var(--text-main)",
        bg: "var(--bg-page)",
        border: "var(--border)",
    };

    const displayText = text || config.label;
    const padding = size === "sm" ? "2px 6px" : "4px 8px";
    const fontSize = size === "sm" ? "0.75rem" : "0.8125rem";

    return (
        <span
            className="status-badge"
            data-status={normalized}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding,
                fontSize,
                fontWeight: 600,
                color: config.color,
                backgroundColor: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: "4px",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
            }}
        >
            <span
                style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: config.color,
                    display: "inline-block",
                }}
                aria-hidden="true"
            />
            <span>{displayText}</span>
        </span>
    );
}
