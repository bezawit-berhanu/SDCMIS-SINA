import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register, user } = useAuth();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // If already authenticated, redirect directly to appropriate dashboard
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

        try {
            await register({
                fullName: fullName.trim(),
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                password,
            });

            setSuccessMessage("Account created successfully! You can now log in.");
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1800);
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
            <h1 className="auth-title">Create an Account</h1>
            <p className="auth-subtitle">Join Sina Dental Customer Information Management</p>

            <ErrorMessage message={error} onDismiss={() => setError("")} />

            {successMessage && (
                <div
                    style={{
                        backgroundColor: "var(--success-bg)",
                        color: "var(--success)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                        textAlign: "center",
                    }}
                >
                    {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: "1.25rem" }}>
                <div className="form-group">
                    <label className="form-label" htmlFor="fullName">
                        Full Name *
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        className="form-input"
                        placeholder="Dr. / Mr. / Ms. Full Name"
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
                        placeholder="you@example.com"
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
                        placeholder="+1 555 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                        autoComplete="tel"
                    />
                    <span className="form-help">Enter at least an email or phone number.</span>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">
                        Password *
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
                        autoComplete="new-password"
                    />
                    <span className="form-help">
                        Min. 8 characters with uppercase, lowercase, number, and symbol.
                    </span>
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">
                        Confirm Password *
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
                        autoComplete="new-password"
                    />
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? <Loading inline size="sm" message="Creating account..." /> : "Register"}
                    </Button>
                </div>

                <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Already have an account? </span>
                    <Link to="/login" style={{ color: "var(--primary)", fontWeight: 500 }}>
                        Sign In
                    </Link>
                </div>
            </form>
        </div>
    );
}
