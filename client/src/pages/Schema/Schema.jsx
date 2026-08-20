import { useEffect, useState } from "react";

import {
    Database,
    Table2,
    KeyRound,
    Link2,
    Hash,
    Circle,
    Check,
} from "lucide-react";

import "./Schema.css";

import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import { getDatabaseSchema } from "../../api/schema";

function Schema({

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

    const [schema, setSchema] = useState([]);
    const [schemaLoading, setSchemaLoading] = useState(true);
    const [schemaError, setSchemaError] = useState(null);

    const allTables = schema.map(table => ({

        id: table.id || table.name,

        name: table.name,

        records: table.records ?? 0,

        columns:
            [...(table.columns || [])]
                .sort(
                    (a, b) =>
                        a.position - b.position
                ),

    }));

    const totalColumns =
        allTables.reduce(
            (total, table) =>
                total + table.columns.length,
            0
        );


    const totalRelationships =
        allTables.reduce(
            (total, table) =>
                total +
                table.columns.filter(
                    column =>
                        column.isForeignKey
                ).length,
            0
        );


    function getColumnIcon(column) {

        if (column.isPrimaryKey) {

            return (
                <KeyRound
                    size={13}
                    strokeWidth={1.3}
                />
            );

        }

        if (column.isForeignKey) {

            return (
                <Link2
                    size={13}
                    strokeWidth={1.3}
                />
            );

        }

        return (
            <Circle
                size={7}
                strokeWidth={1.3}
            />
        );

    }


    function getColumnType(column) {

        return (
            column.dataType ||
            column.type ||
            "TEXT"
        );

    }


    function getColumnState(column) {

        const states = [];

        if (column.isPrimaryKey) {
            states.push("PK");
        }

        if (column.isForeignKey) {
            states.push("FK");
        }

        if (column.isUnique) {
            states.push("UNIQUE");
        }

        if (
            column.isNullable === false
        ) {
            states.push("REQUIRED");
        }

        if (column.isAutoIncrement) {
            states.push("AUTO");
        }

        return states;

    }

    useEffect(() => {

        async function loadSchema() {

            try {

                setSchemaLoading(true);
                setSchemaError(null);

                const data =
                    await getDatabaseSchema();

                setSchema(data);

            } catch (error) {

                console.error(
                    "Failed to load database schema:",
                    error
                );

                setSchemaError(
                    error.message
                );

            } finally {

                setSchemaLoading(false);

            }

        }

        loadSchema();

    }, []);


    return (

        <main className="app">

            <Background />

            <WorkspaceMenu
                setLoggedIn={setLoggedIn}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                schemaMode
            />

            <main className="schemaPage">

                <div className="schemaContent">

                    {schemaLoading && (

                        <div className="schemaEmptyState">

                            <Database
                                size={20}
                                strokeWidth={1.2}
                            />

                            <span>
                                Loading database schema...
                            </span>

                        </div>

                    )}

                    {schemaError && (

                        <div className="schemaEmptyState">

                            <Database
                                size={20}
                                strokeWidth={1.2}
                            />

                            <span>
                                {schemaError}
                            </span>

                        </div>

                    )}

                    {!schemaLoading && !schemaError && (

                        <>
                            <header className="schemaHeader">

                                <div>

                                    <span className="schemaEyebrow">
                                        DATABASE
                                    </span>

                                    <h1>
                                        Schema
                                    </h1>

                                    <p>
                                        Database structure, columns and relationships.
                                    </p>

                                </div>

                                <div className="schemaHeaderStats">

                                    <div className="schemaHeaderStat">

                                        <Database
                                            size={14}
                                            strokeWidth={1.2}
                                        />

                                        <span>
                                            {allTables.length} Tables
                                        </span>

                                    </div>

                                    <div className="schemaHeaderStat">

                                        <Hash
                                            size={14}
                                            strokeWidth={1.2}
                                        />

                                        <span>
                                            {totalColumns} Columns
                                        </span>

                                    </div>

                                    <div className="schemaHeaderStat">

                                        <Link2
                                            size={14}
                                            strokeWidth={1.2}
                                        />

                                        <span>
                                            {totalRelationships} Relationships
                                        </span>

                                    </div>

                                </div>

                            </header>


                            <section className="schemaLegend">

                                <div className="schemaLegendItem">

                                    <KeyRound
                                        size={13}
                                        strokeWidth={1.3}
                                    />

                                    <span>
                                        Primary Key
                                    </span>

                                </div>

                                <div className="schemaLegendItem">

                                    <Link2
                                        size={13}
                                        strokeWidth={1.3}
                                    />

                                    <span>
                                        Foreign Key
                                    </span>

                                </div>

                                <div className="schemaLegendItem">

                                    <Check
                                        size={13}
                                        strokeWidth={1.3}
                                    />

                                    <span>
                                        Required
                                    </span>

                                </div>

                            </section>


                            <section className="schemaTableGrid">

                                {allTables.map(table => (

                                    <article
                                        className="schemaTableCard"
                                        key={table.id}
                                    >

                                        <header className="schemaTableHeader">

                                            <div className="schemaTableTitle">

                                                <div className="schemaTableIcon">

                                                    <Table2
                                                        size={15}
                                                        strokeWidth={1.2}
                                                    />

                                                </div>

                                                <div>

                                                    <h2>
                                                        {table.name}
                                                    </h2>

                                                    <span>
                                                        {table.columns.length} columns
                                                    </span>

                                                </div>

                                            </div>

                                            <span className="schemaRecordCount">

                                                {table.records.toLocaleString()}
                                                {" "}
                                                records

                                            </span>

                                        </header>


                                        <div className="schemaColumns">

                                            {table.columns.map(
                                                (column, index) => {

                                                    const states =
                                                        getColumnState(
                                                            column
                                                        );

                                                    return (

                                                        <div
                                                            className="schemaColumn"
                                                            key={
                                                                column.id ||
                                                                `${table.id}-${index}`
                                                            }
                                                        >

                                                            <div className="schemaColumnIcon">

                                                                {getColumnIcon(
                                                                    column
                                                                )}

                                                            </div>


                                                            <div className="schemaColumnName">

                                                                <span>
                                                                    {column.name}
                                                                </span>

                                                            </div>


                                                            <span className="schemaColumnType">

                                                                {getColumnType(
                                                                    column
                                                                )}

                                                            </span>


                                                            {states.length > 0 && (

                                                                <div className="schemaColumnStates">

                                                                    {states.map(
                                                                        state => (

                                                                            <span
                                                                                key={state}
                                                                                className={`
                                                                        schemaColumnState
                                                                        schemaColumnState${state}
                                                                    `}
                                                                            >
                                                                                {state}
                                                                            </span>

                                                                        )
                                                                    )}

                                                                </div>

                                                            )}

                                                        </div>

                                                    );

                                                }
                                            )}

                                        </div>


                                        {table.columns.length === 0 && (

                                            <div className="schemaEmptyTable">

                                                <span>
                                                    No columns defined
                                                </span>

                                            </div>

                                        )}

                                    </article>

                                ))}

                            </section>


                            {allTables.length === 0 && (

                                <div className="schemaEmptyState">

                                    <Database
                                        size={20}
                                        strokeWidth={1.2}
                                    />

                                    <span>
                                        No tables available
                                    </span>

                                </div>

                            )}

                        </>

                    )}

                </div>

            </main>

        </main>

    );

}

export default Schema;