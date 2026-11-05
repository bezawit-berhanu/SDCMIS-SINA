export default function Button({
    children,
    type = "button",
    variant = "primary",
    disabled = false,
    onClick,
    className = "",
    size = "md",
    fullWidth = false,
    icon = null,
    style = {},
    ...rest
}) {
    // Shared button: light green primary, clean states, supports React Icons without emojis
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
            style={style}
            {...rest}
        >
            {icon && <span className="button-icon">{icon}</span>}
            {children}
        </button>
    );
}
