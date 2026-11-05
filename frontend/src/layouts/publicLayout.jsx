import { Link, Outlet } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";

export default function PublicLayout() {
    const { user } = useAuth();
    const dashboardPath = user ? getDefaultDashboardForRole(user.role) : "/login";

    return (
        <div className="public-layout" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-page)" }}>
            <nav className="public-navbar" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 2rem",
                backgroundColor: "var(--bg-surface)",
                borderBottom: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)"
            }}>
                <Link to="/" className="public-brand" style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    textDecoration: "none",
                }}>
                    Sina Dental Clinic
                </Link>
                <div className="public-nav-links" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Link to="/" className="public-nav-link" style={{
                        color: "var(--text-muted)",
                        textDecoration: "none",
                        fontWeight: 500,
                        fontSize: "0.875rem"
                    }}>
                        Home
                    </Link>
                    {user ? (
                        <Link to={dashboardPath}>
                            <Button variant="primary" size="sm">
                                Open Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <Link to="/login">
                                <Button variant="secondary" size="sm">
                                    Login
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="primary" size="sm">
                                    Register
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            <main className="public-content" style={{ flex: 1 }}>
                <Outlet />
            </main>

            <footer className="public-footer" style={{
                textAlign: "center",
                padding: "1rem",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--bg-surface)"
            }}>
                <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Sina Dental Clinic</p>
            </footer>
        </div>
    );
}
