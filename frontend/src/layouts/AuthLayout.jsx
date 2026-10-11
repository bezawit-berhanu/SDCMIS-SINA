import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-brand">
                        SDCMIS-SINA
                    </Link>
                </div>
                <Outlet />
            </div>
            <div className="auth-footer">
                <Link to="/">Back to Home</Link>
            </div>
        </div>
    );
}
