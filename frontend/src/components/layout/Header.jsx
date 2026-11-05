import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiLogOut, FiLogIn } from "react-icons/fi";
import { useAuth, getDefaultDashboardForRole } from "../../features/auth/auth-context";
import Button from "../common/Button";
import DentistNotificationDropdown from "../notification/DentistNotificationDropdown";

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
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <FiMenu size={20} />
                    </button>
                )}
                <Link to={brandDestination} className="header-brand">
                    Sina Dental Clinic
                </Link>
            </div>

            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Task 8: Dentist Notification Icon & Dropdown in App Header */}
                {user?.role === "DENTIST" && (
                    <DentistNotificationDropdown userId={user.id} />
                )}

                <div className="user-badge">
                    <span className="user-badge__dot" />
                    <span>{user ? user.fullName || "Connected" : "Guest"}</span>
                </div>

                {user ? (
                    <Button variant="secondary" size="sm" onClick={handleLogout} icon={<FiLogOut />}>
                        Logout
                    </Button>
                ) : (
                    <Link to="/login">
                        <Button variant="primary" size="sm" icon={<FiLogIn />}>
                            Login
                        </Button>
                    </Link>
                )}
            </div>
        </header>
    );
}
