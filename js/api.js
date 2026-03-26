const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const FETCH_TIMEOUT = 5000; // 5 segundo timeout
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Caché simple para coordenadas
const coordinateCache = new Map();
const weatherCache = new Map();

/**
 * Realiza un fetch con timeout
 */
async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Valida que las coordenadas sean válidas
 */
function validateCoordinates(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error("Coordenadas inválidas");
  }

  if (lat < -90 || lat > 90) {
    throw new Error("Latitud debe estar entre -90 y 90");
  }

  if (lon < -180 || lon > 180) {
    throw new Error("Longitud debe estar entre -180 y 180");
  }

  return { lat, lon };
}

/**
 * Limpia el caché (para pruebas)
 */
export function clearCache() {
  coordinateCache.clear();
}

/**
 * Obtiene las coordenadas de una ciudad con caché
 */
export async function getCoordinates(city) {
  // Validar entrada
  if (!city || typeof city !== "string" || city.trim().length === 0) {
    throw new Error("Nombre de ciudad inválido");
  }

  const cityTrimmed = city.trim();

  // Verificar caché
  if (coordinateCache.has(cityTrimmed)) {
    const cached = coordinateCache.get(cityTrimmed);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    } else {
      coordinateCache.delete(cityTrimmed);
    }
  }

  try {
    const url = `${GEO_URL}?name=${encodeURIComponent(cityTrimmed)}, Chile&count=5&countryCode=CL`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`La ciudad "${cityTrimmed}" no fue encontrada`);
      }
      throw new Error(`Error de servidor (${response.status})`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error(`No se encontraron resultados para "${cityTrimmed}"`);
    }

    const { latitude, longitude, name } = data.results[0];

    // Validar coordenadas
    validateCoordinates(latitude, longitude);

    // Guardar en caché
    const result = { latitude, longitude, name };
    coordinateCache.set(cityTrimmed, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.");
    }
    throw error;
  }
}

/**
 * Obtiene el clima actual para coordenadas específicas
 * Optimizado: solo obtiene parámetros necesarios (temperatura y viento)
 */
export async function getWeather(lat, lon) {
  try {
    // Validar coordenadas
    const { lat: validLat, lon: validLon } = validateCoordinates(lat, lon);
    const cacheKey = `weather_${validLat}_${validLon}`;

    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey);

      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data; // ← USO CACHE
      } else {
        weatherCache.delete(cacheKey); // ← expiró
      }
    }
    // Optimización: parámetros de consulta mínimos necesarios
    const url = `${WEATHER_URL}?latitude=${validLat}&longitude=${validLon}&current_weather=true&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto&windspeed_unit=kmh`;

    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Error al obtener el clima (${response.status})`);
    }

    const data = await response.json();

    if (!data.current_weather) {
      throw new Error("Los datos de clima no están disponibles para esta ubicación");
    }

    // Extraer solo los datos necesarios
    const weather = data.current_weather;
    if (typeof weather.temperature !== "number") {
      throw new Error("Datos de clima incompletos");
    }

    const result = {
      temperature: weather.temperature,
      windspeed: weather.windspeed || weather.wind_speed_10m || 0,
      weathercode: weather.weathercode || weather.weather_code || null,
      time: weather.time
    };

    weatherCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    console.log("GUARDADO EN CACHE:", cacheKey, weatherCache.get(cacheKey));
    console.log("CACHE COMPLETO:", Array.from(weatherCache.entries()));
    return result;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.");
    }
    throw error;
  }
}

/**
 * Obtiene clima de múltiples ciudades en paralelo
 * @param {Array<string>} cities - Array de nombres de ciudades
 * @returns {Promise<Array>} Array con {name, weather} para cada ciudad
 */
export async function getMultipleCitiesWeather(cities) {
  if (!Array.isArray(cities) || cities.length === 0) {
    throw new Error("Debes proporcionar un array de ciudades");
  }

  try {
    const weatherDataPromises = cities.map(async (city) => {
      const { latitude, longitude, name } = await getCoordinates(city);
      const weather = await getWeather(latitude, longitude);
      return { name, weather };
    });

    const results = await Promise.all(weatherDataPromises);
    return results;
  } catch (error) {
    throw new Error(`Error obteniendo datos de múltiples ciudades: ${error.message}`);
  }
}