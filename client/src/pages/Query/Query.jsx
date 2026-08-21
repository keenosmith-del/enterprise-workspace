import {
    useEffect,
    useState,
} from "react";

import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import {
    Play,
    TerminalSquare,
    RotateCcw,
    X,
    Copy,
} from "lucide-react";

import "./Query.css";

import {
    executeQuery,
} from "../../api/query";


function Query({

    setLoggedIn,
    currentPage,
    setCurrentPage,

    loadDatabase,

}) {

    const [query, setQuery] = useState("");

    const [results, setResults] = useState(null);

    const [queryError, setQueryError] = useState(null);

    const [queryLoading, setQueryLoading] = useState(false);

    const [currentResultPage, setCurrentResultPage] = useState(1);

    const [resultPageSize, setResultPageSize] = useState(20);

    const [queryExecutionTime, setQueryExecutionTime] =
        useState(null);

    const [showCheatsheet, setShowCheatsheet] =
        useState(false);

    const [queryStateLoaded, setQueryStateLoaded] =
        useState(false);

    const [queryHistory, setQueryHistory] =
        useState(() => {

            try {

                const saved =
                    localStorage.getItem(
                        "workspace-query-history"
                    );

                return saved
                    ? JSON.parse(saved)
                    : [];

            } catch {

                return [];

            }

        });

    useEffect(() => {

        try {

            const saved =
                localStorage.getItem(
                    "workspace-query-state"
                );

            if (saved) {

                const state =
                    JSON.parse(saved);

                setQuery(
                    state.query || ""
                );

                setResults(
                    state.results || null
                );

                setQueryError(
                    state.queryError || null
                );

                setQueryExecutionTime(
                    state.queryExecutionTime ?? null
                );

                setCurrentResultPage(
                    state.currentResultPage || 1
                );

                setResultPageSize(
                    state.resultPageSize || 20
                );

            }

        } catch (error) {

            console.error(
                "Failed to restore query state:",
                error
            );

        } finally {

            setQueryStateLoaded(true);

        }

    }, []);

    useEffect(() => {

        if (!queryStateLoaded) return;

        localStorage.setItem(
            "workspace-query-state",
            JSON.stringify({

                query,

                results,

                queryError,

                queryExecutionTime,

                currentResultPage,

                resultPageSize,

            })
        );

    }, [
        queryStateLoaded,
        query,
        results,
        queryError,
        queryExecutionTime,
        currentResultPage,
        resultPageSize,
    ]);

    useEffect(() => {

        localStorage.setItem(
            "workspace-query-history",
            JSON.stringify(queryHistory)
        );

    }, [queryHistory]);


    function clearQuery() {

        setQuery("");

        setResults(null);

        setQueryError(null);

        setQueryExecutionTime(null);

        setCurrentResultPage(1);

        localStorage.removeItem(
            "workspace-query-state"
        );

    }

    function copyQuery(text) {

        navigator.clipboard.writeText(text);

    }

    function saveQueryToHistory(queryText) {

        const cleanedQuery =
            queryText.trim();

        if (!cleanedQuery) return;

        setQueryHistory(
            previous => {

                const existing =
                    previous.filter(
                        item =>
                            item.query !==
                            cleanedQuery
                    );

                const newEntry = {

                    id:
                        Date.now(),

                    query:
                        cleanedQuery,

                    timestamp:
                        new Date().toISOString(),

                };

                return [
                    newEntry,
                    ...existing,
                ].slice(0, 20);

            }
        );

    }

    async function runQuery() {

        if (!query.trim()) return;

        setQueryLoading(true);

        setQueryError(null);

        setResults(null);

        setQueryExecutionTime(null);

        setCurrentResultPage(1);

        const startTime = performance.now();

        try {

            const data =
                await executeQuery(query);

            const endTime =
                performance.now();

            setQueryExecutionTime(
                endTime - startTime
            );

            setResults(data);

            saveQueryToHistory(query);


            /*
            --------------------------------------------------
            Refresh workspace data after mutations
            --------------------------------------------------
            */

            const normalizedQuery =
                query.trim().toUpperCase();

            const isMutation =
                normalizedQuery.startsWith("INSERT ") ||
                normalizedQuery.startsWith("UPDATE ") ||
                normalizedQuery.startsWith("DELETE ") ||
                normalizedQuery.startsWith("TRUNCATE ") ||
                normalizedQuery.startsWith("CREATE TABLE ") ||
                normalizedQuery.startsWith("DROP TABLE ") ||
                normalizedQuery.startsWith("ALTER TABLE ");

            if (isMutation) {

                await loadDatabase();

            }


        } catch (error) {

            const endTime =
                performance.now();

            setQueryExecutionTime(
                endTime - startTime
            );

            setQueryError(
                error.message ||
                "Unable to execute query."
            );

        } finally {

            setQueryLoading(false);

        }

    }

    const totalResultRows =
        results?.rows?.length || 0;

    const totalResultPages =
        Math.max(
            1,
            Math.ceil(
                totalResultRows /
                resultPageSize
            )
        );

    const resultStartIndex =
        (currentResultPage - 1) *
        resultPageSize;

    const visibleResultRows =
        results?.rows?.slice(
            resultStartIndex,
            resultStartIndex + resultPageSize
        ) || [];


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

                            <button
                                className="queryActionButton"
                                onClick={() =>
                                    setShowCheatsheet(true)
                                }
                            >

                                <Copy
                                    size={14}
                                    strokeWidth={1.3}
                                />

                                <span>
                                    Cheatsheet
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


                            {queryExecutionTime !== null && (

                                <div className="queryExecutionMeta">

                                    <span>
                                        {queryExecutionTime < 1000
                                            ? `${Math.round(queryExecutionTime)} ms`
                                            : `${(queryExecutionTime / 1000).toFixed(2)} s`
                                        }
                                    </span>

                                </div>

                            )}

                        </div>

                        {queryLoading && (

                            <div className="queryResultEmpty">

                                <TerminalSquare
                                    size={18}
                                    strokeWidth={1.2}
                                />

                                <span>
                                    Executing query...
                                </span>

                            </div>

                        )}

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


                        {!queryLoading && !queryError && !results && (

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


                        {!queryLoading && results && (

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

                                                    {visibleResultRows.map(
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

                                        <div className="queryPagination">

                                            <div className="queryPaginationInfo">

                                                <span>
                                                    {totalResultRows === 0
                                                        ? "0 rows"
                                                        : `${resultStartIndex + 1}–${Math.min(
                                                            resultStartIndex + resultPageSize,
                                                            totalResultRows
                                                        )} of ${totalResultRows} rows`
                                                    }
                                                </span>

                                            </div>


                                            <div className="queryPaginationControls">

                                                <button
                                                    className="queryPaginationButton"
                                                    disabled={
                                                        currentResultPage === 1
                                                    }
                                                    onClick={() =>
                                                        setCurrentResultPage(
                                                            previous =>
                                                                Math.max(
                                                                    1,
                                                                    previous - 1
                                                                )
                                                        )
                                                    }
                                                >
                                                    Previous
                                                </button>


                                                <span className="queryPaginationPage">

                                                    Page {currentResultPage}
                                                    {" "}
                                                    of
                                                    {" "}
                                                    {totalResultPages}

                                                </span>


                                                <button
                                                    className="queryPaginationButton"
                                                    disabled={
                                                        currentResultPage >=
                                                        totalResultPages
                                                    }
                                                    onClick={() =>
                                                        setCurrentResultPage(
                                                            previous =>
                                                                Math.min(
                                                                    totalResultPages,
                                                                    previous + 1
                                                                )
                                                        )
                                                    }
                                                >
                                                    Next
                                                </button>

                                            </div>


                                            <select
                                                className="queryPaginationSize"
                                                value={resultPageSize}
                                                onChange={(event) => {

                                                    setResultPageSize(
                                                        Number(event.target.value)
                                                    );

                                                    setCurrentResultPage(1);

                                                }}
                                            >

                                                <option value={10}>
                                                    10 rows
                                                </option>

                                                <option value={20}>
                                                    20 rows
                                                </option>

                                                <option value={50}>
                                                    50 rows
                                                </option>

                                                <option value={100}>
                                                    100 rows
                                                </option>

                                            </select>

                                        </div>

                                    </>

                                )}

                            </div>

                        )}

                    </section>


                </div>

                {showCheatsheet && (

                    <div
                        className="queryCheatsheetOverlay"
                        onClick={() =>
                            setShowCheatsheet(false)
                        }
                    >

                        <div
                            className="queryCheatsheetModal"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="queryCheatsheetHeader">

                                <div>

                                    <span className="queryCheatsheetEyebrow">
                                        POSTGRESQL
                                    </span>

                                    <h2>
                                        SQL Cheatsheet
                                    </h2>

                                    <p>
                                        Common queries and useful SQL patterns.
                                    </p>

                                </div>


                                <button
                                    className="queryCheatsheetClose"
                                    onClick={() =>
                                        setShowCheatsheet(false)
                                    }
                                >

                                    <X
                                        size={15}
                                        strokeWidth={1.2}
                                    />

                                </button>

                            </div>


                            <div className="queryCheatsheetBody">


                                {/* BASICS */}

                                <section className="queryCheatsheetSection">

                                    <h3>
                                        Basics
                                    </h3>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT * FROM "Product";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT * FROM "Product";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT "name", "price"
                                            FROM "Product";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT "name", "price" FROM "Product";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>

                                </section>


                                {/* FILTERING */}

                                <section className="queryCheatsheetSection">

                                    <h3>
                                        Filtering
                                    </h3>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT * FROM "Product"
                                            WHERE "price" &gt; 100;
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT * FROM "Product" WHERE "price" > 100;'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT * FROM "Product"
                                            WHERE "name" LIKE '%phone%';
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    `SELECT * FROM "Product" WHERE "name" LIKE '%phone%';`
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT * FROM "Product"
                                            WHERE "price" BETWEEN 100 AND 500;
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT * FROM "Product" WHERE "price" BETWEEN 100 AND 500;'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>

                                </section>


                                {/* SORTING */}

                                <section className="queryCheatsheetSection">

                                    <h3>
                                        Sorting & Limits
                                    </h3>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT * FROM "Product"
                                            ORDER BY "price" ASC;
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT * FROM "Product" ORDER BY "price" ASC;'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT * FROM "Product"
                                            ORDER BY "price" DESC
                                            LIMIT 10 OFFSET 20;
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT * FROM "Product" ORDER BY "price" DESC LIMIT 10 OFFSET 20;'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>

                                </section>


                                {/* JOINS */}

                                <section className="queryCheatsheetSection">

                                    <h3>
                                        Joins
                                    </h3>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT *
                                            FROM "Product"
                                            JOIN "Category"
                                            ON "Product"."categoryId" = "Category"."id";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT * FROM "Product" JOIN "Category" ON "Product"."categoryId" = "Category"."id";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT *
                                            FROM "Product"
                                            LEFT JOIN "Category"
                                            ON "Product"."categoryId" = "Category"."id";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT * FROM "Product" LEFT JOIN "Category" ON "Product"."categoryId" = "Category"."id";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>

                                </section>


                                {/* AGGREGATES */}

                                <section className="queryCheatsheetSection">

                                    <h3>
                                        Aggregates
                                    </h3>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT COUNT(*) FROM "Product";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT COUNT(*) FROM "Product";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT SUM("price") FROM "Product";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT SUM("price") FROM "Product";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT AVG("price") FROM "Product";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT AVG("price") FROM "Product";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT MIN("price") FROM "Product";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT MIN("price") FROM "Product";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT MAX("price") FROM "Product";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT MAX("price") FROM "Product";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>

                                </section>


                                {/* GROUPING */}

                                <section className="queryCheatsheetSection">

                                    <h3>
                                        Grouping
                                    </h3>


                                    <div className="queryCodeCard">

                                        <code>
                                            SELECT "categoryId", COUNT(*)
                                            FROM "Product"
                                            GROUP BY "categoryId";
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'SELECT "categoryId", COUNT(*) FROM "Product" GROUP BY "categoryId";'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>

                                </section>


                                {/* DATA */}

                                <section className="queryCheatsheetSection">

                                    <h3>
                                        Data Operations
                                    </h3>


                                    <div className="queryCodeCard">

                                        <code>
                                            INSERT INTO "Product"
                                            (
                                            "name",
                                            "description",
                                            "sku",
                                            "price",
                                            "stock",
                                            "categoryId",
                                            "supplierId",
                                            "updatedAt"
                                            )
                                            VALUES
                                            (
                                            'Preview Product',
                                            'Created during application preview',
                                            'PREVIEW-001',
                                            1499.00,
                                            25,
                                            3,
                                            3,
                                            CURRENT_TIMESTAMP
                                            );
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(`INSERT INTO "Product"
(
    "name",
    "description",
    "sku",
    "price",
    "stock",
    "categoryId",
    "supplierId",
    "updatedAt"
)
VALUES
(
    'Preview Product',
    'Created during application preview',
    'PREVIEW-001',
    1499.00,
    25,
    3,
    3,
    CURRENT_TIMESTAMP
);`)
                                            }
                                        >
                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />
                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            UPDATE "Product"
                                            SET "price" = 99
                                            WHERE "id" = 1;
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'UPDATE "Product" SET "price" = 99 WHERE "id" = 1;'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>


                                    <div className="queryCodeCard">

                                        <code>
                                            DELETE FROM "Product"
                                            WHERE "id" = 1;
                                        </code>

                                        <button
                                            onClick={() =>
                                                copyQuery(
                                                    'DELETE FROM "Product" WHERE "id" = 1;'
                                                )
                                            }
                                        >

                                            <Copy
                                                size={13}
                                                strokeWidth={1.2}
                                            />

                                        </button>

                                    </div>

                                </section>


                            </div>

                        </div>

                    </div>

                )}

            </main>

        </main>

    );

}


export default Query;