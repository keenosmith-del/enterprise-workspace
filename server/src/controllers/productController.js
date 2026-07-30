import prisma from "../config/prisma.js";

export const getProducts = async (req, res) => {

    try {

        const products = await prisma.product.findMany({

            include: {

                category: true,
                supplier: true,

            },

            orderBy: {

                name: "asc",

            },

        });

        res.status(200).json(products);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to fetch products.",

        });

    }

};

export const createProduct = async (req, res) => {

    try {

        const {

            name,
            description,
            price,
            stock,
            categoryId,
            supplierId,

        } = req.body;

        const sku = `SKU-${Date.now()}`;

        const product = await prisma.product.create({

            data: {

                name,
                description,
                sku,
                price,
                stock,
                categoryId,
                supplierId,

            },

            include: {

                category: true,
                supplier: true,

            },

        });

        res.status(201).json(product);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to create product.",

        });

    }

};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: {
                id: Number(id),
            },
            include: {
                category: true,
                supplier: true,
            },
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found.",
            });
        }

        res.status(200).json(product);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch product.",
        });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            sku,
            price,
            stock,
            categoryId,
            supplierId,
        } = req.body;

        const product = await prisma.product.update({
            where: {
                id: Number(id),
            },
            data: {
                name,
                description,
                sku,
                price,
                stock,
                categoryId,
                supplierId,
            },
            include: {
                category: true,
                supplier: true,
            },
        });

        res.status(200).json(product);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update product.",
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: {
                id: Number(id),
            },
        });

        res.status(200).json({
            message: "Product deleted.",
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete product.",
        });
    }
};