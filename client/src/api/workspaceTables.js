import { api } from "./api";

export function getWorkspaceTables() {

    return api("/tables");

}

export function createWorkspaceTable(data) {

    return api("/tables", {

        method: "POST",

        body: JSON.stringify(data),

    });

}

export function updateWorkspaceTable(id, data) {

    return api(`/tables/${id}`, {

        method: "PUT",

        body: JSON.stringify(data),

    });

}

export function deleteWorkspaceTable(id) {

    return api(`/tables/${id}`, {

        method: "DELETE",

    });

}