import { Link, useNavigate } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../../features/auth/auth-context";
import Button from "../common/Button";

export default function Header({ onToggleSidebar, isSidebarOpen }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const brandDestination = user ? getDefaultDashboardForRole(user.role) : "/";

    return (
        <header className="app-header">
            <div className="header-left">
                {onToggleSidebar && (
                    <button
                        type="button"
                        className="menu-toggle"
                        onClick={onToggleSidebar}
                        aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
                    >
                        ☰
                    </button>
                )}
                <Link to={brandDestination} className="header-brand">
                    SDCMIS-SINA
                </Link>
            </div>

            <div className="header-right">
                <div className="user-badge">
                    <span className="user-badge__dot" />
                    <span>{user ? user.fullName || "Connected" : "Guest"}</span>
                </div>

                {user ? (
                    <Button variant="secondary" size="sm" onClick={handleLogout}>
                        Logout
                    </Button>
                ) : (
                    <Link to="/login">
                        <Button variant="primary" size="sm">
                            Login
                        </Button>
                    </Link>
                )}
            </div>
        </header>
    );
}
