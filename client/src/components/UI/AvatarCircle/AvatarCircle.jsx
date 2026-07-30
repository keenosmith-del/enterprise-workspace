import "./AvatarCircle.css";

function AvatarCircle({
    image,
    className = ""
}) {
    return (
        <div className={`avatarCircle ${className}`}>

            <img
                src={image}
                alt=""
            />

        </div>
    );
}

export default AvatarCircle;