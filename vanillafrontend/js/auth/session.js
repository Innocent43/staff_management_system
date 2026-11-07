
const TOKEN_KEY = "staff_access_token";

export function saveToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
}

export function logout(redirectTo = "../login.html") {
    clearSession();

    window.location.replace(redirectTo);
}
