import prisma from "../config/prisma.js";

console.log("WorkspaceTable delegate:", prisma.workspaceTable);
console.log("Prisma delegates:", Object.keys(prisma).filter(key => !key.startsWith("$")));

export const getWorkspaceTables = async (req, res) => {

    try {

        const tables = await prisma.workspaceTable.findMany({

            orderBy: {

                createdAt: "asc",

            },

        });

        res.status(200).json(tables);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to fetch workspace tables.",

        });

    }

};

export const createWorkspaceTable = async (req, res) => {

    try {

        const name = req.body.name?.trim();

        if (!name) {

            return res.status(400).json({

                message: "Table name is required.",

            });

        }

        const existingTable = await prisma.workspaceTable.findFirst({

            where: {

                name: {

                    equals: name,

                    mode: "insensitive",

                },

            },

        });

        if (existingTable) {

            return res.status(409).json({

                message: "A table with that name already exists.",

            });

        }

        const table = await prisma.workspaceTable.create({

            data: {

                name,

            },

        });

        res.status(201).json(table);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to create workspace table.",

        });

    }

};

export const deleteWorkspaceTable = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const table = await prisma.workspaceTable.findUnique({

            where: {

                id,

            },

        });

        if (!table) {

            return res.status(404).json({

                message: "Table not found.",

            });

        }

        await prisma.workspaceTable.delete({

            where: {

                id,

            },

        });

        res.status(200).json({

            message: "Table deleted.",

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to delete table.",

        });

    }

};

export const updateWorkspaceTable = async (req, res) => {

    try {

        const id = Number(req.params.id);

        const name = req.body.name?.trim();

        if (!name) {

            return res.status(400).json({

                message: "Table name is required.",

            });

        }

        const existingTable = await prisma.workspaceTable.findFirst({

            where: {

                name: {

                    equals: name,

                    mode: "insensitive",

                },

                NOT: {

                    id,

                },

            },

        });

        if (existingTable) {

            return res.status(409).json({

                message: "A table with that name already exists.",

            });

        }

        const table = await prisma.workspaceTable.update({

            where: {

                id,

            },

            data: {

                name,

            },

        });

        res.status(200).json(table);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to update table.",

        });

    }

};