import { useEffect, useRef, useState } from "react";

import "./ExpandedTable.css";

import {
    Pencil,
    Trash2,
    Plus,
    Database,
    X,
    Check,
    RotateCcw,
    ArrowUpDown,
    ListFilter,
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

    loadDatabase,

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

    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const [showSortMenu, setShowSortMenu] = useState(false);

    const [filterColumn, setFilterColumn] = useState(null);
    const [filterCondition, setFilterCondition] = useState("contains");
    const [filterValue, setFilterValue] = useState("");
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    const [schemaEditing, setSchemaEditing] = useState(false);

    const [schemaColumns, setSchemaColumns] = useState([]);

    const [savingSchemaColumn, setSavingSchemaColumn] =
        useState(null);

    const [deletingSchemaColumn, setDeletingSchemaColumn] =
        useState(null);

    const [addingSchemaColumn, setAddingSchemaColumn] =
        useState(false);

    const [editingSchemaColumn, setEditingSchemaColumn] = useState(null);
    const [schemaColumnOriginals, setSchemaColumnOriginals] = useState({});

    const [schemaOriginalColumnIds, setSchemaOriginalColumnIds] = useState([]);
    const [resettingSchema, setResettingSchema] = useState(false);

    const rowRefs = useRef([]);

    const createRowRef = useRef(null);

    const safeRows = rows ?? [];
    const safeRecords = records ?? [];

    const filteredData = safeRows
        .map((row, index) => ({
            row,
            record: safeRecords[index],
            originalIndex: index,
        }))
        .filter(({ row }) => {

            if (searchQuery.trim()) {

                const matchesSearch =
                    row.some(cell =>
                        String(cell ?? "")
                            .toLowerCase()
                            .includes(
                                searchQuery.toLowerCase()
                            )
                    );

                if (!matchesSearch) {
                    return false;
                }

            }


            if (
                filterColumn === null ||
                !filterValue.trim()
            ) {

                return true;

            }


            const cellValue =
                String(
                    row[filterColumn] ?? ""
                ).toLowerCase();

            const value =
                filterValue
                    .trim()
                    .toLowerCase();


            switch (filterCondition) {

                case "equals":

                    return cellValue === value;


                case "notEquals":

                    return cellValue !== value;


                case "startsWith":

                    return cellValue.startsWith(
                        value
                    );


                case "endsWith":

                    return cellValue.endsWith(
                        value
                    );


                case "contains":
                default:

                    return cellValue.includes(
                        value
                    );

            }

        })
        .sort((a, b) => {

            if (sortColumn === null) {
                return 0;
            }

            const aValue =
                a.row[sortColumn];

            const bValue =
                b.row[sortColumn];

            if (
                aValue === null ||
                aValue === undefined
            ) {
                return 1;
            }

            if (
                bValue === null ||
                bValue === undefined
            ) {
                return -1;
            }

            const aString =
                String(aValue).toLowerCase();

            const bString =
                String(bValue).toLowerCase();

            const comparison =
                aString.localeCompare(
                    bString,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base",
                    }
                );

            return sortDirection === "asc"
                ? comparison
                : -comparison;

        });

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

                            const createData = {};

                            customColumns.forEach(
                                column => {

                                    if (column.isAutoIncrement) {
                                        return;
                                    }

                                    createData[column.name] =
                                        editingRecord?.[column.name];

                                }
                            );

                            await createWorkspaceRecord(
                                workspaceTableId,
                                createData
                            );

                        }

                        break;

                }

                await loadDatabase();

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

            await loadDatabase();

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

            await loadDatabase();

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

        const initialColumns =
            customColumns.map(
                column => ({
                    ...column,
                })
            );

        setSchemaColumns(initialColumns);

        setSchemaOriginalColumnIds(
            initialColumns.map(
                column => column.id
            )
        );

        setSchemaEditing(true);

        setCreatingRow(false);

        setEditingRow(null);

        setEditingRecord(null);

        onSelectRow(null);

    }

    async function handleSchemaReset() {

        if (!workspaceTableId || resettingSchema) {
            return;
        }

        const addedColumns =
            schemaColumns.filter(
                column =>
                    !schemaOriginalColumnIds.includes(
                        column.id
                    )
            );

        if (addedColumns.length === 0) {
            return;
        }

        setResettingSchema(true);

        try {

            for (const column of addedColumns) {

                await deleteWorkspaceColumn(
                    workspaceTableId,
                    column.id
                );

            }

            await loadDatabase();

            setSchemaColumns(
                previous =>
                    previous.filter(
                        column =>
                            schemaOriginalColumnIds.includes(
                                column.id
                            )
                    )
            );

            setEditingSchemaColumn(null);

            setSchemaColumnOriginals({});

            setToast({

                visible: true,

                message:
                    addedColumns.length === 1
                        ? "Added column reverted."
                        : `${addedColumns.length} added columns reverted.`,

                type: "success",

            });

        } catch (error) {

            console.error(error);

            setToast({

                visible: true,

                message:
                    error.message ||
                    "Unable to reset added columns.",

                type: "error",

            });

        } finally {

            setResettingSchema(false);

        }

    }

    function closeSchemaEditor() {

        setSchemaEditing(false);

        setSchemaColumns([]);

        setSavingSchemaColumn(null);

        setDeletingSchemaColumn(null);

        setAddingSchemaColumn(false);

        setEditingSchemaColumn(null);

        setSchemaColumnOriginals({});

        setSchemaOriginalColumnIds([]);
        setResettingSchema(false);

    }


    function updateSchemaColumn(
        columnId,
        field,
        value
    ) {

        setSchemaColumnOriginals(
            previous => {

                if (previous[columnId]) {
                    return previous;
                }

                const original =
                    schemaColumns.find(
                        column =>
                            column.id === columnId
                    );

                if (!original) {
                    return previous;
                }

                return {
                    ...previous,
                    [columnId]: {
                        ...original,
                    },
                };

            }
        );


        setEditingSchemaColumn(columnId);


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

        setSchemaColumnOriginals(
            previous => {

                if (previous[column.id]) {
                    return previous;
                }

                return {
                    ...previous,
                    [column.id]: {
                        ...column,
                    },
                };

            }
        );


        setEditingSchemaColumn(
            column.id
        );


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
                                dataType === "INTEGER"
                                    ? current.isAutoIncrement
                                    : false,

                        };

                    }
                )
        );

    }

    function handleSchemaCancel(
        columnId
    ) {

        const original =
            schemaColumnOriginals[
            columnId
            ];

        if (!original) {

            setEditingSchemaColumn(
                null
            );

            return;

        }


        setSchemaColumns(
            previous =>
                previous.map(
                    column =>
                        column.id === columnId
                            ? {
                                ...original,
                            }
                            : column
                )
        );


        setSchemaColumnOriginals(
            previous => {

                const updated = {
                    ...previous,
                };

                delete updated[columnId];

                return updated;

            }
        );


        setEditingSchemaColumn(
            null
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

            await loadDatabase();

            setEditingSchemaColumn(null);

            setSchemaColumnOriginals(
                previous => {

                    const updated = {
                        ...previous,
                    };

                    delete updated[column.id];

                    return updated;

                }
            );

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


    async function handleSchemaDelete(column) {

        if (!workspaceTableId) return;

        if (column.isPrimaryKey) {

            setToast({

                visible: true,

                message:
                    `Unable to delete column "${column.name}" because it is the primary key.`,

                type: "error",

            });

            return;

        }

        setDeletingSchemaColumn(column.id);

        try {

            await deleteWorkspaceColumn(
                workspaceTableId,
                column.id
            );

            await loadDatabase();

            setSchemaColumns(
                previous =>
                    previous.filter(
                        current =>
                            current.id !== column.id
                    )
            );

            setSchemaColumnOriginals(
                previous => {

                    const updated = {
                        ...previous,
                    };

                    delete updated[column.id];

                    return updated;

                }
            );

            setEditingSchemaColumn(null);

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
                    `Unable to delete column "${column.name}". ${error.message ||
                    "The column may be required by another database constraint."
                    }`,

                type: "error",

            });

        } finally {

            setDeletingSchemaColumn(null);

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

            await loadDatabase();

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

                    <div className="expandedTableSchemaHeaderActions">

                        <button
                            className="expandedTableHeaderButton"
                            disabled={
                                resettingSchema ||
                                schemaColumns.filter(
                                    column =>
                                        !schemaOriginalColumnIds.includes(
                                            column.id
                                        )
                                ).length === 0
                            }
                            onClick={handleSchemaReset}
                        >
                            <RotateCcw
                                size={15}
                                strokeWidth={1}
                            />
                        </button>

                        <button
                            className="expandedTableHeaderButton"
                            onClick={closeSchemaEditor}
                        >
                            <X
                                size={15}
                                strokeWidth={1}
                            />
                        </button>

                    </div>

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

                                                    {editingSchemaColumn === column.id && (

                                                        <>

                                                            <button
                                                                className="expandedTableActionButton"
                                                                disabled={
                                                                    isSaving ||
                                                                    isDeleting ||
                                                                    editingSchemaColumn !== column.id
                                                                }
                                                                onClick={() =>
                                                                    handleSchemaSave(column)
                                                                }
                                                            >
                                                                <Check
                                                                    size={15}
                                                                    strokeWidth={1}
                                                                />
                                                            </button>


                                                            <button
                                                                className="expandedTableActionButton"
                                                                disabled={
                                                                    isSaving ||
                                                                    isDeleting
                                                                }
                                                                onClick={() =>
                                                                    handleSchemaCancel(
                                                                        column.id
                                                                    )
                                                                }
                                                            >

                                                                <X
                                                                    size={15}
                                                                    strokeWidth={1}
                                                                />

                                                            </button>

                                                        </>

                                                    )}


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

                                {/* sort button */}
                                <button
                                    className="expandedTableHeaderButton"
                                    title="Sort"
                                    onClick={() =>
                                        setShowSortMenu(
                                            previous => !previous
                                        )
                                    }
                                >
                                    <ArrowUpDown
                                        size={16}
                                        strokeWidth={1}
                                    />
                                </button>

                                {/* sort menu */}
                                {showSortMenu && (

                                    <div className="expandedTableSortMenu">

                                        <div className="expandedTableSortHeader">
                                            Sort by
                                        </div>

                                        {columns.map(
                                            (column, index) => (

                                                <button
                                                    key={column}
                                                    className={`expandedTableSortOption ${sortColumn === index
                                                        ? "active"
                                                        : ""
                                                        }`}
                                                    onClick={() => {

                                                        if (
                                                            sortColumn === index
                                                        ) {

                                                            setSortDirection(
                                                                previous =>
                                                                    previous === "asc"
                                                                        ? "desc"
                                                                        : "asc"
                                                            );

                                                        } else {

                                                            setSortColumn(index);
                                                            setSortDirection("asc");

                                                        }

                                                    }}
                                                >

                                                    <span>
                                                        {column}
                                                    </span>

                                                    {sortColumn === index && (

                                                        <span>
                                                            {sortDirection === "asc"
                                                                ? "↑"
                                                                : "↓"}
                                                        </span>

                                                    )}

                                                </button>

                                            )
                                        )}

                                        {sortColumn !== null && (

                                            <button
                                                className="expandedTableSortClear"
                                                onClick={() => {

                                                    setSortColumn(null);
                                                    setSortDirection("asc");
                                                    setShowSortMenu(false);

                                                }}
                                            >
                                                Clear sort
                                            </button>

                                        )}

                                    </div>

                                )}

                                {/* filter button */}
                                <button
                                    className="expandedTableHeaderButton"
                                    title="Filter"
                                    onClick={() =>
                                        setShowFilterMenu(
                                            previous => !previous
                                        )
                                    }
                                >
                                    <ListFilter
                                        size={16}
                                        strokeWidth={1}
                                    />
                                </button>

                                {/* filter menu */}
                                {showFilterMenu && (

                                    <div className="expandedTableFilterMenu">

                                        <div className="expandedTableFilterHeader">
                                            Filter
                                        </div>


                                        <div className="expandedTableFilterField">

                                            <span>
                                                Column
                                            </span>

                                            <select
                                                value={
                                                    filterColumn === null
                                                        ? ""
                                                        : filterColumn
                                                }
                                                onChange={event => {

                                                    const value =
                                                        event.target.value;

                                                    setFilterColumn(
                                                        value === ""
                                                            ? null
                                                            : Number(value)
                                                    );

                                                }}
                                            >

                                                <option value="">
                                                    Select column
                                                </option>

                                                {columns.map(
                                                    (column, index) => (

                                                        <option
                                                            key={column}
                                                            value={index}
                                                        >
                                                            {column}
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>


                                        <div className="expandedTableFilterField">

                                            <span>
                                                Condition
                                            </span>

                                            <select
                                                value={filterCondition}
                                                onChange={event =>
                                                    setFilterCondition(
                                                        event.target.value
                                                    )
                                                }
                                            >

                                                <option value="contains">
                                                    Contains
                                                </option>

                                                <option value="equals">
                                                    Equals
                                                </option>

                                                <option value="notEquals">
                                                    Not equals
                                                </option>

                                                <option value="startsWith">
                                                    Starts with
                                                </option>

                                                <option value="endsWith">
                                                    Ends with
                                                </option>

                                            </select>

                                        </div>


                                        <div className="expandedTableFilterField">

                                            <span>
                                                Value
                                            </span>

                                            <input
                                                type="text"
                                                value={filterValue}
                                                onChange={event =>
                                                    setFilterValue(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Enter value..."
                                            />

                                        </div>


                                        <div className="expandedTableFilterActions">

                                            <button
                                                className="expandedTableFilterClear"
                                                disabled={
                                                    filterColumn === null &&
                                                    !filterValue
                                                }
                                                onClick={() => {

                                                    setFilterColumn(null);
                                                    setFilterCondition("contains");
                                                    setFilterValue("");
                                                    setShowFilterMenu(false);

                                                }}
                                            >
                                                Clear
                                            </button>

                                        </div>

                                    </div>

                                )}


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

                                    <X
                                        size={15}
                                        strokeWidth={1}
                                    />

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

                                                <X
                                                    size={15}
                                                    strokeWidth={1}
                                                />

                                            </button>

                                            <button
                                                className="expandedTableActionButton"
                                                onClick={
                                                    handleSave
                                                }
                                            >

                                                <Check
                                                    size={15}
                                                    strokeWidth={1}
                                                />

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