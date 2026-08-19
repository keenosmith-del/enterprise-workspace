const DATA_TYPE_SQL = {

    INTEGER: "INTEGER",
    DECIMAL: "DECIMAL",
    VARCHAR: "VARCHAR",
    TEXT: "TEXT",
    BOOLEAN: "BOOLEAN",
    DATE: "DATE",
    TIMESTAMP: "TIMESTAMP",

};

const ALLOWED_DATA_TYPES =
    Object.keys(DATA_TYPE_SQL);


/* -------------------------------------------------- */
/* Identifier */
/* -------------------------------------------------- */

export function quoteIdentifier(identifier) {

    if (
        typeof identifier !== "string" ||
        !identifier.trim()
    ) {

        throw new Error(
            "SQL identifier is required."
        );

    }

    return `"${identifier.replace(/"/g, '""')}"`;

}


/* -------------------------------------------------- */
/* Data types */
/* -------------------------------------------------- */

export function isAllowedDataType(dataType) {

    return ALLOWED_DATA_TYPES.includes(
        dataType
    );

}


export function normalizeDataType(
    dataType,
    udtName = null
) {

    if (udtName) {

        const normalizedUdt =
            String(udtName).toLowerCase();

        if (normalizedUdt === "int2") {
            return "INTEGER";
        }

        if (
            normalizedUdt === "int4" ||
            normalizedUdt === "serial"
        ) {
            return "INTEGER";
        }

        if (
            normalizedUdt === "int8" ||
            normalizedUdt === "bigserial"
        ) {
            return "BIGINT";
        }

        if (
            normalizedUdt === "varchar" ||
            normalizedUdt === "bpchar"
        ) {
            return "VARCHAR";
        }

        if (normalizedUdt === "text") {
            return "TEXT";
        }

        if (
            normalizedUdt === "numeric" ||
            normalizedUdt === "decimal"
        ) {
            return "DECIMAL";
        }

        if (normalizedUdt === "bool") {
            return "BOOLEAN";
        }

        if (normalizedUdt === "date") {
            return "DATE";
        }

        if (
            normalizedUdt === "timestamp" ||
            normalizedUdt === "timestamptz"
        ) {
            return "TIMESTAMP";
        }

    }

    if (
        typeof dataType !== "string"
    ) {

        return null;

    }

    return dataType
        .trim()
        .toUpperCase();

}


/* -------------------------------------------------- */
/* Table validation */
/* -------------------------------------------------- */

export function validateTableName(name) {

    if (
        !name ||
        typeof name !== "string"
    ) {

        throw new Error(
            "Table name is required."
        );

    }

    const trimmedName =
        name.trim();

    if (!trimmedName) {

        throw new Error(
            "Table name is required."
        );

    }

    if (trimmedName.length > 63) {

        throw new Error(
            "Table name cannot exceed 63 characters."
        );

    }

    return trimmedName;

}


/* -------------------------------------------------- */
/* Column validation */
/* -------------------------------------------------- */

export function validateColumnDefinitions(columns) {

    if (!Array.isArray(columns)) {

        return [];

    }

    const names = new Set();

    for (const column of columns) {

        if (
            !column ||
            !column.name ||
            typeof column.name !== "string"
        ) {

            throw new Error(
                "Every column must have a name."
            );

        }

        const name =
            column.name.trim();

        if (!name) {

            throw new Error(
                "Every column must have a name."
            );

        }

        if (name.length > 63) {

            throw new Error(
                `Column name "${name}" cannot exceed 63 characters.`
            );

        }

        const normalizedName =
            name.toLowerCase();

        if (names.has(normalizedName)) {

            throw new Error(
                `Column name "${name}" is duplicated.`
            );

        }

        names.add(normalizedName);

        if (
            !isAllowedDataType(
                column.dataType
            )
        ) {

            throw new Error(
                `Invalid data type for column "${name}".`
            );

        }

        if (
            column.isAutoIncrement &&
            column.dataType !== "INTEGER"
        ) {

            throw new Error(
                `Auto increment is only supported for INTEGER columns.`
            );

        }

        if (
            column.isAutoIncrement &&
            !column.isPrimaryKey
        ) {

            throw new Error(
                `Auto increment column "${name}" must be a primary key.`
            );

        }

        if (
            column.isForeignKey
        ) {

            validateForeignKeyDefinition(
                column
            );

        }

    }

    const primaryKeys =
        columns.filter(
            column =>
                column.isPrimaryKey
        );

    if (primaryKeys.length > 1) {

        throw new Error(
            "A table can only have one primary key."
        );

    }

    return columns;

}


/* -------------------------------------------------- */
/* Foreign key validation */
/* -------------------------------------------------- */

export function validateForeignKeyDefinition(
    column
) {

    const name =
        column?.name || "Unknown";

    if (
        !column?.isForeignKey
    ) {

        return;

    }

    if (
        !column.foreignKeyTableName ||
        typeof column.foreignKeyTableName !== "string"
    ) {

        throw new Error(
            `Foreign key column "${name}" must specify a referenced table.`
        );

    }

    if (
        !column.foreignKeyColumnName ||
        typeof column.foreignKeyColumnName !== "string"
    ) {

        throw new Error(
            `Foreign key column "${name}" must specify a referenced column.`
        );

    }

    const referencedTableName =
        column.foreignKeyTableName.trim();

    const referencedColumnName =
        column.foreignKeyColumnName.trim();

    if (!referencedTableName) {

        throw new Error(
            `Foreign key column "${name}" must specify a referenced table.`
        );

    }

    if (!referencedColumnName) {

        throw new Error(
            `Foreign key column "${name}" must specify a referenced column.`
        );

    }

    if (referencedTableName.length > 63) {

        throw new Error(
            `Referenced table name "${referencedTableName}" cannot exceed 63 characters.`
        );

    }

    if (referencedColumnName.length > 63) {

        throw new Error(
            `Referenced column name "${referencedColumnName}" cannot exceed 63 characters.`
        );

    }

}


/* -------------------------------------------------- */
/* Default values */
/* -------------------------------------------------- */

function buildDefaultValue(column) {

    const value =
        column.defaultValue;

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        return "";

    }

    const defaultValue =
        String(value).trim();

    if (
        column.dataType === "BOOLEAN"
    ) {

        if (
            defaultValue !== "true" &&
            defaultValue !== "false"
        ) {

            throw new Error(
                `Invalid BOOLEAN default value for "${column.name}".`
            );

        }

        return `DEFAULT ${defaultValue}`;

    }

    if (
        column.dataType === "INTEGER" ||
        column.dataType === "DECIMAL"
    ) {

        if (
            !/^-?\d+(\.\d+)?$/.test(
                defaultValue
            )
        ) {

            throw new Error(
                `Invalid numeric default value for "${column.name}".`
            );

        }

        return `DEFAULT ${defaultValue}`;

    }

    if (
        column.dataType === "TIMESTAMP" &&
        defaultValue === "CURRENT_TIMESTAMP"
    ) {

        return "DEFAULT CURRENT_TIMESTAMP";

    }

    return `DEFAULT '${defaultValue.replace(
        /'/g,
        "''"
    )}'`;

}


/* -------------------------------------------------- */
/* Column SQL */
/* -------------------------------------------------- */

function buildColumnDefinition(
    column
) {

    const parts = [

        quoteIdentifier(
            column.name.trim()
        ),

    ];

    if (
        column.isAutoIncrement
    ) {

        parts.push(
            "INTEGER GENERATED BY DEFAULT AS IDENTITY"
        );

    } else {

        parts.push(
            DATA_TYPE_SQL[
            column.dataType
            ]
        );

    }

    if (
        column.isNullable === false
    ) {

        parts.push(
            "NOT NULL"
        );

    }

    if (
        column.isUnique
    ) {

        parts.push(
            "UNIQUE"
        );

    }

    const defaultValue =
        buildDefaultValue(
            column
        );

    if (defaultValue) {

        parts.push(
            defaultValue
        );

    }

    if (
        column.isPrimaryKey
    ) {

        parts.push(
            "PRIMARY KEY"
        );

    }

    return parts.join(" ");

}


/* -------------------------------------------------- */
/* Foreign key SQL */
/* -------------------------------------------------- */

export function buildForeignKeyDefinition(
    column
) {

    validateForeignKeyDefinition(
        column
    );

    return `
        FOREIGN KEY (
            ${quoteIdentifier(
        column.name.trim()
    )}
        )
        REFERENCES
            ${quoteIdentifier(
        column.foreignKeyTableName.trim()
    )}
            (
                ${quoteIdentifier(
        column.foreignKeyColumnName.trim()
    )}
            )
    `;

}


/* -------------------------------------------------- */
/* CREATE TABLE SQL */
/* -------------------------------------------------- */

export function buildCreateTableSQL(
    tableName,
    columns
) {

    const validatedName =
        validateTableName(
            tableName
        );

    const validatedColumns =
        validateColumnDefinitions(
            columns
        );

    const columnDefinitions =
        validatedColumns.map(
            column =>
                buildColumnDefinition(
                    column
                )
        );

    const foreignKeyDefinitions =
        validatedColumns
            .filter(
                column =>
                    column.isForeignKey
            )
            .map(
                column =>
                    buildForeignKeyDefinition(
                        column
                    )
            );

    const definitions = [

        ...columnDefinitions,
        ...foreignKeyDefinitions,

    ];

    return `
        CREATE TABLE ${quoteIdentifier(
        validatedName
    )} (
            ${definitions.join(",\n            ")}
        );
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — ADD COLUMN */
/* -------------------------------------------------- */

export function buildAddColumnSQL(
    tableName,
    column
) {

    const validatedName =
        validateTableName(
            tableName
        );

    const validatedColumn =
        validateSingleColumnDefinition(
            column
        );

    const columnDefinition =
        buildColumnDefinition(
            validatedColumn
        );

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedName
    )}
        ADD COLUMN ${columnDefinition};
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — ADD FOREIGN KEY */
/* -------------------------------------------------- */

export function buildAddForeignKeySQL(
    tableName,
    column
) {

    const validatedName =
        validateTableName(
            tableName
        );

    validateForeignKeyDefinition(
        column
    );

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedName
    )}
        ADD ${buildForeignKeyDefinition(
        column
    )};
    `;

}

/* -------------------------------------------------- */
/* ALTER TABLE — RENAME COLUMN */
/* -------------------------------------------------- */

export function buildRenameColumnSQL(
    tableName,
    currentColumnName,
    newColumnName
) {

    const validatedTableName =
        validateTableName(
            tableName
        );

    if (
        typeof currentColumnName !== "string" ||
        !currentColumnName.trim()
    ) {

        throw new Error(
            "Current column name is required."
        );

    }

    if (
        typeof newColumnName !== "string" ||
        !newColumnName.trim()
    ) {

        throw new Error(
            "New column name is required."
        );

    }

    const trimmedCurrentName =
        currentColumnName.trim();

    const trimmedNewName =
        newColumnName.trim();

    if (trimmedNewName.length > 63) {

        throw new Error(
            `Column name "${trimmedNewName}" cannot exceed 63 characters.`
        );

    }

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedTableName
    )}
        RENAME COLUMN ${quoteIdentifier(
        trimmedCurrentName
    )}
        TO ${quoteIdentifier(
        trimmedNewName
    )};
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — CHANGE DATA TYPE */
/* -------------------------------------------------- */

export function buildAlterColumnTypeSQL(
    tableName,
    columnName,
    dataType
) {

    const validatedTableName =
        validateTableName(
            tableName
        );

    if (
        typeof columnName !== "string" ||
        !columnName.trim()
    ) {

        throw new Error(
            "Column name is required."
        );

    }

    if (
        !isAllowedDataType(
            dataType
        )
    ) {

        throw new Error(
            `Invalid data type for column "${columnName}".`
        );

    }

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedTableName
    )}
        ALTER COLUMN ${quoteIdentifier(
        columnName.trim()
    )}
        TYPE ${DATA_TYPE_SQL[dataType]}
        USING ${quoteIdentifier(
        columnName.trim()
    )}::${DATA_TYPE_SQL[dataType]};
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — NULLABILITY */
/* -------------------------------------------------- */

export function buildSetNullableSQL(
    tableName,
    columnName,
    isNullable
) {

    const validatedTableName =
        validateTableName(
            tableName
        );

    if (
        typeof columnName !== "string" ||
        !columnName.trim()
    ) {

        throw new Error(
            "Column name is required."
        );

    }

    const action =
        isNullable
            ? "DROP NOT NULL"
            : "SET NOT NULL";

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedTableName
    )}
        ALTER COLUMN ${quoteIdentifier(
        columnName.trim()
    )}
        ${action};
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — DEFAULT */
/* -------------------------------------------------- */

export function buildSetDefaultSQL(
    tableName,
    columnName,
    column
) {

    const validatedTableName =
        validateTableName(
            tableName
        );

    if (
        typeof columnName !== "string" ||
        !columnName.trim()
    ) {

        throw new Error(
            "Column name is required."
        );

    }

    const defaultValue =
        buildDefaultValue({

            ...column,

            name:
                columnName.trim(),

        });

    if (!defaultValue) {

        return `
            ALTER TABLE ${quoteIdentifier(
            validatedTableName
        )}
            ALTER COLUMN ${quoteIdentifier(
            columnName.trim()
        )}
            DROP DEFAULT;
        `;

    }

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedTableName
    )}
        ALTER COLUMN ${quoteIdentifier(
        columnName.trim()
    )}
        SET ${defaultValue};
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — ADD UNIQUE */
/* -------------------------------------------------- */

export function buildAddUniqueConstraintSQL(
    tableName,
    columnName,
    constraintName
) {

    const validatedTableName =
        validateTableName(
            tableName
        );

    if (
        typeof columnName !== "string" ||
        !columnName.trim()
    ) {

        throw new Error(
            "Column name is required."
        );

    }

    if (
        typeof constraintName !== "string" ||
        !constraintName.trim()
    ) {

        throw new Error(
            "Unique constraint name is required."
        );

    }

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedTableName
    )}
        ADD CONSTRAINT ${quoteIdentifier(
        constraintName
    )}
        UNIQUE (
            ${quoteIdentifier(
        columnName.trim()
    )}
        );
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — DROP CONSTRAINT */
/* -------------------------------------------------- */

export function buildDropConstraintSQL(
    tableName,
    constraintName
) {

    const validatedTableName =
        validateTableName(
            tableName
        );

    if (
        typeof constraintName !== "string" ||
        !constraintName.trim()
    ) {

        throw new Error(
            "Constraint name is required."
        );

    }

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedTableName
    )}
        DROP CONSTRAINT ${quoteIdentifier(
        constraintName
    )};
    `;

}


/* -------------------------------------------------- */
/* ALTER TABLE — DROP COLUMN */
/* -------------------------------------------------- */

export function buildDropColumnSQL(
    tableName,
    columnName
) {

    const validatedTableName =
        validateTableName(
            tableName
        );

    if (
        typeof columnName !== "string" ||
        !columnName.trim()
    ) {

        throw new Error(
            "Column name is required."
        );

    }

    return `
        ALTER TABLE ${quoteIdentifier(
        validatedTableName
    )}
        DROP COLUMN ${quoteIdentifier(
        columnName.trim()
    )};
    `;

}


/* -------------------------------------------------- */
/* Single column validation */
/* -------------------------------------------------- */

export function validateSingleColumnDefinition(
    column
) {

    const validatedColumns =
        validateColumnDefinitions([
            column,
        ]);

    return validatedColumns[0];

}