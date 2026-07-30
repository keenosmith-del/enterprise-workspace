import "./Toast.css";
import { useEffect, useState } from "react";

function Toast({

    message,
    type = "info",
    visible,
    duration = 3000,
    onClose,

}) {

    const [closing, setClosing] = useState(false);

    useEffect(() => {

        if (!visible) {

            setClosing(false);

            return;

        }

        const closeTimer = setTimeout(() => {

            setClosing(true);

        }, duration);

        const removeTimer = setTimeout(() => {

            setClosing(false);

            onClose?.();

        }, duration + 300);

        return () => {

            clearTimeout(closeTimer);
            clearTimeout(removeTimer);

        };

    }, [visible, duration, onClose]);

    if (!visible) return null;

    return (

        <div
            className={`toast ${closing ? "toastClosing" : ""}`}
        >

            {message}

        </div>

    );

}

export default Toast;