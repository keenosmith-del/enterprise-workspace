import {
    useEffect,
    useState,
} from "react";

import "./WorkspaceModeBanner.css";

import {
    Pencil,
    Trash2,
} from "lucide-react";

function WorkspaceModeBanner({
    editMode,
    deleteMode,
}) {

    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);

    const active = editMode || deleteMode;

    useEffect(() => {

        if (!active) {

            setClosing(true);

            const timeout = setTimeout(() => {

                setVisible(false);
                setClosing(false);

            }, 400);

            return () => clearTimeout(timeout);

        }

        setVisible(true);
        setClosing(false);

        const timeout = setTimeout(() => {

            setClosing(true);

        }, 3000);

        return () => clearTimeout(timeout);

    }, [active]);

    if (!visible) {
        return null;
    }

    const isEditMode = editMode;

    return (

        <div
            className={`
                workspaceModeBanner
                ${closing ? "workspaceModeBannerClosing" : ""}
            `}
        >

            {isEditMode ? (
                <Pencil
                    size={15}
                    strokeWidth={1.25}
                />
            ) : (
                <Trash2
                    size={15}
                    strokeWidth={1.25}
                />
            )}

            <span className="workspaceModeBannerTitle">

                {isEditMode
                    ? "Edit Mode — Select a Table"
                    : "Delete Mode — Select a Table"
                }

            </span>

            <span className="workspaceModeBannerHint">

                ESC to cancel

            </span>

        </div>

    );

}

export default WorkspaceModeBanner;