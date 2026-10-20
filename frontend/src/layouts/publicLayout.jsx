import { Link, Outlet } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";

export default function PublicLayout() {
    const { user } = useAuth();
    const dashboardPath = user ? getDefaultDashboardForRole(user.role) : "/login";

    return (
        <div className="public-layout">
            <nav className="public-navbar">
                <Link to="/" className="public-brand">
                    SDCMIS-SINA
                </Link>
                <div className="public-nav-links">
                    <Link to="/" className="public-nav-link">
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

            <main className="public-content">
                <Outlet />
            </main>

            <footer className="public-footer">
                <p>&copy; {new Date().getFullYear()} SDCMIS-SINA. All rights reserved.</p>
            </footer>
        </div>
    );
}
