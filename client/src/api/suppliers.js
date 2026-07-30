import { api } from "./api";

export function getSuppliers() {
    return api("/suppliers");
}

export function createSupplier(data) {

    return api("/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
    });

}

export function updateSupplier(id, data) {
    return api(`/suppliers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function deleteSupplier(id) {

    return api(`/suppliers/${id}`, {
        method: "DELETE",
    });

}