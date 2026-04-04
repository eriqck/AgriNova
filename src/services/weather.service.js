import { env } from "../config/env.js";

const weatherCodeMap = new Map([
  [0, "Clear sky"],
  [1, "Mostly clear"],
  [2, "Partly cloudy"],
  [3, "Overcast"],
  [45, "Fog"],
  [48, "Depositing rime fog"],
  [51, "Light drizzle"],
  [53, "Moderate drizzle"],
  [55, "Dense drizzle"],
  [61, "Slight rain"],
  [63, "Moderate rain"],
  [65, "Heavy rain"],
  [71, "Slight snowfall"],
  [80, "Rain showers"],
  [95, "Thunderstorm"]
]);

export function describeWeatherCode(code) {
  return weatherCodeMap.get(Number(code)) || "Variable conditions";
}

export async function fetchFarmWeather({ latitude, longitude }) {
  const url = new URL(`${env.openMeteoBaseUrl}/forecast`);
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "rain",
      "precipitation_probability",
      "wind_speed_10m",
      "weather_code",
      "soil_temperature_0cm",
      "soil_moisture_0_to_1cm"
    ].join(",")
  );
  url.searchParams.set(
    "daily",
    ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max", "precipitation_sum"].join(",")
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const current = payload.current || {};
  const daily = payload.daily || {};
  const dailyCount = Array.isArray(daily.time) ? daily.time.length : 0;

  return {
    summaryLabel: describeWeatherCode(current.weather_code),
    currentTemperatureC: current.temperature_2m ?? null,
    rainMm: current.rain ?? null,
    precipitationProbabilityPct: current.precipitation_probability ?? null,
    windSpeedKph: current.wind_speed_10m ?? null,
    soilTemperatureC: current.soil_temperature_0cm ?? null,
    soilMoisturePct:
      current.soil_moisture_0_to_1cm !== undefined && current.soil_moisture_0_to_1cm !== null
        ? Number(current.soil_moisture_0_to_1cm) * 100
        : null,
    weatherCode: current.weather_code ?? null,
    forecast: Array.from({ length: dailyCount }).map((_, index) => ({
      date: daily.time[index],
      weatherCode: daily.weather_code?.[index] ?? null,
      label: describeWeatherCode(daily.weather_code?.[index]),
      maxTemperatureC: daily.temperature_2m_max?.[index] ?? null,
      minTemperatureC: daily.temperature_2m_min?.[index] ?? null,
      precipitationProbabilityPct: daily.precipitation_probability_max?.[index] ?? null,
      precipitationSumMm: daily.precipitation_sum?.[index] ?? null
    }))
  };
}
