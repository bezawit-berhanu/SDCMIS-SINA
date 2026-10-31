import { Component } from "react";
import Button from "./Button";

/**
 * Global ErrorBoundary to catch unhandled rendering exceptions
 * and prevent blank white screens per SDCIMP NFR-REL-01.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("SDCIMP Uncaught Error Boundary Catch:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "2rem",
                        backgroundColor: "var(--bg-main, #f8fafc)",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "520px",
                            width: "100%",
                            backgroundColor: "#ffffff",
                            padding: "2.5rem",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                width: "64px",
                                height: "64px",
                                margin: "0 auto 1.5rem",
                                borderRadius: "50%",
                                backgroundColor: "#fee2e2",
                                color: "#ef4444",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "2rem",
                            }}
                        >
                            ⚠️
                        </div>

                        <h1
                            style={{
                                fontSize: "1.5rem",
                                fontWeight: "700",
                                color: "#1e293b",
                                marginBottom: "0.75rem",
                            }}
                        >
                            Something went wrong
                        </h1>

                        <p
                            style={{
                                fontSize: "0.95rem",
                                color: "#64748b",
                                lineHeight: "1.6",
                                marginBottom: "1.5rem",
                            }}
                        >
                            The application encountered an unexpected error while rendering this view. Your session and data remain safe.
                        </p>

                        {this.state.error && (
                            <details
                                style={{
                                    textAlign: "left",
                                    marginBottom: "1.5rem",
                                    padding: "0.75rem 1rem",
                                    backgroundColor: "#f1f5f9",
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                    color: "#334155",
                                    wordBreak: "break-word",
                                }}
                            >
                                <summary style={{ cursor: "pointer", fontWeight: "600" }}>Technical Details</summary>
                                <p style={{ marginTop: "0.5rem", fontFamily: "monospace" }}>
                                    {this.state.error.toString()}
                                </p>
                            </details>
                        )}

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                            <Button variant="primary" onClick={this.handleReset}>
                                Return to Safety (Home)
                            </Button>
                            <Button variant="secondary" onClick={() => window.location.reload()}>
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
