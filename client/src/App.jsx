import {
    useEffect,
    useState,
} from "react";

import {
    getProducts,
} from "./api/products";

import {
    getCategories,
} from "./api/categories";

import {
    getSuppliers,
} from "./api/suppliers";

import {
    getWorkspaceTables,
    getWorkspaceRecords,
} from "./api/workspaceTables";

import Login from "./pages/Login/Login";
import Workspace from "./pages/Workspace/Workspace";
import Dashboard from "./pages/Dashboard/Dashboard";
import Schema from "./pages/Schema/Schema";
import Query from "./pages/Query/Query";

function App() {

    const [loggedIn, setLoggedIn] = useState(() => {

        return localStorage.getItem("workspace-logged-in") === "true";

    });

    const [currentPage, setCurrentPage] = useState("workspace");

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [customTables, setCustomTables] = useState([]);
    const [customRecords, setCustomRecords] = useState({});

    async function loadDatabase() {

        try {

            const [
                productData,
                categoryData,
                supplierData,
                customTableData,
            ] = await Promise.all([

                getProducts(),
                getCategories(),
                getSuppliers(),
                getWorkspaceTables(),

            ]);

            const customRecordResults =
                await Promise.allSettled(

                    customTableData.map(
                        async (table) => {

                            const records =
                                await getWorkspaceRecords(
                                    table.id
                                );

                            return [
                                table.id,
                                records,
                            ];

                        }
                    )

                );

            const customRecordEntries =
                customRecordResults
                    .filter(
                        result =>
                            result.status === "fulfilled"
                    )
                    .map(
                        result =>
                            result.value
                    );

            setProducts(productData);
            setCategories(categoryData);
            setSuppliers(supplierData);
            setCustomTables(customTableData);

            setCustomRecords(
                Object.fromEntries(
                    customRecordEntries
                )
            );

        } catch (error) {

            console.error(
                "Failed to load database:",
                error
            );

        }

    }

    useEffect(() => {

        if (!loggedIn) return;

        loadDatabase();

    }, [loggedIn]);

    useEffect(() => {

        localStorage.setItem(
            "workspace-logged-in",
            loggedIn
        );

    }, [loggedIn]);

    if (!loggedIn) {

        return (
            <Login
                setLoggedIn={setLoggedIn}
            />
        );

    }

    return (

        <>

            {currentPage === "workspace" && (

                <Workspace
                    setLoggedIn={setLoggedIn}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}

                    products={products}
                    categories={categories}
                    suppliers={suppliers}
                    customTables={customTables}
                    customRecords={customRecords}

                    loadDatabase={loadDatabase}
                />

            )}

            {currentPage === "dashboard" && (

                <Dashboard
                    setLoggedIn={setLoggedIn}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}

                    products={products}
                    categories={categories}
                    suppliers={suppliers}
                    customTables={customTables}
                    customRecords={customRecords}

                    loadDatabase={loadDatabase}
                />

            )}

            {currentPage === "schema" && (

                <Schema
                    setLoggedIn={setLoggedIn}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}

                    products={products}
                    categories={categories}
                    suppliers={suppliers}
                    customTables={customTables}
                    customRecords={customRecords}

                    loadDatabase={loadDatabase}
                />

            )}

            {currentPage === "query" && (

                <Query
                    setLoggedIn={setLoggedIn}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}

                    products={products}
                    categories={categories}
                    suppliers={suppliers}
                    customTables={customTables}
                    customRecords={customRecords}

                    loadDatabase={loadDatabase}
                />

            )}

        </>

    );

}

export default App;