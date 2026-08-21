import prisma from "../config/prisma.js";

function serializeValue(value) {

    if (typeof value === "bigint") {

        return Number(value);

    }

    if (value instanceof Date) {

        return value.toISOString();

    }

    if (
        value &&
        typeof value === "object" &&
        typeof value.toNumber === "function"
    ) {

        return value.toNumber();

    }

    if (Array.isArray(value)) {

        return value.map(
            serializeValue
        );

    }

    if (
        value &&
        typeof value === "object"
    ) {

        return Object.fromEntries(

            Object.entries(value).map(
                ([key, value]) => [

                    key,
                    serializeValue(value),

                ]
            )

        );

    }

    return value;

}


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
                ? result.map(
                    serializeValue
                )
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