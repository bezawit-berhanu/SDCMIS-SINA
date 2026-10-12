import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiclient";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage";
import Loading from "../components/common/Loading";

export default function LoginPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            setError("Please provide both email/username and password.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Attempt login via configured apiClient to /api/v1/auth/login
            const response = await apiClient.post("/api/v1/auth/login", {
                email: username.trim(),
                password,
            });

            const token =
                response.data?.data?.accessToken ||
                response.data?.accessToken;

            if (!token) {
                throw new Error("No access token was returned by the server.");
            }

            sessionStorage.setItem("sdcmis_access_token", token);
            navigate("/dashboard");
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
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your SDCMIS-SINA account</p>

            <ErrorMessage message={error} onDismiss={() => setError("")} />

            <form onSubmit={handleSubmit} style={{ marginTop: "1.25rem" }}>
                <div className="form-group">
                    <label className="form-label" htmlFor="username">
                        Username / Email
                    </label>
                    <input
                        id="username"
                        type="text"
                        className="form-input"
                        placeholder="Enter your username"
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
            </form>
        </div>
    );
}
