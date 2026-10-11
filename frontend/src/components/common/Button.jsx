export default function Button({
    children,
    type = "button",
    variant = "primary",
    disabled = false,
    onClick,
    className = "",
    size = "md",
    fullWidth = false,
    ...rest
}) {
    // Shared button keeping styling and behavior consistent and clean across pages
    const classes = [
        "button",
        `button--${variant}`,
        size !== "md" ? `button--${size}` : "",
        fullWidth ? "button--full" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    );
}
