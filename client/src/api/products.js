import { api } from "./api";

export function getProducts() {

    return api("/products");

}

export function createProduct(data) {

    return api("/products", {
        method: "POST",
        body: JSON.stringify(data),
    });

}

export function updateProduct(id, data) {

    return api(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });

}

export function deleteProduct(id) {

    return api(`/products/${id}`, {
        method: "DELETE",
    });

}