import { NavLink } from "react-router-dom";

export default function Sidebar({ isOpen = false, onClose }) {
    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/", label: "Home Page", icon: "🏠" },
    ];

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
            <aside className={`app-sidebar ${isOpen ? "app-sidebar--open" : ""}`}>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
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
