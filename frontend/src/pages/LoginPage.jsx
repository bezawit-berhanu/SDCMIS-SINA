import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, getDefaultDashboardForRole } from "../features/auth/auth-context";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fromPath = location.state?.from?.pathname || location.state?.from;
    const returnTarget = (fromPath && fromPath !== "/login" && fromPath !== "/register")
        ? fromPath
        : null;

    // If already authenticated, redirect directly to intended destination or role dashboard
    useEffect(() => {
        if (user) {
            navigate(returnTarget || getDefaultDashboardForRole(user.role), { replace: true });
        }
    }, [user, navigate, returnTarget]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            setError("Please provide both email/username and password.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const loggedInUser = await login({
                email: username.trim(),
                password,
            });

            const target = returnTarget || getDefaultDashboardForRole(loggedInUser?.role);
            navigate(target, { replace: true });
        } catch (err) {
            const errorMessage =
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                (err.response?.status === 401
                    ? "Invalid email or password."
                    : err.message || "Failed to sign in. Please check your credentials and server connection.");
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", textAlign: "center", marginBottom: "1.5rem", letterSpacing: "-0.01em" }}>
                Sina Dental Clinic
            </h1>

            <ErrorMessage message={error} onDismiss={() => setError("")} />

            <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
                <div className="form-group">
                    <label className="form-label" htmlFor="username">
                        Username / Email
                    </label>
                    <input
                        id="username"
                        type="text"
                        className="form-input"
                        placeholder="Enter your email or username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        required
                        autoComplete="username"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">
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
                        autoComplete="current-password"
                    />
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? <Loading inline size="sm" message="Signing in..." /> : "Sign In"}
                    </Button>
                </div>

                <div style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Don't have an account? </span>
                    <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
                        Sign Up
                    </Link>
                </div>
            </form>
        </div>
    );
}
