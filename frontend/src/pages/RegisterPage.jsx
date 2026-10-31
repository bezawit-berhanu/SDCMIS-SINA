import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole, UserRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";

/**
 * SCR-02: Sina Dental Clinic Registration Page
 * Features classified Patient vs Staff registration (differentiating Dentist vs Receptionist)
 * Displays exclusively the title 'Sina Dental Clinic' and registration options.
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

            setSuccessMessage(`Account created successfully as ${chosenRole === UserRole.CUSTOMER ? "Patient" : chosenRole}! Redirecting to Sign In...`);
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1600);
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
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", textAlign: "center", marginBottom: "1.5rem", letterSpacing: "-0.01em" }}>
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
                    borderRadius: "8px",
                    marginBottom: "1.25rem",
                    border: "1px solid var(--border)",
                }}
            >
                <button
                    type="button"
                    onClick={() => setAccountCategory("PATIENT")}
                    style={{
                        padding: "0.6rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        backgroundColor: accountCategory === "PATIENT" ? "var(--primary)" : "transparent",
                        color: accountCategory === "PATIENT" ? "#ffffff" : "var(--text-muted)",
                    }}
                >
                    Patient Registration
                </button>
                <button
                    type="button"
                    onClick={() => setAccountCategory("STAFF")}
                    style={{
                        padding: "0.6rem 0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        backgroundColor: accountCategory === "STAFF" ? "var(--primary)" : "transparent",
                        color: accountCategory === "STAFF" ? "#ffffff" : "var(--text-muted)",
                    }}
                >
                    Staff Registration
                </button>
            </div>

            {/* Staff Role Differentiation: Dentist vs Receptionist */}
            {accountCategory === "STAFF" && (
                <div
                    style={{
                        padding: "0.85rem",
                        backgroundColor: "var(--primary-light)",
                        borderRadius: "8px",
                        marginBottom: "1.25rem",
                        border: "1px solid var(--border)",
                    }}
                >
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>
                        Select Staff Role:
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <button
                            type="button"
                            onClick={() => setStaffRole(UserRole.DENTIST)}
                            style={{
                                padding: "0.5rem",
                                borderRadius: "6px",
                                border: "1px solid",
                                borderColor: staffRole === UserRole.DENTIST ? "var(--primary)" : "var(--border)",
                                backgroundColor: staffRole === UserRole.DENTIST ? "#ffffff" : "transparent",
                                color: staffRole === UserRole.DENTIST ? "var(--primary)" : "var(--text-muted)",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                            }}
                        >
                            🩺 Dentist (Dr.)
                        </button>
                        <button
                            type="button"
                            onClick={() => setStaffRole(UserRole.RECEPTIONIST)}
                            style={{
                                padding: "0.5rem",
                                borderRadius: "6px",
                                border: "1px solid",
                                borderColor: staffRole === UserRole.RECEPTIONIST ? "var(--primary)" : "var(--border)",
                                backgroundColor: staffRole === UserRole.RECEPTIONIST ? "#ffffff" : "transparent",
                                color: staffRole === UserRole.RECEPTIONIST ? "var(--primary)" : "var(--text-muted)",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                            }}
                        >
                            🛎️ Receptionist
                        </button>
                    </div>
                </div>
            )}

            <ErrorMessage message={error} onDismiss={() => setError("")} />

            {successMessage && (
                <div
                    style={{
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                        textAlign: "center",
                        fontWeight: 600,
                    }}
                >
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="fullName">
                        Full Name *
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        className="form-input"
                        placeholder={
                            accountCategory === "STAFF"
                                ? (staffRole === UserRole.DENTIST ? "e.g. Dr. Bethel Haile" : "e.g. Selam Yohannes")
                                : "e.g. Yonas Bekele"
                        }
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="name"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="email">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        placeholder="name@sinadental.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="phone">
                        Phone Number
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        className="form-input"
                        placeholder="+251 91 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                        autoComplete="tel"
                    />
                </div>

                {/* Additional context for Staff Dentist */}
                {accountCategory === "STAFF" && staffRole === UserRole.DENTIST && (
                    <div className="form-group">
                        <label className="form-label" htmlFor="specialty">
                            Dental Specialization (Optional)
                        </label>
                        <input
                            id="specialty"
                            type="text"
                            className="form-input"
                            placeholder="e.g. Orthodontics, General Dentistry"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label" htmlFor="password">
                        Password *
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="form-input"
                        placeholder="At least 8 characters (A-Z, a-z, 0-9, symbol)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="new-password"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">
                        Confirm Password *
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        className="form-input"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="new-password"
                    />
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                    <Button type="submit" variant="primary" fullWidth disabled={loading}>
                        {loading ? (
                            <Loading inline size="sm" message="Creating account..." />
                        ) : accountCategory === "STAFF" ? (
                            `Register as Staff ${staffRole === UserRole.DENTIST ? "Dentist" : "Receptionist"}`
                        ) : (
                            "Sign Up as Patient"
                        )}
                    </Button>
                </div>

                <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Already have an account? </span>
                    <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
                        Sign In
                    </Link>
                </div>
            </form>
        </div>
    );
}
