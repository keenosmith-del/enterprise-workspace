import prisma from "../config/prisma.js";

import {
    validateTableName,
    validateColumnDefinitions,
    validateSingleColumnDefinition,
    buildCreateTableSQL,
    quoteIdentifier,
} from "../utils/dynamicTable.js";

console.log("WorkspaceTable delegate:", prisma.workspaceTable);
console.log("Prisma delegates:", Object.keys(prisma).filter(key => !key.startsWith("$")));

export const getWorkspaceTables = async (req, res) => {

    try {

        const tables = await prisma.workspaceTable.findMany({

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

        res.status(200).json(tables);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to fetch workspace tables.",

        });

    }

};

export const createWorkspaceTable = async (req, res) => {

    try {

        console.log(
            "CREATE TABLE REQUEST:",
            JSON.stringify(req.body, null, 2)
        );

        const name =
            validateTableName(req.body.name);

        const columns =
            validateColumnDefinitions(
                Array.isArray(req.body.columns)
                    ? req.body.columns
                    : []
            );

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

        const protectedTables = [

            "products",
            "categories",
            "suppliers",

        ];

        if (
            protectedTables.includes(
                name.toLowerCase()
            )
        ) {

            return res.status(403).json({

                message:
                    "This table name is protected.",

            });

        }

        const table = await prisma.$transaction(
            async (transaction) => {

                const existingPhysicalTable =
                    await transaction.$queryRaw`

                        SELECT EXISTS (

                            SELECT 1

                            FROM information_schema.tables

                            WHERE table_schema = 'public'

                            AND LOWER(table_name) =
                                LOWER(${name})

                        ) AS "exists";

                    `;

                if (existingPhysicalTable[0]?.exists) {

                    throw new Error(
                        "A PostgreSQL table with that name already exists."
                    );

                }

                const createTableSQL =
                    buildCreateTableSQL(
                        name,
                        columns
                    );

                await transaction.$executeRawUnsafe(
                    createTableSQL
                );

                return transaction.workspaceTable.create({

                    data: {

                        name,

                        columns: {

                            create: columns.map(
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

        if (
            error.message?.includes(
                "already exists"
            )
        ) {

            return res.status(409).json({

                message: error.message,

            });

        }

        if (
            error.message?.includes(
                "required"
            ) ||
            error.message?.includes(
                "Invalid"
            ) ||
            error.message?.includes(
                "cannot exceed"
            ) ||
            error.message?.includes(
                "duplicated"
            ) ||
            error.message?.includes(
                "only supported"
            ) ||
            error.message?.includes(
                "must be a primary key"
            )
        ) {

            return res.status(400).json({

                message: error.message,

            });

        }

        res.status(500).json({

            message:
                "Failed to create workspace table.",

        });

    }

};

export const deleteWorkspaceTable = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const table = await prisma.workspaceTable.findUnique({

            where: {

                id,

            },

        });

        if (!table) {

            return res.status(404).json({

                message: "Table not found.",

            });

        }

        await prisma.workspaceTable.delete({

            where: {

                id,

            },

        });

        res.status(200).json({

            message: "Table deleted.",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to delete table.",

        });

    }

};

export const updateWorkspaceTable = async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {

            return res.status(400).json({

                message: "Invalid table ID.",

            });

        }

        const name =
            req.body.name?.trim();

        if (!name) {

            return res.status(400).json({

                message: "Table name is required.",

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

        const table =
            await prisma.workspaceTable.findUnique({

                where: {

                    id,

                },

            });

        if (!table) {

            return res.status(404).json({

                message: "Table not found.",

            });

        }

        const protectedTables = [

            "products",
            "categories",
            "suppliers",

        ];

        if (
            protectedTables.includes(
                name.toLowerCase()
            )
        ) {

            return res.status(403).json({

                message:
                    "This table name is protected.",

            });

        }

        const updatedTable =
            await prisma.$transaction(
                async (transaction) => {

                    const physicalTableCheck =
                        await transaction.$queryRaw`

                            SELECT EXISTS (

                                SELECT 1

                                FROM information_schema.tables

                                WHERE table_schema = 'public'

                                AND LOWER(table_name) =
                                    LOWER(${table.name})

                            ) AS "exists";

                        `;

                    if (!physicalTableCheck[0]?.exists) {

                        throw new Error(
                            `The PostgreSQL table "${table.name}" does not exist.`
                        );

                    }

                    const existingPhysicalTable =
                        await transaction.$queryRaw`

                            SELECT EXISTS (

                                SELECT 1

                                FROM information_schema.tables

                                WHERE table_schema = 'public'

                                AND LOWER(table_name) =
                                    LOWER(${name})

                            ) AS "exists";

                        `;

                    if (existingPhysicalTable[0]?.exists) {

                        throw new Error(
                            `A PostgreSQL table named "${name}" already exists.`
                        );

                    }

                    await transaction.$executeRawUnsafe(`

                        ALTER TABLE ${quoteIdentifier(table.name)}
                        RENAME TO ${quoteIdentifier(name)};

                    `);

                    return transaction.workspaceTable.update({

                        where: {

                            id,

                        },

                        data: {

                            name,

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

                message: error.message,

            });

        }

        res.status(500).json({

            message:
                "Failed to update table.",

        });

    }

};

export const addWorkspaceColumn = async (req, res) => {

    try {

        const tableId = Number(req.params.id);

        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message: "Invalid table ID.",

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

                message: "Table not found.",

            });

        }

        const column =
            validateSingleColumnDefinition(
                req.body
            );

        const existingColumn =
            table.columns.find(
                existing =>
                    existing.name.toLowerCase() ===
                    column.name.trim().toLowerCase()
            );

        if (existingColumn) {

            return res.status(409).json({

                message:
                    `Column "${column.name}" already exists.`,

            });

        }

        const physicalColumnCheck =
            await prisma.$queryRaw`

                SELECT EXISTS (

                    SELECT 1

                    FROM information_schema.columns

                    WHERE table_schema = 'public'

                    AND table_name = ${table.name}

                    AND LOWER(column_name) =
                        LOWER(${column.name.trim()})

                ) AS "exists";

            `;

        if (physicalColumnCheck[0]?.exists) {

            return res.status(409).json({

                message:
                    `Column "${column.name}" already exists in PostgreSQL.`,

            });

        }

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

            const dataTypeMap = {

                INTEGER: "INTEGER",
                DECIMAL: "DECIMAL",
                VARCHAR: "VARCHAR",
                TEXT: "TEXT",
                BOOLEAN: "BOOLEAN",
                DATE: "DATE",
                TIMESTAMP: "TIMESTAMP",

            };

            columnParts.push(
                dataTypeMap[column.dataType]
            );

        }

        if (column.isNullable === false) {

            columnParts.push("NOT NULL");

        }

        if (column.isUnique) {

            columnParts.push("UNIQUE");

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
                defaultValue === "CURRENT_TIMESTAMP"
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

        const position =
            table.columns.length;

        const alterTableSQL = `

            ALTER TABLE ${quoteIdentifier(
            table.name
        )}

            ADD COLUMN ${columnParts.join(" ")};

        `;

        const updatedTable =
            await prisma.$transaction(
                async (transaction) => {

                    await transaction.$executeRawUnsafe(
                        alterTableSQL
                    );

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

        if (
            error.message?.includes(
                "required"
            ) ||
            error.message?.includes(
                "Invalid"
            ) ||
            error.message?.includes(
                "cannot exceed"
            ) ||
            error.message?.includes(
                "duplicated"
            ) ||
            error.message?.includes(
                "only supported"
            ) ||
            error.message?.includes(
                "must be a primary key"
            ) ||
            error.message?.includes(
                "not supported"
            )
        ) {

            return res.status(400).json({

                message: error.message,

            });

        }

        if (
            error.message?.includes(
                "already exists"
            )
        ) {

            return res.status(409).json({

                message: error.message,

            });

        }

        res.status(500).json({

            message:
                "Failed to add workspace column.",

        });

    }

};

export const getWorkspaceRecords = async (req, res) => {

    try {

        const tableId = Number(req.params.id);

        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message: "Invalid table ID.",

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

                message: "Table not found.",

            });

        }

        const records =
            await prisma.$queryRawUnsafe(
                `SELECT * FROM ${quoteIdentifier(table.name)}`
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

export const createWorkspaceRecord = async (req, res) => {

    try {

        const tableId = Number(req.params.id);

        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message: "Invalid table ID.",

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

                message: "Table not found.",

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
                    column => column.name.toLowerCase()
                )
            );

        for (const key of Object.keys(values)) {

            if (!columnNames.has(key.toLowerCase())) {

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

            return res.status(400).json({

                message:
                    "At least one value is required.",

            });

        }

        const columnSQL =
            insertColumns
                .map(column =>
                    quoteIdentifier(column.name)
                )
                .join(", ");

        const valuePlaceholders =
            insertValues
                .map((_, index) =>
                    `$${index + 1}`
                )
                .join(", ");

        const insertSQL = `

            INSERT INTO ${quoteIdentifier(table.name)}
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

        if (
            error.code === "23505"
        ) {

            return res.status(409).json({

                message:
                    "A value already exists for a unique column.",

            });

        }

        if (
            error.code === "23522"
        ) {

            return res.status(400).json({

                message:
                    "A required value is missing.",

            });

        }

        res.status(500).json({

            message:
                "Failed to create workspace record.",

        });

    }

};

export const updateWorkspaceRecord = async (req, res) => {

    try {

        const tableId = Number(req.params.id);
        const recordId = req.params.recordId;

        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message: "Invalid table ID.",

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

                message: "Table not found.",

            });

        }

        const primaryKey =
            table.columns.find(
                column => column.isPrimaryKey
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
                    column => column.name.toLowerCase()
                )
            );

        for (const key of Object.keys(values)) {

            if (!columnNames.has(key.toLowerCase())) {

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
                        `${quoteIdentifier(column.name)} = $${index + 1}`
                )
                .join(", ");

        const primaryKeyPlaceholder =
            `$${updateValues.length + 1}`;

        const updateSQL = `

            UPDATE ${quoteIdentifier(table.name)}

            SET ${setSQL}

            WHERE ${quoteIdentifier(primaryKey.name)}
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

                message: "Record not found.",

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

        res.status(500).json({

            message:
                "Failed to update workspace record.",

        });

    }

};

export const deleteWorkspaceRecord = async (req, res) => {

    try {

        const tableId = Number(req.params.id);
        const recordId = req.params.recordId;

        if (!Number.isInteger(tableId)) {

            return res.status(400).json({

                message: "Invalid table ID.",

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

                message: "Table not found.",

            });

        }

        const primaryKey =
            table.columns.find(
                column => column.isPrimaryKey
            );

        if (!primaryKey) {

            return res.status(400).json({

                message:
                    "This table does not have a primary key.",

            });

        }

        const deleteSQL = `

            DELETE FROM ${quoteIdentifier(table.name)}

            WHERE ${quoteIdentifier(primaryKey.name)}
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

                message: "Record not found.",

            });

        }

        res.status(200).json({

            message: "Record deleted.",

            record: deletedRows[0],

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to delete workspace record.",

        });

    }

};