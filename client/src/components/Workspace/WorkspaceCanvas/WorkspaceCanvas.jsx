import "./WorkspaceCanvas.css";

import WorkspaceState from "../WorkspaceState/WorkspaceState";

function WorkspaceCanvas({

    children,
    noSearchResults,

}) {

    return (

        <main className="workspaceCanvas">

            {children}

            {noSearchResults && (

                <WorkspaceState />

            )}

        </main>

    );

}

export default WorkspaceCanvas;