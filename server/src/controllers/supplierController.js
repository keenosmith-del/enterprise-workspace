import prisma from "../config/prisma.js";

export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: {
                name: "asc",
            },
        });

        res.status(200).json(suppliers);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch suppliers.",
        });
    }
};

export const createSupplier = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const supplier = await prisma.supplier.create({
            data: {
                name,
                email,
                phone,
            },
        });

        res.status(201).json(supplier);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create supplier.",
        });
    }
};

export const updateSupplier = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            name,
            email,
            phone,
        } = req.body;

        const supplier = await prisma.supplier.update({

            where: {
                id: Number(id),
            },

            data: {
                name,
                email,
                phone,
            },

        });

        res.status(200).json(supplier);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update supplier.",
        });

    }

};

export const deleteSupplier = async (req, res) => {

    try {

        const { id } = req.params;

        await prisma.supplier.delete({

            where: {
                id: Number(id),
            },

        });

        res.status(200).json({

            message: "Supplier deleted.",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to delete supplier.",

        });

    }

};