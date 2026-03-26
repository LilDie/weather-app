/**
 * Tests para app.js
 * Casos de prueba: válidos, inválidos y límite
 */

// Mocks ANTES de importar
jest.mock("./api.js", () => ({
    getCoordinates: jest.fn(),
    getWeather: jest.fn(),
    clearCache: jest.fn()
}));

jest.mock("./ui.js", () => ({
    showWeather: jest.fn(),
    showError: jest.fn(),
    showLoading: jest.fn(),
    setButtonState: jest.fn()
}));

// Configurar el DOM DESPUÉS de los mocks pero ANTES de importar app.js
document.body.innerHTML = `
  <input id="cityInput" type="text" />
  <button id="searchBtn">Buscar</button>
  <div id="result"></div>
`;

import { handleSearch } from "./app.js";
import * as api from "./api.js";
import * as ui from "./ui.js";

describe("handleSearch - Búsqueda de clima", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.getElementById("cityInput").value = "";
    });

    // ✅ CASOS VÁLIDOS
    describe("Casos válidos", () => {
        test("Debe mostrar clima cuando la búsqueda es exitosa", async () => {
            const input = document.getElementById("cityInput");
            input.value = "Santiago";

            api.getCoordinates.mockResolvedValueOnce({
                latitude: -33.8688,
                longitude: -51.2093,
                name: "Santiago"
            });

            api.getWeather.mockResolvedValueOnce({
                temperature: 22.5,
                windspeed: 15
            });

            await handleSearch();

            expect(api.getCoordinates).toHaveBeenCalledWith("Santiago");
            expect(api.getWeather).toHaveBeenCalled();
            expect(ui.showWeather).toHaveBeenCalledWith(
                "Santiago",
                expect.objectContaining({
                    temperature: 22.5,
                    windspeed: 15
                })
            );
            expect(ui.setButtonState).toHaveBeenCalledWith(false);
        });

        test("Debe funcionar con espacios antes y después", async () => {
            const input = document.getElementById("cityInput");
            input.value = "  Santiago  ";

            api.getCoordinates.mockResolvedValueOnce({
                latitude: 0,
                longitude: 0,
                name: "Santiago"
            });

            api.getWeather.mockResolvedValueOnce({
                temperature: 20,
                windspeed: 10
            });

            await handleSearch();

            expect(api.getCoordinates).toHaveBeenCalledWith("Santiago");
        });
    });

    // ❌ CASOS INVÁLIDOS
    describe("Casos inválidos", () => {
        test("Debe mostrar error cuando el input está vacío", async () => {
            const input = document.getElementById("cityInput");
            input.value = "";

            await handleSearch();

            expect(ui.showError).toHaveBeenCalledWith("Por favor ingresa una ciudad válida");
            expect(api.getCoordinates).not.toHaveBeenCalled();
        });

        test("Debe mostrar error cuando el input solo contiene espacios", async () => {
            const input = document.getElementById("cityInput");
            input.value = "   ";

            await handleSearch();

            expect(ui.showError).toHaveBeenCalledWith("Por favor ingresa una ciudad válida");
        });

        test("Debe mostrar error cuando getCoordinates falla", async () => {
            const input = document.getElementById("cityInput");
            input.value = "CiudadNoExistente";

            api.getCoordinates.mockRejectedValueOnce(
                new Error("No se encontraron resultados para \"CiudadNoExistente\"")
            );

            await handleSearch();

            expect(ui.showError).toHaveBeenCalledWith("No se encontraron resultados para \"CiudadNoExistente\"");
            expect(ui.showWeather).not.toHaveBeenCalled();
        });

        test("Debe mostrar error cuando getWeather falla", async () => {
            const input = document.getElementById("cityInput");
            input.value = "Santiago";

            api.getCoordinates.mockResolvedValueOnce({
                latitude: 0,
                longitude: 0,
                name: "Santiago"
            });

            api.getWeather.mockRejectedValueOnce(
                new Error("Los datos de clima no están disponibles para esta ubicación")
            );

            await handleSearch();

            expect(ui.showError).toHaveBeenCalledWith("Los datos de clima no están disponibles para esta ubicación");
        });

        test("Debe mostrar error cuando el clima es null", async () => {
            const input = document.getElementById("cityInput");
            input.value = "Santiago";

            api.getCoordinates.mockResolvedValueOnce({
                latitude: 0,
                longitude: 0,
                name: "Santiago"
            });

            api.getWeather.mockResolvedValueOnce(null);

            await handleSearch();

            expect(ui.showError).toHaveBeenCalledWith("No se pudo obtener el clima");
        });
    });

    // 🔄 CASOS LÍMITE
    describe("Casos límite", () => {
        test("Debe funcionar con nombres de ciudades muy largos", async () => {
            const input = document.getElementById("cityInput");
            const longName = "A".repeat(100);
            input.value = longName;

            api.getCoordinates.mockResolvedValueOnce({
                latitude: 0,
                longitude: 0,
                name: longName
            });

            api.getWeather.mockResolvedValueOnce({
                temperature: 20,
                windspeed: 10
            });

            await handleSearch();

            expect(api.getCoordinates).toHaveBeenCalledWith(longName);
        });

        test("Debe funcionar con caracteres especiales en nombres", async () => {
            const input = document.getElementById("cityInput");
            input.value = "São Paulo";

            api.getCoordinates.mockResolvedValueOnce({
                latitude: 0,
                longitude: 0,
                name: "São Paulo"
            });

            api.getWeather.mockResolvedValueOnce({
                temperature: 30,
                windspeed: 5
            });

            await handleSearch();

            expect(api.getCoordinates).toHaveBeenCalledWith("São Paulo");
            expect(ui.showWeather).toHaveBeenCalled();
        });

        test("Debe deshabilitar el botón durante la búsqueda", async () => {
            const input = document.getElementById("cityInput");
            input.value = "Santiago";

            api.getCoordinates.mockImplementationOnce(() => new Promise(resolve => {
                setTimeout(() => {
                    resolve({ latitude: 0, longitude: 0, name: "Santiago" });
                }, 100);
            }));

            api.getWeather.mockResolvedValueOnce({
                temperature: 20,
                windspeed: 10
            });

            const promise = handleSearch();

            expect(ui.setButtonState).toHaveBeenCalledWith(true);

            await promise;

            expect(ui.setButtonState).toHaveBeenCalledWith(false);
        });

        test("Debe mostrar loading mientras se obtienen datos", async () => {
            const input = document.getElementById("cityInput");
            input.value = "Santiago";

            api.getCoordinates.mockResolvedValueOnce({
                latitude: 0,
                longitude: 0,
                name: "Santiago"
            });

            api.getWeather.mockResolvedValueOnce({
                temperature: 20,
                windspeed: 10
            });

            await handleSearch();

            expect(ui.showLoading).toHaveBeenCalled();
        });
    });
});
