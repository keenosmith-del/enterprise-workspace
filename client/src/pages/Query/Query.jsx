import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import "./Query.css";

function Query({

    setLoggedIn,
    currentPage,
    setCurrentPage,

    products,
    categories,
    suppliers,
    customTables,
    customRecords,

    loadDatabase,

}) {

    return (

        <main className="app">

            <Background />

            <WorkspaceMenu
                setLoggedIn={setLoggedIn}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                queryMode
            />

            <main className="queryPage">

                <header className="queryHeader">

                    <div>

                        <span className="queryEyebrow">
                            DATABASE
                        </span>

                        <h1>
                            Query
                        </h1>

                        <p>
                            Build and execute database queries.
                        </p>

                    </div>

                </header>

            </main>

        </main>

    );

}

export default Query;