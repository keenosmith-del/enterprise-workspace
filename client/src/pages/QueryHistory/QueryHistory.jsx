import {
    useEffect,
    useState,
} from "react";

import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import {
    History,
    TerminalSquare,
    Trash2,
} from "lucide-react";

import "./QueryHistory.css";


function QueryHistory({

    setLoggedIn,
    currentPage,
    setCurrentPage,

}) {

    const [queryHistory, setQueryHistory] =
        useState([]);


    useEffect(() => {

        try {

            const saved =
                localStorage.getItem(
                    "workspace-query-history"
                );

            setQueryHistory(
                saved
                    ? JSON.parse(saved)
                    : []
            );

        } catch {

            setQueryHistory([]);

        }

    }, []);


    function restoreQuery(queryText) {

        const savedState =
            localStorage.getItem(
                "workspace-query-state"
            );

        let queryState = {

            query: queryText,

            results: null,

            queryError: null,

            queryExecutionTime: null,

            currentResultPage: 1,

            resultPageSize: 20,

        };

        try {

            if (savedState) {

                queryState = {

                    ...queryState,

                    ...JSON.parse(savedState),

                    query: queryText,

                };

            }

        } catch (error) {

            console.error(
                "Failed to restore query state:",
                error
            );

        }

        localStorage.setItem(
            "workspace-query-state",
            JSON.stringify(queryState)
        );

        setCurrentPage("query");

    }


    function clearHistory() {

        localStorage.removeItem(
            "workspace-query-history"
        );

        setQueryHistory([]);

    }


    function formatQueryDate(timestamp) {

        if (!timestamp) return "";

        const date =
            new Date(timestamp);

        return date.toLocaleString(
            undefined,
            {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    }


    return (

        <main className="app">

            <Background />

            <WorkspaceMenu
                setLoggedIn={setLoggedIn}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                queryMode
            />


            <main className="queryHistoryPage">

                <div className="queryHistoryContent">


                    {/* ------------------------------------------------ */}
                    {/* Header */}
                    {/* ------------------------------------------------ */}

                    <header className="queryHistoryHeader">

                        <div>

                            <span className="queryHistoryEyebrow">
                                DATABASE
                            </span>

                            <h1>
                                Query History
                            </h1>

                            <p>
                                Previously executed SQL queries.
                            </p>

                        </div>


                        {queryHistory.length > 0 && (

                            <button
                                className="queryHistoryClearButton"
                                onClick={clearHistory}
                            >

                                <Trash2
                                    size={14}
                                    strokeWidth={1.2}
                                />

                                <span>
                                    Clear History
                                </span>

                            </button>

                        )}

                    </header>


                    {/* ------------------------------------------------ */}
                    {/* History panel */}
                    {/* ------------------------------------------------ */}

                    <section className="queryHistoryPanel">

                        <div className="queryHistoryPanelHeader">

                            <div className="queryHistoryPanelTitle">

                                <div className="queryHistoryPanelIcon">

                                    <History
                                        size={15}
                                        strokeWidth={1.2}
                                    />

                                </div>

                                <div>

                                    <span className="queryHistoryPanelLabel">
                                        RECENT QUERIES
                                    </span>

                                    <h2>
                                        Query History
                                    </h2>

                                </div>

                            </div>


                            {queryHistory.length > 0 && (

                                <span className="queryHistoryCount">

                                    {queryHistory.length}
                                    {" "}
                                    {queryHistory.length === 1
                                        ? "query"
                                        : "queries"}

                                </span>

                            )}

                        </div>


                        {/* ------------------------------------------------ */}
                        {/* Empty state */}
                        {/* ------------------------------------------------ */}

                        {queryHistory.length === 0 && (

                            <div className="queryHistoryEmpty">

                                <TerminalSquare
                                    size={18}
                                    strokeWidth={1.2}
                                />

                                <span>
                                    No queries have been executed yet.
                                </span>

                            </div>

                        )}


                        {/* ------------------------------------------------ */}
                        {/* Query list */}
                        {/* ------------------------------------------------ */}

                        {queryHistory.length > 0 && (

                            <div className="queryHistoryList">

                                {queryHistory.map(
                                    item => (

                                        <button
                                            key={item.id}
                                            className="queryHistoryItem"
                                            onClick={() =>
                                                restoreQuery(
                                                    item.query
                                                )
                                            }
                                        >

                                            <div className="queryHistoryItemIcon">

                                                <TerminalSquare
                                                    size={14}
                                                    strokeWidth={1.2}
                                                />

                                            </div>


                                            <div className="queryHistoryItemContent">

                                                <code>
                                                    {item.query}
                                                </code>

                                                <span>
                                                    {formatQueryDate(
                                                        item.timestamp
                                                    )}
                                                </span>

                                            </div>


                                        </button>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                </div>

            </main>

        </main>

    );

}


export default QueryHistory;