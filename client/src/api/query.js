import { api } from "./api";


export async function executeQuery(query) {

    return api("/query", {

        method: "POST",

        body: JSON.stringify({
            query,
        }),

    });

}