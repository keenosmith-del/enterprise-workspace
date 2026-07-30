import prisma from "../config/prisma.js";

export const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: "asc",
            },
        });

        res.json(categories);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch categories.",
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const category = await prisma.category.create({
            data: {
                name,
            },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create category.",
        });
    }
};

export const updateCategory = async (req, res) => {

    try {

        const { id } = req.params;
        const { name } = req.body;

        const category = await prisma.category.update({

            where: {
                id: Number(id),
            },

            data: {
                name,
            },

        });

        res.status(200).json(category);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update category.",
        });

    }

};

export const deleteCategory = async (req, res) => {

    try {

        const { id } = req.params;

        await prisma.category.delete({

            where: {
                id: Number(id),
            },

        });

        res.status(200).json({

            message: "Category deleted.",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to delete category.",

        });

    }

};