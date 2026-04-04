USE smart_agriculture;

CREATE TABLE IF NOT EXISTS pro_field_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  farm_id BIGINT UNSIGNED NOT NULL,
  crop_label VARCHAR(120) NULL,
  soil_health_index DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  organic_matter_pct DECIMAL(5,2) NOT NULL DEFAULT 3.20,
  moisture_target_pct DECIMAL(5,2) NOT NULL DEFAULT 24.00,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pro_field_profiles_farm (farm_id),
  CONSTRAINT fk_pro_field_profiles_farm
    FOREIGN KEY (farm_id) REFERENCES farms (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_sensor_devices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  farm_id BIGINT UNSIGNED NOT NULL,
  zone_name VARCHAR(120) NOT NULL,
  sensor_type VARCHAR(80) NOT NULL DEFAULT 'Multi-Sensor',
  status ENUM('online', 'offline', 'warning') NOT NULL DEFAULT 'online',
  battery_level INT NOT NULL DEFAULT 80,
  last_seen_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pro_sensor_devices_user (user_id),
  KEY idx_pro_sensor_devices_farm (farm_id),
  CONSTRAINT fk_pro_sensor_devices_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pro_sensor_devices_farm
    FOREIGN KEY (farm_id) REFERENCES farms (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_sensor_readings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_id BIGINT UNSIGNED NOT NULL,
  temperature_c DECIMAL(5,2) NOT NULL,
  moisture_pct DECIMAL(5,2) NOT NULL,
  ec_dsm DECIMAL(5,2) NOT NULL,
  ph DECIMAL(4,2) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pro_sensor_readings_device (device_id, recorded_at),
  CONSTRAINT fk_pro_sensor_readings_device
    FOREIGN KEY (device_id) REFERENCES pro_sensor_devices (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_microbiome_samples (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  farm_id BIGINT UNSIGNED NOT NULL,
  sample_label VARCHAR(120) NOT NULL,
  sample_date DATE NOT NULL,
  alpha_diversity DECIMAL(4,2) NOT NULL,
  beta_diversity DECIMAL(4,2) NOT NULL,
  beneficial_bacteria_pct INT NOT NULL,
  beneficial_fungi_pct INT NOT NULL,
  nitrogen_fixers_pct INT NOT NULL,
  decomposers_pct INT NOT NULL,
  pathogens_pct INT NOT NULL,
  functional_pathways INT NOT NULL DEFAULT 24,
  disease_risk ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pro_microbiome_user (user_id, sample_date),
  KEY idx_pro_microbiome_farm (farm_id),
  CONSTRAINT fk_pro_microbiome_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pro_microbiome_farm
    FOREIGN KEY (farm_id) REFERENCES farms (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_recommendations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  farm_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  impact ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  result_summary VARCHAR(255) NULL,
  savings_summary VARCHAR(120) NULL,
  status ENUM('open', 'scheduled', 'completed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pro_recommendations_user (user_id, status),
  CONSTRAINT fk_pro_recommendations_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pro_recommendations_farm
    FOREIGN KEY (farm_id) REFERENCES farms (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_interventions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  farm_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  status ENUM('Scheduled', 'In Progress', 'Completed') NOT NULL DEFAULT 'Scheduled',
  scheduled_for DATE NOT NULL,
  completed_at DATE NULL,
  effectiveness_pct INT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pro_interventions_user (user_id, scheduled_for),
  CONSTRAINT fk_pro_interventions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_pro_interventions_farm
    FOREIGN KEY (farm_id) REFERENCES farms (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pro_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  report_type VARCHAR(80) NOT NULL,
  status ENUM('ready', 'generating') NOT NULL DEFAULT 'ready',
  generated_on DATE NOT NULL,
  field_count INT NOT NULL DEFAULT 0,
  sample_count INT NOT NULL DEFAULT 0,
  file_size_label VARCHAR(40) NOT NULL DEFAULT '1.0 MB',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pro_reports_user (user_id, generated_on),
  CONSTRAINT fk_pro_reports_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
