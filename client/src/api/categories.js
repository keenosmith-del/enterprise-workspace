import { api } from "./api";

export function getCategories() {
    return api("/categories");
}

export function createCategory(data) {

    return api("/categories", {
        method: "POST",
        body: JSON.stringify(data),
    });

}

export function updateCategory(id, data) {
    return api(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export function deleteCategory(id) {

    return api(`/categories/${id}`, {
        method: "DELETE",
    });

}