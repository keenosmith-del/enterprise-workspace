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
    expanded,
}) {
    return (

        <section
            className={`workspaceTable ${active ? "activeTable" : ""}`}
            onMouseDown={onActivate}
            onDoubleClick={onExpand}
        >

            <div className="workspaceTableHeader">

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