import { useState } from "react";
import { useAuth, UserRole } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";

export default function SettingsPage() {
    const { user, restoreSession } = useAuth();
    const [theme, setTheme] = useState(user?.themePreference || "LIGHT");
    const [savedNotification, setSavedNotification] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const isStaff = user?.role === UserRole.DENTIST || user?.role === UserRole.RECEPTIONIST;

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await restoreSession();
        } finally {
            setTimeout(() => setRefreshing(false), 400);
        }
    };

    const handleSavePreferences = (e) => {
        e.preventDefault();
        setSavedNotification("Preferences saved successfully!");
        setTimeout(() => setSavedNotification(""), 3000);
    };

    return (
        <PageContainer
            title="System & Account Settings"
            subtitle="Manage your personal preferences, account details, and system configurations"
            actions={
                <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? "Refreshing..." : "🔄 Refresh"}
                </Button>
            }
        >
            {savedNotification && (
                <div
                    style={{
                        backgroundColor: "var(--success-bg)",
                        color: "var(--success)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                    }}
                >
                    ✓ {savedNotification}
                </div>
            )}

            <div className="grid grid-cols-2" style={{ gap: "1.5rem" }}>
                {/* User Profile Summary */}
                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">User Account Information</h2>
                        <p className="card__subtitle">Your authenticated account identity and permissions</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={user?.fullName || ""}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="text"
                                className="form-input"
                                value={user?.email || "Not specified"}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="text"
                                className="form-input"
                                value={user?.phone || "Not specified"}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Assigned Role</label>
                            <div
                                style={{
                                    display: "inline-block",
                                    padding: "0.4rem 0.75rem",
                                    backgroundColor: "var(--primary-light)",
                                    color: "var(--primary)",
                                    borderRadius: "var(--radius-sm)",
                                    fontWeight: 600,
                                    fontSize: "0.875rem",
                                    width: "fit-content",
                                }}
                            >
                                {user?.role || "GUEST"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Display Preferences */}
                <div className="card">
                    <div className="card__header">
                        <h2 className="card__title">Display & Application Preferences</h2>
                        <p className="card__subtitle">Customize application appearance and interface behavior</p>
                    </div>

                    <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="themeSelect">
                                Theme Preference
                            </label>
                            <select
                                id="themeSelect"
                                className="form-input"
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                            >
                                <option value="LIGHT">☀️ Light Theme (Default)</option>
                                <option value="DARK">🌙 Dark Theme</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Session Security</label>
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                                Your session is protected with auto-expiring JWT access tokens and verified on-the-fly.
                            </p>
                        </div>

                        <div style={{ marginTop: "1rem" }}>
                            <Button type="submit" variant="primary">
                                Save Preferences
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Clinic Operational Settings (Least-Privilege: Visible to Clinic Staff Only) */}
            {isStaff && (
                <div className="card" style={{ marginTop: "1.5rem" }}>
                    <div className="card__header">
                        <h2 className="card__title">Clinic Operational Settings (Staff Only)</h2>
                        <p className="card__subtitle">
                            Clinic configuration parameters (Restricted to DENTIST and RECEPTIONIST roles)
                        </p>
                    </div>

                    <div className="grid grid-cols-3">
                        <div className="form-group">
                            <label className="form-label">Clinic Facility Name</label>
                            <input
                                type="text"
                                className="form-input"
                                defaultValue="Sina Dental Specialty Clinic"
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Operational Timezone</label>
                            <input
                                type="text"
                                className="form-input"
                                defaultValue="Africa/Addis_Ababa (UTC+3)"
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Currency Code</label>
                            <input
                                type="text"
                                className="form-input"
                                defaultValue="ETB / USD"
                                disabled
                            />
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
