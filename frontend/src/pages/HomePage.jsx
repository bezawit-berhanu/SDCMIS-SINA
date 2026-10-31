import { Link } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";

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
                        padding: "0.25rem 0.85rem",
                        borderRadius: "9999px",
                        backgroundColor: "rgba(14, 165, 233, 0.12)",
                        color: "#0284c7",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        marginBottom: "1rem",
                    }}
                >
                    SDCIMP v2.0 • SINA DENTAL PRACTICE PLATFORM
                </span>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                    Sina Dental Customer Information Management Platform
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
                                <Button variant="outline" size="lg">
                                    Patient Registration
                                </Button>
                            </Link>
                        </>
                    )}
                    <Link to="/help">
                        <Button variant="secondary" size="lg">
                            System Help & FAQs
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Three-Role Core Value Cards per SRS Section 1.4 */}
            <div className="grid grid-cols-3" style={{ marginBottom: "3rem" }}>
                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🩺</div>
                        <h2 className="card__title">Dentist (Dr. Bethel)</h2>
                        <p className="card__subtitle">
                            Single at-a-glance clinical picture: Next/Ongoing/Done procedures, upcoming tasks, missed appointments reschedule, and instant queue alerts.
                        </p>
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛎️</div>
                        <h2 className="card__title">Receptionist (Selam)</h2>
                        <p className="card__subtitle">
                            Live 3-column front-desk queue (Waiting, Serving, Done), single-tap Call alerting the dentist chair, auto-advance, and fee payment recording.
                        </p>
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👤</div>
                        <h2 className="card__title">Customer (Yonas)</h2>
                        <p className="card__subtitle">
                            Self-service transparency: personal treatment history, next procedure, upcoming appointment date, fee balance, and live queue position.
                        </p>
                    </div>
                </div>
            </div>

            {/* Architectural Guarantees */}
            <div className="grid grid-cols-3">
                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚡</div>
                        <h3 className="card__title" style={{ fontSize: "1.1rem" }}>Instant Real-Time Sync</h3>
                        <p className="card__subtitle">WebSocket & SSE push alerts deliver notifications with zero manual browser refreshing.</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔒</div>
                        <h3 className="card__title" style={{ fontSize: "1.1rem" }}>Strict Data Isolation</h3>
                        <p className="card__subtitle">Rigorous RBAC and patient data ownership policies enforce 403 Forbidden on cross-patient tampering.</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💰</div>
                        <h3 className="card__title" style={{ fontSize: "1.1rem" }}>Precise Fee Ledgers</h3>
                        <p className="card__subtitle">Fixed-point arithmetic guarantees consistent remaining fee computations clinic-wide.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
