import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/auth-context";

export default function Sidebar({ isOpen = false, onClose }) {
    const { user } = useAuth();

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
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

