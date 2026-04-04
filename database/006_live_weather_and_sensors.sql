USE smart_agriculture;

ALTER TABLE pro_sensor_devices
  ADD COLUMN provider ENUM('AGRINOVA_DIRECT', 'THINGSPEAK') NOT NULL DEFAULT 'AGRINOVA_DIRECT' AFTER sensor_type,
  ADD COLUMN external_device_id VARCHAR(120) NULL AFTER provider,
  ADD COLUMN ingest_token VARCHAR(120) NULL AFTER external_device_id,
  ADD COLUMN provider_config JSON NULL AFTER ingest_token,
  ADD COLUMN last_sync_at TIMESTAMP NULL AFTER last_seen_at;

CREATE TABLE IF NOT EXISTS pro_weather_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  farm_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(60) NOT NULL DEFAULT 'OPEN_METEO',
  summary_label VARCHAR(160) NULL,
  current_temperature_c DECIMAL(5,2) NULL,
  rain_mm DECIMAL(6,2) NULL,
  precipitation_probability_pct INT NULL,
  wind_speed_kph DECIMAL(6,2) NULL,
  soil_temperature_c DECIMAL(5,2) NULL,
  soil_moisture_pct DECIMAL(5,2) NULL,
  weather_code INT NULL,
  forecast_json JSON NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pro_weather_snapshots_farm (farm_id),
  CONSTRAINT fk_pro_weather_snapshots_farm
    FOREIGN KEY (farm_id) REFERENCES farms (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
