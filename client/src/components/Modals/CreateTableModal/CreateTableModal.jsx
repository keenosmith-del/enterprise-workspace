import "./CreateTableModal.css";

function CreateTableModal({

    open,
    value,
    onChange,

    onCancel,
    onCreate,

}) {

    if (!open) return null;

    return (

        <div className="createTableModalOverlay">

            <div className="createTableModal">

                <h2>Create Table</h2>

                <input
                    className="createTableInput"
                    placeholder="Table name..."
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    autoFocus
                />

                <div className="createTableActions">

                    <button
                        className="createTableButton"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="createTableButton"
                        onClick={onCreate}
                    >
                        Create
                    </button>

                </div>

            </div>

        </div>

    );

}

export default CreateTableModal;