import {
    useEffect,
    useState,
} from "react";

import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import {
    Copy,
    Database,
    Hammer,
    RotateCcw,
} from "lucide-react";

import "./QueryBuilder.css";


function QueryBuilder({

    setLoggedIn,
    currentPage,
    setCurrentPage,

    products = [],
    categories = [],
    suppliers = [],
    customTables = [],

}) {

    const [selectedTable, setSelectedTable] =
        useState("");

    const [selectedColumns, setSelectedColumns] =
        useState([]);

    const [whereColumn, setWhereColumn] =
        useState("");

    const [whereOperator, setWhereOperator] =
        useState("=");

    const [whereValue, setWhereValue] =
        useState("");

    const [orderByColumn, setOrderByColumn] =
        useState("");

    const [orderByDirection, setOrderByDirection] =
        useState("ASC");

    const [limit, setLimit] =
        useState("");

    const [builderStateLoaded, setBuilderStateLoaded] =
        useState(false);

    const builderTables = [

        {
            id: "Product",
            name: "Product",
            title: "Product",
            columns:
                products.length > 0
                    ? Object.keys(products[0])
                    : [],
        },

        {
            id: "Category",
            name: "Category",
            title: "Category",
            columns:
                categories.length > 0
                    ? Object.keys(categories[0])
                    : [],
        },

        {
            id: "Supplier",
            name: "Supplier",
            title: "Supplier",
            columns:
                suppliers.length > 0
                    ? Object.keys(suppliers[0])
                    : [],
        },

        ...customTables.map(
            table => ({

                id: table.id,

                name: table.name,

                title:
                    table.title ||
                    table.name,

                columns:
                    table.columns || [],

            })
        ),

    ];

    useEffect(() => {

        try {

            const saved =
                localStorage.getItem(
                    "workspace-query-builder-state"
                );

            if (saved) {

                const state =
                    JSON.parse(saved);

                setSelectedTable(
                    state.selectedTable || ""
                );

                setSelectedColumns(
                    state.selectedColumns || []
                );

                setWhereColumn(
                    state.whereColumn || ""
                );

                setWhereOperator(
                    state.whereOperator || "="
                );

                setWhereValue(
                    state.whereValue || ""
                );

                setOrderByColumn(
                    state.orderByColumn || ""
                );

                setOrderByDirection(
                    state.orderByDirection || "ASC"
                );

                setLimit(
                    state.limit || ""
                );

            }

        } catch (error) {

            console.error(
                "Failed to restore query builder state:",
                error
            );

        } finally {

            setBuilderStateLoaded(true);

        }

    }, []);

    useEffect(() => {

        if (!builderStateLoaded) return;

        localStorage.setItem(
            "workspace-query-builder-state",
            JSON.stringify({

                selectedTable,

                selectedColumns,

                whereColumn,

                whereOperator,

                whereValue,

                orderByColumn,

                orderByDirection,

                limit,

            })
        );

    }, [
        builderStateLoaded,
        selectedTable,
        selectedColumns,
        whereColumn,
        whereOperator,
        whereValue,
        orderByColumn,
        orderByDirection,
        limit,
    ]);

    /*
    --------------------------------------------------
    Table columns
    --------------------------------------------------
    */

    const selectedTableData =
        builderTables.find(
            table =>
                String(table.id) ===
                String(selectedTable)
        );


    const columns =
        selectedTableData?.columns || [];


    /*
    --------------------------------------------------
    Table selection
    --------------------------------------------------
    */

    useEffect(() => {

        if (!selectedTable && builderTables.length > 0) {

            setSelectedTable(
                builderTables[0].id
            );

        }

    }, [
        selectedTable,
        builderTables.length,
    ]);


    /*
    --------------------------------------------------
    Column selection
    --------------------------------------------------
    */

    function toggleColumn(columnName) {

        setSelectedColumns(
            previous => {

                if (
                    previous.includes(columnName)
                ) {

                    return previous.filter(
                        column =>
                            column !== columnName
                    );

                }

                return [
                    ...previous,
                    columnName,
                ];

            }
        );

    }


    /*
    --------------------------------------------------
    Table change
    --------------------------------------------------
    */

    function handleTableChange(event) {

        setSelectedTable(
            event.target.value
        );

        setSelectedColumns([]);

        setWhereColumn("");

        setWhereOperator("=");

        setWhereValue("");

        setOrderByColumn("");

        setOrderByDirection("ASC");

        setLimit("");

    }


    /*
    --------------------------------------------------
    Generated query
    --------------------------------------------------
    */

    const hasWhere =
        whereColumn &&
        whereValue.trim();


    const hasOrderBy =
        orderByColumn;

    const hasLimit =
        limit !== "" &&
        Number(limit) > 0;


    const formattedWhereValue =
        whereOperator === "LIKE"
            ? `'%${whereValue.trim()}%'`
            : !Number.isNaN(
                Number(whereValue)
            ) &&
                whereValue.trim() !== ""
                ? whereValue.trim()
                : `'${whereValue.trim()}'`;


    const generatedQuery =
        selectedTableData &&
            selectedColumns.length > 0
            ? `SELECT ${selectedColumns
                .map(
                    column =>
                        `"${column}"`
                )
                .join(", ")}
FROM "${selectedTableData.name}"${hasWhere
                ? `
WHERE "${whereColumn}" ${whereOperator} ${formattedWhereValue}`
                : ""
            }${hasOrderBy
                ? `
ORDER BY "${orderByColumn}" ${orderByDirection}`
                : ""
            }${hasLimit
                ? `
LIMIT ${Number(limit)}`
                : ""
            };`
            : "";


    /*
    --------------------------------------------------
    Copy query
    --------------------------------------------------
    */

    function copyQuery() {

        if (!generatedQuery) return;

        navigator.clipboard.writeText(
            generatedQuery
        );

    }

    function resetBuilder() {

        setSelectedTable(
            builderTables.length > 0
                ? builderTables[0].id
                : ""
        );

        setSelectedColumns([]);

        setWhereColumn("");

        setWhereOperator("=");

        setWhereValue("");

        setOrderByColumn("");

        setOrderByDirection("ASC");

        setLimit("");

        localStorage.removeItem(
            "workspace-query-builder-state"
        );

    }

    return (

        <main className="app">

            <Background />

            <WorkspaceMenu
                setLoggedIn={setLoggedIn}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                queryBuilderMode
            />


            <main className="queryBuilderPage">

                <div className="queryBuilderContent">


                    {/* ------------------------------------------------ */}
                    {/* Header */}
                    {/* ------------------------------------------------ */}

                    <header className="queryBuilderHeader">

                        <div>

                            <span className="queryBuilderEyebrow">
                                DATABASE
                            </span>

                            <h1>
                                Query Builder
                            </h1>

                            <p>
                                Build SQL queries visually.
                            </p>

                        </div>


                        <button
                            className="queryBuilderResetButton"
                            onClick={resetBuilder}
                        >

                            <RotateCcw
                                size={14}
                                strokeWidth={1.3}
                            />

                            <span>
                                Reset
                            </span>

                        </button>

                    </header>


                    {/* ------------------------------------------------ */}
                    {/* Builder */}
                    {/* ------------------------------------------------ */}

                    <section className="queryBuilderPanel">

                        <div className="queryBuilderPanelHeader">

                            <div className="queryBuilderPanelTitle">

                                <div className="queryBuilderPanelIcon">

                                    <Hammer
                                        size={15}
                                        strokeWidth={1.2}
                                    />

                                </div>

                                <div>

                                    <span className="queryBuilderPanelLabel">
                                        VISUAL BUILDER
                                    </span>

                                    <h2>
                                        Build Query
                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div className="queryBuilderBody">


                            {/* ------------------------------------------------ */}
                            {/* Table */}
                            {/* ------------------------------------------------ */}

                            <section className="queryBuilderSection">

                                <span className="queryBuilderSectionLabel">
                                    TABLE
                                </span>


                                <div className="queryBuilderSelectWrapper">

                                    <Database
                                        size={14}
                                        strokeWidth={1.2}
                                    />

                                    <select
                                        className="queryBuilderSelect"
                                        value={selectedTable}
                                        onChange={
                                            handleTableChange
                                        }
                                    >

                                        <option value="">
                                            Select a table
                                        </option>

                                        {builderTables.map(
                                            table => (

                                                <option
                                                    key={table.id}
                                                    value={table.id}
                                                >
                                                    {table.title ||
                                                        table.name}
                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                            </section>


                            {/* ------------------------------------------------ */}
                            {/* Select columns */}
                            {/* ------------------------------------------------ */}

                            <section className="queryBuilderSection">

                                <span className="queryBuilderSectionLabel">
                                    SELECT
                                </span>


                                {!selectedTableData && (

                                    <div className="queryBuilderEmpty">

                                        Select a table to view
                                        available columns.

                                    </div>

                                )}


                                {selectedTableData &&
                                    columns.length === 0 && (

                                        <div className="queryBuilderEmpty">

                                            This table has no
                                            available columns.

                                        </div>

                                    )}


                                {columns.length > 0 && (

                                    <div className="queryBuilderColumns">

                                        {columns.map(
                                            column => {

                                                const columnName =
                                                    typeof column ===
                                                        "string"
                                                        ? column
                                                        : column.name;

                                                const selected =
                                                    selectedColumns.includes(
                                                        columnName
                                                    );

                                                return (

                                                    <button
                                                        key={
                                                            columnName
                                                        }
                                                        className={`
                                                            queryBuilderColumn
                                                            ${selected
                                                                ? "active"
                                                                : ""}
                                                        `}
                                                        onClick={() =>
                                                            toggleColumn(
                                                                columnName
                                                            )
                                                        }
                                                    >

                                                        <span
                                                            className="queryBuilderCheckbox"
                                                        >

                                                            {selected && (
                                                                "✓"
                                                            )}

                                                        </span>

                                                        <span>
                                                            {
                                                                columnName
                                                            }
                                                        </span>

                                                    </button>

                                                );

                                            }
                                        )}

                                    </div>

                                )}

                            </section>


                            {/* ------------------------------------------------ */}
                            {/* Future builder sections */}
                            {/* ------------------------------------------------ */}

                            <section className="queryBuilderSection">

                                <span className="queryBuilderSectionLabel">
                                    WHERE
                                </span>


                                <div className="queryBuilderWhere">

                                    <select
                                        className="queryBuilderField"
                                        value={whereColumn}
                                        onChange={(event) =>
                                            setWhereColumn(
                                                event.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Select column
                                        </option>

                                        {columns.map(
                                            column => {

                                                const columnName =
                                                    typeof column === "string"
                                                        ? column
                                                        : column.name;

                                                return (

                                                    <option
                                                        key={columnName}
                                                        value={columnName}
                                                    >
                                                        {columnName}
                                                    </option>

                                                );

                                            }
                                        )}

                                    </select>


                                    <select
                                        className="queryBuilderField"
                                        value={whereOperator}
                                        onChange={(event) =>
                                            setWhereOperator(
                                                event.target.value
                                            )
                                        }
                                    >

                                        <option value="=">
                                            equals
                                        </option>

                                        <option value="!=">
                                            does not equal
                                        </option>

                                        <option value=">">
                                            is greater than
                                        </option>

                                        <option value=">=">
                                            is greater than or equal to
                                        </option>

                                        <option value="<">
                                            is less than
                                        </option>

                                        <option value="<=">
                                            is less than or equal to
                                        </option>

                                        <option value="LIKE">
                                            contains
                                        </option>

                                    </select>


                                    <input
                                        className="queryBuilderField"
                                        type="text"
                                        value={whereValue}
                                        onChange={(event) =>
                                            setWhereValue(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Value"
                                    />

                                </div>

                            </section>


                            <section className="queryBuilderSection">

                                <span className="queryBuilderSectionLabel">
                                    ORDER BY
                                </span>


                                <div className="queryBuilderWhere">

                                    <select
                                        className="queryBuilderField"
                                        value={orderByColumn}
                                        onChange={(event) =>
                                            setOrderByColumn(
                                                event.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Select column
                                        </option>

                                        {columns.map(
                                            column => {

                                                const columnName =
                                                    typeof column === "string"
                                                        ? column
                                                        : column.name;

                                                return (

                                                    <option
                                                        key={columnName}
                                                        value={columnName}
                                                    >
                                                        {columnName}
                                                    </option>

                                                );

                                            }
                                        )}

                                    </select>


                                    <select
                                        className="queryBuilderField"
                                        value={orderByDirection}
                                        onChange={(event) =>
                                            setOrderByDirection(
                                                event.target.value
                                            )
                                        }
                                    >

                                        <option value="ASC">
                                            Ascending
                                        </option>

                                        <option value="DESC">
                                            Descending
                                        </option>

                                    </select>

                                </div>

                            </section>


                            <section className="queryBuilderSection">

                                <span className="queryBuilderSectionLabel">
                                    LIMIT
                                </span>


                                <div className="queryBuilderWhere">

                                    <input
                                        className="queryBuilderField"
                                        type="number"
                                        min="1"
                                        value={limit}
                                        onChange={(event) =>
                                            setLimit(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Number of rows"
                                    />

                                </div>

                            </section>


                        </div>

                    </section>


                    {/* ------------------------------------------------ */}
                    {/* Generated query */}
                    {/* ------------------------------------------------ */}

                    <section className="queryBuilderResultPanel">

                        <div className="queryBuilderResultHeader">

                            <div>

                                <span className="queryBuilderSectionLabel">
                                    GENERATED QUERY
                                </span>

                                <h2>
                                    SQL
                                </h2>

                            </div>


                            <button
                                className="queryBuilderCopyButton"
                                onClick={copyQuery}
                                disabled={!generatedQuery}
                                title="Copy SQL"
                            >

                                <Copy
                                    size={14}
                                    strokeWidth={1.2}
                                />

                                <span>
                                    Copy
                                </span>

                            </button>

                        </div>


                        <div className="queryBuilderCode">

                            {generatedQuery ? (

                                <pre>
                                    {generatedQuery}
                                </pre>

                            ) : (

                                <div className="queryBuilderCodeEmpty">

                                    Select columns to
                                    generate SQL.

                                </div>

                            )}

                        </div>

                    </section>


                </div>

            </main>

        </main>

    );

}


export default QueryBuilder;