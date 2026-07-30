import "./PrimaryButton.css";
import { ArrowRight } from "lucide-react";

function PrimaryButton({
    children,
    ...props
}) {
    return (
        <button
            className="primaryButton"
            {...props}
        >

            <span className="buttonLabel">
                {children}
            </span>

            <span className="buttonArrow">
                <ArrowRight
                    size={18}
                    strokeWidth={2}
                />
            </span>

        </button>
    );
}

export default PrimaryButton;