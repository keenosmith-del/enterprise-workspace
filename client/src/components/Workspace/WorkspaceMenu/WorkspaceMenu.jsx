import "./WorkspaceMenu.css";

import {
    LayoutDashboard,
    Table2,
    Database,
    TerminalSquare,
    Check,
    Plus,
    Pencil,
    Trash2,
    LogOut,
} from "lucide-react";

import background from "../../../assets/background.png";

function WorkspaceMenu({

    addTable,
    removeTable,

    activeTables,

    tables,

    setLoggedIn,

    setCreateTableOpen,
    editMode,
    setEditMode,
    deleteMode,
    setDeleteMode,

}) {

    return (

        <aside className="workspaceMenu">

            <div className="workspaceMenuHeader">

                <img
                    className="workspaceMenuAvatar"
                    src={background}
                    alt=""
                />

                <div className="workspaceMenuHeaderText">

                    <h2>Enterprise</h2>

                    <span>Workspace</span>

                </div>

            </div>


            <nav className="workspaceNavigation">

                <button className="workspaceNavigationItem active">

                    <LayoutDashboard
                        size={16}
                        strokeWidth={1}
                    />

                    <span>Workspace</span>

                </button>

                <button className="workspaceNavigationItem">

                    <Table2
                        size={16}
                        strokeWidth={1}
                    />

                    <span>Tables</span>

                </button>

                <button className="workspaceNavigationItem">

                    <Database
                        size={16}
                        strokeWidth={1}
                    />

                    <span>Schema</span>

                </button>

                <button className="workspaceNavigationItem">

                    <TerminalSquare
                        size={16}
                        strokeWidth={1}
                    />

                    <span>Query</span>

                </button>

            </nav>


            <div className="workspaceMenuDivider" />


            <section className="workspaceTableList">

                <div className="workspaceSectionLabel">

                    Tables

                </div>

                <div className="workspaceTableListItems">

                    {tables.map((table) => {

                        const added =
                            activeTables.includes(table.id);

                        return (

                            <button
                                key={table.id}
                                className={`
                                    workspaceTableListItem
                                    ${added
                                        ? "workspaceTableListItemActive"
                                        : ""}
                                `}
                                onClick={() => {

                                    if (added) {

                                        removeTable(table.id);

                                    } else {

                                        addTable(table.id);

                                    }

                                }}
                            >

                                <span
                                    className="workspaceTableListIndicator"
                                >

                                    {added && (

                                        <Check
                                            size={14}
                                            strokeWidth={1.5}
                                        />

                                    )}

                                </span>

                                <span>
                                    {table.title}
                                </span>

                            </button>

                        );

                    })}

                </div>

            </section>


            <div className="workspaceMenuBottom">

                <div className="workspaceSectionLabel">
                    Table Actions
                </div>

                <div className="workspaceMenuActions">

                    <button
                        className="workspaceMenuAction"
                        onClick={() =>
                            setCreateTableOpen(true)
                        }
                    >

                        <Plus
                            size={16}
                            strokeWidth={1.5}
                        />

                        <span>
                            New Table
                        </span>

                    </button>


                    <button
                        className={`
        workspaceMenuAction
        ${editMode ? "workspaceMenuActionActive" : ""}
    `}
                        onClick={() => {

                            setDeleteMode(false);
                            setEditMode(true);

                        }}
                    >

                        <Pencil
                            size={16}
                            strokeWidth={1.5}
                        />

                        <span>
                            Edit Table
                        </span>

                    </button>


                    <button
                        className={`
        workspaceMenuAction
        ${deleteMode ? "workspaceMenuActionActive" : ""}
    `}
                        onClick={() => {

                            setEditMode(false);
                            setDeleteMode(true);

                        }}
                    >

                        <Trash2
                            size={16}
                            strokeWidth={1.5}
                        />

                        <span>
                            Delete Table
                        </span>

                    </button>

                </div>


                <button
                    className="workspaceLogout"
                    onClick={() =>
                        setLoggedIn(false)
                    }
                >

                    <LogOut
                        size={16}
                        strokeWidth={1.5}
                    />

                    <span>
                        Logout
                    </span>

                </button>

            </div>

        </aside>

    );

}

export default WorkspaceMenu;