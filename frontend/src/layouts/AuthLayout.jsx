import { Outlet } from "react-router-dom";

/**
 * Minimalist Auth Layout for Sina Dental Clinic
 * Displays exclusively the centered authentication card container with a clean creamish/white palette.
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
                    maxWidth: "440px",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "2rem",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                }}
            >
                <Outlet />
            </div>
        </div>
    );
}
