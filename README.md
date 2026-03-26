# 🌦️ Weather App

Aplicación web simple que permite consultar el clima actual de una ciudad utilizando la API de Open-Meteo.
(Solo ciudades de Chile por el momento)
## 🚀 Características

- Búsqueda de clima por ciudad
- Conversión automática de ciudad a coordenadas (Geocoding API)
- Obtención de clima actual (Weather API)
- Manejo de errores (ciudades inválidas, fallos de red)
- Indicador de carga (loading)
- Soporte para tecla Enter
- Interfaz simple con Bootstrap

---

## 🧠 Cómo funciona

1. El usuario ingresa una ciudad
2. Se consulta la Geocoding API para obtener latitud y longitud
3. Se realiza una segunda solicitud a la Weather API
4. Se muestran los datos del clima en pantalla

---

## 🛠️ Tecnologías

- JavaScript (ES Modules)
- HTML5
- Bootstrap 5
- API: Open-Meteo

---

## 📦 Estructura del proyecto
/project
│── index.html
│── /js
│ ├── app.js # Lógica principal
│ ├── api.js # Consumo de APIs
│ ├── ui.js # Manipulación del DOM


---
## ⚙️ Instalación y uso

1. Clonar el repositorio:


git clone https://github.com/tu-usuario/weather-app.git


2. Entrar al proyecto:


cd weather-app


3. Ejecutar con un servidor local (recomendado):

Puedes usar Live Server en VS Code o:


npx serve


4. Abrir en el navegador:


http://localhost:3000


---

## ⚠️ Consideraciones

- La API de Open-Meteo trabaja con coordenadas, no con nombres de ciudad directamente
- Algunas ubicaciones pueden no estar disponibles en la API de geocoding
- No se requiere API key para su uso

---

## 📌 Posibles mejoras

- Autocompletado de ciudades
- Manejo de múltiples resultados de búsqueda
- Historial de búsquedas (localStorage)
- Mostrar más datos meteorológicos

---

