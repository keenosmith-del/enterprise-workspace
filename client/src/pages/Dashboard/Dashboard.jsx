import {
    useEffect,
    useState,
} from "react";

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

import { getDatabaseSchema } from "../../api/schema";

import "./Dashboard.css";


function Dashboard({

    setLoggedIn,
    currentPage,
    setCurrentPage,

}) {

    const [schema, setSchema] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);


    useEffect(() => {

        async function loadDashboard() {

            try {

                setLoading(true);
                setError(null);

                const data =
                    await getDatabaseSchema();

                setSchema(data);

            } catch (error) {

                console.error(
                    "Failed to load dashboard data:",
                    error
                );

                setError(
                    error.message
                );

            } finally {

                setLoading(false);

            }

        }

        loadDashboard();

    }, []);


    /*
     * --------------------------------------------------
     * Database statistics
     * --------------------------------------------------
     */

    const totalTables =
        schema.length;


    const totalRecords =
        schema.reduce(
            (total, table) =>
                total +
                (table.records || 0),
            0
        );


    const totalColumns =
        schema.reduce(
            (total, table) =>
                total +
                (table.columns || []).length,
            0
        );


    const relationshipCount =
        schema.reduce(
            (total, table) =>
                total +
                (table.columns || []).filter(
                    column =>
                        column.isForeignKey
                ).length,
            0
        );


    /*
     * System tables are the three tables belonging
     * to the original application database.
     *
     * Custom tables are everything else.
     */

    const systemTableNames = [
        "Product",
        "Category",
        "Supplier",
    ];


    const systemTables =
        schema.filter(
            table =>
                systemTableNames.includes(
                    table.name
                )
        );


    const customTables =
        schema.filter(
            table =>
                !systemTableNames.includes(
                    table.name
                )
        );


    /*
     * --------------------------------------------------
     * Render
     * --------------------------------------------------
     */

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

                {loading && (

                    <div className="dashboardPanel">

                        <div className="dashboardEmptyActivity">

                            <div className="dashboardActivityIcon">

                                <Database
                                    size={18}
                                    strokeWidth={1.2}
                                />

                            </div>

                            <div>

                                <span>
                                    Loading database...
                                </span>

                                <p>
                                    Reading database statistics.
                                </p>

                            </div>

                        </div>

                    </div>

                )}


                {error && (

                    <div className="dashboardPanel">

                        <div className="dashboardEmptyActivity">

                            <div className="dashboardActivityIcon">

                                <Activity
                                    size={18}
                                    strokeWidth={1.2}
                                />

                            </div>

                            <div>

                                <span>
                                    Failed to load database
                                </span>

                                <p>
                                    {error}
                                </p>

                            </div>

                        </div>

                    </div>

                )}


                {!loading && !error && (

                    <>

                        {/* -------------------------------------------- */}
                        {/* Header */}
                        {/* -------------------------------------------- */}

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


                        {/* -------------------------------------------- */}
                        {/* Overview */}
                        {/* -------------------------------------------- */}

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
                                        {customTables.length}
                                    </strong>

                                </div>

                                <ArrowUpRight
                                    className="dashboardMetricArrow"
                                    size={15}
                                    strokeWidth={1.2}
                                />

                            </div>

                        </section>


                        {/* -------------------------------------------- */}
                        {/* Main analytics */}
                        {/* -------------------------------------------- */}

                        <section className="dashboardGrid">


                            {/* Table Inventory */}

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

                                    {schema.map(table => {

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
                                                key={table.name}
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

                                                    {(
                                                        table.records ||
                                                        0
                                                    ).toLocaleString()}

                                                </span>

                                            </div>

                                        );

                                    })}

                                </div>

                            </div>


                            {/* Database Statistics */}

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
                                            {systemTables.length}
                                        </strong>

                                    </div>


                                    <div className="dashboardStatistic">

                                        <span>
                                            Custom tables
                                        </span>

                                        <strong>
                                            {customTables.length}
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


                        {/* -------------------------------------------- */}
                        {/* Activity */}
                        {/* -------------------------------------------- */}

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

                    </>

                )}

            </main>

        </main>

    );

}

export default Dashboard;