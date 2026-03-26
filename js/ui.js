/**
 * Sanitiza HTML para prevenir XSS
 */
function sanitizeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Valida que los datos del clima sean válidos
 */
function validateWeatherData(weather) {
  if (!weather || typeof weather !== "object") {
    throw new Error("Datos de clima inválidos");
  }

  if (typeof weather.temperature !== "number") {
    throw new Error("Temperatura no disponible");
  }

  if (typeof weather.windspeed !== "number") {
    throw new Error("Velocidad del viento no disponible");
  }

  if (!weather.weathercode && typeof weather.weathercode !== "number") {
    weather.weathercode = null; // Opcional si no hay código
  }

  return true;
}

// Historial de búsqueda
const searchHistory = [];

export function showLoading() {
  const result = document.getElementById("result");
  if (!result) return;

  result.innerHTML = `
    <div class="weather-loading">
      <div class="spinner"></div>
      <p class="loading-text">Buscando información del clima...</p>
    </div>
  `;
}

// Función para obtener icono según condición (weathercode)
function getWeatherIcon(weathercode) {
  if (weathercode === null) return "🌈"; // default
  // Categoría básica basada en Open-Meteo codes simplificados
  if ([0, 1].includes(weathercode)) return "☀️"; // soleado
  if ([2, 3, 45, 48].includes(weathercode)) return "☁️"; // nublado
  if ([51, 53, 55, 61, 63, 65].includes(weathercode)) return "🌧️"; // lluvia
  if ([71, 73, 75, 77, 85, 86].includes(weathercode)) return "❄️"; // nieve
  if ([95, 96, 99].includes(weathercode)) return "⛈️"; // tormenta
  return "🌈"; // fallback
}

export function showWeather(city, weather) {
  const result = document.getElementById("result");
  if (!result) return;

  try {
    validateWeatherData(weather);
    const sanitizedCity = sanitizeHTML(city);

    // Formatear valores
    const temp = weather.temperature.toFixed(1);
    const windspeed = weather.windspeed.toFixed(1);
    const icon = getWeatherIcon(weather.weathercode);

    // Guardar en historial
    if (!searchHistory.includes(sanitizedCity)) {
      searchHistory.unshift(sanitizedCity);
      if (searchHistory.length > 5) searchHistory.pop();
    }

    result.innerHTML = `
      <div class="weather-card">
        <h3>${icon} ${sanitizedCity}</h3>
        <div class="weather-info-grid">
          <div class="weather-item">
            <span class="weather-label">Temperatura</span>
            <div class="weather-value">
              ${temp}<span class="weather-unit">°C</span>
            </div>
          </div>
          <div class="weather-item">
            <span class="weather-label">Viento</span>
            <div class="weather-value">
              ${windspeed}<span class="weather-unit">km/h</span>
            </div>
          </div>
        </div>
        <div class="weather-timestamp">
          ⏱️ Actualizado: ${new Date().toLocaleTimeString("es-CL")}
        </div>
      </div>
    `;
  } catch (error) {
    showError(`Error al mostrar el clima: ${error.message}`);
  }
}

export function showError(message) {
  const result = document.getElementById("result");
  if (!result) return;

  const sanitizedMessage = sanitizeHTML(message);

  result.innerHTML = `
    <div class="weather-alert">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <strong style="font-size: 1.1rem;">⚠️ Error</strong>
          <p style="margin: 0.5rem 0 0; opacity: 0.95;">${sanitizedMessage}</p>
        </div>
        <button onclick="this.parentElement.parentElement.style.display='none'" type="button" aria-label="Cerrar" style="margin: -8px -8px 0 0; border: none; background: none; font-size: 1.5rem; cursor: pointer; opacity: 0.7;">
          &times;
        </button>
      </div>
    </div>
  `;
}

export function setButtonState(disabled) {
  const button = document.getElementById("searchBtn");
  if (!button) {
    console.error("Elemento 'searchBtn' no encontrado");
    return;
  }

  button.disabled = disabled;

  if (disabled) {
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="btn-text">Buscando...</span>';
  } else {
    button.innerHTML = '<i class="fas fa-search"></i> <span class="btn-text">Buscar</span>';
  }
}

/**
 * Muestra el clima de múltiples ciudades
 * @param {Array<{name: string, weather: object}>} results - Resultados de múltiples ciudades
 */
export function showMultipleWeather(results) {
  const result = document.getElementById("result");
  if (!result) return;

  try {
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No hay datos que mostrar");
    }

    // Generar tarjetas para cada ciudad
    const cardsHTML = results.map((item) => {
      const { name, weather } = item;
      validateWeatherData(weather);
      const sanitizedCity = sanitizeHTML(name);

      const temp = weather.temperature.toFixed(1);
      const windspeed = weather.windspeed.toFixed(1);
      const icon = getWeatherIcon(weather.weathercode);

      return `
        <div class="weather-card">
          <h3>${icon} ${sanitizedCity}</h3>
          <div class="weather-info-grid">
            <div class="weather-item">
              <span class="weather-label">Temperatura</span>
              <div class="weather-value">
                ${temp}<span class="weather-unit">°C</span>
              </div>
            </div>
            <div class="weather-item">
              <span class="weather-label">Viento</span>
              <div class="weather-value">
                ${windspeed}<span class="weather-unit">km/h</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    result.innerHTML = `
      <div class="weather-comparison">
        <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary-color);">Comparativa de Clima</h2>
        <div class="weather-grid">
          ${cardsHTML}
        </div>
        <div class="weather-timestamp" style="text-align: center; margin-top: 1.5rem;">
          ⏱️ Actualizado: ${new Date().toLocaleTimeString("es-CL")}
        </div>
      </div>
    `;
  } catch (error) {
    showError(`Error al mostrar el clima: ${error.message}`);
  }
}