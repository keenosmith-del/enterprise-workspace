import "./IconButton.css";

function IconButton({
    icon: Icon,
    onClick
}) {
    return (
        <button
            className="iconButton"
            onClick={onClick}
        >
            <Icon
                size={20}
                strokeWidth={1}
            />
        </button>
    );
}

export default IconButton;