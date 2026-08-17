import "./WorkspaceTable.css";

function WorkspaceTable({
    title,
    columns,
    rows,
    active,
    onActivate,
    selectedRow,
    onSelectRow,
    onDoubleSelectRow,
    onRemove,
    onExpand,
    onDragStart,
    dragging,
    dragPreview,
    placeholder,
    visualIndex,
    dragPosition,
    onDoubleClick,
}) {
    return (

        <section
            className={`
        workspaceTable
        ${active ? "activeTable" : ""}
        ${dragging ? "draggingTable" : ""}
        ${placeholder ? "dragPlaceholder" : ""}
    `}
            style={{

                gridColumn:
                    visualIndex >= 0
                        ? `${(visualIndex % 3) + 1}`
                        : undefined,

                gridRow:
                    visualIndex >= 0
                        ? `${Math.floor(
                            visualIndex / 3
                        ) + 1}`
                        : undefined,

                opacity:
                    dragging && !dragPreview
                        ? 0
                        : 1,

            }}
            onMouseDown={onActivate}
            onDoubleClick={(event) => {

                event.stopPropagation();

                onDoubleClick?.();

            }}
        >

            <div
                className="workspaceTableHeader"
                onPointerDown={(event) => {

                    event.stopPropagation();

                    onDragStart(event);

                }}
            >

                <h3>{title}</h3>

                <button
                    onClick={(event) => {

                        event.stopPropagation();

                        onRemove();

                    }}
                >
                    ×
                </button>

            </div>

            <div className="workspaceTableBody">

                <table className="workspaceTableElement">

                    <thead>

                        <tr>

                            {columns.map((column) => (

                                <th key={column}>
                                    {column}
                                </th>

                            ))}

                        </tr>

                    </thead>

                    <tbody>

                        {rows.length === 0 ? (

                            <tr>

                                <td
                                    className="workspaceEmptyState"
                                    colSpan={columns.length}
                                >

                                    No data available.

                                    <br />

                                    Create columns to wire date.

                                </td>

                            </tr>

                        ) : (

                            rows.map((row, index) => (

                                <tr
                                    key={index}
                                    onClick={(event) => {

                                        event.stopPropagation();

                                        onActivate();

                                        onSelectRow(index);

                                    }}
                                    onDoubleClick={(event) => {

                                        event.stopPropagation();

                                        onActivate();

                                        onDoubleSelectRow(index);

                                        onExpand();

                                    }}
                                    className={
                                        selectedRow === index
                                            ? "selectedRow"
                                            : ""
                                    }
                                >

                                    {row.map((cell, cellIndex) => (

                                        <td key={cellIndex}>
                                            {cell}
                                        </td>

                                    ))}

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

        </section>

    );

}

export default WorkspaceTable;