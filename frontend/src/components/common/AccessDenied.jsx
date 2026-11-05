import { Link } from "react-router-dom";
import { FiShieldOff } from "react-icons/fi";
import { useAuth, getDefaultDashboardForRole } from "../../features/auth/auth-context";
import Button from "./Button";

export default function AccessDenied({ message, requiredRoles }) {
    const { user } = useAuth();
    const authorizedDashboard = getDefaultDashboardForRole(user?.role);

    return (
        <div style={{ maxWidth: "600px", margin: "3rem auto", padding: "1.5rem" }}>
            <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
                <div style={{ fontSize: "2.5rem", color: "var(--danger)", marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
                    <FiShieldOff />
                </div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-main)" }}>
                    Access Denied
                </h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
                    {message || "You do not have the required role or permissions to access this page."}
                </p>

                {user && (
                    <div
                        style={{
                            display: "inline-block",
                            padding: "0.5rem 1rem",
                            backgroundColor: "var(--bg-page)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border)",
                            marginBottom: "1.5rem",
                            fontSize: "0.8125rem",
                            color: "var(--text-main)",
                        }}
                    >
                        <strong>Your Current Role:</strong> {user.role || "None"}
                        {requiredRoles && requiredRoles.length > 0 && (
                            <span style={{ display: "block", marginTop: "0.25rem", color: "var(--text-muted)" }}>
                                <strong>Required Role(s):</strong> {Array.isArray(requiredRoles) ? requiredRoles.join(", ") : requiredRoles}
                            </span>
                        )}
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
                    <Link to={authorizedDashboard || "/dashboard"}>
                        <Button variant="primary">Return to Dashboard</Button>
                    </Link>
                    <Link to="/">
                        <Button variant="secondary">Go to Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
