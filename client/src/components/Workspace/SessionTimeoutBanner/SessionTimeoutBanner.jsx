import {
    Clock,
} from "lucide-react";

import "./SessionTimeoutBanner.css";


function SessionTimeoutBanner({
    secondsRemaining,
}) {

    const minutes =
        Math.floor(
            secondsRemaining / 60
        );

    const seconds =
        secondsRemaining % 60;

    const formattedTime =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    return (

        <div className="sessionTimeoutBanner">

            <Clock
                size={15}
                strokeWidth={1.25}
            />

            <span className="sessionTimeoutBannerTitle">

                Session Expiring

            </span>

            <span className="sessionTimeoutBannerHint">

                No activity detected

            </span>

            <span className="sessionTimeoutBannerTimer">

                {formattedTime}

            </span>

        </div>

    );

}


export default SessionTimeoutBanner;