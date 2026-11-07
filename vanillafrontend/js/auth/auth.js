
import { apiRequest } from "../api/api.js";

import {
    saveToken,
    clearSession
} from "./session.js";


export async function login(credentials) {

    const tokenData = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
    });

    if (!tokenData?.access_token) {
        throw new Error("The server did not return an access token.");
    }

    saveToken(tokenData.access_token);

    try {

        const userData = await apiRequest("/auth/me");

        return userData;

    } catch (error) {

        clearSession();

        throw error;
    }
}


export async function register(registrationData) {

    const tokenData = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(registrationData)
    });

    if (!tokenData?.access_token) {
        throw new Error("The server did not return an access token.");
    }

    saveToken(tokenData.access_token);

    try {

        const userData = await apiRequest("/auth/me");

        return userData;

    } catch (error) {

        clearSession();

        throw error;
    }
}








