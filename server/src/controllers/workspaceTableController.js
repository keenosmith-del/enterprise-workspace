import prisma from "../config/prisma.js";

import {
    validateTableName,
    validateColumnDefinitions,
    validateSingleColumnDefinition,
    buildCreateTableSQL,
    buildRenameColumnSQL,
    buildAlterColumnTypeSQL,
    buildSetNullableSQL,
    buildSetDefaultSQL,
    buildAddUniqueConstraintSQL,
    buildDropConstraintSQL,
    buildDropColumnSQL,
    buildAddForeignKeySQL,
    normalizeDataType,
    quoteIdentifier,
} from "../utils/dynamicTable.js";


const PROTECTED_TABLES = [
    "products",
    "categories",
    "suppliers",
];


function isProtectedTable(name) {

    return PROTECTED_TABLES.includes(
        String(name).toLowerCase()
    );

}


function normalizePostgresType(dataType, udtName) {

    if (udtName === "int2") {
        return "SMALLINT";
    }

    if (udtName === "int4") {
        return "INTEGER";
    }

    if (udtName === "int8") {
        return "BIGINT";
    }

    if (udtName === "numeric") {
        return "DECIMAL";
    }

    if (udtName === "float4") {
        return "REAL";
    }

    if (udtName === "float8") {
        return "DOUBLE";
    }

    if (udtName === "varchar") {
        return "VARCHAR";
    }

    if (udtName === "bpchar") {
        return "CHAR";
    }

    if (udtName === "text") {
        return "TEXT";
    }

    if (udtName === "bool") {
        return "BOOLEAN";
    }

    if (udtName === "date") {
        return "DATE";
    }

    if (
        udtName === "timestamp" ||
        udtName === "timestamptz"
    ) {
        return "TIMESTAMP";
    }

    return String(dataType).toUpperCase();

}


async function getPhysicalTable(
    transaction,
    tableName
) {

    const result =
        await transaction.$queryRaw`

            SELECT
                table_name

            FROM information_schema.tables

            WHERE table_schema = 'public'

            AND LOWER(table_name) =
                LOWER(${tableName})

            LIMIT 1;

        `;

    return result[0] ?? null;

}


async function getPhysicalColumn(
    transaction,
    tableName,
    columnName
) {

    const result =
        await transaction.$queryRaw`

            SELECT
                column_name,
                data_type,
                udt_name

            FROM information_schema.columns

            WHERE table_schema = 'public'

            AND LOWER(table_name) =
                LOWER(${tableName})

            AND LOWER(column_name) =
                LOWER(${columnName})

            LIMIT 1;

        `;

    return result[0] ?? null;

}

async function getWorkspaceForeignKeyIds(
    transaction,
    tableName,
    columnName
) {

    const referencedTable =
        await transaction.workspaceTable.findFirst({

            where: {

                name: {
                    equals: tableName,
                    mode: "insensitive",
                },

            },

        });

    if (!referencedTable) {

        throw new Error(
            `Referenced table "${tableName}" does not exist in workspace metadata.`
        );

    }

    const referencedColumn =
        await transaction.workspaceColumn.findFirst({

            where: {

                tableId: referencedTable.id,

                name: {
                    equals: columnName,
                    mode: "insensitive",
                },

            },

        });

    if (!referencedColumn) {

        throw new Error(
            `Referenced column "${columnName}" does not exist in table "${tableName}".`
        );

    }

    return {

        foreignKeyTableId:
            referencedTable.id,

        foreignKeyColumnId:
            referencedColumn.id,

    };

}


function getValidationStatus(error) {

    const message =
        error?.message || "";

    return (
        message.includes("required") ||
        message.includes("Invalid") ||
        message.includes("cannot exceed") ||
        message.includes("duplicated") ||
        message.includes("only supported") ||
        message.includes("must be a primary key") ||
        message.includes("Foreign key column") ||
        message.includes("not supported")
    );

}


function getDatabaseConflictStatus(error) {

    return (
        error?.code === "42P07" ||
        error?.code === "42701" ||
        error?.code === "42P16" ||
        error?.code === "23505"
    );

}


/* ================================================== */
/* GET TABLES                                         */
/* ================================================== */

export const getWorkspaceTables = async (req, res) => {

    try {

        const tables =
            await prisma.workspaceTable.findMany({

                orderBy: {

                    createdAt: "asc",

                },

                include: {

                    columns: {

                        orderBy: {

                            position: "asc",

                        },

                    },

                },

            });

        const validTables = [];

        for (const table of tables) {

            const physicalTable =
                await prisma.$queryRaw`

                    SELECT EXISTS (

                        SELECT 1

                        FROM information_schema.tables

                        WHERE table_schema = 'public'

                        AND LOWER(table_name) =
                            LOWER(${table.name})

                    ) AS "exists";

                `;

            if (!physicalTable[0]?.exists) {

                console.warn(
                    `Removing stale workspace metadata for "${table.name}".`
                );

                await prisma.workspaceTable.delete({

                    where: {

                        id: table.id,

                    },

                });

                continue;

            }

            validTables.push(table);

        }

        res.status(200).json(validTables);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to fetch workspace tables.",

        });

    }

};

/* ================================================== */
/* GET DATABASE SCHEMA                                */
/* ================================================== */

export const getDatabaseSchema = async (req, res) => {

    try {

        /*
         * --------------------------------------------------
         * Tables + columns
         * --------------------------------------------------
         */

        const tables =
            await prisma.$queryRaw`

                SELECT

                    c.table_name,
                    c.column_name,
                    c.data_type,
                    c.udt_name,
                    c.is_nullable,
                    c.column_default,
                    c.ordinal_position,

                    CASE
                        WHEN pk.column_name IS NOT NULL
                        THEN true
                        ELSE false
                    END AS "isPrimaryKey",

                    CASE
                        WHEN uq.column_name IS NOT NULL
                        THEN true
                        ELSE false
                    END AS "isUnique"

                FROM information_schema.columns c

                LEFT JOIN (

                    SELECT
                        kcu.table_name,
                        kcu.column_name

                    FROM information_schema.table_constraints tc

                    JOIN information_schema.key_column_usage kcu

                        ON tc.constraint_name =
                            kcu.constraint_name

                        AND tc.table_schema =
                            kcu.table_schema

                    WHERE
                        tc.table_schema = 'public'

                        AND tc.constraint_type =
                            'PRIMARY KEY'

                ) pk

                    ON pk.table_name =
                        c.table_name

                    AND pk.column_name =
                        c.column_name

                LEFT JOIN (

                    SELECT
                        kcu.table_name,
                        kcu.column_name

                    FROM information_schema.table_constraints tc

                    JOIN information_schema.key_column_usage kcu

                        ON tc.constraint_name =
                            kcu.constraint_name

                        AND tc.table_schema =
                            kcu.table_schema

                    WHERE
                        tc.table_schema = 'public'

                        AND tc.constraint_type =
                            'UNIQUE'

                ) uq

                    ON uq.table_name =
                        c.table_name

                    AND uq.column_name =
                        c.column_name

                WHERE
                    c.table_schema = 'public'

                    AND c.table_name NOT IN (
                        'WorkspaceTable',
                        'WorkspaceColumn',
                        '_prisma_migrations'
                    )

                ORDER BY
                    c.table_name,
                    c.ordinal_position;

            `;


        /*
         * --------------------------------------------------
         * Foreign keys
         * --------------------------------------------------
         */

        const foreignKeys =
            await prisma.$queryRaw`

                SELECT

                    tc.table_name
                        AS "tableName",

                    kcu.column_name
                        AS "columnName",

                    ccu.table_name
                        AS "referencedTable",

                    ccu.column_name
                        AS "referencedColumn"

                FROM information_schema.table_constraints tc

                JOIN information_schema.key_column_usage kcu

                    ON tc.constraint_name =
                        kcu.constraint_name

                    AND tc.table_schema =
                        kcu.table_schema

                JOIN information_schema.constraint_column_usage ccu

                    ON tc.constraint_name =
                        ccu.constraint_name

                    AND tc.table_schema =
                        ccu.table_schema

                WHERE

                    tc.table_schema = 'public'

                    AND tc.constraint_type =
                        'FOREIGN KEY'

                    AND tc.table_name NOT IN (
                        'WorkspaceTable',
                        'WorkspaceColumn',
                        '_prisma_migrations'
                    );

            `;


        /*
         * --------------------------------------------------
         * Build schema structure
         * --------------------------------------------------
         */

        const schema = {};


        for (const column of tables) {

            const tableName =
                column.table_name;


            if (!schema[tableName]) {

                schema[tableName] = {

                    name: tableName,

                    columns: [],

                    records: 0,

                };

            }


            schema[tableName].columns.push({

                name:
                    column.column_name,

                dataType:
                    normalizePostgresType(
                        column.data_type,
                        column.udt_name
                    ),

                isPrimaryKey:
                    Boolean(
                        column.isPrimaryKey
                    ),

                isForeignKey:
                    false,

                isNullable:
                    column.is_nullable === "YES",

                isUnique:
                    Boolean(
                        column.isUnique
                    ),

                isAutoIncrement:
                    typeof column.column_default === "string" &&
                    column.column_default.includes("nextval("),

                defaultValue:
                    column.column_default,

                foreignKeyTableName:
                    null,

                foreignKeyColumnName:
                    null,

                position:
                    Number(
                        column.ordinal_position
                    ),

            });

        }


        /*
         * --------------------------------------------------
         * Attach foreign key information
         * --------------------------------------------------
         */

        for (const foreignKey of foreignKeys) {

            const table =
                schema[
                foreignKey.tableName
                ];

            if (!table) continue;


            const column =
                table.columns.find(
                    item =>
                        item.name ===
                        foreignKey.columnName
                );

            if (!column) continue;


            column.isForeignKey = true;

            column.foreignKeyTableName =
                foreignKey.referencedTable;

            column.foreignKeyColumnName =
                foreignKey.referencedColumn;

        }


        /*
         * --------------------------------------------------
         * Actual record counts
         * --------------------------------------------------
         */

        const tableNames =
            Object.keys(schema);


        await Promise.all(

            tableNames.map(
                async tableName => {

                    /*
                     * tableName came directly from
                     * information_schema, so it is
                     * trusted database metadata.
                     */

                    const result =
                        await prisma.$queryRawUnsafe(
                            `
                                SELECT COUNT(*)::int AS count
                                FROM "${tableName.replace(/"/g, '""')}"
                            `
                        );


                    schema[tableName].records =
                        result[0]?.count ?? 0;

                }
            )

        );


        /*
         * --------------------------------------------------
         * Final response
         * --------------------------------------------------
         */

        res.status(200).json(

            Object.values(schema)

                .map(table => ({

                    ...table,

                    columns:
                        table.columns.sort(
                            (a, b) =>
                                a.position -
                                b.position
                        ),

                }))

        );


    } catch (error) {

        console.error(
            "Failed to fetch database schema:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch database schema.",

        });

    }

};


/* ================================================== */
/* CREATE TABLE                                       */
/* ================================================== */

export const createWorkspaceTable = async (req, res) => {

    try {

        const name =
            validateTableName(
                req.body?.name
            );

        const columns =
            validateColumnDefinitions(
                Array.isArray(req.body?.columns)
                    ? req.body.columns
                    : []
            );


        /*
         * Validate every foreign key before creating
         * anything in PostgreSQL.
         */

        for (const column of columns) {

            if (!column.isForeignKey) {
                continue;
            }


            const referencedTable =
                await prisma.$queryRaw`

                    SELECT
                        table_name

                    FROM information_schema.tables

                    WHERE table_schema = 'public'

                    AND LOWER(table_name) =
                        LOWER(${column.foreignKeyTableName})

                    LIMIT 1;

                `;


            if (referencedTable.length === 0) {

                throw new Error(
                    `Referenced table "${column.foreignKeyTableName}" does not exist.`
                );

            }


            const referencedColumn =
                await prisma.$queryRaw`

                    SELECT
                        column_name,
                        data_type,
                        udt_name

                    FROM information_schema.columns

                    WHERE table_schema = 'public'

                    AND LOWER(table_name) =
                        LOWER(${column.foreignKeyTableName})

                    AND LOWER(column_name) =
                        LOWER(${column.foreignKeyColumnName})

                    LIMIT 1;

                `;


            if (referencedColumn.length === 0) {

                throw new Error(
                    `Referenced column "${column.foreignKeyColumnName}" does not exist in table "${column.foreignKeyTableName}".`
                );

            }


            const referencedType =
                referencedColumn[0];


            const localType =
                String(
                    column.dataType
                ).toUpperCase();


            const foreignType =
                normalizePostgresType(
                    referencedType.data_type,
                    referencedType.udt_name
                );


            if (localType !== foreignType) {

                throw new Error(
                    `Foreign key column "${column.name}" has type ${localType}, but "${column.foreignKeyTableName}.${column.foreignKeyColumnName}" is ${foreignType}. Change the foreign key column data type to ${foreignType}.`
                );

            }

        }


        /*
         * Prevent duplicate metadata records.
         */

        const existingTable =
            await prisma.workspaceTable.findFirst({

                where: {

                    name: {

                        equals: name,

                        mode: "insensitive",

                    },

                },

            });


        if (existingTable) {

            return res.status(409).json({

                message:
                    "A table with that name already exists.",

            });

        }


        if (isProtectedTable(name)) {

            return res.status(403).json({

                message:
                    "This table name is protected.",

            });

        }


        const table =
            await prisma.$transaction(
                async (transaction) => {

                    /*
                     * Check the actual PostgreSQL database.
                     * This prevents stale physical tables from
                     * conflicting with new metadata.
                     */

                    const existingPhysicalTable =
                        await getPhysicalTable(
                            transaction,
                            name
                        );


                    if (existingPhysicalTable) {

                        throw new Error(
                            `A PostgreSQL table with the name "${name}" already exists. Delete the existing PostgreSQL table before creating another table with this name.`
                        );

                    }


                    const createTableSQL =
                        buildCreateTableSQL(
                            name,
                            columns
                        );


                    /*
                     * Create the real PostgreSQL table first.
                     */

                    await transaction.$executeRawUnsafe(
                        createTableSQL
                    );

                    const foreignKeyMetadata = new Map();

                    for (const column of columns) {

                        if (!column.isForeignKey) {
                            continue;
                        }

                        const foreignKeyIds =
                            await getWorkspaceForeignKeyIds(
                                transaction,
                                column.foreignKeyTableName,
                                column.foreignKeyColumnName
                            );

                        foreignKeyMetadata.set(
                            column.name,
                            foreignKeyIds
                        );

                    }


                    /*
                     * Then create the application metadata.
                     */

                    return transaction.workspaceTable.create({

                        data: {

                            name,

                            columns: {

                                create:
                                    columns.map(
                                        (column, index) => ({

                                            name:
                                                column.name.trim(),

                                            dataType:
                                                column.dataType,

                                            position:
                                                index,

                                            isPrimaryKey:
                                                Boolean(
                                                    column.isPrimaryKey
                                                ),

                                            isAutoIncrement:
                                                Boolean(
                                                    column.isAutoIncrement
                                                ),

                                            isNullable:
                                                column.isNullable !== false,

                                            isUnique:
                                                Boolean(
                                                    column.isUnique
                                                ),

                                            defaultValue:
                                                column.defaultValue
                                                    ?.trim() || null,

                                            foreignKeyTableId:
                                                foreignKeyMetadata.get(
                                                    column.name
                                                )?.foreignKeyTableId ?? null,

                                            foreignKeyColumnId:
                                                foreignKeyMetadata.get(
                                                    column.name
                                                )?.foreignKeyColumnId ?? null,

                                        })
                                    ),

                            },

                        },

                        include: {

                            columns: {

                                orderBy: {

                                    position: "asc",

                                },

                            },

                        },

                    });

                }
            );


        res.status(201).json(table);

    } catch (error) {

        console.error(error);


        if (getValidationStatus(error)) {

            return res.status(400).json({

                message: error.message,

            });

        }


        if (
            error.message?.includes(
                "already exists"
            ) ||
            getDatabaseConflictStatus(error)
        ) {

            return res.status(409).json({

                message:
                    error.message ||
                    "A table with that name already exists.",

            });

        }


        res.status(500).json({

            message:
                "Failed to create workspace table.",

        });

    }

};


/* ================================================== */
/* DELETE TABLE                                       */
/* ================================================== */

export const deleteWorkspaceTable = async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res.status(400).json({

                message:
                    "Invalid table ID.",

            });

        }


        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id,

                },

            });


        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }


        if (isProtectedTable(table.name)) {

            return res.status(403).json({

                message:
                    "This table is protected.",

            });

        }


        await prisma.$transaction(
            async (transaction) => {

                /*
                 * Check whether the physical PostgreSQL
                 * table still exists.
                 */

                const physicalTable =
                    await getPhysicalTable(
                        transaction,
                        table.name
                    );


                /*
                 * Delete the REAL PostgreSQL table.
                 *
                 * CASCADE removes dependent constraints,
                 * not unrelated tables.
                 */

                if (physicalTable) {

                    await transaction.$executeRawUnsafe(
                        `DROP TABLE ${quoteIdentifier(
                            physicalTable.table_name
                        )}`
                    );

                }


                /*
                 * Delete application metadata.
                 *
                 * WorkspaceColumn.table has onDelete: Cascade,
                 * so its columns are removed automatically.
                 */

                await transaction.workspaceTable.delete({

                    where: {

                        id,

                    },

                });

            }
        );


        res.status(200).json({

            message:
                "Table deleted.",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to delete table.",

        });

    }

};


/* ================================================== */
/* RENAME TABLE                                      */
/* ================================================== */

export const updateWorkspaceTable = async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res.status(400).json({

                message:
                    "Invalid table ID.",

            });

        }


        const name =
            validateTableName(
                req.body?.name
            );


        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id,

                },

            });


        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }


        if (isProtectedTable(table.name)) {

            return res.status(403).json({

                message:
                    "This table is protected.",

            });

        }


        if (isProtectedTable(name)) {

            return res.status(403).json({

                message:
                    "This table name is protected.",

            });

        }


        const existingTable =
            await prisma.workspaceTable.findFirst({

                where: {

                    name: {

                        equals: name,

                        mode: "insensitive",

                    },

                    NOT: {

                        id,

                    },

                },

            });


        if (existingTable) {

            return res.status(409).json({

                message:
                    "A table with that name already exists.",

            });

        }


        const updatedTable =
            await prisma.$transaction(
                async (transaction) => {

                    const physicalTable =
                        await getPhysicalTable(
                            transaction,
                            table.name
                        );


                    if (!physicalTable) {

                        throw new Error(
                            `The PostgreSQL table "${table.name}" does not exist.`
                        );

                    }


                    const existingPhysicalTable =
                        await getPhysicalTable(
                            transaction,
                            name
                        );


                    if (existingPhysicalTable) {

                        throw new Error(
                            `A PostgreSQL table named "${name}" already exists.`
                        );

                    }


                    await transaction.$executeRawUnsafe(`

                        ALTER TABLE
                            ${quoteIdentifier(
                        physicalTable.table_name
                    )}

                        RENAME TO
                            ${quoteIdentifier(name)};

                    `);


                    return transaction.workspaceTable.update({

                        where: {

                            id,

                        },

                        data: {

                            name,

                        },

                        include: {

                            columns: {

                                orderBy: {

                                    position: "asc",

                                },

                            },

                        },

                    });

                }
            );


        res.status(200).json(updatedTable);

    } catch (error) {

        console.error(error);


        if (
            error.message?.includes(
                "does not exist"
            ) ||
            error.message?.includes(
                "already exists"
            )
        ) {

            return res.status(409).json({

                message:
                    error.message,

            });

        }


        if (getValidationStatus(error)) {

            return res.status(400).json({

                message:
                    error.message,

            });

        }


        res.status(500).json({

            message:
                "Failed to update table.",

        });

    }

};


/* ================================================== */
/* ADD COLUMN                                         */
/* ================================================== */

export const addWorkspaceColumn = async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);


        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message:
                    "Invalid table ID.",

            });

        }


        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

                include: {

                    columns: {

                        orderBy: {

                            position: "asc",

                        },

                    },

                },

            });


        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }


        const physicalTable =
            await getPhysicalTable(
                prisma,
                table.name
            );


        if (!physicalTable) {

            return res.status(409).json({

                message:
                    `The PostgreSQL table "${table.name}" does not exist.`,

            });

        }


        const column =
            validateSingleColumnDefinition(
                req.body
            );


        const normalizedColumnName =
            column.name.trim().toLowerCase();


        const existingColumn =
            table.columns.find(
                existing =>
                    existing.name.toLowerCase() ===
                    normalizedColumnName
            );


        if (existingColumn) {

            return res.status(409).json({

                message:
                    `Column "${column.name}" already exists.`,

            });

        }


        const physicalColumn =
            await getPhysicalColumn(
                prisma,
                table.name,
                column.name.trim()
            );


        if (physicalColumn) {

            return res.status(409).json({

                message:
                    `Column "${column.name}" already exists in PostgreSQL.`,

            });

        }


        /*
         * Validate FK before ALTER TABLE.
         */

        if (column.isForeignKey) {

            const referencedTable =
                await getPhysicalTable(
                    prisma,
                    column.foreignKeyTableName
                );


            if (!referencedTable) {

                throw new Error(
                    `Referenced table "${column.foreignKeyTableName}" does not exist.`
                );

            }


            const referencedColumn =
                await getPhysicalColumn(
                    prisma,
                    column.foreignKeyTableName,
                    column.foreignKeyColumnName
                );


            if (!referencedColumn) {

                throw new Error(
                    `Referenced column "${column.foreignKeyColumnName}" does not exist in table "${column.foreignKeyTableName}".`
                );

            }


            const localType =
                String(
                    column.dataType
                ).toUpperCase();


            const foreignType =
                normalizePostgresType(
                    referencedColumn.data_type,
                    referencedColumn.udt_name
                );


            if (localType !== foreignType) {

                throw new Error(
                    `Foreign key column "${column.name}" has type ${localType}, but "${column.foreignKeyTableName}.${column.foreignKeyColumnName}" is ${foreignType}. Change the foreign key column data type to ${foreignType}.`
                );

            }

        }


        /*
         * Build the physical PostgreSQL column.
         */

        const columnParts = [

            quoteIdentifier(
                column.name.trim()
            ),

        ];


        if (column.isAutoIncrement) {

            columnParts.push(
                "INTEGER GENERATED BY DEFAULT AS IDENTITY"
            );

        } else {

            columnParts.push(
                column.dataType
            );

        }


        if (column.isNullable === false) {

            columnParts.push(
                "NOT NULL"
            );

        }


        if (column.isUnique) {

            columnParts.push(
                "UNIQUE"
            );

        }


        if (
            column.defaultValue !== null &&
            column.defaultValue !== undefined &&
            String(column.defaultValue).trim() !== ""
        ) {

            const defaultValue =
                String(
                    column.defaultValue
                ).trim();


            if (
                column.dataType === "BOOLEAN" &&
                defaultValue !== "true" &&
                defaultValue !== "false"
            ) {

                throw new Error(
                    `Invalid BOOLEAN default value for "${column.name}".`
                );

            }


            if (
                (
                    column.dataType === "INTEGER" ||
                    column.dataType === "DECIMAL"
                ) &&
                !/^-?\d+(\.\d+)?$/.test(
                    defaultValue
                )
            ) {

                throw new Error(
                    `Invalid numeric default value for "${column.name}".`
                );

            }


            if (
                column.dataType === "TIMESTAMP" &&
                defaultValue ===
                "CURRENT_TIMESTAMP"
            ) {

                columnParts.push(
                    "DEFAULT CURRENT_TIMESTAMP"
                );

            } else {

                columnParts.push(
                    `DEFAULT '${defaultValue.replace(
                        /'/g,
                        "''"
                    )}'`
                );

            }

        }


        if (column.isPrimaryKey) {

            throw new Error(
                "Adding a primary key column to an existing table is not supported yet."
            );

        }


        /*
         * Add the foreign key constraint separately.
         */

        let foreignKeySQL = "";


        if (column.isForeignKey) {

            foreignKeySQL = `

                ALTER TABLE ${quoteIdentifier(
                table.name
            )}

                ADD CONSTRAINT ${quoteIdentifier(
                `fk_${table.name}_${column.name}`
            )}

                FOREIGN KEY (${quoteIdentifier(
                column.name.trim()
            )})

                REFERENCES ${quoteIdentifier(
                column.foreignKeyTableName
            )}

                (${quoteIdentifier(
                column.foreignKeyColumnName
            )});

            `;

        }


        const position =
            table.columns.length;


        const updatedTable =
            await prisma.$transaction(
                async (transaction) => {

                    /*
                     * Re-check the physical table inside
                     * the transaction.
                     */

                    const transactionPhysicalTable =
                        await getPhysicalTable(
                            transaction,
                            table.name
                        );


                    if (!transactionPhysicalTable) {

                        throw new Error(
                            `The PostgreSQL table "${table.name}" does not exist.`
                        );

                    }


                    const alterTableSQL = `

                        ALTER TABLE ${quoteIdentifier(
                        transactionPhysicalTable.table_name
                    )}

                        ADD COLUMN ${columnParts.join(" ")};

                    `;


                    await transaction.$executeRawUnsafe(
                        alterTableSQL
                    );


                    if (foreignKeySQL) {

                        await transaction.$executeRawUnsafe(
                            foreignKeySQL
                        );

                    }

                    let foreignKeyMetadata = null;

                    if (column.isForeignKey) {

                        foreignKeyMetadata =
                            await getWorkspaceForeignKeyIds(
                                transaction,
                                column.foreignKeyTableName,
                                column.foreignKeyColumnName
                            );

                    }

                    await transaction.workspaceColumn.create({

                        data: {

                            name:
                                column.name.trim(),

                            dataType:
                                column.dataType,

                            position,

                            tableId,

                            isPrimaryKey:
                                Boolean(
                                    column.isPrimaryKey
                                ),

                            isAutoIncrement:
                                Boolean(
                                    column.isAutoIncrement
                                ),

                            isNullable:
                                column.isNullable !== false,

                            isUnique:
                                Boolean(
                                    column.isUnique
                                ),

                            defaultValue:
                                column.defaultValue
                                    ?.trim() || null,

                            foreignKeyTableId:
                                foreignKeyMetadata?.foreignKeyTableId ?? null,

                            foreignKeyColumnId:
                                foreignKeyMetadata?.foreignKeyColumnId ?? null,

                        },

                    });


                    return transaction.workspaceTable.findUnique({

                        where: {

                            id: tableId,

                        },

                        include: {

                            columns: {

                                orderBy: {

                                    position: "asc",

                                },

                            },

                        },

                    });

                }
            );


        res.status(201).json(updatedTable);

    } catch (error) {

        console.error(error);


        if (getValidationStatus(error)) {

            return res.status(400).json({

                message:
                    error.message,

            });

        }


        if (
            error.message?.includes(
                "already exists"
            )
        ) {

            return res.status(409).json({

                message:
                    error.message,

            });

        }


        res.status(500).json({

            message:
                "Failed to add workspace column.",

        });

    }

};


/* ================================================== */
/* GET RECORDS                                        */
/* ================================================== */

export const getWorkspaceRecords = async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);


        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message:
                    "Invalid table ID.",

            });

        }


        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

            });


        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }


        const physicalTable =
            await getPhysicalTable(
                prisma,
                table.name
            );


        if (!physicalTable) {

            return res.status(409).json({

                message:
                    `The PostgreSQL table "${table.name}" does not exist.`,

            });

        }


        const records =
            await prisma.$queryRawUnsafe(
                `SELECT * FROM ${quoteIdentifier(
                    physicalTable.table_name
                )}`
            );


        res.status(200).json(records);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to fetch workspace records.",

        });

    }

};


/* ================================================== */
/* CREATE RECORD                                      */
/* ================================================== */

export const createWorkspaceRecord = async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);


        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message:
                    "Invalid table ID.",

            });

        }


        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

                include: {

                    columns: {

                        orderBy: {

                            position: "asc",

                        },

                    },

                },

            });


        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }


        const values =
            req.body &&
                typeof req.body === "object"
                ? req.body
                : {};


        const columnNames =
            new Set(
                table.columns.map(
                    column =>
                        column.name.toLowerCase()
                )
            );


        for (const key of Object.keys(values)) {

            if (
                !columnNames.has(
                    key.toLowerCase()
                )
            ) {

                return res.status(400).json({

                    message:
                        `Column "${key}" does not exist.`,

                });

            }

        }


        const insertColumns = [];
        const insertValues = [];


        for (const column of table.columns) {

            if (column.isAutoIncrement) {
                continue;
            }


            const matchingKey =
                Object.keys(values).find(
                    key =>
                        key.toLowerCase() ===
                        column.name.toLowerCase()
                );


            const value =
                matchingKey !== undefined
                    ? values[matchingKey]
                    : undefined;


            const isEmpty =
                value === undefined ||
                value === null ||
                (
                    typeof value === "string" &&
                    value.trim() === ""
                );


            if (
                column.isNullable === false &&
                isEmpty &&
                !column.defaultValue
            ) {

                return res.status(400).json({

                    message:
                        `Column "${column.name}" is required.`,

                });

            }


            if (isEmpty) {
                continue;
            }


            insertColumns.push(column);
            insertValues.push(value);

        }


        if (insertColumns.length === 0) {

            const insertSQL = `

        INSERT INTO ${quoteIdentifier(
                table.name
            )}

        DEFAULT VALUES

        RETURNING *;

    `;

            const createdRows =
                await prisma.$queryRawUnsafe(
                    insertSQL
                );

            return res.status(201).json(
                createdRows[0]
            );

        }


        const columnSQL =
            insertColumns
                .map(column =>
                    quoteIdentifier(
                        column.name
                    )
                )
                .join(", ");


        const valuePlaceholders =
            insertValues
                .map(
                    (_, index) =>
                        `$${index + 1}`
                )
                .join(", ");


        const insertSQL = `

            INSERT INTO ${quoteIdentifier(
            table.name
        )}

            (${columnSQL})

            VALUES (${valuePlaceholders})

            RETURNING *;

        `;


        const createdRows =
            await prisma.$queryRawUnsafe(
                insertSQL,
                ...insertValues
            );


        res.status(201).json(
            createdRows[0]
        );

    } catch (error) {

        console.error(error);


        if (error.code === "23505") {

            return res.status(409).json({

                message:
                    "A value already exists for a unique column.",

            });

        }


        if (
            error.code === "23522" ||
            error.code === "23502"
        ) {

            return res.status(400).json({

                message:
                    "A required value is missing.",

            });

        }


        if (error.code === "23503") {

            return res.status(400).json({

                message:
                    "The record contains a foreign key value that does not exist.",

            });

        }


        res.status(500).json({

            message:
                "Failed to create workspace record.",

        });

    }

};


/* ================================================== */
/* UPDATE RECORD                                      */
/* ================================================== */

export const updateWorkspaceRecord = async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);

        const recordId =
            req.params.recordId;


        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message:
                    "Invalid table ID.",

            });

        }


        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

                include: {

                    columns: {

                        orderBy: {

                            position: "asc",

                        },

                    },

                },

            });


        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }


        const primaryKey =
            table.columns.find(
                column =>
                    column.isPrimaryKey
            );


        if (!primaryKey) {

            return res.status(400).json({

                message:
                    "This table does not have a primary key.",

            });

        }


        const values =
            req.body &&
                typeof req.body === "object"
                ? req.body
                : {};


        const columnNames =
            new Set(
                table.columns.map(
                    column =>
                        column.name.toLowerCase()
                )
            );


        for (const key of Object.keys(values)) {

            if (
                !columnNames.has(
                    key.toLowerCase()
                )
            ) {

                return res.status(400).json({

                    message:
                        `Column "${key}" does not exist.`,

                });

            }

        }


        const updateColumns = [];
        const updateValues = [];


        for (const column of table.columns) {

            if (column.isPrimaryKey) {
                continue;
            }


            const matchingKey =
                Object.keys(values).find(
                    key =>
                        key.toLowerCase() ===
                        column.name.toLowerCase()
                );


            if (matchingKey === undefined) {
                continue;
            }


            let value =
                values[matchingKey];


            const isEmpty =
                value === undefined ||
                value === null ||
                (
                    typeof value === "string" &&
                    value.trim() === ""
                );


            if (
                column.isNullable === false &&
                isEmpty
            ) {

                return res.status(400).json({

                    message:
                        `Column "${column.name}" is required.`,

                });

            }


            if (isEmpty) {
                value = null;
            }


            updateColumns.push(column);
            updateValues.push(value);

        }


        if (updateColumns.length === 0) {

            return res.status(400).json({

                message:
                    "At least one value is required.",

            });

        }


        const setSQL =
            updateColumns
                .map(
                    (column, index) =>
                        `${quoteIdentifier(
                            column.name
                        )} = $${index + 1}`
                )
                .join(", ");


        const primaryKeyPlaceholder =
            `$${updateValues.length + 1}`;


        const updateSQL = `

            UPDATE ${quoteIdentifier(
            table.name
        )}

            SET ${setSQL}

            WHERE ${quoteIdentifier(
            primaryKey.name
        )}
                = ${primaryKeyPlaceholder}

            RETURNING *;

        `;


        const updatedRows =
            await prisma.$queryRawUnsafe(

                updateSQL,

                ...updateValues,

                recordId

            );


        if (updatedRows.length === 0) {

            return res.status(404).json({

                message:
                    "Record not found.",

            });

        }


        res.status(200).json(
            updatedRows[0]
        );

    } catch (error) {

        console.error(error);


        if (error.code === "23505") {

            return res.status(409).json({

                message:
                    "A value already exists for a unique column.",

            });

        }


        if (error.code === "23503") {

            return res.status(400).json({

                message:
                    "The record contains a foreign key value that does not exist.",

            });

        }


        if (
            error.code === "23502" ||
            error.code === "23522"
        ) {

            return res.status(400).json({

                message:
                    "A required value is missing.",

            });

        }


        res.status(500).json({

            message:
                "Failed to update workspace record.",

        });

    }

};


/* ================================================== */
/* DELETE RECORD                                      */
/* ================================================== */

export const deleteWorkspaceRecord = async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);

        const recordId =
            req.params.recordId;


        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message:
                    "Invalid table ID.",

            });

        }


        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

                include: {

                    columns: true,

                },

            });


        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }


        const primaryKey =
            table.columns.find(
                column =>
                    column.isPrimaryKey
            );


        if (!primaryKey) {

            return res.status(400).json({

                message:
                    "This table does not have a primary key.",

            });

        }


        const deleteSQL = `

            DELETE FROM ${quoteIdentifier(
            table.name
        )}

            WHERE ${quoteIdentifier(
            primaryKey.name
        )}
                = $1

            RETURNING *;

        `;


        const deletedRows =
            await prisma.$queryRawUnsafe(
                deleteSQL,
                recordId
            );


        if (deletedRows.length === 0) {

            return res.status(404).json({

                message:
                    "Record not found.",

            });

        }


        res.status(200).json({

            message:
                "Record deleted.",

            record:
                deletedRows[0],

        });

    } catch (error) {

        console.error(error);


        if (error.code === "23503") {

            return res.status(409).json({

                message:
                    "This record cannot be deleted because it is referenced by another table.",

            });

        }


        res.status(500).json({

            message:
                "Failed to delete workspace record.",

        });

    }

};

export const updateWorkspaceColumn = async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);

        const columnId =
            Number(req.params.columnId);

        if (
            !Number.isInteger(tableId) ||
            !Number.isInteger(columnId)
        ) {

            return res.status(400).json({

                message:
                    "Invalid table or column ID.",

            });

        }

        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

                include: {

                    columns: {

                        orderBy: {

                            position: "asc",

                        },

                    },

                },

            });

        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }

        const column =
            table.columns.find(
                item =>
                    item.id === columnId
            );

        if (!column) {

            return res.status(404).json({

                message:
                    "Column not found.",

            });

        }

        const physicalTable =
            await prisma.$queryRaw`

                SELECT EXISTS (

                    SELECT 1

                    FROM information_schema.tables

                    WHERE table_schema = 'public'

                    AND LOWER(table_name) =
                        LOWER(${table.name})

                ) AS "exists";

            `;

        if (!physicalTable[0]?.exists) {

            return res.status(409).json({

                message:
                    `The PostgreSQL table "${table.name}" does not exist.`,

            });

        }

        const physicalColumn =
            await prisma.$queryRaw`

                SELECT
                    column_name,
                    data_type,
                    udt_name,
                    is_nullable,
                    column_default

                FROM information_schema.columns

                WHERE table_schema = 'public'

                AND LOWER(table_name) =
                    LOWER(${table.name})

                AND LOWER(column_name) =
                    LOWER(${column.name})

                LIMIT 1;

            `;

        if (physicalColumn.length === 0) {

            return res.status(409).json({

                message:
                    `The PostgreSQL column "${column.name}" does not exist.`,

            });

        }

        const requestedName =
            req.body.name !== undefined
                ? String(req.body.name).trim()
                : column.name;

        const requestedType =
            req.body.dataType !== undefined
                ? req.body.dataType
                : column.dataType;

        const requestedNullable =
            req.body.isNullable !== undefined
                ? Boolean(req.body.isNullable)
                : column.isNullable;

        const requestedUnique =
            req.body.isUnique !== undefined
                ? Boolean(req.body.isUnique)
                : column.isUnique;

        const requestedDefault =
            req.body.defaultValue !== undefined
                ? req.body.defaultValue
                : column.defaultValue;

        const requestedForeignKey =
            req.body.isForeignKey !== undefined
                ? Boolean(req.body.isForeignKey)
                : Boolean(column.foreignKeyTableId);

        const requestedForeignKeyTableName =
            req.body.foreignKeyTableName !== undefined
                ? String(
                    req.body.foreignKeyTableName
                ).trim()
                : null;

        const requestedForeignKeyColumnName =
            req.body.foreignKeyColumnName !== undefined
                ? String(
                    req.body.foreignKeyColumnName
                ).trim()
                : null;

        const validatedColumn =
            validateSingleColumnDefinition({

                name:
                    requestedName,

                dataType:
                    requestedType,

                isPrimaryKey:
                    column.isPrimaryKey,

                isAutoIncrement:
                    column.isAutoIncrement,

                isNullable:
                    requestedNullable,

                isUnique:
                    requestedUnique,

                defaultValue:
                    requestedDefault,

                isForeignKey:
                    requestedForeignKey,

                foreignKeyTableName:
                    requestedForeignKeyTableName,

                foreignKeyColumnName:
                    requestedForeignKeyColumnName,

            });

        if (
            column.isAutoIncrement &&
            requestedType !== "INTEGER"
        ) {

            throw new Error(
                `Auto increment column "${column.name}" must remain INTEGER.`
            );

        }

        if (
            column.isAutoIncrement &&
            requestedName !== column.name
        ) {

            // Allowed. PostgreSQL will rename the identity column.
        }

        if (
            requestedNullable === false &&
            column.isNullable
        ) {

            const nullCount =
                await prisma.$queryRawUnsafe(
                    `
                        SELECT COUNT(*)::int AS count
                        FROM ${quoteIdentifier(table.name)}
                        WHERE ${quoteIdentifier(column.name)}
                            IS NULL;
                    `
                );

            if (
                Number(
                    nullCount[0]?.count || 0
                ) > 0
            ) {

                throw new Error(
                    `Cannot make column "${column.name}" required because it contains NULL values.`
                );

            }

        }

        if (
            requestedForeignKey
        ) {

            if (
                !requestedForeignKeyTableName ||
                !requestedForeignKeyColumnName
            ) {

                throw new Error(
                    `Foreign key column "${requestedName}" must specify a referenced table and column.`
                );

            }

            const referencedColumn =
                await prisma.$queryRaw`

                    SELECT
                        data_type,
                        udt_name

                    FROM information_schema.columns

                    WHERE table_schema = 'public'

                    AND LOWER(table_name) =
                        LOWER(${requestedForeignKeyTableName})

                    AND LOWER(column_name) =
                        LOWER(${requestedForeignKeyColumnName})

                    LIMIT 1;

                `;

            if (
                referencedColumn.length === 0
            ) {

                throw new Error(
                    `Referenced column "${requestedForeignKeyColumnName}" does not exist in table "${requestedForeignKeyTableName}".`
                );

            }

            const referencedType =
                normalizeDataType(
                    referencedColumn[0].data_type,
                    referencedColumn[0].udt_name
                );

            const localType =
                normalizeDataType(
                    requestedType
                );

            if (
                localType !== referencedType
            ) {

                throw new Error(
                    `Foreign key column "${requestedName}" has type ${localType}, but "${requestedForeignKeyTableName}.${requestedForeignKeyColumnName}" is ${referencedType}. Change the foreign key column data type to ${referencedType}.`
                );

            }

        }

        const updatedColumn =
            await prisma.$transaction(
                async (transaction) => {

                    const currentColumn =
                        await transaction.$queryRaw`

                            SELECT
                                column_name,
                                data_type,
                                udt_name

                            FROM information_schema.columns

                            WHERE table_schema = 'public'

                            AND LOWER(table_name) =
                                LOWER(${table.name})

                            AND LOWER(column_name) =
                                LOWER(${column.name})

                            LIMIT 1;

                        `;

                    if (
                        currentColumn.length === 0
                    ) {

                        throw new Error(
                            `The PostgreSQL column "${column.name}" does not exist.`
                        );

                    }

                    if (
                        requestedName.toLowerCase() !==
                        column.name.toLowerCase()
                    ) {

                        const duplicateColumn =
                            table.columns.find(
                                item =>
                                    item.id !== column.id &&
                                    item.name.toLowerCase() ===
                                    requestedName.toLowerCase()
                            );

                        if (duplicateColumn) {

                            throw new Error(
                                `Column "${requestedName}" already exists.`
                            );

                        }

                        await transaction.$executeRawUnsafe(
                            buildRenameColumnSQL(
                                table.name,
                                column.name,
                                requestedName
                            )
                        );

                    }

                    const currentType =
                        normalizeDataType(
                            currentColumn[0].data_type,
                            currentColumn[0].udt_name
                        );

                    if (
                        currentType !== requestedType
                    ) {

                        await transaction.$executeRawUnsafe(
                            buildAlterColumnTypeSQL(
                                table.name,
                                requestedName,
                                requestedType
                            )
                        );

                    }

                    if (
                        requestedNullable !==
                        column.isNullable
                    ) {

                        await transaction.$executeRawUnsafe(
                            buildSetNullableSQL(
                                table.name,
                                requestedName,
                                requestedNullable
                            )
                        );

                    }

                    if (
                        String(
                            requestedDefault ?? ""
                        ).trim() !==
                        String(
                            column.defaultValue ?? ""
                        ).trim()
                    ) {

                        await transaction.$executeRawUnsafe(
                            buildSetDefaultSQL(
                                table.name,
                                requestedName,
                                {
                                    ...validatedColumn,
                                    defaultValue:
                                        requestedDefault,
                                }
                            )
                        );

                    }

                    if (
                        requestedUnique !==
                        column.isUnique
                    ) {

                        const uniqueConstraints =
                            await transaction.$queryRaw`

                                SELECT
                                    con.conname AS "constraintName"

                                FROM pg_constraint con

                                JOIN pg_class rel
                                    ON rel.oid =
                                        con.conrelid

                                JOIN pg_attribute attr
                                    ON attr.attrelid =
                                        rel.oid
                                    AND attr.attnum =
                                        ANY(con.conkey)

                                WHERE rel.relname =
                                    ${table.name}

                                AND con.contype = 'u'

                                AND attr.attname =
                                    ${requestedName};

                            `;

                        if (requestedUnique) {

                            if (
                                uniqueConstraints.length === 0
                            ) {

                                const constraintName =
                                    `${table.name}_${requestedName}_unique`;

                                await transaction.$executeRawUnsafe(
                                    buildAddUniqueConstraintSQL(
                                        table.name,
                                        requestedName,
                                        constraintName
                                    )
                                );

                            }

                        } else {

                            for (
                                const constraint
                                of uniqueConstraints
                            ) {

                                await transaction.$executeRawUnsafe(
                                    buildDropConstraintSQL(
                                        table.name,
                                        constraint.constraintName
                                    )
                                );

                            }

                        }

                    }

                    return transaction.workspaceColumn.update({

                        where: {

                            id: columnId,

                        },

                        data: {

                            name:
                                requestedName,

                            dataType:
                                requestedType,

                            isNullable:
                                requestedNullable,

                            isUnique:
                                requestedUnique,

                            defaultValue:
                                String(
                                    requestedDefault ?? ""
                                ).trim() || null,

                        },

                    });

                }
            );

        res.status(200).json({

            message:
                "Column updated.",

            column:
                updatedColumn,

        });

    } catch (error) {

        console.error(error);

        if (
            error.code === "23505"
        ) {

            return res.status(409).json({

                message:
                    "The requested column change violates a unique constraint.",

            });

        }

        if (
            error.code === "23502"
        ) {

            return res.status(400).json({

                message:
                    "The column cannot be made required because existing data contains NULL values.",

            });

        }

        if (
            error.code === "22P02" ||
            error.code === "42804"
        ) {

            return res.status(400).json({

                message:
                    "The existing column data cannot be converted to the requested data type. Change the data type or update the existing values first.",

            });

        }

        if (
            error.message?.includes("required") ||
            error.message?.includes("Invalid") ||
            error.message?.includes("already exists") ||
            error.message?.includes("Foreign key") ||
            error.message?.includes("Referenced column") ||
            error.message?.includes("NULL values") ||
            error.message?.includes("Auto increment")
        ) {

            return res.status(400).json({

                message:
                    error.message,

            });

        }

        res.status(500).json({

            message:
                "Failed to update workspace column.",

        });

    }

};

export const deleteWorkspaceColumn = async (req, res) => {

    try {

        const tableId =
            Number(req.params.id);

        const columnId =
            Number(req.params.columnId);

        if (
            !Number.isInteger(tableId) ||
            !Number.isInteger(columnId)
        ) {

            return res.status(400).json({

                message:
                    "Invalid table or column ID.",

            });

        }

        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

                include: {

                    columns: {

                        orderBy: {

                            position: "asc",

                        },

                    },

                },

            });

        if (!table) {

            return res.status(404).json({

                message:
                    "Table not found.",

            });

        }

        const column =
            table.columns.find(
                item =>
                    item.id === columnId
            );

        if (!column) {

            return res.status(404).json({

                message:
                    "Column not found.",

            });

        }

        if (column.isPrimaryKey) {

            return res.status(400).json({

                message:
                    "Primary key columns cannot be deleted yet.",

            });

        }

        const physicalTable =
            await prisma.$queryRaw`

                SELECT EXISTS (

                    SELECT 1

                    FROM information_schema.tables

                    WHERE table_schema = 'public'

                    AND LOWER(table_name) =
                        LOWER(${table.name})

                ) AS "exists";

            `;

        if (!physicalTable[0]?.exists) {

            return res.status(409).json({

                message:
                    `The PostgreSQL table "${table.name}" does not exist.`,

            });

        }

        const physicalColumn =
            await prisma.$queryRaw`

                SELECT column_name

                FROM information_schema.columns

                WHERE table_schema = 'public'

                AND LOWER(table_name) =
                    LOWER(${table.name})

                AND LOWER(column_name) =
                    LOWER(${column.name})

                LIMIT 1;

            `;

        if (
            physicalColumn.length === 0
        ) {

            return res.status(409).json({

                message:
                    `The PostgreSQL column "${column.name}" does not exist.`,

            });

        }

        await prisma.$transaction(
            async (transaction) => {

                const foreignKeyConstraints =
                    await transaction.$queryRaw`

                        SELECT
                            con.conname AS "constraintName"

                        FROM pg_constraint con

                        JOIN pg_class rel
                            ON rel.oid =
                                con.conrelid

                        JOIN pg_attribute attr
                            ON attr.attrelid =
                                rel.oid
                            AND attr.attnum =
                                ANY(con.conkey)

                        WHERE rel.relname =
                            ${table.name}

                        AND con.contype = 'f'

                        AND attr.attname =
                            ${column.name};

                    `;

                for (
                    const constraint
                    of foreignKeyConstraints
                ) {

                    await transaction.$executeRawUnsafe(
                        buildDropConstraintSQL(
                            table.name,
                            constraint.constraintName
                        )
                    );

                }

                await transaction.$executeRawUnsafe(
                    buildDropColumnSQL(
                        table.name,
                        column.name
                    )
                );

                await transaction.workspaceColumn.delete({

                    where: {

                        id: columnId,

                    },

                });

                const remainingColumns =
                    await transaction.workspaceColumn.findMany({

                        where: {

                            tableId,

                        },

                        orderBy: {

                            position: "asc",

                        },

                    });

                for (
                    const [
                        index,
                        remainingColumn,
                    ]
                    of remainingColumns.entries()
                ) {

                    if (
                        remainingColumn.position !==
                        index
                    ) {

                        await transaction.workspaceColumn.update({

                            where: {

                                id:
                                    remainingColumn.id,

                            },

                            data: {

                                position:
                                    index,

                            },

                        });

                    }

                }

            }
        );

        const updatedTable =
            await prisma.workspaceTable.findUnique({

                where: {

                    id: tableId,

                },

                include: {

                    columns: {

                        orderBy: {

                            position: "asc",

                        },

                    },

                },

            });

        res.status(200).json({

            message:
                "Column deleted.",

            table:
                updatedTable,

        });

    } catch (error) {

        console.error(error);

        if (
            error.code === "2BP01"
        ) {

            return res.status(409).json({

                message:
                    "This column cannot be deleted because other database objects depend on it.",

            });

        }

        res.status(500).json({

            message:
                "Failed to delete workspace column.",

        });

    }

};