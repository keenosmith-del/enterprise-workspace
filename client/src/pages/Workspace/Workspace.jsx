import {
    useEffect,
    useRef,
    useState,
} from "react";

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
    getWorkspaceRecords,
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

    const [customRecords, setCustomRecords] = useState({});

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

    const workspaceCanvasRef = useRef(null);

    const [dragState, setDragState] = useState(null);

    const dragStateRef = useRef(null);

    const dragFrameRef = useRef(null);

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

    function getWorkspacePosition(clientX, clientY) {

        const canvas = workspaceCanvasRef.current;

        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();

        const columnWidth = 460;
        const rowHeight = 300;
        const gap = 20;

        const relativeX =
            clientX - rect.left;

        const relativeY =
            clientY -
            rect.top +
            canvas.scrollTop;

        if (
            relativeX < 0 ||
            relativeY < 0
        ) {
            return null;
        }

        const column = Math.floor(
            relativeX / (columnWidth + gap)
        );

        const row = Math.floor(
            relativeY / (rowHeight + gap)
        );

        if (column < 0 || column > 2) {
            return null;
        }

        if (row < 0) {
            return null;
        }

        return (
            row * 3 +
            column
        );

    }


    function handleTableDragStart(event, tableId) {

        const canvas =
            workspaceCanvasRef.current;

        if (!canvas) return;

        const tableElement =
            event.currentTarget.closest(".workspaceTable");

        if (!tableElement) return;

        const tableRect =
            tableElement.getBoundingClientRect();

        const initialIndex =
            activeTables.indexOf(tableId);

        if (initialIndex === -1) return;

        const state = {

            tableId,

            initialIndex,

            currentIndex: initialIndex,

            startX: event.clientX,
            startY: event.clientY,

            x: event.clientX,
            y: event.clientY,

            offsetX:
                event.clientX -
                tableRect.left,

            offsetY:
                event.clientY -
                tableRect.top,

            width:
                tableRect.width,

            height:
                tableRect.height,

            dragging: false,

        };

        dragStateRef.current = state;


        function handlePointerMove(moveEvent) {

            const current =
                dragStateRef.current;

            if (!current) return;

            const deltaX =
                moveEvent.clientX -
                current.startX;

            const deltaY =
                moveEvent.clientY -
                current.startY;

            const distance =
                Math.sqrt(
                    deltaX * deltaX +
                    deltaY * deltaY
                );


            if (
                !current.dragging &&
                distance < 6
            ) {

                return;

            }


            if (!current.dragging) {

                current.dragging = true;

                document.body.style.userSelect =
                    "none";

            }


            current.x =
                moveEvent.clientX;

            current.y =
                moveEvent.clientY;


            const targetIndex =
                getWorkspacePosition(
                    moveEvent.clientX,
                    moveEvent.clientY
                );


            if (targetIndex !== null) {

                current.currentIndex =
                    Math.min(
                        targetIndex,
                        activeTables.length - 1
                    );

            }


            if (!dragFrameRef.current) {

                dragFrameRef.current =
                    requestAnimationFrame(() => {

                        dragFrameRef.current = null;

                        setDragState({
                            ...current,
                        });

                    });

            }

        }


        function handlePointerUp() {

            const current =
                dragStateRef.current;


            window.removeEventListener(
                "pointermove",
                handlePointerMove
            );

            window.removeEventListener(
                "pointerup",
                handlePointerUp
            );


            document.body.style.userSelect =
                "";


            if (!current) return;


            if (
                current.dragging &&
                current.currentIndex !==
                current.initialIndex
            ) {

                setActiveTables(previous => {

                    const next = [
                        ...previous,
                    ];

                    const [
                        movedTable,
                    ] = next.splice(
                        current.initialIndex,
                        1
                    );

                    next.splice(
                        current.currentIndex,
                        0,
                        movedTable
                    );

                    return next;

                });

            }


            dragStateRef.current = null;

            setDragState(null);

        }


        window.addEventListener(
            "pointermove",
            handlePointerMove
        );

        window.addEventListener(
            "pointerup",
            handlePointerUp
        );

    }


    function cancelTableDrag() {

        const current =
            dragStateRef.current;

        if (!current) return;

        document.body.style.userSelect =
            "";

        dragStateRef.current = null;

        setDragState(null);

    }


    useEffect(() => {

        function handleKeyDown(event) {

            if (event.key === "Escape") {

                cancelTableDrag();

            }

        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, []);

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

            const customRecordEntries =
                await Promise.all(

                    customTableData.map(
                        async (table) => {

                            const records =
                                await getWorkspaceRecords(
                                    table.id
                                );

                            return [
                                table.id,
                                records,
                            ];

                        }
                    )

                );

            setProducts(productData);

            setCategories(categoryData);

            setSuppliers(supplierData);

            setCustomTables(customTableData);

            setCustomRecords(
                Object.fromEntries(
                    customRecordEntries
                )
            );

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

            columns: (table.columns || [])
                .sort((a, b) => a.position - b.position)
                .map((column) => column.name),

            columnDefinitions: (table.columns || [])
                .sort((a, b) => a.position - b.position),

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

    customTables.forEach((table) => {

        const records =
            customRecords[table.id] || [];

        const columns =
            (table.columns || [])
                .sort(
                    (a, b) =>
                        a.position - b.position
                );

        tableData[`custom-${table.id}`] =
            records.map((record) =>

                columns.map((column) => {

                    return record[column.name];

                })

            );

    });

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
            ? (
                {
                    products,
                    categories,
                    suppliers,
                }[selectedRow.table]?.[
                selectedRow.index
                ] ?? null
            )
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
                ref={workspaceCanvasRef}
                noSearchResults={noSearchResults}
            >

                {visibleTables.map((tableId) => {

                    const table = allTables.find(
                        table => table.id === tableId
                    );

                    if (!table) return null;

                    const tableIndex =
                        activeTables.indexOf(table.id);

                    const isDragging =
                        dragState?.tableId === table.id &&
                        dragState.dragging;

                    const isDragActive =
                        Boolean(dragState?.dragging);

                    const draggedIndex =
                        dragState?.initialIndex ?? -1;

                    const targetIndex =
                        dragState?.currentIndex ?? draggedIndex;

                    let visualIndex =
                        tableIndex;

                    if (isDragActive) {

                        if (tableIndex === draggedIndex) {

                            visualIndex = -1;

                        } else if (
                            draggedIndex < targetIndex &&
                            tableIndex > draggedIndex &&
                            tableIndex <= targetIndex
                        ) {

                            visualIndex =
                                tableIndex - 1;

                        } else if (
                            draggedIndex > targetIndex &&
                            tableIndex < draggedIndex &&
                            tableIndex >= targetIndex
                        ) {

                            visualIndex =
                                tableIndex + 1;

                        }

                    }

                    const isPlaceholder =
                        isDragActive &&
                        tableIndex === targetIndex;

                    return (
                        <WorkspaceTable
                            key={table.id}
                            title={table.title}
                            columns={table.columns || []}
                            rows={filteredTableData[table.id] || []}

                            visualIndex={visualIndex}

                            dragging={
                                dragState?.tableId === table.id &&
                                dragState.dragging
                            }

                            placeholder={isPlaceholder}

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
                            onDoubleClick={() => {

                                setStartEditing(false);
                                setExpandedTable(table.id);

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
                            onDragStart={(event) =>
                                handleTableDragStart(
                                    event,
                                    table.id
                                )
                            }
                            onExpand={() => {

                                setStartEditing(false);
                                setExpandedTable(table.id);

                            }}
                            expanded
                            onClose={() => setExpandedTable(null)}

                            dragPosition={
                                isDragging
                                    ? {
                                        x: dragState.x,
                                        y: dragState.y,
                                        offsetX: dragState.offsetX,
                                        offsetY: dragState.offsetY,
                                        width: dragState.width,
                                        height: dragState.height,
                                    }
                                    : null
                            }

                        />
                    );

                })}

            </WorkspaceCanvas>

            {dragState?.dragging && (

                <div
                    className="workspaceDragPreview"
                    style={{
                        left:
                            dragState.x -
                            dragState.offsetX,

                        top:
                            dragState.y -
                            dragState.offsetY,

                        width:
                            dragState.width,

                        height:
                            dragState.height,
                    }}
                >

                    {(() => {

                        const table =
                            allTables.find(
                                table =>
                                    table.id ===
                                    dragState.tableId
                            );

                        if (!table) return null;

                        return (

                            <WorkspaceTable
                                title={table.title}
                                columns={table.columns || []}
                                rows={
                                    filteredTableData[
                                    table.id
                                    ] || []
                                }

                                active={false}

                                selectedRow={null}

                                dragPreview

                                placeholder={false}
                                visualIndex={-1}

                                onActivate={() => { }}
                                onSelectRow={() => { }}
                                onDoubleSelectRow={() => { }}
                                onRemove={() => { }}
                                onExpand={() => { }}
                                onDoubleClick={() => { }}
                            />

                        );

                    })()}

                </div>

            )}

            <ExpandedTableModal
                open={expandedTable !== null}
                onClose={() => setExpandedTable(null)}
            >

                {expandedTableConfig && (

                    <ExpandedTable
                        tableId={expandedTableConfig.id}
                        title={expandedTableConfig.title}
                        columns={expandedTableConfig.columns}
                        columnDefinitions={
                            expandedTableConfig.columnDefinitions
                        }
                        rows={tableData[expandedTableConfig.id]}
                        records={
                            expandedTableConfig.id.startsWith("custom-")
                                ? customRecords[
                                Number(
                                    expandedTableConfig.id.replace(
                                        "custom-",
                                        ""
                                    )
                                )
                                ] || []
                                : {
                                    products,
                                    categories,
                                    suppliers,
                                }[expandedTableConfig.id]
                        }
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
                onCreate={async (columns) => {

                    try {

                        await createWorkspaceTable({

                            name: newTableName,
                            columns,

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