import { Link, Outlet } from "react-router-dom";
import Button from "../components/common/Button";

export default function PublicLayout() {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("sdcmis_access_token") : null;

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
                    {token ? (
                        <Link to="/dashboard">
                            <Button variant="primary" size="sm">
                                Open Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/login">
                            <Button variant="primary" size="sm">
                                Login
                            </Button>
                        </Link>
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
