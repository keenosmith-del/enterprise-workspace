import { useEffect, useRef, useState } from "react";

import "./ExpandedTable.css";

import { Pencil, Trash2, Plus } from "lucide-react";

// making changes 
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

function ExpandedTable({

    tableId,

    title,
    columns,

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

    const rowRefs = useRef([]);

    const createRowRef = useRef(null);

    const safeRows = rows ?? [];
    const safeRecords = records ?? [];

    const itemName = {

        products: "Product",
        categories: "Category",
        suppliers: "Supplier",

    }[tableId];

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
                        .includes(searchQuery.toLowerCase())
                )
            );

    const noSearchResults =
        searchQuery.trim() &&
        filteredData.length === 0;

    useEffect(() => {

        if (selectedRow == null) {

            setEditingRow(null);
            setEditingRecord(null);

            return;

        }

        if (startEditing) {

            setEditingRow(selectedRow);
            setEditingRecord({ ...safeRecords[selectedRow] });

        } else {

            setEditingRow(null);
            setEditingRecord(null);

        }

    }, [selectedRow, startEditing, safeRecords]);

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

    function handleCreate() {

        if (creatingRow) return;

        setCreatingRow(true);

        switch (tableId) {

            case "products":

                setEditingRecord({

                    name: "",
                    categoryId: categories[0]?.id ?? "",
                    supplierId: suppliers[0]?.id ?? "",
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

                break;

        }

    }

    useEffect(() => {

        if (selectedRow == null) return;

        requestAnimationFrame(() => {

            rowRefs.current[selectedRow]?.scrollIntoView({

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

    function handleFieldChange(field, value) {

        setEditingRecord(previous => ({

            ...previous,

            [field]: value,

        }));

    }

    async function handleSave() {

        try {

            if (creatingRow) {

                switch (tableId) {

                    case "products":

                        await createProduct(editingRecord);

                        break;

                    case "categories":

                        await createCategory({

                            name: editingRecord.name,

                        });

                        break;

                    case "suppliers":

                        await createSupplier({

                            name: editingRecord.name,
                            email: editingRecord.email,
                            phone: editingRecord.phone,

                        });

                        break;

                    default:

                        break;

                }

                await loadWorkspace();

                setCreatingRow(false);

                setEditingRow(null);

                setEditingRecord(null);

                onSelectRow(null);

                setToast({

                    visible: true,
                    message: `${itemName} created.`,
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

                    await updateCategory(editingRecord.id, {

                        name: editingRecord.name,

                    });

                    break;

                case "suppliers":

                    await updateSupplier(editingRecord.id, {

                        name: editingRecord.name,
                        email: editingRecord.email,
                        phone: editingRecord.phone,

                    });

                    break;

                default:

                    break;

            }

            await loadWorkspace();

            setEditingRow(null);
            setEditingRecord(null);

        } catch (error) {

            console.error(error);

            setToast({

                visible: true,
                message: `Unable to create ${itemName.toLowerCase()}.`,
                type: "error",

            });

        }

    }

    async function handleDelete() {

        if (selectedRow == null) return;

        try {

            const record = safeRecords[selectedRow];

            switch (tableId) {

                case "products":

                    await deleteProduct(record.id);
                    break;

                case "categories":

                    await deleteCategory(record.id);
                    break;

                case "suppliers":

                    await deleteSupplier(record.id);
                    break;

                default:

                    break;

            }

            await loadWorkspace();

            setToast({

                visible: true,
                message: `${itemName} deleted.`,
                type: "success",

            });

            onSelectRow(null);

            setEditingRow(null);
            setEditingRecord(null);

        } catch (error) {

            console.error(error);

            let message = "Unable to delete item.";

            if (tableId === "categories") {

                message = "Cannot delete category because products are assigned to it.";

            }

            if (tableId === "suppliers") {

                message = "Cannot delete supplier because products are assigned to it.";

            }

            setToast({

                visible: true,
                message,
                type: "error",

            });

        }

    }

    return (

        <section
            className={`expandedTable ${active ? "activeTable" : ""}`}
        >

            <div className="expandedTableHeader">

                <h3>{title}</h3>

                <div className="expandedTableHeaderActions">

                    <input
                        className="expandedTableSearchBar"
                        type="text"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search..."
                    />

                    <button
                        className="expandedTableHeaderButton"
                        onClick={handleCreate}
                    >

                        <Plus
                            size={16}
                            strokeWidth={1}
                        />

                    </button>

                    <button
                        className="expandedTableHeaderButton"
                        onClick={(event) => {

                            event.stopPropagation();

                            onClose();

                        }}
                    >

                        ×

                    </button>

                </div>

            </div>

            <div className="expandedTableBody">

                <table className="expandedTableElement">

                    <thead>

                        <tr>

                            {columns.map(column => (

                                <th key={column}>
                                    {column}
                                </th>

                            ))}

                        </tr>

                    </thead>

                    <tbody>

                        {safeRows.length === 0 ? (

                            <tr>

                                <td
                                    className="workspaceEmptyState"
                                    colSpan={columns.length}
                                >
                                    No data available.
                                </td>

                            </tr>

                        ) : noSearchResults ? (

                            <tr>

                                <td
                                    className="workspaceEmptyState"
                                    colSpan={columns.length}
                                >
                                    No results found.
                                </td>

                            </tr>

                        ) : (

                            filteredData.map(({ row, record, originalIndex }) => (

                                <tr
                                    key={record.id}
                                    ref={(element) => (rowRefs.current[originalIndex] = element)}
                                    className={
                                        selectedRow === originalIndex
                                            ? "selectedRow"
                                            : ""
                                    }
                                    onClick={() => {

                                        onActivate();

                                        onSelectRow(originalIndex);

                                    }}
                                >

                                    {tableId === "products" && editingRow === originalIndex ? (

                                        <>
                                            <td>
                                                <input
                                                    className="expandedTableInput"
                                                    value={editingRecord?.name ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("name", e.target.value)
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>

                                            <td>
                                                <select
                                                    className="expandedTableInput"
                                                    value={editingRecord?.categoryId ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("categoryId", Number(e.target.value))
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {categories.map(category => (
                                                        <option
                                                            key={category.id}
                                                            value={category.id}
                                                        >
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                <select
                                                    className="expandedTableInput"
                                                    value={editingRecord?.supplierId ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("supplierId", Number(e.target.value))
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {suppliers.map(supplier => (
                                                        <option
                                                            key={supplier.id}
                                                            value={supplier.id}
                                                        >
                                                            {supplier.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                <input
                                                    className="expandedTableInput"
                                                    type="number"
                                                    value={editingRecord?.stock ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("stock", Number(e.target.value))
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    className="expandedTableInput"
                                                    type="number"
                                                    step="0.01"
                                                    value={editingRecord?.price ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("price", Number(e.target.value))
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                        </>

                                    ) : tableId === "categories" && editingRow === originalIndex ? (

                                        <>
                                            <td>
                                                <input
                                                    className="expandedTableInput"
                                                    value={editingRecord?.name ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("name", e.target.value)
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>

                                            <td>
                                                {products.filter(
                                                    product => product.category?.id === editingRecord?.id
                                                ).length}
                                            </td>
                                        </>

                                    ) : tableId === "suppliers" && editingRow === originalIndex ? (

                                        <>
                                            <td>
                                                <input
                                                    className="expandedTableInput"
                                                    value={editingRecord?.name ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("name", e.target.value)
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    className="expandedTableInput"
                                                    value={editingRecord?.email ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("email", e.target.value)
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    className="expandedTableInput"
                                                    value={editingRecord?.phone ?? ""}
                                                    onChange={(e) =>
                                                        handleFieldChange("phone", e.target.value)
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                        </>

                                    ) : (

                                        row.map((cell, cellIndex) => (

                                            <td key={cellIndex}>
                                                {cell}
                                            </td>

                                        ))

                                    )}

                                </tr>

                            ))

                        )}

                        {creatingRow && (

                            <tr
                                ref={createRowRef}
                                className="selectedRow"
                            >

                                {tableId === "products" && (

                                    <>
                                        <td>

                                            <input
                                                className="expandedTableInput"
                                                value={editingRecord?.name ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("name", e.target.value)
                                                }
                                            />

                                        </td>

                                        <td>

                                            <select
                                                className="expandedTableInput"
                                                value={editingRecord?.categoryId ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("categoryId", Number(e.target.value))
                                                }
                                            >

                                                {categories.map(category => (

                                                    <option
                                                        key={category.id}
                                                        value={category.id}
                                                    >
                                                        {category.name}
                                                    </option>

                                                ))}

                                            </select>

                                        </td>

                                        <td>

                                            <select
                                                className="expandedTableInput"
                                                value={editingRecord?.supplierId ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("supplierId", Number(e.target.value))
                                                }
                                            >

                                                {suppliers.map(supplier => (

                                                    <option
                                                        key={supplier.id}
                                                        value={supplier.id}
                                                    >
                                                        {supplier.name}
                                                    </option>

                                                ))}

                                            </select>

                                        </td>

                                        <td>

                                            <input
                                                className="expandedTableInput"
                                                type="number"
                                                value={editingRecord?.stock ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("stock", Number(e.target.value))
                                                }
                                            />

                                        </td>

                                        <td>

                                            <input
                                                className="expandedTableInput"
                                                type="number"
                                                step="0.01"
                                                value={editingRecord?.price ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("price", Number(e.target.value))
                                                }
                                            />

                                        </td>

                                    </>

                                )}

                                {tableId === "categories" && (

                                    <>
                                        <td>

                                            <input
                                                className="expandedTableInput"
                                                value={editingRecord?.name ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("name", e.target.value)
                                                }
                                            />

                                        </td>

                                        <td>0</td>

                                    </>

                                )}

                                {tableId === "suppliers" && (

                                    <>
                                        <td>

                                            <input
                                                className="expandedTableInput"
                                                value={editingRecord?.name ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("name", e.target.value)
                                                }
                                            />

                                        </td>

                                        <td>

                                            <input
                                                className="expandedTableInput"
                                                value={editingRecord?.email ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("email", e.target.value)
                                                }
                                            />

                                        </td>

                                        <td>

                                            <input
                                                className="expandedTableInput"
                                                value={editingRecord?.phone ?? ""}
                                                onChange={(e) =>
                                                    handleFieldChange("phone", e.target.value)
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

            {(selectedRow !== null || creatingRow) && (

                <div
                    className={`expandedTableActionBar ${selectedRow !== null || creatingRow
                        ? "expandedTableActionBarVisible"
                        : "expandedTableActionBarHidden"
                        }`}
                >

                    {editingRow === null && !creatingRow ? (

                        <>

                            <button
                                className="expandedTableActionButton"
                                onClick={handleEdit}
                            >

                                <Pencil
                                    size={16}
                                    strokeWidth={1}
                                />

                            </button>

                            <button
                                className="expandedTableActionButton"
                                onClick={handleDelete}
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
                                onClick={handleCancel}
                            >

                                ✕

                            </button>

                            <button
                                className="expandedTableActionButton"
                                onClick={handleSave}
                            >

                                ✓

                            </button>

                        </>

                    )}

                </div>

            )}

        </section>

    );

}

export default ExpandedTable;