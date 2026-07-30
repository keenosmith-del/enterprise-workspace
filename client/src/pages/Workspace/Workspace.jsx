import { useEffect, useState } from "react";

import Background from "../../components/Layout/Background";
import Dock from "../../components/Layout/Dock/Dock";
import WorkspaceCanvas from "../../components/Workspace/WorkspaceCanvas/WorkspaceCanvas";
import WorkspaceTable from "../../components/Tables/WorkspaceTable/WorkspaceTable";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import { getProducts } from "../../api/products";
import { getCategories } from "../../api/categories";
import { getSuppliers } from "../../api/suppliers";
import { workspaceTables } from "../../config/workspaceTables";

import {
    createWorkspaceTable,
    getWorkspaceTables,
    updateWorkspaceTable,
    deleteWorkspaceTable,
} from "../../api/workspaceTables";

import RecordModal from "../../components/Modals/RecordModal/RecordModal";

import ExpandedTableModal from "../../components/Modals/ExpandedTableModal/ExpandedTableModal";
import ExpandedTable from "../../components/Tables/ExpandedTable/ExpandedTable";

import Toast from "../../components/Toast/Toast";
import CreateTableModal from "../../components/Modals/CreateTableModal/CreateTableModal";
import DeleteTableModal from "../../components/Modals/DeleteTableModal/DeleteTableModal";
import EditTableModal from "../../components/Modals/EditTableModal/EditTableModal";

function Workspace({ setLoggedIn }) {

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [customTables, setCustomTables] = useState([]);

    const [activeTables, setActiveTables] = useState(() => {

        const saved = localStorage.getItem("workspace-active-tables");

        return saved
            ? JSON.parse(saved)
            : ["products"];

    });

    const [activeTable, setActiveTable] = useState("products");

    const [editingTable, setEditingTable] = useState(null);
    const [editingRecord, setEditingRecord] = useState(null);

    const [menuOpen, setMenuOpen] = useState(false);

    const [selectedRow, setSelectedRow] = useState(null);

    const [recordModalOpen, setRecordModalOpen] = useState(false);

    const [recordModalMode, setRecordModalMode] = useState("create");

    const [recordModalTable, setRecordModalTable] = useState(null);

    const [recordModalRecord, setRecordModalRecord] = useState(null);

    const [expandedTable, setExpandedTable] = useState(null);

    const [startEditing, setStartEditing] = useState(false);

    const [createTableOpen, setCreateTableOpen] = useState(false);

    const [deleteMode, setDeleteMode] = useState(false);

    const [tablePendingDelete, setTablePendingDelete] = useState(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [deleteBlocked, setDeleteBlocked] = useState(false);

    const [editMode, setEditMode] = useState(false);

    const [tablePendingEdit, setTablePendingEdit] = useState(null);

    const [editTableName, setEditTableName] = useState("");

    const [editModalOpen, setEditModalOpen] = useState(false);

    const [editBlocked, setEditBlocked] = useState(false);

    const [newTableName, setNewTableName] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    const [toast, setToast] = useState({

        visible: false,
        message: "",
        type: "info",

    });

    function addTable(tableId) {

        if (activeTables.includes(tableId)) return;

        if (activeTables.length >= 6) return;

        setActiveTables(previous => [
            ...previous,
            tableId,
        ]);

    }

    function removeTable(tableId) {

        setActiveTables(previous =>
            previous.filter(id => id !== tableId)
        );

    }

    async function loadWorkspace() {

        try {

            const [
                productData,
                categoryData,
                supplierData,
                customTableData,
            ] = await Promise.all([
                getProducts(),
                getCategories(),
                getSuppliers(),
                getWorkspaceTables(),
            ]);

            setProducts(productData);
            setCategories(categoryData);
            setSuppliers(supplierData);
            setCustomTables(customTableData);

        } catch (error) {

            console.error(error);

        }

    }

    useEffect(() => {

        localStorage.setItem(
            "workspace-active-tables",
            JSON.stringify(activeTables)
        );

    }, [activeTables]);

    useEffect(() => {

        loadWorkspace();

    }, []);

    const allTables = [

        ...workspaceTables,

        ...customTables.map((table) => ({

            id: `custom-${table.id}`,
            title: table.name,
            columns: [],

        })),

    ];

    const tableData = {

        products: products.map((product) => ([
            product.name,
            product.category?.name,
            product.supplier?.name,
            product.stock,
            `R ${product.price}`,
        ])),

        categories: categories.map((category) => ([
            category.name,
            products.filter(
                product => product.category?.id === category.id
            ).length,
        ])),

        suppliers: suppliers.map((supplier) => ([
            supplier.name,
            supplier.email,
            supplier.phone,
        ])),

    };

    const filteredTableData = Object.fromEntries(

        Object.entries(tableData).map(([tableId, rows]) => [

            tableId,

            !searchQuery.trim()

                ? rows

                : rows.filter((row) =>

                    row.some((cell) =>

                        String(cell ?? "")
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())

                    )

                ),

        ])

    );

    const visibleTables = activeTables.filter((tableId) => {

        if (!searchQuery.trim()) {

            return true;

        }

        return (filteredTableData[tableId] || []).length > 0;

    });

    const noSearchResults =
        searchQuery.trim() &&
        visibleTables.length === 0;

    console.log({
        searchQuery,
        visibleTables,
        noSearchResults,
    });

    const selectedRecord =
        selectedRow
            ? {
                products,
                categories,
                suppliers,
            }[selectedRow.table][selectedRow.index]
            : null;

    const expandedTableConfig = allTables.find(
        table => table.id === expandedTable
    );

    return (
        <main className="app">

            <Background />

            <WorkspaceMenu
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                addTable={addTable}
                removeTable={removeTable}
                activeTables={activeTables}
                tables={allTables}
                setLoggedIn={setLoggedIn}
                setCreateTableOpen={setCreateTableOpen}
                setEditMode={setEditMode}
                setDeleteMode={setDeleteMode}
            />

            <WorkspaceCanvas
                noSearchResults={noSearchResults}
            >

                {visibleTables.map((tableId) => {

                    const table = allTables.find(
                        table => table.id === tableId
                    );

                    if (!table) return null;

                    return (
                        <WorkspaceTable
                            key={table.id}
                            title={table.title}
                            columns={table.columns || []}
                            rows={filteredTableData[table.id] || []}
                            selectedRow={
                                selectedRow?.table === table.id
                                    ? selectedRow.index
                                    : null
                            }
                            onSelectRow={(rowIndex) => {

                                setSelectedRow(previous =>

                                    previous?.table === table.id &&
                                        previous?.index === rowIndex
                                        ? null
                                        : {
                                            table: table.id,
                                            index: rowIndex,
                                        }

                                );

                            }}
                            onDoubleSelectRow={(rowIndex) => {

                                setSelectedRow({

                                    table: table.id,
                                    index: rowIndex,

                                });

                            }}
                            onRemove={() => removeTable(table.id)}
                            active={activeTable === table.id}
                            onActivate={() => {

                                if (deleteMode) {

                                    setTablePendingDelete(table);

                                    setDeleteBlocked(
                                        table.id === "products" ||
                                        table.id === "categories" ||
                                        table.id === "suppliers"
                                    );

                                    setDeleteModalOpen(true);

                                    setDeleteMode(false);

                                    return;

                                }

                                if (editMode) {

                                    setTablePendingEdit(table);

                                    setEditTableName(table.title);

                                    setEditBlocked(
                                        table.id === "products" ||
                                        table.id === "categories" ||
                                        table.id === "suppliers"
                                    );

                                    setEditModalOpen(true);

                                    setEditMode(false);

                                    return;

                                }

                                setActiveTable(table.id);

                            }}
                            onExpand={() => {

                                setStartEditing(false);
                                setExpandedTable(table.id);

                            }}
                            expanded
                            onClose={() => setExpandedTable(null)}
                        />
                    );

                })}

            </WorkspaceCanvas>

            <ExpandedTableModal
                open={expandedTable !== null}
                onClose={() => setExpandedTable(null)}
            >

                {expandedTableConfig && (

                    <ExpandedTable
                        tableId={expandedTableConfig.id}
                        title={expandedTableConfig.title}
                        columns={expandedTableConfig.columns}
                        rows={tableData[expandedTableConfig.id]}
                        records={{
                            products,
                            categories,
                            suppliers,
                        }[expandedTableConfig.id]}
                        products={products}
                        categories={categories}
                        suppliers={suppliers}
                        loadWorkspace={loadWorkspace}
                        startEditing={startEditing}
                        selectedRow={
                            selectedRow?.table === expandedTableConfig.id
                                ? selectedRow.index
                                : null
                        }
                        onSelectRow={(rowIndex) => {

                            setSelectedRow(previous =>

                                previous?.table === expandedTableConfig.id &&
                                    previous?.index === rowIndex
                                    ? null
                                    : {
                                        table: expandedTableConfig.id,
                                        index: rowIndex,
                                    }

                            );

                        }}
                        onClose={() => setExpandedTable(null)}
                        active
                        onActivate={() => { }}
                        toast={toast}
                        setToast={setToast}
                    />

                )}

            </ExpandedTableModal>

            <Toast

                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() =>
                    setToast(previous => ({
                        ...previous,
                        visible: false,
                    }))
                }

            />

            <CreateTableModal
                open={createTableOpen}
                value={newTableName}
                onChange={setNewTableName}
                onCancel={() => {

                    setCreateTableOpen(false);

                    setNewTableName("");

                }}
                onCreate={async () => {

                    try {

                        await createWorkspaceTable({

                            name: newTableName,

                        });

                        await loadWorkspace();

                        setCreateTableOpen(false);

                        setNewTableName("");

                        setToast({

                            visible: true,
                            message: "Table created.",
                            type: "success",

                        });

                    } catch (error) {

                        setToast({

                            visible: true,
                            message: error.message,
                            type: "error",

                        });

                    }

                }}
            />

            <DeleteTableModal
                open={deleteModalOpen}
                blocked={deleteBlocked}
                table={tablePendingDelete}
                onCancel={() => {

                    setDeleteModalOpen(false);

                    setTablePendingDelete(null);

                    setDeleteBlocked(false);

                }}
                onDelete={async () => {

                    try {

                        const tableId = Number(
                            tablePendingDelete.id.replace("custom-", "")
                        );

                        await deleteWorkspaceTable(tableId);

                        await loadWorkspace();

                        removeTable(tablePendingDelete.id);

                        setDeleteModalOpen(false);

                        setTablePendingDelete(null);

                        setDeleteBlocked(false);

                        setToast({

                            visible: true,
                            message: "Table deleted.",
                            type: "success",

                        });

                    } catch (error) {

                        setToast({

                            visible: true,
                            message: error.message,
                            type: "error",

                        });

                    }

                }}
            />

            <EditTableModal
                open={editModalOpen}
                blocked={editBlocked}
                table={tablePendingEdit}
                value={editTableName}
                onChange={setEditTableName}
                onCancel={() => {

                    setEditModalOpen(false);

                    setTablePendingEdit(null);

                    setEditBlocked(false);

                    setEditTableName("");

                }}
                onSave={async () => {

                    try {

                        const tableId = Number(
                            tablePendingEdit.id.replace("custom-", "")
                        );

                        await updateWorkspaceTable(tableId, {

                            name: editTableName,

                        });

                        await loadWorkspace();

                        setEditModalOpen(false);

                        setTablePendingEdit(null);

                        setEditBlocked(false);

                        setEditTableName("");

                        setToast({

                            visible: true,
                            message: "Table updated.",
                            type: "success",

                        });

                    } catch (error) {

                        setToast({

                            visible: true,
                            message: error.message,
                            type: "error",

                        });

                    }

                }}
            />

            <Dock
                activeTable={activeTable}
                selectedRecord={selectedRecord}
                onCreate={() => {

                    if (!activeTable) return;

                    setRecordModalMode("create");
                    setRecordModalTable(activeTable);
                    setRecordModalRecord(null);

                    setRecordModalOpen(true);

                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

        </main>
    );
}

export default Workspace;