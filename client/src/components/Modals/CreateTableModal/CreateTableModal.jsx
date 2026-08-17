import { useState } from "react";

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
        },
    ]);

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

    function handleCreate() {

        onCreate(columns);

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
                        <span></span>

                    </div>

                    {columns.map((column, index) => (

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

                                    if (dataType !== "INTEGER") {

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
                                checked={column.isPrimaryKey}
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
                                checked={column.isAutoIncrement}
                                disabled={!column.isPrimaryKey || column.dataType !== "INTEGER"}
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
                                checked={!column.isNullable}
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
                                checked={column.isUnique}
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
                                value={column.defaultValue}
                                onChange={(event) =>
                                    updateColumn(
                                        index,
                                        "defaultValue",
                                        event.target.value
                                    )
                                }
                            />

                            <button
                                className="createTableRemoveColumn"
                                onClick={() =>
                                    removeColumn(index)
                                }
                                disabled={columns.length === 1}
                            >
                                ×
                            </button>

                        </div>

                    ))}

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