
import { login } from "../auth/auth.js";

const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-button");
const loginMessage = document.querySelector("#login-message");


function showMessage(message, type = "error") {

    loginMessage.textContent = message;

    loginMessage.className = `form-message ${type}`;
}


loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const formData = new FormData(loginForm);

    const credentials = {
        email: formData.get("email").trim(),
        password: formData.get("password")
    };

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    loginMessage.className = "form-message";
    loginMessage.textContent = "";

    try {

        await login(credentials);

        showMessage("Login successful. Redirecting...", "success");

        loginButton.textContent = "Success";

        window.location.replace("./dashboard/index.html");

    } catch (error) {

        showMessage(error.message);

        loginButton.disabled = false;
        loginButton.textContent = "Sign in";
    }

});
