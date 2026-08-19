import { useEffect, useRef, useState } from "react";

import "./ExpandedTable.css";

import {
    Pencil,
    Trash2,
    Plus,
    Database,
} from "lucide-react";

import {
    createProduct,
    updateProduct,
    deleteProduct,
} from "../../../api/products";

import {
    createCategory,
    updateCategory,
    deleteCategory,
} from "../../../api/categories";

import {
    createSupplier,
    updateSupplier,
    deleteSupplier,
} from "../../../api/suppliers";

import {
    createWorkspaceRecord,
    updateWorkspaceRecord,
    deleteWorkspaceRecord,
    addWorkspaceColumn,
    updateWorkspaceColumn,
    deleteWorkspaceColumn,
} from "../../../api/workspaceTables";


const DATA_TYPES = [
    "INTEGER",
    "DECIMAL",
    "VARCHAR",
    "TEXT",
    "BOOLEAN",
    "DATE",
    "TIMESTAMP",
];


function ExpandedTable({

    tableId,

    title,
    columns,
    columnDefinitions,

    rows,
    records,

    products,
    categories,
    suppliers,

    loadWorkspace,

    toast,
    setToast,

    active,

    selectedRow,

    startEditing,

    onActivate,
    onSelectRow,
    onClose,

}) {

    const [editingRow, setEditingRow] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    const [creatingRow, setCreatingRow] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");

    const [schemaEditing, setSchemaEditing] = useState(false);

    const [schemaColumns, setSchemaColumns] = useState([]);

    const [savingSchemaColumn, setSavingSchemaColumn] =
        useState(null);

    const [deletingSchemaColumn, setDeletingSchemaColumn] =
        useState(null);

    const [addingSchemaColumn, setAddingSchemaColumn] =
        useState(false);

    const rowRefs = useRef([]);

    const createRowRef = useRef(null);

    const safeRows = rows ?? [];
    const safeRecords = records ?? [];

    const filteredData = !searchQuery.trim()

        ? safeRows.map((row, index) => ({
            row,
            record: safeRecords[index],
            originalIndex: index,
        }))

        : safeRows
            .map((row, index) => ({
                row,
                record: safeRecords[index],
                originalIndex: index,
            }))
            .filter(({ row }) =>
                row.some((cell) =>
                    String(cell ?? "")
                        .toLowerCase()
                        .includes(
                            searchQuery.toLowerCase()
                        )
                )
            );

    const noSearchResults =
        searchQuery.trim() &&
        filteredData.length === 0;

    const isCustomTable =
        tableId.startsWith("custom-");

    const workspaceTableId =
        isCustomTable
            ? Number(
                tableId.replace(
                    "custom-",
                    ""
                )
            )
            : null;

    const customColumns =
        isCustomTable
            ? columnDefinitions ?? []
            : [];

    const itemName = isCustomTable
        ? "Record"
        : {
            products: "Product",
            categories: "Category",
            suppliers: "Supplier",
        }[tableId];


    /* -------------------------------------------------- */
    /* Record editing */
    /* -------------------------------------------------- */

    useEffect(() => {

        if (selectedRow == null) {

            setEditingRow(null);
            setEditingRecord(null);

            return;

        }

        if (startEditing) {

            setEditingRow(selectedRow);

            setEditingRecord({
                ...safeRecords[selectedRow],
            });

        } else {

            setEditingRow(null);
            setEditingRecord(null);

        }

    }, [
        selectedRow,
        startEditing,
        safeRecords,
    ]);


    useEffect(() => {

        if (!creatingRow) return;

        requestAnimationFrame(() => {

            createRowRef.current?.scrollIntoView({

                block: "center",
                behavior: "smooth",

            });

        });

    }, [creatingRow]);


    function handleEdit() {

        if (selectedRow == null) return;

        setEditingRow(selectedRow);

        setEditingRecord({
            ...safeRecords[selectedRow],
        });

    }


    function getInitialValue(column) {

        switch (column.dataType) {

            case "INTEGER":
            case "DECIMAL":

                return "";

            case "BOOLEAN":

                return false;

            case "DATE":
            case "TIMESTAMP":
            case "VARCHAR":
            case "TEXT":
            default:

                return "";

        }

    }


    function handleCreate() {

        if (creatingRow) return;

        setCreatingRow(true);

        switch (tableId) {

            case "products":

                setEditingRecord({

                    name: "",
                    categoryId:
                        categories[0]?.id ?? "",
                    supplierId:
                        suppliers[0]?.id ?? "",
                    stock: 0,
                    price: 0,

                });

                break;

            case "categories":

                setEditingRecord({

                    name: "",

                });

                break;

            case "suppliers":

                setEditingRecord({

                    name: "",
                    email: "",
                    phone: "",

                });

                break;

            default:

                if (isCustomTable) {

                    const initialRecord = {};

                    customColumns.forEach(
                        column => {

                            if (
                                column.isAutoIncrement
                            ) {
                                return;
                            }

                            initialRecord[
                                column.name
                            ] =
                                getInitialValue(
                                    column
                                );

                        }
                    );

                    setEditingRecord(
                        initialRecord
                    );

                }

                break;

        }

    }


    useEffect(() => {

        if (selectedRow == null) return;

        requestAnimationFrame(() => {

            rowRefs.current[
                selectedRow
            ]?.scrollIntoView({

                block: "center",
                behavior: "instant",

            });

        });

    }, []);


    function handleCancel() {

        setCreatingRow(false);

        setEditingRow(null);

        setEditingRecord(null);

        onSelectRow(null);

    }


    function handleFieldChange(
        field,
        value
    ) {

        setEditingRecord(previous => ({

            ...previous,

            [field]: value,

        }));

    }


    /* -------------------------------------------------- */
    /* Record save */
    /* -------------------------------------------------- */

    async function handleSave() {

        try {

            if (creatingRow) {

                switch (tableId) {

                    case "products":

                        await createProduct(
                            editingRecord
                        );

                        break;

                    case "categories":

                        await createCategory({

                            name:
                                editingRecord.name,

                        });

                        break;

                    case "suppliers":

                        await createSupplier({

                            name:
                                editingRecord.name,

                            email:
                                editingRecord.email,

                            phone:
                                editingRecord.phone,

                        });

                        break;

                    default:

                        if (isCustomTable) {

                            await createWorkspaceRecord(
                                workspaceTableId,
                                editingRecord
                            );

                        }

                        break;

                }

                await loadWorkspace();

                setCreatingRow(false);

                setEditingRow(null);

                setEditingRecord(null);

                onSelectRow(null);

                setToast({

                    visible: true,

                    message:
                        `${itemName} created.`,

                    type: "success",

                });

                return;

            }


            switch (tableId) {

                case "products":

                    await updateProduct(
                        editingRecord.id,
                        editingRecord
                    );

                    break;

                case "categories":

                    await updateCategory(
                        editingRecord.id,
                        {
                            name:
                                editingRecord.name,
                        }
                    );

                    break;

                case "suppliers":

                    await updateSupplier(
                        editingRecord.id,
                        {
                            name:
                                editingRecord.name,

                            email:
                                editingRecord.email,

                            phone:
                                editingRecord.phone,
                        }
                    );

                    break;

                default:

                    if (isCustomTable) {

                        const primaryKey =
                            customColumns.find(
                                column =>
                                    column.isPrimaryKey
                            );

                        if (!primaryKey) {

                            throw new Error(
                                "This table does not have a primary key."
                            );

                        }

                        const recordId =
                            editingRecord[
                            primaryKey.name
                            ];

                        const updateData = {};

                        customColumns.forEach(
                            column => {

                                if (
                                    column.isPrimaryKey
                                ) {
                                    return;
                                }

                                updateData[
                                    column.name
                                ] =
                                    editingRecord[
                                    column.name
                                    ];

                            }
                        );

                        await updateWorkspaceRecord(
                            workspaceTableId,
                            recordId,
                            updateData
                        );

                    }

                    break;

            }

            await loadWorkspace();

            setEditingRow(null);

            setEditingRecord(null);

        } catch (error) {

            console.error(error);

            setToast({

                visible: true,

                message:
                    error.message ||
                    `Unable to save ${itemName.toLowerCase()}.`,

                type: "error",

            });

        }

    }


    /* -------------------------------------------------- */
    /* Record delete */
    /* -------------------------------------------------- */

    async function handleDelete() {

        if (selectedRow == null) return;

        try {

            const record =
                safeRecords[selectedRow];

            switch (tableId) {

                case "products":

                    await deleteProduct(
                        record.id
                    );

                    break;

                case "categories":

                    await deleteCategory(
                        record.id
                    );

                    break;

                case "suppliers":

                    await deleteSupplier(
                        record.id
                    );

                    break;

                default:

                    if (isCustomTable) {

                        const primaryKey =
                            customColumns.find(
                                column =>
                                    column.isPrimaryKey
                            );

                        if (!primaryKey) {

                            throw new Error(
                                "This table does not have a primary key."
                            );

                        }

                        const recordId =
                            record[
                            primaryKey.name
                            ];

                        await deleteWorkspaceRecord(
                            workspaceTableId,
                            recordId
                        );

                    }

                    break;

            }

            await loadWorkspace();

            setToast({

                visible: true,

                message:
                    `${itemName} deleted.`,

                type: "success",

            });

            onSelectRow(null);

            setEditingRow(null);

            setEditingRecord(null);

        } catch (error) {

            console.error(error);

            let message =
                error.message ||
                "Unable to delete item.";

            if (
                tableId === "categories"
            ) {

                message =
                    "Cannot delete category because products are assigned to it.";

            }

            if (
                tableId === "suppliers"
            ) {

                message =
                    "Cannot delete supplier because products are assigned to it.";

            }

            setToast({

                visible: true,
                message,
                type: "error",

            });

        }

    }


    /* -------------------------------------------------- */
    /* Schema editor */
    /* -------------------------------------------------- */

    function openSchemaEditor() {

        if (!isCustomTable) return;

        setSchemaColumns(
            customColumns.map(
                column => ({
                    ...column,
                })
            )
        );

        setSchemaEditing(true);

        setCreatingRow(false);

        setEditingRow(null);

        setEditingRecord(null);

        onSelectRow(null);

    }


    function closeSchemaEditor() {

        setSchemaEditing(false);

        setSchemaColumns([]);

        setSavingSchemaColumn(null);

        setDeletingSchemaColumn(null);

        setAddingSchemaColumn(false);

    }


    function updateSchemaColumn(
        columnId,
        field,
        value
    ) {

        setSchemaColumns(
            previous =>
                previous.map(
                    column =>
                        column.id === columnId
                            ? {
                                ...column,
                                [field]: value,
                            }
                            : column
                )
        );

    }


    function handleSchemaDataTypeChange(
        column,
        dataType
    ) {

        setSchemaColumns(
            previous =>
                previous.map(
                    current => {

                        if (
                            current.id !==
                            column.id
                        ) {
                            return current;
                        }

                        return {

                            ...current,

                            dataType,

                            isAutoIncrement:
                                dataType ===
                                    "INTEGER"
                                    ? current.isAutoIncrement
                                    : false,

                        };

                    }
                )
        );

    }


    async function handleSchemaSave(
        column
    ) {

        if (!workspaceTableId) return;

        setSavingSchemaColumn(
            column.id
        );

        try {

            const data = {

                name:
                    column.name,

                dataType:
                    column.dataType,

                isNullable:
                    column.isNullable,

                isUnique:
                    column.isUnique,

                defaultValue:
                    column.defaultValue,

            };

            await updateWorkspaceColumn(
                workspaceTableId,
                column.id,
                data
            );

            await loadWorkspace();

            setToast({

                visible: true,

                message:
                    `Column "${column.name}" updated.`,

                type: "success",

            });

        } catch (error) {

            console.error(error);

            setToast({

                visible: true,

                message:
                    error.message ||
                    "Unable to update column.",

                type: "error",

            });

        } finally {

            setSavingSchemaColumn(null);

        }

    }


    async function handleSchemaDelete(
        column
    ) {

        if (!workspaceTableId) return;

        if (column.isPrimaryKey) {

            setToast({

                visible: true,

                message:
                    "The primary key column cannot be deleted.",

                type: "error",

            });

            return;

        }

        const confirmed =
            window.confirm(
                `Delete column "${column.name}"? This will permanently remove the column and its data from PostgreSQL.`
            );

        if (!confirmed) return;

        setDeletingSchemaColumn(
            column.id
        );

        try {

            await deleteWorkspaceColumn(
                workspaceTableId,
                column.id
            );

            await loadWorkspace();

            setSchemaColumns(
                previous =>
                    previous.filter(
                        current =>
                            current.id !==
                            column.id
                    )
            );

            setToast({

                visible: true,

                message:
                    `Column "${column.name}" deleted.`,

                type: "success",

            });

        } catch (error) {

            console.error(error);

            setToast({

                visible: true,

                message:
                    error.message ||
                    "Unable to delete column.",

                type: "error",

            });

        } finally {

            setDeletingSchemaColumn(
                null
            );

        }

    }


    async function handleSchemaAdd() {

        if (!workspaceTableId) return;

        setAddingSchemaColumn(true);

        try {

            const newColumn = {

                name: `column_${schemaColumns.length + 1}`,

                dataType: "VARCHAR",

                isPrimaryKey: false,

                isAutoIncrement: false,

                isNullable: true,

                isUnique: false,

                defaultValue: "",

                isForeignKey: false,

            };

            const updatedTable =
                await addWorkspaceColumn(
                    workspaceTableId,
                    newColumn
                );

            const refreshedColumns =
                updatedTable?.columns ??
                [];

            setSchemaColumns(
                refreshedColumns.map(
                    column => ({
                        ...column,
                    })
                )
            );

            await loadWorkspace();

            setToast({

                visible: true,

                message:
                    "Column added.",

                type: "success",

            });

        } catch (error) {

            console.error(error);

            setToast({

                visible: true,

                message:
                    error.message ||
                    "Unable to add column.",

                type: "error",

            });

        } finally {

            setAddingSchemaColumn(false);

        }

    }


    /* -------------------------------------------------- */
    /* Schema editor render */
    /* -------------------------------------------------- */

    function renderSchemaEditor() {

        return (

            <div className="expandedTableSchemaEditor">

                <div className="expandedTableSchemaHeader">

                    <div>

                        <h4>
                            Table Schema
                        </h4>

                        <span>
                            {schemaColumns.length} column
                            {schemaColumns.length === 1
                                ? ""
                                : "s"}
                        </span>

                    </div>

                    <button
                        className="expandedTableHeaderButton"
                        onClick={closeSchemaEditor}
                    >
                        ×
                    </button>

                </div>


                <div className="expandedTableSchemaBody">

                    <table className="expandedTableElement">

                        <thead>

                            <tr>

                                <th>
                                    Column
                                </th>

                                <th>
                                    Type
                                </th>

                                <th>
                                    PK
                                </th>

                                <th>
                                    Auto
                                </th>

                                <th>
                                    Required
                                </th>

                                <th>
                                    Unique
                                </th>

                                <th>
                                    Default
                                </th>

                                <th>
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {schemaColumns.map(
                                column => {

                                    const isPrimaryKey =
                                        Boolean(
                                            column.isPrimaryKey
                                        );

                                    const isSaving =
                                        savingSchemaColumn ===
                                        column.id;

                                    const isDeleting =
                                        deletingSchemaColumn ===
                                        column.id;

                                    return (

                                        <tr
                                            key={column.id}
                                        >

                                            <td>

                                                <input
                                                    className="expandedTableInput"
                                                    value={
                                                        column.name ??
                                                        ""
                                                    }
                                                    disabled={
                                                        isPrimaryKey ||
                                                        isSaving ||
                                                        isDeleting
                                                    }
                                                    onChange={
                                                        event =>
                                                            updateSchemaColumn(
                                                                column.id,
                                                                "name",
                                                                event.target.value
                                                            )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <select
                                                    className="expandedTableInput"
                                                    value={
                                                        column.dataType
                                                    }
                                                    disabled={
                                                        isPrimaryKey ||
                                                        isSaving ||
                                                        isDeleting
                                                    }
                                                    onChange={
                                                        event =>
                                                            handleSchemaDataTypeChange(
                                                                column,
                                                                event.target.value
                                                            )
                                                    }
                                                >

                                                    {DATA_TYPES.map(
                                                        type => (

                                                            <option
                                                                key={type}
                                                                value={type}
                                                            >
                                                                {type}
                                                            </option>

                                                        )
                                                    )}

                                                </select>

                                            </td>


                                            <td>

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        isPrimaryKey
                                                    }
                                                    disabled
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        Boolean(
                                                            column.isAutoIncrement
                                                        )
                                                    }
                                                    disabled
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        !column.isNullable
                                                    }
                                                    disabled={
                                                        isPrimaryKey ||
                                                        isSaving ||
                                                        isDeleting
                                                    }
                                                    onChange={
                                                        event =>
                                                            updateSchemaColumn(
                                                                column.id,
                                                                "isNullable",
                                                                !event.target.checked
                                                            )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        Boolean(
                                                            column.isUnique
                                                        )
                                                    }
                                                    disabled={
                                                        isSaving ||
                                                        isDeleting
                                                    }
                                                    onChange={
                                                        event =>
                                                            updateSchemaColumn(
                                                                column.id,
                                                                "isUnique",
                                                                event.target.checked
                                                            )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <input
                                                    className="expandedTableInput"
                                                    value={
                                                        column.defaultValue ??
                                                        ""
                                                    }
                                                    disabled={
                                                        isPrimaryKey ||
                                                        isSaving ||
                                                        isDeleting
                                                    }
                                                    onChange={
                                                        event =>
                                                            updateSchemaColumn(
                                                                column.id,
                                                                "defaultValue",
                                                                event.target.value
                                                            )
                                                    }
                                                />

                                            </td>


                                            <td>

                                                <div
                                                    className="expandedTableSchemaActions"
                                                >

                                                    <button
                                                        className="expandedTableActionButton"
                                                        disabled={
                                                            isPrimaryKey ||
                                                            isSaving ||
                                                            isDeleting
                                                        }
                                                        onClick={() =>
                                                            handleSchemaSave(
                                                                column
                                                            )
                                                        }
                                                    >

                                                        <Pencil
                                                            size={15}
                                                            strokeWidth={1}
                                                        />

                                                    </button>


                                                    <button
                                                        className="expandedTableActionButton"
                                                        disabled={
                                                            isPrimaryKey ||
                                                            isSaving ||
                                                            isDeleting
                                                        }
                                                        onClick={() =>
                                                            handleSchemaDelete(
                                                                column
                                                            )
                                                        }
                                                    >

                                                        <Trash2
                                                            size={15}
                                                            strokeWidth={1}
                                                        />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                        </tbody>

                    </table>

                </div>


                <div className="expandedTableSchemaFooter">

                    <button
                        className="expandedTableAddColumnButton"
                        disabled={addingSchemaColumn}
                        onClick={handleSchemaAdd}
                    >

                        <Plus
                            size={15}
                            strokeWidth={1}
                        />

                        {addingSchemaColumn
                            ? "Adding..."
                            : "Add Column"}

                    </button>


                    <button
                        className="expandedTableSchemaCloseButton"
                        onClick={closeSchemaEditor}
                    >

                        Done

                    </button>

                </div>

            </div>

        );

    }


    /* -------------------------------------------------- */
    /* Main render */
    /* -------------------------------------------------- */

    return (

        <section
            className={`expandedTable ${active
                    ? "activeTable"
                    : ""
                }`}
        >

            {schemaEditing
                ? renderSchemaEditor()
                : (

                    <>

                        <div className="expandedTableHeader">

                            <h3>
                                {title}
                            </h3>

                            <div className="expandedTableHeaderActions">

                                <input
                                    className="expandedTableSearchBar"
                                    type="text"
                                    value={
                                        searchQuery
                                    }
                                    onChange={
                                        event =>
                                            setSearchQuery(
                                                event.target.value
                                            )
                                    }
                                    placeholder="Search..."
                                />


                                {isCustomTable && (

                                    <button
                                        className="expandedTableHeaderButton"
                                        title="Edit table schema"
                                        onClick={
                                            openSchemaEditor
                                        }
                                    >

                                        <Database
                                            size={16}
                                            strokeWidth={1}
                                        />

                                    </button>

                                )}


                                <button
                                    className="expandedTableHeaderButton"
                                    onClick={
                                        handleCreate
                                    }
                                >

                                    <Plus
                                        size={16}
                                        strokeWidth={1}
                                    />

                                </button>


                                <button
                                    className="expandedTableHeaderButton"
                                    onClick={
                                        event => {

                                            event.stopPropagation();

                                            onClose();

                                        }
                                    }
                                >

                                    ×

                                </button>

                            </div>

                        </div>


                        <div className="expandedTableBody">

                            <table className="expandedTableElement">

                                <thead>

                                    <tr>

                                        {columns.map(
                                            column => (

                                                <th
                                                    key={column}
                                                >
                                                    {column}
                                                </th>

                                            )
                                        )}

                                    </tr>

                                </thead>


                                <tbody>

                                    {safeRows.length === 0 &&
                                        !creatingRow ? (

                                        <tr>

                                            <td
                                                className="workspaceEmptyState"
                                                colSpan={
                                                    columns.length
                                                }
                                            >
                                                No data available.
                                            </td>

                                        </tr>

                                    ) : noSearchResults ? (

                                        <tr>

                                            <td
                                                className="workspaceEmptyState"
                                                colSpan={
                                                    columns.length
                                                }
                                            >
                                                No results found.
                                            </td>

                                        </tr>

                                    ) : (

                                        filteredData.map(
                                            ({
                                                row,
                                                record,
                                                originalIndex,
                                            }) => (

                                                <tr
                                                    key={
                                                        record?.id ??
                                                        originalIndex
                                                    }
                                                    ref={
                                                        element =>
                                                        (
                                                            rowRefs.current[
                                                            originalIndex
                                                            ] =
                                                            element
                                                        )
                                                    }
                                                    className={
                                                        selectedRow ===
                                                            originalIndex
                                                            ? "selectedRow"
                                                            : ""
                                                    }
                                                    onClick={() => {

                                                        onActivate();

                                                        onSelectRow(
                                                            originalIndex
                                                        );

                                                    }}
                                                >

                                                    {tableId ===
                                                        "products" &&
                                                        editingRow ===
                                                        originalIndex ? (

                                                        <>

                                                            <td>

                                                                <input
                                                                    className="expandedTableInput"
                                                                    value={
                                                                        editingRecord?.name ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "name",
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <select
                                                                    className="expandedTableInput"
                                                                    value={
                                                                        editingRecord?.categoryId ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "categoryId",
                                                                                Number(
                                                                                    event.target.value
                                                                                )
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                >

                                                                    {categories.map(
                                                                        category => (

                                                                            <option
                                                                                key={
                                                                                    category.id
                                                                                }
                                                                                value={
                                                                                    category.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    category.name
                                                                                }
                                                                            </option>

                                                                        )
                                                                    )}

                                                                </select>

                                                            </td>

                                                            <td>

                                                                <select
                                                                    className="expandedTableInput"
                                                                    value={
                                                                        editingRecord?.supplierId ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "supplierId",
                                                                                Number(
                                                                                    event.target.value
                                                                                )
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                >

                                                                    {suppliers.map(
                                                                        supplier => (

                                                                            <option
                                                                                key={
                                                                                    supplier.id
                                                                                }
                                                                                value={
                                                                                    supplier.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    supplier.name
                                                                                }
                                                                            </option>

                                                                        )
                                                                    )}

                                                                </select>

                                                            </td>

                                                            <td>

                                                                <input
                                                                    className="expandedTableInput"
                                                                    type="number"
                                                                    value={
                                                                        editingRecord?.stock ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "stock",
                                                                                Number(
                                                                                    event.target.value
                                                                                )
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <input
                                                                    className="expandedTableInput"
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={
                                                                        editingRecord?.price ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "price",
                                                                                Number(
                                                                                    event.target.value
                                                                                )
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                />

                                                            </td>

                                                        </>

                                                    ) : tableId ===
                                                        "categories" &&
                                                        editingRow ===
                                                        originalIndex ? (

                                                        <>

                                                            <td>

                                                                <input
                                                                    className="expandedTableInput"
                                                                    value={
                                                                        editingRecord?.name ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "name",
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                {
                                                                    products.filter(
                                                                        product =>
                                                                            product.category?.id ===
                                                                            editingRecord?.id
                                                                    ).length
                                                                }

                                                            </td>

                                                        </>

                                                    ) : tableId ===
                                                        "suppliers" &&
                                                        editingRow ===
                                                        originalIndex ? (

                                                        <>

                                                            <td>

                                                                <input
                                                                    className="expandedTableInput"
                                                                    value={
                                                                        editingRecord?.name ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "name",
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <input
                                                                    className="expandedTableInput"
                                                                    value={
                                                                        editingRecord?.email ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "email",
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                />

                                                            </td>

                                                            <td>

                                                                <input
                                                                    className="expandedTableInput"
                                                                    value={
                                                                        editingRecord?.phone ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                "phone",
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                    onClick={
                                                                        event =>
                                                                            event.stopPropagation()
                                                                    }
                                                                />

                                                            </td>

                                                        </>

                                                    ) : isCustomTable &&
                                                        editingRow ===
                                                        originalIndex ? (

                                                        customColumns.map(
                                                            column => (

                                                                <td
                                                                    key={
                                                                        column.name
                                                                    }
                                                                >

                                                                    {column.isAutoIncrement ? (

                                                                        <span className="expandedTableAutoValue">
                                                                            {
                                                                                editingRecord?.[
                                                                                column.name
                                                                                ] ??
                                                                                ""
                                                                            }
                                                                        </span>

                                                                    ) : column.dataType ===
                                                                        "BOOLEAN" ? (

                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                Boolean(
                                                                                    editingRecord?.[
                                                                                    column.name
                                                                                    ]
                                                                                )
                                                                            }
                                                                            onChange={
                                                                                event =>
                                                                                    handleFieldChange(
                                                                                        column.name,
                                                                                        event.target.checked
                                                                                    )
                                                                            }
                                                                            onClick={
                                                                                event =>
                                                                                    event.stopPropagation()
                                                                            }
                                                                        />

                                                                    ) : (

                                                                        <input
                                                                            className="expandedTableInput"
                                                                            type={
                                                                                column.dataType ===
                                                                                    "INTEGER"
                                                                                    ? "number"
                                                                                    : column.dataType ===
                                                                                        "DECIMAL"
                                                                                        ? "number"
                                                                                        : column.dataType ===
                                                                                            "DATE"
                                                                                            ? "date"
                                                                                            : column.dataType ===
                                                                                                "TIMESTAMP"
                                                                                                ? "datetime-local"
                                                                                                : "text"
                                                                            }
                                                                            step={
                                                                                column.dataType ===
                                                                                    "DECIMAL"
                                                                                    ? "0.01"
                                                                                    : undefined
                                                                            }
                                                                            value={
                                                                                editingRecord?.[
                                                                                column.name
                                                                                ] ??
                                                                                ""
                                                                            }
                                                                            onChange={
                                                                                event => {

                                                                                    let value =
                                                                                        event.target.value;

                                                                                    if (
                                                                                        (
                                                                                            column.dataType ===
                                                                                            "INTEGER" ||
                                                                                            column.dataType ===
                                                                                            "DECIMAL"
                                                                                        ) &&
                                                                                        value !==
                                                                                        ""
                                                                                    ) {

                                                                                        value =
                                                                                            Number(
                                                                                                value
                                                                                            );

                                                                                    }

                                                                                    handleFieldChange(
                                                                                        column.name,
                                                                                        value
                                                                                    );

                                                                                }
                                                                            }
                                                                            onClick={
                                                                                event =>
                                                                                    event.stopPropagation()
                                                                            }
                                                                        />

                                                                    )}

                                                                </td>

                                                            )
                                                        )

                                                    ) : (

                                                        row.map(
                                                            (
                                                                cell,
                                                                cellIndex
                                                            ) => (

                                                                <td
                                                                    key={
                                                                        cellIndex
                                                                    }
                                                                >
                                                                    {cell instanceof
                                                                        Date
                                                                        ? cell.toLocaleString()
                                                                        : String(
                                                                            cell ??
                                                                            ""
                                                                        )}
                                                                </td>

                                                            )
                                                        )

                                                    )}

                                                </tr>

                                            )
                                        )

                                    )}


                                    {creatingRow && (

                                        <tr
                                            ref={
                                                createRowRef
                                            }
                                            className="selectedRow"
                                        >

                                            {tableId ===
                                                "products" && (

                                                    <>

                                                        <td>

                                                            <input
                                                                className="expandedTableInput"
                                                                value={
                                                                    editingRecord?.name ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "name",
                                                                            event.target.value
                                                                        )
                                                                }
                                                            />

                                                        </td>

                                                        <td>

                                                            <select
                                                                className="expandedTableInput"
                                                                value={
                                                                    editingRecord?.categoryId ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "categoryId",
                                                                            Number(
                                                                                event.target.value
                                                                            )
                                                                        )
                                                                }
                                                            >

                                                                {categories.map(
                                                                    category => (

                                                                        <option
                                                                            key={
                                                                                category.id
                                                                            }
                                                                            value={
                                                                                category.id
                                                                            }
                                                                        >
                                                                            {
                                                                                category.name
                                                                            }
                                                                        </option>

                                                                    )
                                                                )}

                                                            </select>

                                                        </td>

                                                        <td>

                                                            <select
                                                                className="expandedTableInput"
                                                                value={
                                                                    editingRecord?.supplierId ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "supplierId",
                                                                            Number(
                                                                                event.target.value
                                                                            )
                                                                        )
                                                                }
                                                            >

                                                                {suppliers.map(
                                                                    supplier => (

                                                                        <option
                                                                            key={
                                                                                supplier.id
                                                                            }
                                                                            value={
                                                                                supplier.id
                                                                            }
                                                                        >
                                                                            {
                                                                                supplier.name
                                                                            }
                                                                        </option>

                                                                    )
                                                                )}

                                                            </select>

                                                        </td>

                                                        <td>

                                                            <input
                                                                className="expandedTableInput"
                                                                type="number"
                                                                value={
                                                                    editingRecord?.stock ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "stock",
                                                                            Number(
                                                                                event.target.value
                                                                            )
                                                                        )
                                                                }
                                                            />

                                                        </td>

                                                        <td>

                                                            <input
                                                                className="expandedTableInput"
                                                                type="number"
                                                                step="0.01"
                                                                value={
                                                                    editingRecord?.price ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "price",
                                                                            Number(
                                                                                event.target.value
                                                                            )
                                                                        )
                                                                }
                                                            />

                                                        </td>

                                                    </>

                                                )}


                                            {isCustomTable && (

                                                customColumns.map(
                                                    column => (

                                                        <td
                                                            key={
                                                                column.name
                                                            }
                                                        >

                                                            {column.isAutoIncrement ? (

                                                                <span className="expandedTableAutoValue">
                                                                    Auto
                                                                </span>

                                                            ) : column.dataType ===
                                                                "BOOLEAN" ? (

                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        Boolean(
                                                                            editingRecord?.[
                                                                            column.name
                                                                            ]
                                                                        )
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            handleFieldChange(
                                                                                column.name,
                                                                                event.target.checked
                                                                            )
                                                                    }
                                                                />

                                                            ) : (

                                                                <input
                                                                    className="expandedTableInput"
                                                                    type={
                                                                        column.dataType ===
                                                                            "INTEGER"
                                                                            ? "number"
                                                                            : column.dataType ===
                                                                                "DECIMAL"
                                                                                ? "number"
                                                                                : column.dataType ===
                                                                                    "DATE"
                                                                                    ? "date"
                                                                                    : column.dataType ===
                                                                                        "TIMESTAMP"
                                                                                        ? "datetime-local"
                                                                                        : "text"
                                                                    }
                                                                    step={
                                                                        column.dataType ===
                                                                            "DECIMAL"
                                                                            ? "0.01"
                                                                            : undefined
                                                                    }
                                                                    value={
                                                                        editingRecord?.[
                                                                        column.name
                                                                        ] ??
                                                                        ""
                                                                    }
                                                                    onChange={
                                                                        event => {

                                                                            let value =
                                                                                event.target.value;

                                                                            if (
                                                                                (
                                                                                    column.dataType ===
                                                                                    "INTEGER" ||
                                                                                    column.dataType ===
                                                                                    "DECIMAL"
                                                                                ) &&
                                                                                value !==
                                                                                ""
                                                                            ) {

                                                                                value =
                                                                                    Number(
                                                                                        value
                                                                                    );

                                                                            }

                                                                            handleFieldChange(
                                                                                column.name,
                                                                                value
                                                                            );

                                                                        }
                                                                    }
                                                                />

                                                            )}

                                                        </td>

                                                    )
                                                )

                                            )}


                                            {tableId ===
                                                "categories" && (

                                                    <>

                                                        <td>

                                                            <input
                                                                className="expandedTableInput"
                                                                value={
                                                                    editingRecord?.name ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "name",
                                                                            event.target.value
                                                                        )
                                                                }
                                                            />

                                                        </td>

                                                        <td>
                                                            0
                                                        </td>

                                                    </>

                                                )}


                                            {tableId ===
                                                "suppliers" && (

                                                    <>

                                                        <td>

                                                            <input
                                                                className="expandedTableInput"
                                                                value={
                                                                    editingRecord?.name ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "name",
                                                                            event.target.value
                                                                        )
                                                                }
                                                            />

                                                        </td>

                                                        <td>

                                                            <input
                                                                className="expandedTableInput"
                                                                value={
                                                                    editingRecord?.email ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "email",
                                                                            event.target.value
                                                                        )
                                                                }
                                                            />

                                                        </td>

                                                        <td>

                                                            <input
                                                                className="expandedTableInput"
                                                                value={
                                                                    editingRecord?.phone ??
                                                                    ""
                                                                }
                                                                onChange={
                                                                    event =>
                                                                        handleFieldChange(
                                                                            "phone",
                                                                            event.target.value
                                                                        )
                                                                }
                                                            />

                                                        </td>

                                                    </>

                                                )}

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>


                        {(selectedRow !== null ||
                            creatingRow) && (

                                <div
                                    className={`expandedTableActionBar ${selectedRow !== null ||
                                            creatingRow
                                            ? "expandedTableActionBarVisible"
                                            : "expandedTableActionBarHidden"
                                        }`}
                                >

                                    {editingRow === null &&
                                        !creatingRow ? (

                                        <>

                                            <button
                                                className="expandedTableActionButton"
                                                onClick={
                                                    handleEdit
                                                }
                                            >

                                                <Pencil
                                                    size={16}
                                                    strokeWidth={1}
                                                />

                                            </button>

                                            <button
                                                className="expandedTableActionButton"
                                                onClick={
                                                    handleDelete
                                                }
                                            >

                                                <Trash2
                                                    size={16}
                                                    strokeWidth={1}
                                                />

                                            </button>

                                        </>

                                    ) : (

                                        <>

                                            <button
                                                className="expandedTableActionButton"
                                                onClick={
                                                    handleCancel
                                                }
                                            >

                                                ✕

                                            </button>

                                            <button
                                                className="expandedTableActionButton"
                                                onClick={
                                                    handleSave
                                                }
                                            >

                                                ✓

                                            </button>

                                        </>

                                    )}

                                </div>

                            )}

                    </>

                )}

        </section>

    );

}


export default ExpandedTable;