
import { API_BASE_URL } from "../config/config.js";

export async function apiRequest(endpoint, options = {}) {

    const headers = new Headers(options.headers || {});

    const token = sessionStorage.getItem("staff_access_token");

    if (options.body) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    const responseText = await response.text();

    let data = null;

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch {
            data = responseText;
        }
    }

    if (!response.ok) {

        let message = "Something went wrong. Please try again.";

        if (typeof data?.detail === "string") {
            message = data.detail;
        } else if (Array.isArray(data?.detail)) {
            message = data.detail
                .map(error => error.msg)
                .join(", ");
        } else if (typeof data?.message === "string") {
            message = data.message;
        }

        throw new Error(message);
    }

    return data;
}
