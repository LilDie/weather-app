import { getCoordinates, getWeather } from "./api.js";
import { showWeather, showError, showLoading, setButtonState } from "./ui.js";

const MESSAGES = {
    EMPTY_INPUT: "Por favor ingresa una ciudad válida",
    SEARCH_ERROR: "No se pudo completar la búsqueda",
    DEFAULT_ERROR: "Ocurrió un error inesperado"
};

/**
 * Valida que el input sea válido
 */
function validateInput(city) {
    if (!city || typeof city !== "string") {
        return false;
    }

    const trimmed = city.trim();
    return trimmed.length > 0 && trimmed.length <= 100;
}

/**
 * Maneja la búsqueda de clima
 */
export async function handleSearch() {
    // Obtener input y botón cuando se llama la función, no al importar
    const input = document.getElementById("cityInput");
    const button = document.getElementById("searchBtn");

    if (!input || !button) {
        showError(MESSAGES.DEFAULT_ERROR);
        return;
    }

    const city = input.value.trim();

    // Validación de entrada
    if (!validateInput(city)) {
        showError(MESSAGES.EMPTY_INPUT);
        return;
    }

    try {
        setButtonState(true);
        showLoading();

        const { latitude, longitude, name } = await getCoordinates(city);
        const weather = await getWeather(latitude, longitude);

        if (!weather) {
            throw new Error("No se pudo obtener el clima");
        }

        showWeather(name, weather);
    } catch (error) {
        // Mostrar mensaje de error específico o genérico
        const errorMessage = error.message || MESSAGES.DEFAULT_ERROR;
        showError(errorMessage);
    } finally {
        setButtonState(false);
        input.value = ""; // Limpiar input después de búsqueda
    }
}

/**
 * Aplica el tema
 */
export function applyTheme(theme) {
    const app = document.querySelector(".weather-app");
    const themeToggle = document.getElementById("themeToggle");

    if (theme === "dark") {
        if (app) app.classList.add("dark-theme");
        document.body.classList.add("dark-theme");
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        if (app) app.classList.remove("dark-theme");
        document.body.classList.remove("dark-theme");
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }

    localStorage.setItem("theme", theme);
}

/**
 * Alterna entre tema claro y oscuro
 */
export function toggleTheme() {
    const currentTheme = localStorage.getItem("theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
}

/**
 * Inicializa los event listeners cuando el DOM está listo
 */
function initializeApp() {
    const input = document.getElementById("cityInput");
    const button = document.getElementById("searchBtn");
    const themeToggle = document.getElementById("themeToggle");

    if (!input || !button) {
        // Silenciosamente ignorar si no hay elementos (útil en tests)
        return;
    }

    // Click botón
    button.addEventListener("click", handleSearch);

    // Enter en input
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    });

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
        // Cargar tema guardado
        const savedTheme = localStorage.getItem("theme") || "light";
        applyTheme(savedTheme);
    }
}

// Solo inicializar si estamos en el navegador (no en tests)
if (typeof document !== "undefined" && typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeApp);
    } else {
        initializeApp();
    }
}
