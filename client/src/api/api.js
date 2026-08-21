const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

export async function api(endpoint, options = {}) {

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            ...options,
        }
    );


    if (!response.ok) {

        let errorMessage =
            `Request failed: ${response.status}`;

        try {

            const errorData =
                await response.json();

            if (errorData?.message) {

                errorMessage =
                    errorData.message;

            }

        } catch {

            // Keep the default error message.

        }

        throw new Error(
            errorMessage
        );

    }


    return response.json();

}