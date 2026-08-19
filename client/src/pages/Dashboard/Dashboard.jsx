import Background from "../../components/Layout/Background";
import WorkspaceMenu from "../../components/Workspace/WorkspaceMenu/WorkspaceMenu";

import {
    Database,
    Table2,
    Rows3,
    GitBranch,
    BarChart3,
    Activity,
    ArrowUpRight,
} from "lucide-react";

import "./Dashboard.css";

function Dashboard({

    setLoggedIn,
    currentPage,
    setCurrentPage,

    products,
    categories,
    suppliers,
    customTables,
    customRecords,

    loadDatabase,

}) {

    const systemTables = [
        {
            id: "products",
            name: "Products",
            records: products.length,
        },
        {
            id: "categories",
            name: "Categories",
            records: categories.length,
        },
        {
            id: "suppliers",
            name: "Suppliers",
            records: suppliers.length,
        },
    ];

    const customTableData = customTables.map(table => ({

        id: `custom-${table.id}`,

        name: table.name,

        records:
            customRecords[table.id]?.length || 0,

    }));

    const allTables = [
        ...systemTables,
        ...customTableData,
    ];

    const totalTables =
        allTables.length;

    const totalRecords =
        allTables.reduce(
            (total, table) =>
                total + table.records,
            0
        );

    const customTableCount =
        customTables.length;

    /*
     * These are currently derived from the
     * schema metadata available to the application.
     *
     * We can make this more sophisticated once
     * the Schema page and relationship system are built.
     */
    const relationshipCount =
        customTables.reduce(
            (total, table) =>
                total +
                (table.columns || []).filter(
                    column =>
                        column.isForeignKey
                ).length,
            0
        );

    const totalColumns =
        customTables.reduce(
            (total, table) =>
                total +
                (table.columns || []).length,
            0
        );

    return (

        <main className="app">

            <Background />

            <WorkspaceMenu
                setLoggedIn={setLoggedIn}

                currentPage={currentPage}
                setCurrentPage={setCurrentPage}

                dashboardMode
            />

            <main className="dashboard">

                <header className="dashboardHeader">

                    <div>

                        <span className="dashboardEyebrow">
                            DATABASE
                        </span>

                        <h1>
                            Workspace
                        </h1>

                        <p>
                            Database overview and analytics.
                        </p>

                    </div>

                    <div className="dashboardHeaderStatus">

                        <span className="dashboardStatusDot" />

                        <span>
                            Connected
                        </span>

                    </div>

                </header>


                {/* ------------------------------------------------ */}
                {/* Overview */}
                {/* ------------------------------------------------ */}

                <section className="dashboardOverview">

                    <div className="dashboardMetricCard">

                        <div className="dashboardMetricIcon">

                            <Database
                                size={17}
                                strokeWidth={1.2}
                            />

                        </div>

                        <div className="dashboardMetricContent">

                            <span>
                                Tables
                            </span>

                            <strong>
                                {totalTables}
                            </strong>

                        </div>

                        <ArrowUpRight
                            className="dashboardMetricArrow"
                            size={15}
                            strokeWidth={1.2}
                        />

                    </div>


                    <div className="dashboardMetricCard">

                        <div className="dashboardMetricIcon">

                            <Rows3
                                size={17}
                                strokeWidth={1.2}
                            />

                        </div>

                        <div className="dashboardMetricContent">

                            <span>
                                Records
                            </span>

                            <strong>
                                {totalRecords.toLocaleString()}
                            </strong>

                        </div>

                        <ArrowUpRight
                            className="dashboardMetricArrow"
                            size={15}
                            strokeWidth={1.2}
                        />

                    </div>


                    <div className="dashboardMetricCard">

                        <div className="dashboardMetricIcon">

                            <GitBranch
                                size={17}
                                strokeWidth={1.2}
                            />

                        </div>

                        <div className="dashboardMetricContent">

                            <span>
                                Relationships
                            </span>

                            <strong>
                                {relationshipCount}
                            </strong>

                        </div>

                        <ArrowUpRight
                            className="dashboardMetricArrow"
                            size={15}
                            strokeWidth={1.2}
                        />

                    </div>


                    <div className="dashboardMetricCard">

                        <div className="dashboardMetricIcon">

                            <Table2
                                size={17}
                                strokeWidth={1.2}
                            />

                        </div>

                        <div className="dashboardMetricContent">

                            <span>
                                Custom Tables
                            </span>

                            <strong>
                                {customTableCount}
                            </strong>

                        </div>

                        <ArrowUpRight
                            className="dashboardMetricArrow"
                            size={15}
                            strokeWidth={1.2}
                        />

                    </div>

                </section>


                {/* ------------------------------------------------ */}
                {/* Main analytics */}
                {/* ------------------------------------------------ */}

                <section className="dashboardGrid">

                    <div className="dashboardPanel dashboardTablePanel">

                        <div className="dashboardPanelHeader">

                            <div>

                                <span className="dashboardPanelLabel">
                                    TABLE INVENTORY
                                </span>

                                <h2>
                                    Tables
                                </h2>

                            </div>

                            <Table2
                                size={17}
                                strokeWidth={1.2}
                            />

                        </div>


                        <div className="dashboardTableList">

                            {allTables.map(table => {

                                const percentage =
                                    totalRecords > 0
                                        ? (
                                            table.records /
                                            totalRecords
                                        ) * 100
                                        : 0;

                                return (

                                    <div
                                        className="dashboardTableRow"
                                        key={table.id}
                                    >

                                        <div className="dashboardTableName">

                                            <span className="dashboardTableIndicator" />

                                            <span>
                                                {table.name}
                                            </span>

                                        </div>

                                        <div className="dashboardTableBar">

                                            <span
                                                style={{
                                                    width:
                                                        `${Math.max(
                                                            percentage,
                                                            table.records > 0
                                                                ? 3
                                                                : 0
                                                        )}%`,
                                                }}
                                            />

                                        </div>

                                        <span className="dashboardTableCount">

                                            {table.records.toLocaleString()}

                                        </span>

                                    </div>

                                );

                            })}

                        </div>

                    </div>


                    <div className="dashboardPanel dashboardStatisticsPanel">

                        <div className="dashboardPanelHeader">

                            <div>

                                <span className="dashboardPanelLabel">
                                    DATABASE
                                </span>

                                <h2>
                                    Statistics
                                </h2>

                            </div>

                            <BarChart3
                                size={17}
                                strokeWidth={1.2}
                            />

                        </div>


                        <div className="dashboardStatistics">

                            <div className="dashboardStatistic">

                                <span>
                                    System tables
                                </span>

                                <strong>
                                    3
                                </strong>

                            </div>

                            <div className="dashboardStatistic">

                                <span>
                                    Custom tables
                                </span>

                                <strong>
                                    {customTableCount}
                                </strong>

                            </div>

                            <div className="dashboardStatistic">

                                <span>
                                    Columns
                                </span>

                                <strong>
                                    {totalColumns}
                                </strong>

                            </div>

                            <div className="dashboardStatistic">

                                <span>
                                    Relationships
                                </span>

                                <strong>
                                    {relationshipCount}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ------------------------------------------------ */}
                {/* Activity */}
                {/* ------------------------------------------------ */}

                <section className="dashboardPanel dashboardActivityPanel">

                    <div className="dashboardPanelHeader">

                        <div>

                            <span className="dashboardPanelLabel">
                                ACTIVITY
                            </span>

                            <h2>
                                Recent Activity
                            </h2>

                        </div>

                        <Activity
                            size={17}
                            strokeWidth={1.2}
                        />

                    </div>


                    <div className="dashboardEmptyActivity">

                        <div className="dashboardActivityIcon">

                            <Activity
                                size={18}
                                strokeWidth={1.2}
                            />

                        </div>

                        <div>

                            <span>
                                Activity tracking
                            </span>

                            <p>
                                Database activity will appear here.
                            </p>

                        </div>

                    </div>

                </section>

            </main>

        </main>

    );

}

export default Dashboard;