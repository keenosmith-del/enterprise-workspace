import "./EditTableModal.css";

function EditTableModal({

    open,
    blocked,

    value,
    onChange,

    table,

    onCancel,
    onSave,

}) {

    if (!open) return null;

    return (

        <div className="createTableModalOverlay">

            <div className="createTableModal">

                <h2>

                    {blocked
                        ? "Cannot Edit Table"
                        : "Edit Table"}

                </h2>

                {blocked ? (

                    <p>

                        "{table?.title}" is a protected system table and cannot be renamed.

                    </p>

                ) : (

                    <input
                        className="createTableInput"
                        value={value}
                        onChange={(event) =>
                            onChange(event.target.value)
                        }
                        autoFocus
                    />

                )}

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
                            onClick={onSave}
                        >

                            Save

                        </button>

                    )}

                </div>

            </div>

        </div>

    );

}

export default EditTableModal;