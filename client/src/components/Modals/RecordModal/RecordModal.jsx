import "./RecordModal.css";

function RecordModal({
    open,
    mode,
    table,
    record,
    onClose,
}) {

    if (!open) return null;

    return (

        <div className="recordModalOverlay">

            <div className="recordModal">

                <h2>

                    {mode === "create"
                        ? "Create"
                        : "Edit"}{" "}

                    {table}

                </h2>

                <button onClick={onClose}>
                    Close
                </button>

            </div>

        </div>

    );

}

export default RecordModal;