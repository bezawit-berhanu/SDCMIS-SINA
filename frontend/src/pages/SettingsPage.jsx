import { useState } from "react";
import { useAuth, UserRole } from "../features/auth/auth-context";
import PageContainer from "../components/layout/PageContainer";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage";
import { FiUser, FiEdit2, FiPhone, FiLock, FiCheck, FiInfo, FiRefreshCw } from "react-icons/fi";

// Form 1: Name Update Component
function NameSettingsForm({ user, updateName }) {
    const [nameVal, setNameVal] = useState(user?.fullName || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const trimmed = nameVal.trim();
        if (!trimmed) {
            setError("Full name is required.");
            return;
        }
        if (trimmed.length > 120) {
            setError("Full name must not exceed 120 characters.");
            return;
        }

        setLoading(true);
        try {
            await updateName(trimmed);
            setSuccess("Full name updated successfully.");
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to update full name.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px" }}>
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Update Full Name</h2>
                    <p className="card__subtitle">
                        Modify your legal or professional name displayed across appointments, charts, and headers
                    </p>
                </div>

                {success && (
                    <div
                        style={{
                            backgroundColor: "var(--success-bg)",
                            color: "var(--success)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.75rem 1rem",
                            fontSize: "0.875rem",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <FiCheck />
                        <span>{success}</span>
                    </div>
                )}
                {error && (
                    <div style={{ marginBottom: "1rem" }}>
                        <ErrorMessage message={error} onDismiss={() => setError("")} />
                    </div>
                )}

                <form onSubmit={handleUpdateName} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="settingsFullNameInput">
                            Full Name <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                            id="settingsFullNameInput"
                            type="text"
                            className="form-input"
                            value={nameVal}
                            onChange={(e) => setNameVal(e.target.value)}
                            placeholder="Enter your updated full name"
                            maxLength={120}
                            required
                            disabled={loading}
                        />
                        <span className="form-help">Maximum 120 characters. Must not be blank.</span>
                    </div>

                    <div>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "Updating..." : "Update Name"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Form 2: Contact Update Component
function ContactSettingsForm({ user, updateContact }) {
    const [emailVal, setEmailVal] = useState(user?.email || "");
    const [phoneVal, setPhoneVal] = useState(user?.phone || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleUpdateContact = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const trimmedEmail = emailVal.trim();
        const trimmedPhone = phoneVal.trim();

        if (!trimmedEmail && !trimmedPhone) {
            setError("At least an email address or phone number is required.");
            return;
        }

        if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError("Please provide a valid email address.");
            return;
        }

        if (trimmedPhone) {
            const digits = trimmedPhone.replace(/\D/g, "");
            if (digits.length < 7 || digits.length > 15) {
                setError("Phone number must contain between 7 and 15 digits.");
                return;
            }
        }

        setLoading(true);
        try {
            await updateContact({
                email: trimmedEmail || null,
                phone: trimmedPhone || null,
            });
            setSuccess("Contact information updated successfully.");
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to update contact information.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px" }}>
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Update Contact Information</h2>
                    <p className="card__subtitle">
                        Manage the email address and phone number used for clinic communication, notifications, and login
                    </p>
                </div>

                {success && (
                    <div
                        style={{
                            backgroundColor: "var(--success-bg)",
                            color: "var(--success)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.75rem 1rem",
                            fontSize: "0.875rem",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <FiCheck />
                        <span>{success}</span>
                    </div>
                )}
                {error && (
                    <div style={{ marginBottom: "1rem" }}>
                        <ErrorMessage message={error} onDismiss={() => setError("")} />
                    </div>
                )}

                <form onSubmit={handleUpdateContact} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="settingsEmailInput">
                            Email Address
                        </label>
                        <input
                            id="settingsEmailInput"
                            type="email"
                            className="form-input"
                            value={emailVal}
                            onChange={(e) => setEmailVal(e.target.value)}
                            placeholder="example@domain.com"
                            disabled={loading}
                        />
                        <span className="form-help">Must be a valid email format. Used for account identification.</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="settingsPhoneInput">
                            Phone Number
                        </label>
                        <input
                            id="settingsPhoneInput"
                            type="tel"
                            className="form-input"
                            value={phoneVal}
                            onChange={(e) => setPhoneVal(e.target.value)}
                            placeholder="+251911223344"
                            disabled={loading}
                        />
                        <span className="form-help">7 to 15 digits. International format supported (e.g. +251...).</span>
                    </div>

                    <div
                        style={{
                            backgroundColor: "var(--secondary-light)",
                            padding: "0.75rem",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.8125rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <FiInfo />
                        <span><strong>Policy requirement:</strong> At least one contact method (email or phone) must remain active on your account.</span>
                    </div>

                    <div>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "Saving Contacts..." : "Update Contact"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Form 3: Password Change Component
function PasswordSettingsForm({ changePassword }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!currentPassword) {
            setError("Current password is required.");
            return;
        }
        if (!newPassword) {
            setError("New password is required.");
            return;
        }
        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }

        setLoading(true);
        try {
            await changePassword({ currentPassword, newPassword });
            setSuccess("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to change password.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px" }}>
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Change Password</h2>
                    <p className="card__subtitle">
                        Secure your account with a new password conforming to platform security policies
                    </p>
                </div>

                {success && (
                    <div
                        style={{
                            backgroundColor: "var(--success-bg)",
                            color: "var(--success)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.75rem 1rem",
                            fontSize: "0.875rem",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <FiCheck />
                        <span>{success}</span>
                    </div>
                )}
                {error && (
                    <div style={{ marginBottom: "1rem" }}>
                        <ErrorMessage message={error} onDismiss={() => setError("")} />
                    </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="currentPasswordInput">
                            Current Password <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                            id="currentPasswordInput"
                            type="password"
                            className="form-input"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="newPasswordInput">
                            New Password <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                            id="newPasswordInput"
                            type="password"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your new secure password"
                            required
                            disabled={loading}
                        />
                        <span className="form-help">
                            Minimum 8 characters. Must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
                        </span>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPasswordInput">
                            Confirm New Password <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                            id="confirmPasswordInput"
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your new password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "Changing Password..." : "Change Password"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Form 4: Profile Overview & Preferences Component
function ProfileSettingsForm({ user, updateProfile }) {
    const [profileName, setProfileName] = useState(user?.fullName || "");
    const [profileEmail, setProfileEmail] = useState(user?.email || "");
    const [profilePhone, setProfilePhone] = useState(user?.phone || "");
    const [profileTheme, setProfileTheme] = useState(user?.themePreference || "LIGHT");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const trimmedName = profileName.trim();
        const trimmedEmail = profileEmail.trim();
        const trimmedPhone = profilePhone.trim();

        if (!trimmedName) {
            setError("Full name is required.");
            return;
        }
        if (!trimmedEmail && !trimmedPhone) {
            setError("At least an email address or phone number is required.");
            return;
        }

        setLoading(true);
        try {
            await updateProfile({
                fullName: trimmedName,
                email: trimmedEmail || null,
                phone: trimmedPhone || null,
                themePreference: profileTheme,
            });
            setSuccess("Profile information updated successfully.");
            setTimeout(() => setSuccess(""), 4000);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Failed to update profile.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-2" style={{ gap: "1.5rem" }}>
            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">User Account Overview</h2>
                    <p className="card__subtitle">Your authenticated account identity and permissions</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

                    <div className="form-group">
                        <label className="form-label">Current Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={user?.fullName || ""}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Registered Email</label>
                        <input
                            type="text"
                            className="form-input"
                            value={user?.email || "Not specified"}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Registered Phone</label>
                        <input
                            type="text"
                            className="form-input"
                            value={user?.phone || "Not specified"}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <h2 className="card__title">Update Profile & Preferences</h2>
                    <p className="card__subtitle">Update your profile fields and display theme</p>
                </div>

                {success && (
                    <div
                        style={{
                            backgroundColor: "var(--success-bg)",
                            color: "var(--success)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.75rem 1rem",
                            fontSize: "0.875rem",
                            marginBottom: "1rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <FiCheck />
                        <span>{success}</span>
                    </div>
                )}
                {error && (
                    <div style={{ marginBottom: "1rem" }}>
                        <ErrorMessage message={error} onDismiss={() => setError("")} />
                    </div>
                )}

                <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="profileFullName">
                            Full Name <span style={{ color: "var(--danger)" }}>*</span>
                        </label>
                        <input
                            id="profileFullName"
                            type="text"
                            className="form-input"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="profileEmail">
                            Email Address
                        </label>
                        <input
                            id="profileEmail"
                            type="email"
                            className="form-input"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            placeholder="example@domain.com"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="profilePhone">
                            Phone Number
                        </label>
                        <input
                            id="profilePhone"
                            type="tel"
                            className="form-input"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="+251911223344"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="profileThemeSelect">
                            Display Theme Preference
                        </label>
                        <select
                            id="profileThemeSelect"
                            className="form-input"
                            value={profileTheme}
                            onChange={(e) => setProfileTheme(e.target.value)}
                            disabled={loading}
                        >
                            <option value="LIGHT">Light Theme (Default)</option>
                            <option value="DARK">Dark Theme</option>
                        </select>
                    </div>

                    <div style={{ marginTop: "0.5rem" }}>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? "Saving Changes..." : "Save Profile Information"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Main Settings Page
export default function SettingsPage() {
    const {
        user,
        restoreSession,
        updateName,
        updateContact,
        changePassword,
        updateProfile,
    } = useAuth();

    const [activeTab, setActiveTab] = useState("profile"); // "profile" | "name" | "contact" | "password"
    const [refreshing, setRefreshing] = useState(false);
    const [globalSuccess, setGlobalSuccess] = useState("");
    const [globalError, setGlobalError] = useState("");

    const isStaff = user?.role === UserRole.DENTIST || user?.role === UserRole.RECEPTIONIST;

    const handleRefresh = async () => {
        setRefreshing(true);
        setGlobalError("");
        try {
            await restoreSession();
            setGlobalSuccess("Settings refreshed from server successfully.");
            setTimeout(() => setGlobalSuccess(""), 3000);
        } catch {
            setGlobalError("Failed to refresh session from server.");
        } finally {
            setTimeout(() => setRefreshing(false), 300);
        }
    };

    return (
        <PageContainer
            title="Personal Settings"
            subtitle="Manage your personal information, contact methods, security credentials, and preferences"
            actions={
                <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing} icon={<FiRefreshCw />}>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
            }
        >
            {/* Global alerts */}
            {globalSuccess && (
                <div
                    style={{
                        backgroundColor: "var(--success-bg)",
                        color: "var(--success)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <FiCheck />
                    <span>{globalSuccess}</span>
                </div>
            )}
            {globalError && (
                <div style={{ marginBottom: "1rem" }}>
                    <ErrorMessage message={globalError} onDismiss={() => setGlobalError("")} />
                </div>
            )}

            {/* Navigation Tabs for the 4 Personal Settings */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "1.5rem",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "0.5rem",
                }}
                role="tablist"
                aria-label="Personal Settings Navigation"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "profile"}
                    onClick={() => setActiveTab("profile")}
                    style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        backgroundColor: activeTab === "profile" ? "var(--primary)" : "transparent",
                        color: activeTab === "profile" ? "#ffffff" : "var(--text-muted)",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <FiUser />
                    <span>Profile Information</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "name"}
                    onClick={() => setActiveTab("name")}
                    style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        backgroundColor: activeTab === "name" ? "var(--primary)" : "transparent",
                        color: activeTab === "name" ? "#ffffff" : "var(--text-muted)",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <FiEdit2 />
                    <span>Update Name</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "contact"}
                    onClick={() => setActiveTab("contact")}
                    style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        backgroundColor: activeTab === "contact" ? "var(--primary)" : "transparent",
                        color: activeTab === "contact" ? "#ffffff" : "var(--text-muted)",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <FiPhone />
                    <span>Update Contact</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "password"}
                    onClick={() => setActiveTab("password")}
                    style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        backgroundColor: activeTab === "password" ? "var(--primary)" : "transparent",
                        color: activeTab === "password" ? "#ffffff" : "var(--text-muted)",
                        transition: "all 0.15s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                    }}
                >
                    <FiLock />
                    <span>Change Password</span>
                </button>
            </div>

            {/* TAB 1: Profile Information */}
            {activeTab === "profile" && (
                <ProfileSettingsForm
                    key={`profile-${user?.fullName}-${user?.email}-${user?.phone}-${user?.themePreference}`}
                    user={user}
                    updateProfile={updateProfile}
                />
            )}

            {/* TAB 2: Update Name */}
            {activeTab === "name" && (
                <NameSettingsForm
                    key={`name-${user?.fullName}`}
                    user={user}
                    updateName={updateName}
                />
            )}

            {/* TAB 3: Update Contact */}
            {activeTab === "contact" && (
                <ContactSettingsForm
                    key={`contact-${user?.email}-${user?.phone}`}
                    user={user}
                    updateContact={updateContact}
                />
            )}

            {/* TAB 4: Change Password */}
            {activeTab === "password" && (
                <PasswordSettingsForm changePassword={changePassword} />
            )}

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
