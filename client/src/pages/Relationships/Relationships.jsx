import {
    useEffect,
    useMemo,
    useState,
} from "react";

import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import {
    Database,
    GitBranch,
    KeyRound,
    Link2,
} from "lucide-react";

import { getDatabaseSchema } from "../../api/schema";

import "./Relationships.css";


function Relationships({

    setLoggedIn,
    currentPage,
    setCurrentPage,

}) {

    const [schema, setSchema] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState(null);


    useEffect(() => {

        async function loadSchema() {

            try {

                setLoading(true);

                setError(null);

                const data =
                    await getDatabaseSchema();

                setSchema(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (error) {

                console.error(
                    "Failed to load database relationships:",
                    error
                );

                setError(
                    error.message ||
                    "Unable to load database relationships."
                );

            } finally {

                setLoading(false);

            }

        }

        loadSchema();

    }, []);


    /*
     * Build relationships directly from
     * the schema returned by PostgreSQL.
     */

    const relationships =
        useMemo(() => {

            const result = [];

            schema.forEach(table => {

                (table.columns || []).forEach(
                    column => {

                        if (
                            !column.isForeignKey
                        ) {
                            return;
                        }

                        if (
                            !column.foreignKeyTableName
                        ) {
                            return;
                        }

                        result.push({

                            id:
                                `${table.name}-${column.name}-${column.foreignKeyTableName}-${column.foreignKeyColumnName}`,

                            sourceTable:
                                table.name,

                            sourceColumn:
                                column.name,

                            targetTable:
                                column.foreignKeyTableName,

                            targetColumn:
                                column.foreignKeyColumnName,

                        });

                    }
                );

            });

            return result;

        }, [schema]);


    /*
     * Group relationships by source table.
     */

    const relationshipGroups =
        useMemo(() => {

            const groups = {};

            relationships.forEach(
                relationship => {

                    if (
                        !groups[
                        relationship.sourceTable
                        ]
                    ) {

                        groups[
                            relationship.sourceTable
                        ] = [];

                    }

                    groups[
                        relationship.sourceTable
                    ].push(
                        relationship
                    );

                }
            );

            return Object.entries(
                groups
            );

        }, [relationships]);


    return (

        <main className="app">

            <Background />


            <WorkspaceMenu
                setLoggedIn={setLoggedIn}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                queryMode={false}
            />


            <main className="relationshipsPage">

                <div className="relationshipsContent">


                    {/* ------------------------------------------------ */}
                    {/* Header */}
                    {/* ------------------------------------------------ */}

                    <header className="relationshipsHeader">

                        <div>

                            <span className="relationshipsEyebrow">
                                DATABASE
                            </span>

                            <h1>
                                Relationships
                            </h1>

                            <p>
                                Foreign key relationships between tables.
                            </p>

                        </div>


                        <div className="relationshipsLegend">

                            <div className="relationshipsLegendItem">

                                <KeyRound
                                    size={13}
                                    strokeWidth={1.2}
                                />

                                <span>
                                    Primary Key
                                </span>

                            </div>


                            <div className="relationshipsLegendItem">

                                <Link2
                                    size={13}
                                    strokeWidth={1.2}
                                />

                                <span>
                                    Foreign Key
                                </span>

                            </div>


                            <div className="relationshipsLegendItem">

                                <span className="relationshipsLegendLine" />

                                <span>
                                    Relationship
                                </span>

                            </div>

                        </div>

                    </header>


                    {/* ------------------------------------------------ */}
                    {/* Loading */}
                    {/* ------------------------------------------------ */}

                    {loading && (

                        <section className="relationshipsCanvas">

                            <div className="relationshipsEmpty">

                                <Database
                                    size={22}
                                    strokeWidth={1.1}
                                />

                                <span>
                                    Loading relationships...
                                </span>

                            </div>

                        </section>

                    )}


                    {/* ------------------------------------------------ */}
                    {/* Error */}
                    {/* ------------------------------------------------ */}

                    {!loading && error && (

                        <section className="relationshipsCanvas">

                            <div className="relationshipsEmpty">

                                <Database
                                    size={22}
                                    strokeWidth={1.1}
                                />

                                <span>
                                    {error}
                                </span>

                            </div>

                        </section>

                    )}


                    {/* ------------------------------------------------ */}
                    {/* Relationship map */}
                    {/* ------------------------------------------------ */}

                    {!loading &&
                        !error &&
                        relationships.length > 0 && (

                            <section className="relationshipsCanvas">

                                <div className="relationshipsMap">

                                    {relationshipGroups.map(
                                        ([tableName, tableRelationships]) => (

                                            <div
                                                className="relationshipGroup"
                                                key={tableName}
                                            >

                                                <div className="relationshipTableCard">

                                                    <div className="relationshipTableHeader">

                                                        <GitBranch
                                                            size={14}
                                                            strokeWidth={1.2}
                                                        />

                                                        <span>
                                                            {tableName}
                                                        </span>

                                                    </div>


                                                    <div className="relationshipColumns">

                                                        {tableRelationships.map(
                                                            relationship => (

                                                                <div
                                                                    className="relationshipColumn"
                                                                    key={
                                                                        relationship.id
                                                                    }
                                                                >

                                                                    <Link2
                                                                        size={13}
                                                                        strokeWidth={1.2}
                                                                    />

                                                                    <span>
                                                                        {
                                                                            relationship.sourceColumn
                                                                        }
                                                                    </span>

                                                                    <span className="relationshipFK">
                                                                        FK
                                                                    </span>

                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                </div>


                                                <div className="relationshipConnections">

                                                    {tableRelationships.map(
                                                        relationship => (

                                                            <div
                                                                className="relationshipConnection"
                                                                key={
                                                                    relationship.id
                                                                }
                                                            >

                                                                <span className="relationshipConnectionLabel">
                                                                    {
                                                                        relationship.sourceColumn
                                                                    }
                                                                </span>

                                                                <span className="relationshipLine" />

                                                                <span className="relationshipArrow">
                                                                    →
                                                                </span>

                                                                <span className="relationshipConnectionLabel">
                                                                    {
                                                                        relationship.targetColumn
                                                                    }
                                                                </span>

                                                            </div>

                                                        )
                                                    )}

                                                </div>


                                                <div className="relationshipTargets">

                                                    {tableRelationships.map(
                                                        relationship => (

                                                            <div
                                                                className="relationshipTableCard"
                                                                key={
                                                                    `${relationship.id}-target`
                                                                }
                                                            >

                                                                <div className="relationshipTableHeader">

                                                                    <KeyRound
                                                                        size={14}
                                                                        strokeWidth={1.2}
                                                                    />

                                                                    <span>
                                                                        {
                                                                            relationship.targetTable
                                                                        }
                                                                    </span>

                                                                </div>


                                                                <div className="relationshipColumn">

                                                                    <KeyRound
                                                                        size={13}
                                                                        strokeWidth={1.2}
                                                                    />

                                                                    <span>
                                                                        {
                                                                            relationship.targetColumn
                                                                        }
                                                                    </span>

                                                                    <span className="relationshipPK">
                                                                        PK
                                                                    </span>

                                                                </div>

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            </section>

                        )}


                    {/* ------------------------------------------------ */}
                    {/* Empty */}
                    {/* ------------------------------------------------ */}

                    {!loading &&
                        !error &&
                        relationships.length === 0 && (

                            <section className="relationshipsCanvas">

                                <div className="relationshipsEmpty">

                                    <GitBranch
                                        size={22}
                                        strokeWidth={1.1}
                                    />

                                    <span>
                                        No foreign key relationships defined.
                                    </span>

                                </div>

                            </section>

                        )}

                </div>

            </main>

        </main>

    );

}


export default Relationships;