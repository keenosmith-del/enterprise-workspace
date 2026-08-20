import prisma from "../config/prisma.js";


export const executeQuery = async (req, res) => {

    try {

        const { query } = req.body;


        if (
            typeof query !== "string" ||
            !query.trim()
        ) {

            return res.status(400).json({

                message:
                    "A SQL query is required.",

            });

        }


        const sql =
            query.trim();


        const result =
            await prisma.$queryRawUnsafe(
                sql
            );


        const rows =
            Array.isArray(result)
                ? result
                : [];


        const columns =
            rows.length > 0
                ? Object.keys(rows[0])
                : [];


        return res.status(200).json({

            columns,

            rows,

            rowCount:
                rows.length,

        });

    } catch (error) {

        console.error(
            "Query execution failed:",
            error
        );


        return res.status(400).json({

            message:
                error.message ||
                "Failed to execute query.",

        });

    }

};