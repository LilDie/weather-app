/**
 * Tests para api.js
 * Casos de prueba: válidos, inválidos y límite
 */

import { getCoordinates, getWeather, clearCache } from "./api.js";

// Mock global fetch
global.fetch = jest.fn();

describe("getCoordinates - Buscar coordenadas de ciudad", () => {
    beforeEach(() => {
        fetch.mockClear();
        clearCache();
    });

    // ✅ CASOS VÁLIDOS
    describe("Casos válidos", () => {
        test("Debe retornar coordenadas para una ciudad válida", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [
                        {
                            latitude: -33.8688,
                            longitude: -51.2093,
                            name: "Santiago"
                        }
                    ]
                })
            });

            const result = await getCoordinates("Santiago");
            expect(result.latitude).toBe(-33.8688);
            expect(result.longitude).toBe(-51.2093);
            expect(result.name).toBe("Santiago");
        });

        test("Debe retornar la primera ciudad cuando hay múltiples resultados", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [
                        { latitude: 10, longitude: 20, name: "Santiago, Chile" },
                        { latitude: 30, longitude: 40, name: "Santiago, España" }
                    ]
                })
            });

            const result = await getCoordinates("Santiago");
            expect(result.name).toBe("Santiago, Chile");
        });
    });

    // ❌ CASOS INVÁLIDOS
    describe("Casos inválidos", () => {
        test("Debe lanzar error cuando la API retorna error (404)", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(getCoordinates("CiudadNoExistente")).rejects.toThrow(
                /no fue encontrada/
            );
        });

        test("Debe lanzar error cuando no hay resultados", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ results: [] })
            });

            await expect(getCoordinates("XyZ123")).rejects.toThrow(
                /No se encontraron resultados/
            );
        });

        test("Debe lanzar error cuando la conexión falla", async () => {
            fetch.mockRejectedValueOnce(new Error("Network error"));

            await expect(getCoordinates("Santiago")).rejects.toThrow("Network error");
        });
    });

    // 🔄 CASOS LÍMITE
    describe("Casos límite", () => {
        test("Debe funcionar con nombres de ciudades con caracteres especiales", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [
                        { latitude: 10, longitude: 20, name: "São Paulo" }
                    ]
                })
            });

            const result = await getCoordinates("São Paulo");
            expect(result.name).toBe("São Paulo");
        });

        test("Debe funcionar con ciudades con nombres muy largos", async () => {
            const longName = "A".repeat(100);
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [
                        { latitude: 10, longitude: 20, name: longName }
                    ]
                })
            });

            const result = await getCoordinates(longName);
            expect(result.name).toBe(longName);
        });

        test("Debe manejar coordenadas en el polo sur", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: [
                        { latitude: -89.9999, longitude: 0, name: "Polo Sur" }
                    ]
                })
            });

            const result = await getCoordinates("Polo Sur");
            expect(result.latitude).toBe(-89.9999);
        });
    });
});

describe("getWeather - Obtener datos del clima", () => {
    beforeEach(() => {
        fetch.mockClear();
        clearCache();
    });

    // ✅ CASOS VÁLIDOS
    describe("Casos válidos", () => {
        test("Debe retornar datos válidos del clima", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    current_weather: {
                        temperature: 22.5,
                        windspeed: 15.3,
                        weather_code: 0
                    }
                })
            });

            const result = await getWeather(-33.8688, -51.2093);
            expect(result.temperature).toBe(22.5);
            expect(result.windspeed).toBe(15.3);
        });

        test("Debe aceptar coordenadas negativas (hemisferio sur)", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    current_weather: {
                        temperature: 20,
                        windspeed: 10
                    }
                })
            });

            await expect(getWeather(-45.123, -72.456)).resolves.toBeDefined();
        });
    });

    // ❌ CASOS INVÁLIDOS
    describe("Casos inválidos", () => {
        test("Debe lanzar error cuando la API falla", async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(getWeather(0, 0)).rejects.toThrow(/Error al obtener el clima/);
        });

        test("Debe lanzar error cuando faltan datos del clima", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ current_weather: null })
            });

            await expect(getWeather(0, 0)).rejects.toThrow(
                /Los datos de clima no están disponibles/
            );
        });

        test("Debe lanzar error cuando la respuesta no tiene estructura esperada", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

            await expect(getWeather(0, 0)).rejects.toThrow(
                /Los datos de clima no están disponibles/
            );
        });
    });

    // 🔄 CASOS LÍMITE
    describe("Casos límite", () => {
        test("Debe manejar temperaturas extremadamente altas", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    current_weather: {
                        temperature: 58.2,
                        windspeed: 0
                    }
                })
            });

            const result = await getWeather(0, 0);
            expect(result.temperature).toBe(58.2);
        });

        test("Debe manejar temperaturas extremadamente bajas", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    current_weather: {
                        temperature: -89.2,
                        windspeed: 300
                    }
                })
            });

            const result = await getWeather(0, 0);
            expect(result.temperature).toBe(-89.2);
        });

        test("Debe manejar velocidades de viento extremas", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    current_weather: {
                        temperature: 20,
                        windspeed: 999.9
                    }
                })
            });

            const result = await getWeather(0, 0);
            expect(result.windspeed).toBe(999.9);
        });

        test("Debe manejar cero viento", async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    current_weather: {
                        temperature: 20,
                        windspeed: 0
                    }
                })
            });

            const result = await getWeather(0, 0);
            expect(result.windspeed).toBe(0);
        });
    });
});
