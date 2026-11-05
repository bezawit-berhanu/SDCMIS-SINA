import { Link } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";
import { FiActivity, FiBell, FiUser, FiZap, FiLock, FiDollarSign } from "react-icons/fi";

/**
 * SCR-01 & Landing Page per SDCIMP SRS Section 2.6 and Executive Summary.
 * Direct access to role workflows and system help.
 */
export default function HomePage() {
    const { user } = useAuth();
    const dashboardPath = user ? getDefaultDashboardForRole(user.role) : "/login";

    return (
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "3rem 1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <span
                    style={{
                        display: "inline-block",
                        padding: "0.35rem 1rem",
                        borderRadius: "9999px",
                        backgroundColor: "rgba(37, 99, 235, 0.08)",
                        color: "var(--primary)",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        border: "1px solid var(--border)",
                        marginBottom: "1rem",
                    }}
                >
                    SINA DENTAL CLINIC • CLINICAL PRACTICE PLATFORM
                </span>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--primary)", letterSpacing: "-0.02em" }}>
                    Sina Dental Clinic
                </h1>
                <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", maxWidth: "680px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
                    Unified clinical and front-desk workflows: instant real-time patient queue, centralized treatment tracking, and transparent customer self-service.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {user ? (
                        <Link to={dashboardPath}>
                            <Button variant="primary" size="lg">
                                Open {user.role.charAt(0) + user.role.slice(1).toLowerCase()} Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="primary" size="lg">
                                    Sign In to Portal
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="secondary" size="lg">
                                    Register Account
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Three-Role Core Value Cards per SRS Section 1.4 */}
            <div className="grid grid-cols-3" style={{ marginBottom: "3rem" }}>
                <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderLeft: "4px solid var(--primary)" }}>
                    <div className="card__header">
                        <div style={{ marginBottom: "0.5rem" }}>
                            <FiActivity style={{ color: "var(--primary)", fontSize: "1.75rem" }} />
                        </div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Dentist Portal</h2>
                        <p className="card__subtitle">
                            Single at-a-glance clinical picture: Next/Ongoing/Done procedures, upcoming tasks, missed appointments reschedule, and instant queue alerts.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderLeft: "4px solid var(--primary)" }}>
                    <div className="card__header">
                        <div style={{ marginBottom: "0.5rem" }}>
                            <FiBell style={{ color: "var(--primary)", fontSize: "1.75rem" }} />
                        </div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Receptionist Portal</h2>
                        <p className="card__subtitle">
                            Live 3-column front-desk queue (Waiting, Serving, Done), single-tap Call alerting the dentist chair, auto-advance, and fee payment recording.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderLeft: "4px solid var(--primary)" }}>
                    <div className="card__header">
                        <div style={{ marginBottom: "0.5rem" }}>
                            <FiUser style={{ color: "var(--primary)", fontSize: "1.75rem" }} />
                        </div>
                        <h2 className="card__title" style={{ color: "var(--primary)" }}>Patient Portal</h2>
                        <p className="card__subtitle">
                            Self-service transparency: personal treatment history, next procedure, upcoming appointment date, fee balance, and live queue position.
                        </p>
                    </div>
                </div>
            </div>

            {/* Architectural Guarantees */}
            <div className="grid grid-cols-3">
                <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                    <div className="card__header">
                        <div style={{ marginBottom: "0.5rem" }}>
                            <FiZap style={{ color: "var(--primary)", fontSize: "1.25rem" }} />
                        </div>
                        <h3 className="card__title" style={{ fontSize: "1.1rem", color: "var(--primary)" }}>SignalR Real-Time Sync</h3>
                        <p className="card__subtitle">Bidirectional SignalR hub updates deliver queue transitions and callouts with zero manual refreshing.</p>
                    </div>
                </div>

                <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                    <div className="card__header">
                        <div style={{ marginBottom: "0.5rem" }}>
                            <FiLock style={{ color: "var(--primary)", fontSize: "1.25rem" }} />
                        </div>
                        <h3 className="card__title" style={{ fontSize: "1.1rem", color: "var(--primary)" }}>Strict Data Isolation</h3>
                        <p className="card__subtitle">Rigorous RBAC and patient data ownership policies enforce access control across all roles.</p>
                    </div>
                </div>

                <div className="card" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                    <div className="card__header">
                        <div style={{ marginBottom: "0.5rem" }}>
                            <FiDollarSign style={{ color: "var(--primary)", fontSize: "1.25rem" }} />
                        </div>
                        <h3 className="card__title" style={{ fontSize: "1.1rem", color: "var(--primary)" }}>Precise Fee Ledgers</h3>
                        <p className="card__subtitle">Fixed-point arithmetic guarantees consistent remaining fee computations clinic-wide in ETB.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
