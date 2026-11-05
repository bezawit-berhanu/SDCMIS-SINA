import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUserCheck, FiActivity, FiUserPlus } from "react-icons/fi";
import { useAuth, getDefaultDashboardForRole, UserRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";

/**
 * SCR-02: Sina Dental Clinic Registration Page
 * Pure, uncluttered registration form with light-green actions and React Icons.
 */
export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, user } = useAuth();

    // Classification: 'PATIENT' | 'STAFF'
    const [accountCategory, setAccountCategory] = useState("PATIENT");
    // For staff: 'DENTIST' | 'RECEPTIONIST'
    const [staffRole, setStaffRole] = useState(UserRole.DENTIST);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [staffCode, setStaffCode] = useState("");
    const [specialty, setSpecialty] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (user) {
            navigate(getDefaultDashboardForRole(user.role), { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fullName.trim()) {
            setError("Full name is required.");
            return;
        }

        if (!email.trim() && !phone.trim()) {
            setError("Please provide at least an email address or phone number.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
            setError("Password must include at least one uppercase letter, one lowercase letter, one number, and one special symbol.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMessage("");

        const chosenRole = accountCategory === "STAFF" ? staffRole : UserRole.CUSTOMER;

        try {
            await register({
                fullName: fullName.trim(),
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                password,
                role: chosenRole,
                staffCode: accountCategory === "STAFF" ? staffCode.trim() : undefined,
                specialty: accountCategory === "STAFF" && staffRole === UserRole.DENTIST ? specialty.trim() : undefined,
            });

            setSuccessMessage("Account created successfully. Redirecting to login...");
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1200);
        } catch (err) {
            const serverMsg =
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                err.message ||
                "Failed to register. Please try again.";
            setError(serverMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-main)", textAlign: "center", marginBottom: "1.25rem" }}>
                Sina Dental Clinic
            </h1>

            {/* Account Category Classification Tabs: Patient vs Staff */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    backgroundColor: "var(--bg-page)",
                    padding: "4px",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    border: "1px solid var(--border)",
                }}
            >
                <button
                    type="button"
                    onClick={() => setAccountCategory("PATIENT")}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        backgroundColor: accountCategory === "PATIENT" ? "var(--primary)" : "transparent",
                        color: accountCategory === "PATIENT" ? "#ffffff" : "var(--text-muted)",
                    }}
                >
                    Patient
                </button>
                <button
                    type="button"
                    onClick={() => setAccountCategory("STAFF")}
                    style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        backgroundColor: accountCategory === "STAFF" ? "var(--primary)" : "transparent",
                        color: accountCategory === "STAFF" ? "#ffffff" : "var(--text-muted)",
                    }}
                >
                    Staff
                </button>
            </div>

            {/* Staff Role Differentiation: Dentist vs Receptionist */}
            {accountCategory === "STAFF" && (
                <div
                    style={{
                        padding: "0.75rem",
                        backgroundColor: "var(--primary-light)",
                        borderRadius: "6px",
                        marginBottom: "1rem",
                        border: "1px solid var(--border)",
                    }}
                >
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "0.375rem" }}>
                        Staff Role
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <button
                            type="button"
                            onClick={() => setStaffRole(UserRole.DENTIST)}
                            style={{
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid",
                                borderColor: staffRole === UserRole.DENTIST ? "var(--primary)" : "var(--border)",
                                backgroundColor: staffRole === UserRole.DENTIST ? "#ffffff" : "transparent",
                                color: staffRole === UserRole.DENTIST ? "var(--primary-hover)" : "var(--text-muted)",
                                fontWeight: 600,
                                fontSize: "0.8125rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                            }}
                        >
                            <FiActivity /> Dentist
                        </button>
                        <button
                            type="button"
                            onClick={() => setStaffRole(UserRole.RECEPTIONIST)}
                            style={{
                                padding: "0.5rem",
                                borderRadius: "4px",
                                border: "1px solid",
                                borderColor: staffRole === UserRole.RECEPTIONIST ? "var(--primary)" : "var(--border)",
                                backgroundColor: staffRole === UserRole.RECEPTIONIST ? "#ffffff" : "transparent",
                                color: staffRole === UserRole.RECEPTIONIST ? "var(--primary-hover)" : "var(--text-muted)",
                                fontWeight: 600,
                                fontSize: "0.8125rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                            }}
                        >
                            <FiUserCheck /> Receptionist
                        </button>
                    </div>
                </div>
            )}

            <ErrorMessage message={error} onDismiss={() => setError("")} />

            {successMessage && (
                <div
                    style={{
                        backgroundColor: "var(--primary-light)",
                        color: "#2e7d32",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #c8e6c9",
                        marginBottom: "1rem",
                        fontSize: "0.85rem",
                    }}
                >
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                    <label className="form-label" htmlFor="fullName" style={{ display: "block", marginBottom: "0.25rem" }}>
                        Full Name
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        className="form-input"
                        placeholder="Enter full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email" style={{ display: "block", marginBottom: "0.25rem" }}>
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="phone" style={{ display: "block", marginBottom: "0.25rem" }}>
                            Phone
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            className="form-input"
                            placeholder="Phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password" style={{ display: "block", marginBottom: "0.25rem" }}>
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword" style={{ display: "block", marginBottom: "0.25rem" }}>
                            Confirm
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>

                {accountCategory === "STAFF" && staffRole === UserRole.DENTIST && (
                    <div className="form-group" style={{ marginBottom: "0.75rem" }}>
                        <label className="form-label" htmlFor="specialty" style={{ display: "block", marginBottom: "0.25rem" }}>
                            Clinical Specialty
                        </label>
                        <input
                            id="specialty"
                            type="text"
                            className="form-input"
                            placeholder="e.g. Orthodontics, General"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    disabled={loading}
                    icon={<FiUserPlus />}
                >
                    {loading ? <Loading inline size="sm" message="Creating..." /> : "Create Account"}
                </Button>

                <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Already have an account? </span>
                    <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
                        Sign In
                    </Link>
                </div>
            </form>
        </div>
    );
}
