import "./TextInput.css";
import { useState } from "react";

function TextInput({
    label,
    type = "text",
    placeholder,
    inputRef,
    onKeyDown,
    value,
    onChange,
    error,
}) {
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";

    return (
        <div className="textInput">

            <label>{label}</label>

            <div className="inputWrapper">

                <input
                    ref={inputRef}
                    className={error ? "error" : ""}
                    type={
                        isPassword && showPassword
                            ? "text"
                            : type
                    }
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    onKeyDown={onKeyDown}
                />

                {isPassword && (

                    <span
                        className="togglePassword"
                        onClick={() =>
                            setShowPassword(!showPassword)
                        }
                    >
                        {showPassword ? "Hide" : "Show"}
                    </span>

                )}

            </div>

        </div>
    );
}

export default TextInput;