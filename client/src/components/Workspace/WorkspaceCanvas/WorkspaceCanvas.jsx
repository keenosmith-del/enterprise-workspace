import { forwardRef } from "react";

import "./WorkspaceCanvas.css";

import WorkspaceState from "../WorkspaceState/WorkspaceState";

const WorkspaceCanvas = forwardRef(function WorkspaceCanvas({

    children,
    noSearchResults,

}, ref) {

    return (

        <main
            ref={ref}
            className="workspaceCanvas"
        >

            {children}

            {noSearchResults && (

                <WorkspaceState />

            )}

        </main>

    );

});

export default WorkspaceCanvas;