
import { register } from "../auth/auth.js";

const registerForm = document.getElementById("register-form");
const businessNameInput = document.getElementById("business-name");
const fullNameInput = document.getElementById("full-name");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const timezoneSelect = document.getElementById("timezone");
const currencySelect = document.getElementById("currency");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const messageElement = document.getElementById("register-message");
const registerButton = document.getElementById("register-button");


function showMessage(message, type = "error") {
    messageElement.textContent = message;
    messageElement.className = message
        ? `auth-message ${type}`
        : "auth-message";
}


function populateTimezones() {
    const detectedTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    let timezones = [];

    if (typeof Intl.supportedValuesOf === "function") {
        timezones = Intl.supportedValuesOf("timeZone");
    } else {
        timezones = [
            "Africa/Lagos",
            "Africa/Accra",
            "Africa/Nairobi",
            "Africa/Johannesburg",
            "Europe/London",
            "Europe/Paris",
            "America/New_York",
            "America/Los_Angeles",
            "Asia/Dubai",
            "Asia/Kolkata",
            "Asia/Tokyo",
            "Australia/Sydney",
            "UTC"
        ];
    }

    if (!timezones.includes(detectedTimezone)) {
        timezones.push(detectedTimezone);
    }

    if (!timezones.includes("UTC")) {
        timezones.push("UTC");
    }

    timezones.sort();

    timezoneSelect.innerHTML =
        '<option value="">Select your business timezone</option>';

    timezones.forEach((timezone) => {
        const option = document.createElement("option");

        option.value = timezone;
        option.textContent = timezone.replaceAll("_", " ");

        timezoneSelect.appendChild(option);
    });

    timezoneSelect.value = detectedTimezone;
}


// Populate the currency dropdown using browser internationalization.
function populateCurrencies() {
    let currencyCodes = [];

    if (typeof Intl.supportedValuesOf === "function") {
        currencyCodes = Intl.supportedValuesOf("currency");
    } else {
        currencyCodes = [
            "NGN", "USD", "GBP", "EUR", "GHS",
            "KES", "ZAR", "CAD", "AUD", "INR"
        ];
    }

    const displayNames = new Intl.DisplayNames(["en"], {
        type: "currency"
    });

    function getCurrencySymbol(code) {
        try {
            return (0).toLocaleString("en", {
                style: "currency",
                currency: code,
                currencyDisplay: "symbol"
            }).replace(/[0-9.,\s]/g, "");
        } catch {
            return code;
        }
    }

    const formattedCurrencies = currencyCodes
        .map((code) => ({
            code,
            name: displayNames.of(code) || code,
            symbol: getCurrencySymbol(code)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    if (!currencyCodes.includes("NGN")) {
        formattedCurrencies.push({
            code: "NGN",
            name: displayNames.of("NGN") || "Nigerian Naira",
            symbol: getCurrencySymbol("NGN")
        });
    }

    formattedCurrencies.sort((a, b) => a.name.localeCompare(b.name));

    currencySelect.innerHTML =
        '<option value="">Select your business currency</option>';

    formattedCurrencies.forEach((currency) => {
        const option = document.createElement("option");

        option.value = currency.code;
        option.textContent =
            `${currency.name} (${currency.symbol}) — ${currency.code}`;

        currencySelect.appendChild(option);
    });

    currencySelect.value = "NGN";
}


populateTimezones();
populateCurrencies();


registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage("");

    if (passwordInput.value !== confirmPasswordInput.value) {
        showMessage("Passwords do not match.");
        return;
    }

    const registrationData = {
        business_name: businessNameInput.value.trim(),
        full_name: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim() || null,
        timezone: timezoneSelect.value,
        currency: currencySelect.value,
        password: passwordInput.value
    };

    try {
        registerButton.disabled = true;
        registerButton.textContent = "Creating account...";

        await register(registrationData);

        showMessage(
            "Account created successfully. Redirecting...",
            "success"
        );

        window.location.href = "./dashboard/index.html";

    } catch (error) {
        showMessage(error.message || "Registration failed. Please try again.");

    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Create Account";
    }
});
