function GlassPanel({
    children,
    className = "",
    ...props
}) {
    return (
        <section
            className={`glassPanel ${className}`}
            {...props}
        >
            {children}
        </section>
    );
}

export default GlassPanel;