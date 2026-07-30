import "./ExpandedTableModal.css";

function ExpandedTableModal({ open, children, onClose }) {

    if (!open) return null;

    return (

        <div
            className="expandedTableOverlay"
            onClick={onClose}
        >

            <div
                className="expandedTableModal"
                onClick={(event) => event.stopPropagation()}
            >

                {children}

            </div>

        </div>

    );

}

export default ExpandedTableModal;