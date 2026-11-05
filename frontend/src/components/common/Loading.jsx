export default function Loading({
    message = "Loading...",
    size = "md",
    inline = false,
}) {
    return (
        <div className={`loading-wrapper ${inline ? "loading-wrapper--inline" : ""}`} role="status" aria-live="polite">
            <div className={`loading-spinner loading-spinner--${size}`} aria-hidden="true" />
            {message && <p className="loading-text">{message}</p>}
        </div>
    );
}
