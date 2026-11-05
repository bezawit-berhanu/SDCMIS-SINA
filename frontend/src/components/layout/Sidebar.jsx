import { NavLink } from "react-router-dom";
import {
    FiActivity,
    FiUsers,
    FiCheckSquare,
    FiClock,
    FiBell,
    FiList,
    FiDollarSign,
    FiUser,
    FiHelpCircle,
    FiSettings,
    FiHome,
} from "react-icons/fi";
import { useAuth, UserRole } from "../../features/auth/auth-context";

export default function Sidebar({ isOpen = false, onClose }) {
    const { user } = useAuth();

    const navItems = [
        { path: "/dentist", label: "Dentist Dashboard", icon: <FiActivity />, roles: [UserRole.DENTIST] },
        { path: "/patients", label: "Patient Directory", icon: <FiUsers />, roles: [UserRole.DENTIST, UserRole.RECEPTIONIST] },
        { path: "/dentist/tasks", label: "Upcoming Tasks", icon: <FiCheckSquare />, roles: [UserRole.DENTIST] },
        { path: "/appointments/missed", label: "Missed Appointments", icon: <FiClock />, roles: [UserRole.DENTIST, UserRole.RECEPTIONIST] },
        { path: "/dentist/notifications", label: "Notification History", icon: <FiBell />, roles: [UserRole.DENTIST] },
        { path: "/receptionist", label: "Queue Desk", icon: <FiList />, roles: [UserRole.RECEPTIONIST] },
        { path: "/receptionist/customers", label: "Customers & Fees", icon: <FiDollarSign />, roles: [UserRole.RECEPTIONIST] },
        { path: "/customer", label: "My Dental Record", icon: <FiUser />, roles: [UserRole.CUSTOMER] },
        { path: "/help", label: "Help & FAQ", icon: <FiHelpCircle /> },
        { path: "/settings", label: "Settings", icon: <FiSettings /> },
        { path: "/", label: "Home", icon: <FiHome /> },
    ];

    // Filter items based on user role (if roles array is specified on the item)
    const visibleNavItems = navItems.filter(
        (item) => !item.roles || (user?.role && item.roles.includes(user.role))
    );

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
            <aside className={`app-sidebar ${isOpen ? "app-sidebar--open" : ""}`}>
                <nav className="sidebar-nav">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? "sidebar-link--active" : ""}`
                            }
                        >
                            <span className="sidebar-icon" style={{ display: "flex", alignItems: "center" }}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
