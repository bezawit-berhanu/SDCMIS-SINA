import { FiLock } from "react-icons/fi";

/**
 * CustomerReadOnlyNotice
 * Accessible to: Customer
 * Enforces FR-CUS-03: Clear read-only indicator for customer self-service views.
 */
export default function CustomerReadOnlyNotice() {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.85rem",
                backgroundColor: "rgba(2, 132, 199, 0.08)",
                border: "1px solid rgba(2, 132, 199, 0.2)",
                borderRadius: "9999px",
                fontSize: "0.8rem",
                color: "#0284c7",
                fontWeight: 600,
                marginBottom: "1rem",
            }}
        >
            <FiLock size={14} />
            <span>Official SINA Clinical Record • Read-Only Self-Service View</span>
        </div>
    );
}
