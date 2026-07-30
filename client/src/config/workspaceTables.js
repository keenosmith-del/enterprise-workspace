export const workspaceTables = [
    {
        id: "products",
        title: "Products",
        columns: [
            "Product",
            "Category",
            "Supplier",
            "Stock",
            "Price",
        ],
    },

    {
        id: "categories",
        title: "Categories",
        columns: [
            "Category",
            "Products",
        ],
    },

    {
        id: "suppliers",
        title: "Suppliers",
        columns: [
            "Supplier",
            "Email",
            "Phone",
        ],
    },
];