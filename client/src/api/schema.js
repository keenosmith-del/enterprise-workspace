import { api } from "./api";

export async function getDatabaseSchema() {

    return api("/tables/schema");

}