import { NavLink } from "react-router-dom";
import { useAuth, UserRole } from "../../features/auth/auth-context";

export default function Sidebar({ isOpen = false, onClose }) {
    const { user } = useAuth();

    const navItems = [
        { path: "/dentist", label: "Dentist Dashboard", icon: "🦷", roles: [UserRole.DENTIST] },
        { path: "/patients", label: "Patient Directory", icon: "👥", roles: [UserRole.DENTIST, UserRole.RECEPTIONIST] },
        { path: "/dentist/tasks", label: "Upcoming Tasks", icon: "📌", roles: [UserRole.DENTIST] },
        { path: "/appointments/missed", label: "Missed Appointments", icon: "⚠️", roles: [UserRole.DENTIST, UserRole.RECEPTIONIST] },
        { path: "/dentist/notifications", label: "Notification History", icon: "🔔", roles: [UserRole.DENTIST] },
        { path: "/receptionist", label: "Receptionist Desk", icon: "📋", roles: [UserRole.RECEPTIONIST] },
        { path: "/receptionist/customers", label: "Customers & Fees", icon: "💰", roles: [UserRole.RECEPTIONIST] },
        { path: "/customer", label: "Customer Portal", icon: "👤", roles: [UserRole.CUSTOMER] },
        { path: "/help", label: "Help & FAQs", icon: "❓" },
        { path: "/settings", label: "Settings", icon: "⚙️" },
        { path: "/", label: "Home Page", icon: "🏠" },
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
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}

