const API_BASE_URL = "http://localhost:5050/api";

export async function api(endpoint, options = {}) {

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
        },
        ...options,
    });

    if (!response.ok) {

        throw new Error(`Request failed: ${response.status}`);

    }

    return response.json();

}