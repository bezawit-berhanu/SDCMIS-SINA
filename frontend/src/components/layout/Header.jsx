import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";

export default function Header({ onToggleSidebar, isSidebarOpen }) {
    const navigate = useNavigate();
    const token = typeof window !== "undefined" ? sessionStorage.getItem("sdcmis_access_token") : null;

    const handleLogout = () => {
        sessionStorage.removeItem("sdcmis_access_token");
        navigate("/login");
    };

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
                <Link to="/dashboard" className="header-brand">
                    SDCMIS-SINA
                </Link>
            </div>

            <div className="header-right">
                <div className="user-badge">
                    <span className="user-badge__dot" />
                    <span>{token ? "Connected" : "Guest"}</span>
                </div>

                {token ? (
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
