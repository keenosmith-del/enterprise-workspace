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

export function addWorkspaceColumn(tableId, data) {

    return api(`/tables/${tableId}/columns`, {

        method: "POST",

        body: JSON.stringify(data),

    });

}

export function getWorkspaceRecords(tableId) {

    return api(`/tables/${tableId}/records`);

}

export function createWorkspaceRecord(tableId, data) {

    return api(`/tables/${tableId}/records`, {

        method: "POST",

        body: JSON.stringify(data),

    });

}

export function updateWorkspaceRecord(
    tableId,
    recordId,
    data
) {

    return api(
        `/tables/${tableId}/records/${recordId}`,
        {

            method: "PUT",

            body: JSON.stringify(data),

        }
    );

}

export function deleteWorkspaceRecord(
    tableId,
    recordId
) {

    return api(
        `/tables/${tableId}/records/${recordId}`,
        {

            method: "DELETE",

        }
    );

}