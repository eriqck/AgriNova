import crypto from "node:crypto";
import { pool } from "../config/db.js";
import { fetchThingSpeakLatestReading } from "../services/sensor-provider.service.js";
import { fetchFarmWeather } from "../services/weather.service.js";

const healthTemplate = [78, 82, 65, 71, 76, 80];
const organicTemplate = [3.8, 4.1, 2.9, 3.4, 3.7, 4.0];
const moistureTemplate = [24, 26, 22, 25, 23, 24];
const batteryTemplate = [87, 92, 65, 58, 84, 73];
const sensorStatusTemplate = ["online", "online", "warning", "online", "offline", "online"];
const cropFallbacks = ["Corn", "Soybeans", "Wheat", "Cotton", "Tomatoes", "Avocados"];

function generateIngestToken() {
  return crypto.randomBytes(18).toString("hex");
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + toNumber(value), 0) / values.length;
}

function round(value, digits = 1) {
  return Number(toNumber(value).toFixed(digits));
}

function buildCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const normalized = value === null || value === undefined ? "" : String(value);
          return `"${normalized.replaceAll('"', '""')}"`;
        })
        .join(",")
    )
    .join("\n");
}

function slugify(value) {
  return String(value || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatDateKey(date) {
  const instance = new Date(date);
  const year = instance.getFullYear();
  const month = String(instance.getMonth() + 1).padStart(2, "0");
  const day = String(instance.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date, months) {
  const instance = new Date(date);
  instance.setMonth(instance.getMonth() + months);
  return instance;
}

function minutesAgo(value) {
  if (!value) {
    return 0;
  }

  const diff = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

function createRecommendationTemplates(farms) {
  const safeFarms = farms.length ? farms : [{ id: null, farm_name: "Main Field" }];

  return [
    {
      farmId: safeFarms[0]?.id,
      title: "Apply Mycorrhizal Inoculant",
      impact: "high",
      description:
        "Low beneficial fungi detected. Apply mycorrhizal inoculant to improve nutrient uptake and early vigor.",
      resultSummary: "Expected 15% increase in phosphorus availability",
      savingsSummary: "KSh 125/acre equivalent"
    },
    {
      farmId: safeFarms[1 % safeFarms.length]?.id,
      title: "Reduce Nitrogen Application",
      impact: "medium",
      description:
        "Nitrogen-fixing activity is healthy. Reduce synthetic nitrogen by 20% while monitoring leaf color and growth.",
      resultSummary: "Maintain yield while lowering unnecessary inputs",
      savingsSummary: "KSh 45/acre saved"
    },
    {
      farmId: safeFarms[2 % safeFarms.length]?.id,
      title: "Increase Organic Matter",
      impact: "medium",
      description:
        "Add compost or residue cover to improve microbial activity, water retention, and long-term soil structure.",
      resultSummary: "Improved soil resilience and moisture retention",
      savingsSummary: "KSh 85/acre improvement"
    }
  ].filter((item) => item.farmId);
}

function createInterventionTemplates(farms) {
  const safeFarms = farms.length ? farms : [{ id: null }];
  const now = new Date();

  return [
    {
      farmId: safeFarms[0]?.id,
      title: "Biofertilizer Application",
      status: "Completed",
      scheduledFor: formatDateKey(addMonths(now, 0)),
      completedAt: formatDateKey(addMonths(now, 0)),
      effectiveness: 88,
      notes: "Field response remained stable after the last irrigation cycle."
    },
    {
      farmId: safeFarms[1 % safeFarms.length]?.id,
      title: "Compost Amendment",
      status: "Completed",
      scheduledFor: formatDateKey(addMonths(now, 0)),
      completedAt: formatDateKey(addMonths(now, 0)),
      effectiveness: 92,
      notes: "Organic matter levels improved after amendment."
    },
    {
      farmId: safeFarms[2 % safeFarms.length]?.id,
      title: "Cover Crop Rotation",
      status: "Completed",
      scheduledFor: formatDateKey(addMonths(now, 0)),
      completedAt: formatDateKey(addMonths(now, 0)),
      effectiveness: 81,
      notes: "Ground cover improved soil retention in exposed areas."
    }
  ].filter((item) => item.farmId);
}

function createReportTemplates(fieldCount, sampleCount) {
  const today = new Date();

  return [
    {
      title: "April 2026 Soil Health Summary",
      type: "Monthly Report",
      date: formatDateKey(today),
      fields: fieldCount,
      samples: sampleCount,
      status: "ready",
      size: "2.4 MB"
    },
    {
      title: "Q1 2026 Microbiome Evolution",
      type: "Quarterly Report",
      date: formatDateKey(addMonths(today, -1)),
      fields: fieldCount,
      samples: sampleCount,
      status: "ready",
      size: "5.8 MB"
    },
    {
      title: "Intervention Effectiveness Analysis",
      type: "Custom Report",
      date: formatDateKey(addMonths(today, -1)),
      fields: Math.max(fieldCount - 1, 1),
      samples: sampleCount,
      status: "ready",
      size: "1.9 MB"
    },
    {
      title: "Yield Prediction Model - 2026",
      type: "Predictive Report",
      date: formatDateKey(today),
      fields: fieldCount,
      samples: sampleCount,
      status: "generating",
      size: "-"
    }
  ];
}

async function getFarmsForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, farm_name, county, sub_county, village, acreage, soil_type, latitude, longitude
     FROM farms
     WHERE farmer_id = ?
     ORDER BY created_at ASC`,
    [userId]
  );

  return rows;
}

async function getListingsForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT l.id, l.farm_id, l.title, p.name AS product_name
     FROM listings l
     LEFT JOIN products p ON p.id = l.product_id
     WHERE l.farmer_id = ?
     ORDER BY l.created_at DESC`,
    [userId]
  );

  return rows;
}

async function ensureFieldProfiles(farms, listings) {
  const listingByFarm = listings.reduce((accumulator, listing) => {
    if (!accumulator[listing.farm_id]) {
      accumulator[listing.farm_id] = listing;
    }

    return accumulator;
  }, {});

  for (const [index, farm] of farms.entries()) {
    const listing = listingByFarm[farm.id];
    const cropLabel = listing?.product_name || listing?.title || cropFallbacks[index % cropFallbacks.length];

    await pool.execute(
      `INSERT INTO pro_field_profiles
        (farm_id, crop_label, soil_health_index, organic_matter_pct, moisture_target_pct, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         crop_label = VALUES(crop_label),
         soil_health_index = COALESCE(pro_field_profiles.soil_health_index, VALUES(soil_health_index)),
         organic_matter_pct = COALESCE(pro_field_profiles.organic_matter_pct, VALUES(organic_matter_pct)),
         moisture_target_pct = COALESCE(pro_field_profiles.moisture_target_pct, VALUES(moisture_target_pct))`,
      [
        farm.id,
        cropLabel,
        healthTemplate[index % healthTemplate.length],
        organicTemplate[index % organicTemplate.length],
        moistureTemplate[index % moistureTemplate.length],
        `Auto-generated field profile for ${farm.farm_name}.`
      ]
    );
  }
}

async function ensureSensorData(userId, farms) {
  if (!farms.length) {
    return;
  }

  const [devices] = await pool.execute(
    `SELECT id, farm_id, ingest_token
     FROM pro_sensor_devices
     WHERE user_id = ?`,
    [userId]
  );

  const deviceByFarmId = new Map(devices.map((device) => [Number(device.farm_id), device]));

  for (const [index, farm] of farms.entries()) {
    if (!deviceByFarmId.has(Number(farm.id))) {
      await pool.execute(
        `INSERT INTO pro_sensor_devices
          (user_id, farm_id, zone_name, sensor_type, provider, status, battery_level, ingest_token)
         VALUES (?, ?, ?, 'Multi-Sensor', 'AGRINOVA_DIRECT', 'offline', ?, ?)`,
        [
          userId,
          farm.id,
          "Zone A",
          batteryTemplate[index % batteryTemplate.length],
          generateIngestToken()
        ]
      );
    }
  }

  for (const device of devices) {
    if (!device.ingest_token) {
      await pool.execute(
        `UPDATE pro_sensor_devices
         SET ingest_token = COALESCE(ingest_token, ?)
         WHERE id = ?`,
        [generateIngestToken(), device.id]
      );
    }
  }
}

async function ensureMicrobiomeData(userId, farms) {
  if (!farms.length) {
    return;
  }

  const [countRows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM pro_microbiome_samples WHERE user_id = ?",
    [userId]
  );

  const existingCount = Number(countRows[0]?.total || 0);

  if (existingCount >= 7) {
    return;
  }

  const now = new Date();
  const toInsert = 7 - existingCount;
  const microbiomeTemplates = [
    { bacteria: 42, fungi: 28, nitrogen: 15, decomposers: 10, pathogens: 5 },
    { bacteria: 45, fungi: 27, nitrogen: 14, decomposers: 10, pathogens: 4 },
    { bacteria: 47, fungi: 26, nitrogen: 13, decomposers: 10, pathogens: 4 },
    { bacteria: 49, fungi: 26, nitrogen: 12, decomposers: 9, pathogens: 4 },
    { bacteria: 52, fungi: 25, nitrogen: 11, decomposers: 8, pathogens: 4 },
    { bacteria: 54, fungi: 24, nitrogen: 10, decomposers: 8, pathogens: 4 },
    { bacteria: 56, fungi: 23, nitrogen: 9, decomposers: 8, pathogens: 4 }
  ];

  for (let index = 0; index < toInsert; index += 1) {
    const farm = farms[index % farms.length];
    const sampleDate = addMonths(now, -(6 - index));
    const template = microbiomeTemplates[index % microbiomeTemplates.length];

    await pool.execute(
      `INSERT INTO pro_microbiome_samples
        (user_id, farm_id, sample_label, sample_date, alpha_diversity, beta_diversity,
         beneficial_bacteria_pct, beneficial_fungi_pct, nitrogen_fixers_pct, decomposers_pct,
         pathogens_pct, functional_pathways, disease_risk)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        farm.id,
        `${farm.farm_name} Sample ${index + 1}`,
        formatDateKey(sampleDate),
        round(2.9 + index * 0.1, 2),
        round(0.48 + index * 0.02, 2),
        template.bacteria,
        template.fungi,
        template.nitrogen,
        template.decomposers,
        template.pathogens,
        22 + index,
        index > 4 ? "Low" : "Medium"
      ]
    );
  }
}

async function ensureRecommendationData(userId, farms) {
  const [countRows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM pro_recommendations WHERE user_id = ?",
    [userId]
  );

  if (Number(countRows[0]?.total || 0) > 0) {
    return;
  }

  const templates = createRecommendationTemplates(farms);

  for (const item of templates) {
    await pool.execute(
      `INSERT INTO pro_recommendations
        (user_id, farm_id, title, impact, description, result_summary, savings_summary, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
      [
        userId,
        item.farmId,
        item.title,
        item.impact,
        item.description,
        item.resultSummary,
        item.savingsSummary
      ]
    );
  }
}

async function ensureInterventionData(userId, farms) {
  const [countRows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM pro_interventions WHERE user_id = ?",
    [userId]
  );

  if (Number(countRows[0]?.total || 0) > 0) {
    return;
  }

  const templates = createInterventionTemplates(farms);

  for (const item of templates) {
    await pool.execute(
      `INSERT INTO pro_interventions
        (user_id, farm_id, title, status, scheduled_for, completed_at, effectiveness_pct, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        item.farmId,
        item.title,
        item.status,
        item.scheduledFor,
        item.completedAt,
        item.effectiveness,
        item.notes
      ]
    );
  }
}

async function ensureReportData(userId, fieldCount, sampleCount) {
  const [countRows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM pro_reports WHERE user_id = ?",
    [userId]
  );

  if (Number(countRows[0]?.total || 0) > 0) {
    return;
  }

  const templates = createReportTemplates(fieldCount, sampleCount);

  for (const item of templates) {
    await pool.execute(
      `INSERT INTO pro_reports
        (user_id, title, report_type, status, generated_on, field_count, sample_count, file_size_label)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, item.title, item.type, item.status, item.date, item.fields, item.samples, item.size]
    );
  }
}

async function ensureProFarmerData(userId) {
  const farms = await getFarmsForUser(userId);
  const listings = await getListingsForUser(userId);

  if (!farms.length) {
    return;
  }

  await ensureFieldProfiles(farms, listings);
  await ensureSensorData(userId, farms);
  await ensureMicrobiomeData(userId, farms);
  await ensureRecommendationData(userId, farms);
  await ensureInterventionData(userId, farms);

  const [sampleCountRows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM pro_microbiome_samples WHERE user_id = ?",
    [userId]
  );

  await ensureReportData(userId, farms.length, Number(sampleCountRows[0]?.total || 0));
}

function parseJsonConfig(rawConfig) {
  if (!rawConfig) {
    return {};
  }

  if (typeof rawConfig === "object") {
    return rawConfig;
  }

  try {
    return JSON.parse(rawConfig);
  } catch {
    return {};
  }
}

async function upsertSensorReading(deviceId, reading) {
  if (
    reading.temperatureC === null ||
    reading.moisturePct === null ||
    reading.ecDsm === null ||
    reading.ph === null
  ) {
    return;
  }

  const recordedAt = reading.recordedAt ? new Date(reading.recordedAt) : new Date();
  const [existingRows] = await pool.execute(
    `SELECT id
     FROM pro_sensor_readings
     WHERE device_id = ? AND recorded_at = ?
     LIMIT 1`,
    [deviceId, recordedAt]
  );

  if (!existingRows.length) {
    await pool.execute(
      `INSERT INTO pro_sensor_readings
        (device_id, temperature_c, moisture_pct, ec_dsm, ph, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deviceId, reading.temperatureC, reading.moisturePct, reading.ecDsm, reading.ph, recordedAt]
    );
  }

  await pool.execute(
    `UPDATE pro_sensor_devices
     SET battery_level = COALESCE(?, battery_level),
         status = COALESCE(?, status),
         last_seen_at = ?,
         last_sync_at = NOW()
     WHERE id = ?`,
    [reading.batteryLevel ?? null, reading.status || null, recordedAt, deviceId]
  );
}

async function syncExternalSensorDevices(userId) {
  const [devices] = await pool.execute(
    `SELECT id, provider, external_device_id, provider_config
     FROM pro_sensor_devices
     WHERE user_id = ?`,
    [userId]
  );

  for (const device of devices) {
    if (device.provider !== "THINGSPEAK") {
      continue;
    }

    try {
      const reading = await fetchThingSpeakLatestReading({
        ...device,
        provider_config: parseJsonConfig(device.provider_config)
      });

      if (reading) {
        await upsertSensorReading(device.id, reading);
      }
    } catch {
      await pool.execute(
        `UPDATE pro_sensor_devices
         SET last_sync_at = NOW(), status = 'warning'
         WHERE id = ?`,
        [device.id]
      );
    }
  }
}

async function refreshFarmWeather(fields) {
  for (const field of fields) {
    if (field.latitude === null || field.longitude === null) {
      continue;
    }

    const [snapshotRows] = await pool.execute(
      `SELECT id, fetched_at
       FROM pro_weather_snapshots
       WHERE farm_id = ?
       LIMIT 1`,
      [field.id]
    );

    const fetchedAt = snapshotRows[0]?.fetched_at ? new Date(snapshotRows[0].fetched_at) : null;
    const needsRefresh = !fetchedAt || Date.now() - fetchedAt.getTime() > 30 * 60 * 1000;

    if (!needsRefresh) {
      continue;
    }

    try {
      const weather = await fetchFarmWeather({
        latitude: field.latitude,
        longitude: field.longitude
      });

      await pool.execute(
        `INSERT INTO pro_weather_snapshots
          (farm_id, provider, summary_label, current_temperature_c, rain_mm, precipitation_probability_pct,
           wind_speed_kph, soil_temperature_c, soil_moisture_pct, weather_code, forecast_json, fetched_at)
         VALUES (?, 'OPEN_METEO', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           summary_label = VALUES(summary_label),
           current_temperature_c = VALUES(current_temperature_c),
           rain_mm = VALUES(rain_mm),
           precipitation_probability_pct = VALUES(precipitation_probability_pct),
           wind_speed_kph = VALUES(wind_speed_kph),
           soil_temperature_c = VALUES(soil_temperature_c),
           soil_moisture_pct = VALUES(soil_moisture_pct),
           weather_code = VALUES(weather_code),
           forecast_json = VALUES(forecast_json),
           fetched_at = VALUES(fetched_at)`,
        [
          field.id,
          weather.summaryLabel,
          weather.currentTemperatureC,
          weather.rainMm,
          weather.precipitationProbabilityPct,
          weather.windSpeedKph,
          weather.soilTemperatureC,
          weather.soilMoisturePct,
          weather.weatherCode,
          JSON.stringify(weather.forecast)
        ]
      );
    } catch {
      // Keep the previous cached weather snapshot when provider refresh fails.
    }
  }
}

async function getWeatherRows(userId) {
  const [rows] = await pool.execute(
    `SELECT
      w.farm_id,
      f.farm_name,
      w.summary_label,
      w.current_temperature_c,
      w.rain_mm,
      w.precipitation_probability_pct,
      w.wind_speed_kph,
      w.soil_temperature_c,
      w.soil_moisture_pct,
      w.weather_code,
      w.forecast_json,
      w.fetched_at
     FROM pro_weather_snapshots w
     JOIN farms f ON f.id = w.farm_id
     WHERE f.farmer_id = ?
     ORDER BY w.fetched_at DESC`,
    [userId]
  );

  return rows.map((row) => ({
    farmId: row.farm_id,
    fieldName: row.farm_name,
    summaryLabel: row.summary_label,
    currentTemperatureC: row.current_temperature_c === null ? null : round(row.current_temperature_c, 1),
    rainMm: row.rain_mm === null ? null : round(row.rain_mm, 1),
    precipitationProbabilityPct: row.precipitation_probability_pct,
    windSpeedKph: row.wind_speed_kph === null ? null : round(row.wind_speed_kph, 1),
    soilTemperatureC: row.soil_temperature_c === null ? null : round(row.soil_temperature_c, 1),
    soilMoisturePct: row.soil_moisture_pct === null ? null : round(row.soil_moisture_pct, 1),
    weatherCode: row.weather_code,
    forecast: parseJsonConfig(row.forecast_json),
    fetchedAt: row.fetched_at
  }));
}

async function getFieldRows(userId) {
  const [rows] = await pool.execute(
    `SELECT
      f.id,
      f.farm_name,
      f.county,
      f.sub_county,
      f.village,
      f.acreage,
      f.soil_type,
      f.latitude,
      f.longitude,
      pfp.crop_label,
      pfp.soil_health_index,
      pfp.organic_matter_pct,
      pfp.moisture_target_pct,
      pfp.notes
     FROM farms f
     LEFT JOIN pro_field_profiles pfp ON pfp.farm_id = f.id
     WHERE f.farmer_id = ?
     ORDER BY f.created_at ASC`,
    [userId]
  );

  return rows.map((row, index) => ({
    id: row.id,
    name: row.farm_name,
    crop: row.crop_label || cropFallbacks[index % cropFallbacks.length],
    acreage: round(row.acreage || 0, 1),
    health: Math.round(toNumber(row.soil_health_index, healthTemplate[index % healthTemplate.length])),
    soil: row.soil_type || "Loam",
    county: row.county,
    subCounty: row.sub_county,
    village: row.village,
    latitude: row.latitude,
    longitude: row.longitude,
    organicMatter: round(row.organic_matter_pct, 1),
    moistureTarget: round(row.moisture_target_pct, 1),
    notes: row.notes || ""
  }));
}

async function getSensorRows(userId) {
  const [rows] = await pool.execute(
    `SELECT
      d.id,
      d.farm_id,
      d.zone_name,
      d.sensor_type,
      d.provider,
      d.external_device_id,
      d.ingest_token,
      d.provider_config,
      d.status,
      d.battery_level,
      d.last_seen_at,
      d.last_sync_at,
      f.farm_name,
      latest.temperature_c,
      latest.moisture_pct,
      latest.ec_dsm,
      latest.ph,
      latest.recorded_at
     FROM pro_sensor_devices d
     JOIN farms f ON f.id = d.farm_id
     LEFT JOIN (
       SELECT r1.*
       FROM pro_sensor_readings r1
       JOIN (
         SELECT device_id, MAX(recorded_at) AS latest_recorded_at
         FROM pro_sensor_readings
         GROUP BY device_id
       ) latest_readings
         ON latest_readings.device_id = r1.device_id
        AND latest_readings.latest_recorded_at = r1.recorded_at
     ) latest ON latest.device_id = d.id
     WHERE d.user_id = ?
     ORDER BY d.created_at ASC`,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    farmId: row.farm_id,
    fieldName: row.farm_name,
    zoneName: row.zone_name,
    sensorType: row.sensor_type,
    provider: row.provider,
    externalDeviceId: row.external_device_id,
    ingestToken: row.ingest_token,
    providerConfig: parseJsonConfig(row.provider_config),
    status: row.status,
    batteryLevel: row.battery_level,
    lastSeenAt: row.last_seen_at,
    lastSyncAt: row.last_sync_at,
    lastSeenMinutes: minutesAgo(row.last_seen_at || row.recorded_at),
    temperature: row.temperature_c === null ? null : round(row.temperature_c, 1),
    moisture: row.moisture_pct === null ? null : round(row.moisture_pct, 1),
    ec: row.ec_dsm === null ? null : round(row.ec_dsm, 1),
    ph: row.ph === null ? null : round(row.ph, 1)
  }));
}

async function getMicrobiomeRows(userId) {
  const [rows] = await pool.execute(
    `SELECT
      s.id,
      s.farm_id,
      s.sample_label,
      s.sample_date,
      s.alpha_diversity,
      s.beta_diversity,
      s.beneficial_bacteria_pct,
      s.beneficial_fungi_pct,
      s.nitrogen_fixers_pct,
      s.decomposers_pct,
      s.pathogens_pct,
      s.functional_pathways,
      s.disease_risk,
      f.farm_name
     FROM pro_microbiome_samples s
     JOIN farms f ON f.id = s.farm_id
     WHERE s.user_id = ?
     ORDER BY s.sample_date ASC, s.id ASC`,
    [userId]
  );

  return rows;
}

async function getRecommendationRows(userId) {
  const [rows] = await pool.execute(
    `SELECT
      r.id,
      r.farm_id,
      r.title,
      r.impact,
      r.description,
      r.result_summary,
      r.savings_summary,
      r.status,
      r.created_at,
      f.farm_name
     FROM pro_recommendations r
     JOIN farms f ON f.id = r.farm_id
     WHERE r.user_id = ?
     ORDER BY FIELD(r.status, 'open', 'scheduled', 'completed'), r.created_at DESC`,
    [userId]
  );

  return rows;
}

async function getInterventionRows(userId) {
  const [rows] = await pool.execute(
    `SELECT
      i.id,
      i.farm_id,
      i.title,
      i.status,
      i.scheduled_for,
      i.completed_at,
      i.effectiveness_pct,
      i.notes,
      f.farm_name
     FROM pro_interventions i
     JOIN farms f ON f.id = i.farm_id
     WHERE i.user_id = ?
     ORDER BY COALESCE(i.completed_at, i.scheduled_for) DESC, i.id DESC`,
    [userId]
  );

  return rows;
}

async function getReportRows(userId) {
  const [rows] = await pool.execute(
    `SELECT id, title, report_type, status, generated_on, field_count, sample_count, file_size_label
     FROM pro_reports
     WHERE user_id = ?
     ORDER BY generated_on DESC, id DESC`,
    [userId]
  );

  return rows;
}

function buildDashboardPayload(fields, sensors, samples, recommendations, interventions, reports, weather) {
  const totalAcres = round(fields.reduce((sum, field) => sum + toNumber(field.acreage), 0), 1);
  const averageHealth = Math.round(average(fields.map((field) => field.health)));
  const onlineSensors = sensors.filter((sensor) => sensor.status === "online").length;
  const latestSample = samples[samples.length - 1] || null;
  const currentWeather = weather[0] || null;
  const temperatureReadings = sensors.map((sensor) => sensor.temperature).filter((value) => value !== null);
  const moistureReadings = sensors.map((sensor) => sensor.moisture).filter((value) => value !== null);
  const ecReadings = sensors.map((sensor) => sensor.ec).filter((value) => value !== null);

  const trendMap = new Map();
  samples.forEach((sample) => {
    const date = new Date(sample.sample_date);
    const key = date.toLocaleString("en-US", { month: "short" });

    if (!trendMap.has(key)) {
      trendMap.set(key, {
        month: key,
        bacteria: [],
        fungi: [],
        pathogens: [],
        diversity: []
      });
    }

    const bucket = trendMap.get(key);
    bucket.bacteria.push(sample.beneficial_bacteria_pct);
    bucket.fungi.push(sample.beneficial_fungi_pct);
    bucket.pathogens.push(sample.pathogens_pct);
    bucket.diversity.push(sample.alpha_diversity);
  });

  const microbiomeTrend = Array.from(trendMap.values())
    .slice(-7)
    .map((bucket) => ({
      month: bucket.month,
      bacteria: Math.round(average(bucket.bacteria)),
      fungi: Math.round(average(bucket.fungi)),
      pathogens: Math.round(average(bucket.pathogens)),
      diversity: round(average(bucket.diversity), 2)
    }));

  const latestByFarm = new Map();
  [...samples].reverse().forEach((sample) => {
    if (!latestByFarm.has(sample.farm_id)) {
      latestByFarm.set(sample.farm_id, sample);
    }
  });

  const fieldComparisons = Array.from(latestByFarm.values()).map((sample) => ({
    field: sample.farm_name,
    alpha: round(sample.alpha_diversity, 2),
    beta: round(sample.beta_diversity, 2)
  }));

  const treatmentMap = new Map();
  interventions.forEach((intervention) => {
    const group = intervention.title.includes("Compost")
      ? "Compost"
      : intervention.title.includes("Rotation")
        ? "Crop Rotation"
        : intervention.title.includes("Bio")
          ? "Biofertilizer"
          : intervention.title.includes("Mycorrh")
            ? "Mycorrhizal"
            : intervention.title.includes("Cover")
              ? "Cover Crops"
              : intervention.title;

    if (!treatmentMap.has(group)) {
      treatmentMap.set(group, []);
    }

    if (intervention.effectiveness_pct !== null) {
      treatmentMap.get(group).push(intervention.effectiveness_pct);
    }
  });

  const treatmentEffectiveness = Array.from(treatmentMap.entries()).map(([label, values]) => ({
    label,
    value: Math.round(average(values))
  }));

  const interventionTrend = [...interventions]
    .filter((item) => item.effectiveness_pct !== null)
    .reverse()
    .slice(-6)
    .map((item, index) => ({
      week: `Week ${index + 1}`,
      value: item.effectiveness_pct
    }));

  const projectedImpact = fields.slice(0, 4).map((field, index) => ({
    field: field.name,
    yieldIncrease: [18, 22, 15, 19][index] || 16,
    costSavings: [45, 38, 52, 41][index] || 34,
    healthImprovement: [12, 15, 20, 14][index] || 10
  }));

  return {
    summary: {
      fieldCount: fields.length,
      avgHealth: averageHealth,
      totalAcres,
      sampleCount: samples.length,
      reportCount: reports.length
    },
    fields,
    weather: {
      current: currentWeather,
      forecast: currentWeather?.forecast || [],
      availableFields: weather
    },
    sensors,
    sensorSummary: [
      {
        label: "Avg Temperature",
        value: temperatureReadings.length ? `${round(average(temperatureReadings), 1)}°C` : "--",
        detail: temperatureReadings.length ? "Across all sensors" : "Waiting for live readings"
      },
      {
        label: "Avg Moisture",
        value: moistureReadings.length ? `${round(average(moistureReadings), 1)}%` : "--",
        detail: moistureReadings.length ? "Soil moisture content" : "Waiting for live readings"
      },
      {
        label: "Avg EC",
        value: ecReadings.length ? `${round(average(ecReadings), 1)} dS/m` : "--",
        detail: ecReadings.length ? "Electrical conductivity" : "Waiting for live readings"
      },
      {
        label: "Active Sensors",
        value: `${onlineSensors}/${sensors.length}`,
        detail: "Currently online"
      }
    ],
    microbiome: {
      summary: {
        avgAlphaDiversity: round(average(samples.map((sample) => sample.alpha_diversity)), 2),
        functionalPathways: Math.round(average(samples.map((sample) => sample.functional_pathways))),
        beneficialRatio: Math.round(
          average(
            samples.map(
              (sample) => toNumber(sample.beneficial_bacteria_pct) + toNumber(sample.beneficial_fungi_pct)
            )
          )
        ),
        diseaseRisk: latestSample?.disease_risk || "Low"
      },
      composition: latestSample
        ? [
            { label: "Beneficial Bacteria", value: latestSample.beneficial_bacteria_pct, tone: "bg-emerald-700" },
            { label: "Beneficial Fungi", value: latestSample.beneficial_fungi_pct, tone: "bg-lime-400" },
            { label: "Nitrogen Fixers", value: latestSample.nitrogen_fixers_pct, tone: "bg-amber-400" },
            { label: "Decomposers", value: latestSample.decomposers_pct, tone: "bg-sky-400" },
            { label: "Pathogens", value: latestSample.pathogens_pct, tone: "bg-rose-500" }
          ]
        : [],
      trend: microbiomeTrend,
      fieldComparisons,
      latestSample: latestSample
        ? {
            label: latestSample.sample_label,
            farmName: latestSample.farm_name,
            sampleDate: latestSample.sample_date
          }
        : null
    },
    recommendations: recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      impact: item.impact,
      description: item.description,
      result: item.result_summary,
      savings: item.savings_summary,
      field: item.farm_name,
      status: item.status
    })),
    projectedImpact,
    treatmentEffectiveness,
    interventions: {
      list: interventions.map((item) => ({
        id: item.id,
        title: item.title,
        field: item.farm_name,
        date: item.completed_at || item.scheduled_for,
        effectiveness: item.effectiveness_pct,
        status: item.status,
        notes: item.notes
      })),
      trend: interventionTrend
    },
    reports: reports.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.report_type,
      date: item.generated_on,
      fields: item.field_count,
      samples: item.sample_count,
      status: item.status,
      size: item.file_size_label
    }))
  };
}

async function getPreparedProFarmerData(userId) {
  await ensureProFarmerData(userId);
  await syncExternalSensorDevices(userId);

  const fields = await getFieldRows(userId);
  await refreshFarmWeather(fields);

  const [sensors, samples, recommendations, interventions, reports, weather] = await Promise.all([
    getSensorRows(userId),
    getMicrobiomeRows(userId),
    getRecommendationRows(userId),
    getInterventionRows(userId),
    getReportRows(userId),
    getWeatherRows(userId)
  ]);

  return buildDashboardPayload(fields, sensors, samples, recommendations, interventions, reports, weather);
}

function sendCsv(res, filename, rows) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buildCsv(rows));
}

export async function getProFarmerDashboard(req, res) {
  const dashboard = await getPreparedProFarmerData(req.user.id);
  res.json(dashboard);
}

export async function updateSensorDevice(req, res) {
  const sensorId = Number(req.params.id);
  const {
    provider,
    zoneName,
    externalDeviceId,
    channelId,
    readApiKey,
    temperatureField,
    moistureField,
    ecField,
    phField,
    batteryField
  } = req.body;

  const [rows] = await pool.execute(
    `SELECT id, provider, ingest_token
     FROM pro_sensor_devices
     WHERE id = ? AND user_id = ?`,
    [sensorId, req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Sensor device not found." });
  }

  const nextProvider = provider === "THINGSPEAK" ? "THINGSPEAK" : "AGRINOVA_DIRECT";
  const providerConfig =
    nextProvider === "THINGSPEAK"
      ? {
          channelId: channelId || externalDeviceId || null,
          readApiKey: readApiKey || null,
          fieldMap: {
            temperature: temperatureField || "field1",
            moisture: moistureField || "field2",
            ec: ecField || "field3",
            ph: phField || "field4",
            battery: batteryField || "field5"
          }
        }
      : null;

  await pool.execute(
    `UPDATE pro_sensor_devices
     SET provider = ?,
         zone_name = COALESCE(?, zone_name),
         external_device_id = ?,
         provider_config = ?,
         ingest_token = CASE
           WHEN ? = 'AGRINOVA_DIRECT' AND ingest_token IS NULL THEN ?
           ELSE ingest_token
         END
     WHERE id = ?`,
    [
      nextProvider,
      zoneName || null,
      externalDeviceId || channelId || null,
      providerConfig ? JSON.stringify(providerConfig) : null,
      nextProvider,
      generateIngestToken(),
      sensorId
    ]
  );

  const [updatedRows] = await pool.execute(
    `SELECT id, provider, zone_name, external_device_id, ingest_token, provider_config
     FROM pro_sensor_devices
     WHERE id = ?`,
    [sensorId]
  );

  res.json({
    sensor: {
      ...updatedRows[0],
      provider_config: parseJsonConfig(updatedRows[0].provider_config)
    }
  });
}

export async function ingestSensorReading(req, res) {
  const token = req.headers["x-sensor-token"] || req.body.token;
  const { temperatureC, moisturePct, ecDsm, ph, batteryLevel, status, recordedAt } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Sensor token is required." });
  }

  const [rows] = await pool.execute(
    `SELECT id
     FROM pro_sensor_devices
     WHERE ingest_token = ?
     LIMIT 1`,
    [token]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Sensor device not found for token." });
  }

  await upsertSensorReading(rows[0].id, {
    temperatureC: toNumber(temperatureC, null),
    moisturePct: toNumber(moisturePct, null),
    ecDsm: toNumber(ecDsm, null),
    ph: toNumber(ph, null),
    batteryLevel: batteryLevel === undefined ? null : toNumber(batteryLevel, null),
    status: status || "online",
    recordedAt: recordedAt || new Date()
  });

  res.status(201).json({ received: true });
}

export async function scheduleRecommendation(req, res) {
  const recommendationId = Number(req.params.id);

  const [rows] = await pool.execute(
    `SELECT id, user_id, farm_id, title
     FROM pro_recommendations
     WHERE id = ? AND user_id = ?`,
    [recommendationId, req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Recommendation not found." });
  }

  const recommendation = rows[0];
  const scheduledFor = formatDateKey(new Date());

  await pool.execute(
    `INSERT INTO pro_interventions
      (user_id, farm_id, title, status, scheduled_for, completed_at, effectiveness_pct, notes)
     VALUES (?, ?, ?, 'Scheduled', ?, NULL, NULL, ?)`,
    [
      req.user.id,
      recommendation.farm_id,
      recommendation.title,
      scheduledFor,
      "Created from Pro Farmer recommendation."
    ]
  );

  await pool.execute(
    `UPDATE pro_recommendations
     SET status = 'scheduled'
     WHERE id = ?`,
    [recommendation.id]
  );

  res.status(201).json({
    message: "Intervention scheduled successfully.",
    scheduledFor
  });
}

export async function exportFieldData(req, res) {
  const dashboard = await getPreparedProFarmerData(req.user.id);
  const rows = [
    ["Field", "Crop", "County", "Acreage", "Soil Type", "Soil Health", "Organic Matter %", "Moisture Target %"]
  ];

  dashboard.fields.forEach((field) => {
    rows.push([
      field.name,
      field.crop,
      field.county,
      field.acreage,
      field.soil,
      field.health,
      field.organicMatter,
      field.moistureTarget
    ]);
  });

  sendCsv(res, "pro-farmer-fields.csv", rows);
}

export async function exportSampleData(req, res) {
  const samples = await getMicrobiomeRows(req.user.id);
  const rows = [
    [
      "Field",
      "Sample",
      "Sample Date",
      "Alpha Diversity",
      "Beta Diversity",
      "Beneficial Bacteria %",
      "Beneficial Fungi %",
      "Nitrogen Fixers %",
      "Decomposers %",
      "Pathogens %",
      "Functional Pathways",
      "Disease Risk"
    ]
  ];

  samples.forEach((sample) => {
    rows.push([
      sample.farm_name,
      sample.sample_label,
      sample.sample_date,
      sample.alpha_diversity,
      sample.beta_diversity,
      sample.beneficial_bacteria_pct,
      sample.beneficial_fungi_pct,
      sample.nitrogen_fixers_pct,
      sample.decomposers_pct,
      sample.pathogens_pct,
      sample.functional_pathways,
      sample.disease_risk
    ]);
  });

  sendCsv(res, "pro-farmer-samples.csv", rows);
}

export async function exportSummaryReport(req, res) {
  const dashboard = await getPreparedProFarmerData(req.user.id);
  const rows = [
    ["Metric", "Value"],
    ["Total Fields", dashboard.summary.fieldCount],
    ["Average Soil Health", dashboard.summary.avgHealth],
    ["Total Acres", dashboard.summary.totalAcres],
    ["Total Samples", dashboard.summary.sampleCount],
    ["Reports Generated", dashboard.summary.reportCount],
    ["Active Sensors", dashboard.sensorSummary.find((item) => item.label === "Active Sensors")?.value || "0/0"]
  ];

  sendCsv(res, "pro-farmer-summary-report.csv", rows);
}

export async function downloadReport(req, res) {
  const reportId = Number(req.params.id);
  const [rows] = await pool.execute(
    `SELECT id, title, report_type, status, generated_on, field_count, sample_count, file_size_label
     FROM pro_reports
     WHERE id = ? AND user_id = ?`,
    [reportId, req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Report not found." });
  }

  const report = rows[0];

  if (report.status !== "ready") {
    return res.status(409).json({ message: "This report is still generating." });
  }

  const dashboard = await getPreparedProFarmerData(req.user.id);
  const rowsToExport = [
    ["Report", report.title],
    ["Type", report.report_type],
    ["Generated On", formatDate(report.generated_on)],
    ["Fields", report.field_count],
    ["Samples", report.sample_count],
    [""],
    ["Field", "Soil Health", "Acreage", "Crop"]
  ];

  dashboard.fields.forEach((field) => {
    rowsToExport.push([field.name, field.health, field.acreage, field.crop]);
  });

  sendCsv(res, `${slugify(report.title)}.csv`, rowsToExport);
}

export async function printReport(req, res) {
  const dashboard = await getPreparedProFarmerData(req.user.id);
  const printableHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Pro Farmer Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
      h1, h2 { margin-bottom: 8px; }
      .muted { color: #475569; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 24px 0; }
      .card { border: 1px solid #d9e3cf; border-radius: 16px; padding: 16px; background: #fbfdf8; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; }
      th { color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
    </style>
  </head>
  <body>
    <h1>Pro Farmer Report</h1>
    <p class="muted">Generated ${escapeHtml(formatDate(new Date()))}</p>
    <div class="grid">
      <div class="card"><strong>Total Fields</strong><div>${escapeHtml(dashboard.summary.fieldCount)}</div></div>
      <div class="card"><strong>Average Soil Health</strong><div>${escapeHtml(dashboard.summary.avgHealth)}</div></div>
      <div class="card"><strong>Total Samples</strong><div>${escapeHtml(dashboard.summary.sampleCount)}</div></div>
    </div>
    <h2>Fields</h2>
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Crop</th>
          <th>Acreage</th>
          <th>Health</th>
        </tr>
      </thead>
      <tbody>
        ${dashboard.fields
          .map(
            (field) => `<tr>
              <td>${escapeHtml(field.name)}</td>
              <td>${escapeHtml(field.crop)}</td>
              <td>${escapeHtml(field.acreage)}</td>
              <td>${escapeHtml(field.health)}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
    <h2>Top Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th>Recommendation</th>
          <th>Impact</th>
          <th>Field</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${dashboard.recommendations
          .map(
            (item) => `<tr>
              <td>${escapeHtml(item.title)}</td>
              <td>${escapeHtml(item.impact)}</td>
              <td>${escapeHtml(item.field)}</td>
              <td>${escapeHtml(item.status)}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(printableHtml);
}
