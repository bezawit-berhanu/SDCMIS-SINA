import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function ErrorMessage({
    message,
    onDismiss,
    retry,
}) {
    if (!message) return null;

    return (
        <div className="error-message" role="alert">
            <span className="error-message__icon" aria-hidden="true">
                <FiAlertTriangle />
            </span>
            <div className="error-message__content">{message}</div>
            {retry && (
                <button
                    type="button"
                    className="error-message__retry"
                    onClick={retry}
                >
                    Retry
                </button>
            )}
            {onDismiss && (
                <button
                    type="button"
                    className="error-message__close"
                    onClick={onDismiss}
                    aria-label="Dismiss message"
                >
                    <FiX />
                </button>
            )}
        </div>
    );
}
