import { Link } from "react-router-dom";
import Button from "../components/common/Button";

export default function HomePage() {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("sdcmis_access_token") : null;

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "3rem 1.5rem" }}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-main)" }}>
                    Spatial Data & Information Management System
                </h1>
                <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto 2rem" }}>
                    SDCMIS-SINA delivers streamlined records processing, fast spatial information handling, and dependable system management.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {token ? (
                        <Link to="/dashboard">
                            <Button variant="primary" size="lg">
                                Go to Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button variant="primary" size="lg">
                                    Sign In
                                </Button>
                            </Link>
                            <Link to="/dashboard">
                                <Button variant="outline" size="lg">
                                    View Dashboard
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3">
                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>⚡</div>
                        <h2 className="card__title">Fast & Minimalist</h2>
                        <p className="card__subtitle">Built for swift response times and minimal footprint.</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>🔒</div>
                        <h2 className="card__title">Secure Access</h2>
                        <p className="card__subtitle">Token-based request validation and protected workflows.</p>
                    </div>
                </div>

                <div className="card">
                    <div className="card__header">
                        <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>📱</div>
                        <h2 className="card__title">Fully Responsive</h2>
                        <p className="card__subtitle">Seamless experience across mobile, tablet, and desktop screens.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
