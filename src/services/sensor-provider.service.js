import { env } from "../config/env.js";

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

function mapThingSpeakField(feed, fieldKey) {
  if (!fieldKey) {
    return null;
  }

  const value = feed[fieldKey];
  return value === undefined || value === null || value === "" ? null : Number(value);
}

export async function fetchThingSpeakLatestReading(device) {
  const config = parseJsonConfig(device.provider_config);
  const channelId = config.channelId || device.external_device_id;

  if (!channelId) {
    return null;
  }

  const fieldMap = {
    temperature: config.fieldMap?.temperature || "field1",
    moisture: config.fieldMap?.moisture || "field2",
    ec: config.fieldMap?.ec || "field3",
    ph: config.fieldMap?.ph || "field4",
    battery: config.fieldMap?.battery || "field5"
  };

  const url = new URL(`${env.thingspeakBaseUrl}/channels/${channelId}/feeds.json`);
  url.searchParams.set("results", "1");

  if (config.readApiKey) {
    url.searchParams.set("api_key", config.readApiKey);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`ThingSpeak request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const feed = payload.feeds?.[0];

  if (!feed) {
    return null;
  }

  return {
    recordedAt: feed.created_at,
    temperatureC: mapThingSpeakField(feed, fieldMap.temperature),
    moisturePct: mapThingSpeakField(feed, fieldMap.moisture),
    ecDsm: mapThingSpeakField(feed, fieldMap.ec),
    ph: mapThingSpeakField(feed, fieldMap.ph),
    batteryLevel: mapThingSpeakField(feed, fieldMap.battery),
    status: "online"
  };
}
