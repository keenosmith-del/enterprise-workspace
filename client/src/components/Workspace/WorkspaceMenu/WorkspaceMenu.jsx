import "./WorkspaceMenu.css";

import {
    AlignJustify,
    Check,
    Plus,
    Pencil,
    Trash2,
    LogOut,
} from "lucide-react";

import IconButton from "../../UI/IconButton/IconButton";

function WorkspaceMenu({

    menuOpen,
    setMenuOpen,

    addTable,
    removeTable,

    activeTables,

    tables,

    setLoggedIn,

    setCreateTableOpen,

    setEditMode,

    setDeleteMode,

}) {

    return (
        <div className="workspaceMenu">

            <IconButton
                icon={AlignJustify}
                onClick={() => setMenuOpen(!menuOpen)}
            />

            {menuOpen && (

                <div className="workspaceDropdown">

                    <button
                        className="workspaceDropdownItem"
                        onClick={() => {

                            setMenuOpen(false);

                            setCreateTableOpen(true);

                        }}
                    >

                        <div className="workspaceDropdownLeft">

                            <Plus size={16} />

                            <span>New Table</span>

                        </div>

                    </button>

                    <button
                        className="workspaceDropdownItem"
                        onClick={() => {

                            setMenuOpen(false);

                            setEditMode(true);

                        }}
                    >

                        <div className="workspaceDropdownLeft">

                            <Pencil size={16} />

                            <span>Edit Table</span>

                        </div>

                    </button>

                    <button
                        className="workspaceDropdownItem"
                        onClick={() => {

                            setMenuOpen(false);

                            setDeleteMode(true);

                        }}
                    >

                        <div className="workspaceDropdownLeft">

                            <Trash2 size={16} />

                            <span>Delete Table</span>

                        </div>

                    </button>

                    <div className="workspaceDropdownDivider" />

                    <button
                        className="workspaceDropdownItem"
                        onClick={() => {

                            setMenuOpen(false);

                            setLoggedIn(false);

                        }}
                    >

                        <div className="workspaceDropdownLeft">

                            <LogOut size={16} />

                            <span>Logout</span>

                        </div>

                    </button>

                    <div className="workspaceDropdownDivider" />

                    {tables.map((table) => {

                        const added = activeTables.includes(table.id);

                        return (

                            <button
                                key={table.id}
                                className="workspaceDropdownItem"
                                onClick={() => {

                                    if (added) {

                                        removeTable(table.id);

                                    } else {

                                        addTable(table.id);

                                    }

                                    setMenuOpen(false);

                                }}
                            >

                                <div className="workspaceDropdownLeft">

                                    {added && <Check size={16} />}

                                    {!added && <span className="workspaceCheckPlaceholder" />}

                                    <span>{table.title}</span>

                                </div>

                            </button>

                        );

                    })}

                </div>

            )}

        </div>
    );

}

export default WorkspaceMenu;