import "./DeleteTableModal.css";

function DeleteTableModal({

    open,
    blocked,
    table,
    onCancel,
    onDelete,

}) {

    if (!open) return null;

    return (

        <div className="createTableModalOverlay">

            <div className="createTableModal">

                <h2>

                    {blocked
                        ? "Cannot Delete Table"
                        : "Delete Table"}

                </h2>

                <p>

                    {blocked
                        ? `"${table?.title}" is a system table and cannot be deleted.`
                        : `Are you sure you want to delete "${table?.title}"? This action cannot be undone.`}

                </p>

                <div className="createTableActions">

                    <button
                        className="createTableButton"
                        onClick={onCancel}
                    >

                        {blocked ? "Close" : "Cancel"}

                    </button>

                    {!blocked && (

                        <button
                            className="createTableButton"
                            onClick={onDelete}
                        >

                            Delete

                        </button>

                    )}

                </div>

            </div>

        </div>

    );

}

export default DeleteTableModal;