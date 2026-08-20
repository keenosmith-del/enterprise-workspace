import {
    useState,
} from "react";

import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import {
    Play,
    TerminalSquare,
    RotateCcw,
} from "lucide-react";

import "./Query.css";

import {
    executeQuery,
} from "../../api/query";


function Query({

    setLoggedIn,
    currentPage,
    setCurrentPage,

}) {

    const [query, setQuery] = useState("");

    const [results, setResults] = useState(null);

    const [queryError, setQueryError] = useState(null);

    const [queryLoading, setQueryLoading] = useState(false);


    function clearQuery() {

        setQuery("");

        setResults(null);

        setQueryError(null);

    }

    async function runQuery() {

        if (!query.trim()) return;


        setQueryLoading(true);

        setQueryError(null);

        setResults(null);


        try {

            const data =
                await executeQuery(query);

            setResults(data);

        } catch (error) {

            setQueryError(
                error.message
            );

        } finally {

            setQueryLoading(false);

        }

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


            <main className="queryPage">

                <div className="queryContent">


                    {/* ------------------------------------------------ */}
                    {/* Header */}
                    {/* ------------------------------------------------ */}

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


                        <div className="queryHeaderActions">

                            <button
                                className="queryActionButton"
                                onClick={clearQuery}
                                disabled={
                                    !query &&
                                    !results &&
                                    !queryError
                                }
                            >

                                <RotateCcw
                                    size={14}
                                    strokeWidth={1.3}
                                />

                                <span>
                                    Clear
                                </span>

                            </button>


                            <button
                                className="queryRunButton"
                                onClick={runQuery}
                                disabled={
                                    queryLoading ||
                                    !query.trim()
                                }
                            >

                                <Play
                                    size={14}
                                    strokeWidth={1.3}
                                />

                                <span>
                                    {queryLoading
                                        ? "Running..."
                                        : "Run Query"
                                    }
                                </span>

                            </button>

                        </div>

                    </header>


                    {/* ------------------------------------------------ */}
                    {/* Query editor */}
                    {/* ------------------------------------------------ */}

                    <section className="queryEditorPanel">

                        <div className="queryPanelHeader">

                            <div className="queryPanelTitle">

                                <div className="queryPanelIcon">

                                    <TerminalSquare
                                        size={15}
                                        strokeWidth={1.2}
                                    />

                                </div>

                                <div>

                                    <span className="queryPanelLabel">
                                        SQL EDITOR
                                    </span>

                                    <h2>
                                        Query
                                    </h2>

                                </div>

                            </div>


                            <span className="queryLanguage">
                                PostgreSQL
                            </span>

                        </div>


                        <textarea
                            className="queryEditor"
                            value={query}
                            onChange={(event) => {

                                setQuery(
                                    event.target.value
                                );

                                setQueryError(null);

                            }}
                            placeholder={
                                "SELECT * FROM \"Product\";"
                            }
                            spellCheck={false}
                        />

                    </section>


                    {/* ------------------------------------------------ */}
                    {/* Results */}
                    {/* ------------------------------------------------ */}

                    <section className="queryResultsPanel">

                        <div className="queryPanelHeader">

                            <div className="queryPanelTitle">

                                <div className="queryPanelIcon">

                                    <TerminalSquare
                                        size={15}
                                        strokeWidth={1.2}
                                    />

                                </div>

                                <div>

                                    <span className="queryPanelLabel">
                                        RESULTS
                                    </span>

                                    <h2>
                                        Query Results
                                    </h2>

                                </div>

                            </div>

                        </div>


                        {queryError && (

                            <div className="queryResultMessage">

                                <span>
                                    Query failed
                                </span>

                                <p>
                                    {queryError}
                                </p>

                            </div>

                        )}


                        {!queryError && !results && (

                            <div className="queryResultEmpty">

                                <TerminalSquare
                                    size={18}
                                    strokeWidth={1.2}
                                />

                                <span>
                                    Run a query to see results.
                                </span>

                            </div>

                        )}


                        {results && (

                            <div className="queryResults">

                                {results.columns.length === 0 ? (

                                    <div className="queryResultEmpty">

                                        <TerminalSquare
                                            size={18}
                                            strokeWidth={1.2}
                                        />

                                        <span>
                                            Query executed successfully. No rows returned.
                                        </span>

                                    </div>

                                ) : (

                                    <>

                                        <div className="queryResultMeta">

                                            <span>
                                                {results.rowCount}{" "}
                                                {results.rowCount === 1
                                                    ? "row"
                                                    : "rows"}
                                            </span>

                                        </div>


                                        <div className="queryResultTableWrapper">

                                            <table className="queryResultTable">

                                                <thead>

                                                    <tr>

                                                        {results.columns.map(
                                                            column => (

                                                                <th key={column}>

                                                                    {column}

                                                                </th>

                                                            )
                                                        )}

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {results.rows.map(
                                                        (row, rowIndex) => (

                                                            <tr
                                                                key={rowIndex}
                                                            >

                                                                {results.columns.map(
                                                                    column => (

                                                                        <td
                                                                            key={column}
                                                                        >

                                                                            {row[column] === null
                                                                                ? (
                                                                                    <span className="queryNullValue">
                                                                                        NULL
                                                                                    </span>
                                                                                )
                                                                                : String(
                                                                                    row[column]
                                                                                )}

                                                                        </td>

                                                                    )
                                                                )}

                                                            </tr>

                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    </>

                                )}

                            </div>

                        )}

                    </section>


                </div>

            </main>

        </main>

    );

}


export default Query;