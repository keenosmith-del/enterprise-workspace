import { useEffect, useState } from "react";

import "./CreateTableModal.css";

const DATA_TYPES = [
    "INTEGER",
    "DECIMAL",
    "VARCHAR",
    "TEXT",
    "BOOLEAN",
    "DATE",
    "TIMESTAMP",
];

function CreateTableModal({

    open,
    value,
    onChange,

    onCancel,
    onCreate,

    tables = [],

}) {

    const [columns, setColumns] = useState([
        {
            name: "id",
            dataType: "INTEGER",
            isPrimaryKey: true,
            isAutoIncrement: true,
            isNullable: false,
            isUnique: false,
            defaultValue: "",

            isForeignKey: false,
            foreignKeyTableId: "",
            foreignKeyColumnId: "",
        },
    ]);

    useEffect(() => {

        if (!open) return;

        setColumns([
            {
                name: "id",
                dataType: "INTEGER",
                isPrimaryKey: true,
                isAutoIncrement: true,
                isNullable: false,
                isUnique: false,
                defaultValue: "",

                isForeignKey: false,
                foreignKeyTableId: "",
                foreignKeyColumnId: "",
            },
        ]);

    }, [open]);

    if (!open) return null;

    function updateColumn(index, field, newValue) {

        setColumns(previous =>

            previous.map((column, columnIndex) => {

                if (columnIndex !== index) {
                    return column;
                }

                return {
                    ...column,
                    [field]: newValue,
                };

            })

        );

    }

    function addColumn() {

        setColumns(previous => [

            ...previous,

            {
                name: "",
                dataType: "VARCHAR",
                isPrimaryKey: false,
                isAutoIncrement: false,
                isNullable: true,
                isUnique: false,
                defaultValue: "",

                isForeignKey: false,
                foreignKeyTableId: "",
                foreignKeyColumnId: "",
            },

        ]);

    }

    function removeColumn(index) {

        setColumns(previous =>

            previous.filter(
                (_, columnIndex) =>
                    columnIndex !== index
            )

        );

    }

    function handleForeignKeyToggle(index, checked) {

        updateColumn(
            index,
            "isForeignKey",
            checked
        );

        if (!checked) {

            updateColumn(
                index,
                "foreignKeyTableId",
                ""
            );

            updateColumn(
                index,
                "foreignKeyColumnId",
                ""
            );

        }

    }

    function getReferencedTable(tableId) {

        return tables.find(
            table =>
                String(table.id) === String(tableId)
        );

    }

    function handleForeignKeyTableChange(index, tableId) {

        updateColumn(
            index,
            "foreignKeyTableId",
            tableId
        );

        updateColumn(
            index,
            "foreignKeyColumnId",
            ""
        );

    }

    function handleCreate() {

        const preparedColumns = columns.map(column => {

            if (!column.isForeignKey) {

                return column;

            }

            const referencedTable =
                getReferencedTable(
                    column.foreignKeyTableId
                );

            const referencedColumn =
                referencedTable?.columnDefinitions?.find(
                    referencedColumn =>
                        String(referencedColumn.id) ===
                        String(column.foreignKeyColumnId)
                );

            return {

                ...column,

                foreignKeyTableName:
                    referencedTable?.title || "",

                foreignKeyColumnName:
                    referencedColumn?.name || "",

            };

        });

        onCreate(preparedColumns);

    }

    return (

        <div className="createTableModalOverlay">

            <div className="createTableSchemaModal">

                <h2>Create Table</h2>

                <input
                    className="createTableInput"
                    placeholder="Table name..."
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    autoFocus
                />

                <div className="createTableColumns">

                    <div className="createTableColumnsHeader">

                        <span>Column</span>
                        <span>Type</span>
                        <span>PK</span>
                        <span>Auto</span>
                        <span>Required</span>
                        <span>Unique</span>
                        <span>Default</span>
                        <span>FK</span>
                        <span></span>

                    </div>

                    {columns.map((column, index) => {

                        const referencedTable =
                            getReferencedTable(
                                column.foreignKeyTableId
                            );

                        const referencedColumns =
                            referencedTable?.columnDefinitions ||
                            [];

                        return (

                            <div
                                className="createTableColumnRow"
                                key={index}
                            >

                                <input
                                    className="createTableColumnInput"
                                    placeholder="Column name"
                                    value={column.name}
                                    onChange={(event) =>
                                        updateColumn(
                                            index,
                                            "name",
                                            event.target.value
                                        )
                                    }
                                />

                                <select
                                    className="createTableColumnInput"
                                    value={column.dataType}
                                    onChange={(event) => {

                                        const dataType =
                                            event.target.value;

                                        updateColumn(
                                            index,
                                            "dataType",
                                            dataType
                                        );

                                        if (
                                            dataType !==
                                            "INTEGER"
                                        ) {

                                            updateColumn(
                                                index,
                                                "isAutoIncrement",
                                                false
                                            );

                                        }

                                    }}
                                >

                                    {DATA_TYPES.map(type => (

                                        <option
                                            key={type}
                                            value={type}
                                        >
                                            {type}
                                        </option>

                                    ))}

                                </select>

                                <input
                                    type="checkbox"
                                    checked={
                                        column.isPrimaryKey
                                    }
                                    onChange={(event) => {

                                        const isPrimaryKey =
                                            event.target.checked;

                                        updateColumn(
                                            index,
                                            "isPrimaryKey",
                                            isPrimaryKey
                                        );

                                        if (!isPrimaryKey) {

                                            updateColumn(
                                                index,
                                                "isAutoIncrement",
                                                false
                                            );

                                        }

                                    }}
                                />

                                <input
                                    type="checkbox"
                                    checked={
                                        column.isAutoIncrement
                                    }
                                    disabled={
                                        !column.isPrimaryKey ||
                                        column.dataType !==
                                        "INTEGER"
                                    }
                                    onChange={(event) =>
                                        updateColumn(
                                            index,
                                            "isAutoIncrement",
                                            event.target.checked
                                        )
                                    }
                                />

                                <input
                                    type="checkbox"
                                    checked={
                                        !column.isNullable
                                    }
                                    onChange={(event) =>
                                        updateColumn(
                                            index,
                                            "isNullable",
                                            !event.target.checked
                                        )
                                    }
                                />

                                <input
                                    type="checkbox"
                                    checked={
                                        column.isUnique
                                    }
                                    onChange={(event) =>
                                        updateColumn(
                                            index,
                                            "isUnique",
                                            event.target.checked
                                        )
                                    }
                                />

                                <input
                                    className="createTableColumnInput"
                                    placeholder="Default"
                                    value={
                                        column.defaultValue
                                    }
                                    onChange={(event) =>
                                        updateColumn(
                                            index,
                                            "defaultValue",
                                            event.target.value
                                        )
                                    }
                                />

                                <input
                                    type="checkbox"
                                    checked={
                                        column.isForeignKey
                                    }
                                    onChange={(event) =>
                                        handleForeignKeyToggle(
                                            index,
                                            event.target.checked
                                        )
                                    }
                                />

                                <button
                                    className="createTableRemoveColumn"
                                    onClick={() =>
                                        removeColumn(index)
                                    }
                                    disabled={
                                        columns.length === 1
                                    }
                                >
                                    ×
                                </button>

                                {column.isForeignKey && (

                                    <div
                                        className="createTableForeignKeyControls"
                                    >

                                        <select
                                            className="createTableColumnInput"
                                            value={
                                                column.foreignKeyTableId
                                            }
                                            onChange={(event) =>
                                                handleForeignKeyTableChange(
                                                    index,
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Referenced table
                                            </option>

                                            {tables.map(table => (

                                                <option
                                                    key={table.id}
                                                    value={table.id}
                                                >
                                                    {table.title}
                                                </option>

                                            ))}

                                        </select>

                                        <select
                                            className="createTableColumnInput"
                                            value={
                                                column.foreignKeyColumnId
                                            }
                                            disabled={
                                                !column.foreignKeyTableId
                                            }
                                            onChange={(event) =>
                                                updateColumn(
                                                    index,
                                                    "foreignKeyColumnId",
                                                    event.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Referenced column
                                            </option>

                                            {referencedColumns.map(
                                                columnDefinition => (

                                                    <option
                                                        key={
                                                            columnDefinition.id
                                                        }
                                                        value={
                                                            columnDefinition.id
                                                        }
                                                    >
                                                        {
                                                            columnDefinition.name
                                                        }
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                )}

                            </div>

                        );

                    })}

                </div>

                <button
                    className="createTableAddColumn"
                    onClick={addColumn}
                >
                    + Add Column
                </button>

                <div className="createTableActions">

                    <button
                        className="createTableButton"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="createTableButton"
                        onClick={handleCreate}
                    >
                        Create Table
                    </button>

                </div>

            </div>

        </div>

    );

}

export default CreateTableModal;