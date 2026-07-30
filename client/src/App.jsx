import { useEffect, useState } from "react";

import Login from "./pages/Login/Login";
import Workspace from "./pages/Workspace/Workspace";

function App() {

    const [loggedIn, setLoggedIn] = useState(() => {

        return localStorage.getItem("workspace-logged-in") === "true";

    });

    useEffect(() => {

        localStorage.setItem(
            "workspace-logged-in",
            loggedIn
        );

    }, [loggedIn]);

    return loggedIn ? (
        <Workspace setLoggedIn={setLoggedIn} />
    ) : (
        <Login setLoggedIn={setLoggedIn} />
    );

}

export default App;