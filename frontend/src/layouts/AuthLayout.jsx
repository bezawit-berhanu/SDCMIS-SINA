import { Outlet } from "react-router-dom";

/**
 * Minimalist Auth Layout for Sina Dental Clinic
 * Displays exclusively the centered authentication card container with a soft greenish tint.
 */
export default function AuthLayout() {
    return (
        <div
            className="auth-layout"
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "1.5rem",
                backgroundColor: "var(--bg-page)",
            }}
        >
            <div
                className="auth-card"
                style={{
                    width: "100%",
                    maxWidth: "460px",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "2.25rem 2rem",
                    boxShadow: "0 4px 20px rgba(27, 77, 46, 0.08)",
                }}
            >
                <Outlet />
            </div>
        </div>
    );
}
