USE smart_agriculture;

CREATE TABLE IF NOT EXISTS membership_plans (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  audience ENUM('FARMER', 'BUYER', 'ALL') NOT NULL DEFAULT 'ALL',
  billing_period ENUM('MONTHLY', 'YEARLY', 'ONETIME') NOT NULL DEFAULT 'MONTHLY',
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) NOT NULL DEFAULT 'KES',
  description TEXT NULL,
  features JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_membership_plans_code (code),
  KEY idx_membership_plans_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  started_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_memberships_user (user_id, status),
  KEY idx_memberships_plan (plan_id),
  CONSTRAINT fk_memberships_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_memberships_plan
    FOREIGN KEY (plan_id) REFERENCES membership_plans (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS membership_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  membership_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('PAYSTACK', 'MPESA', 'MANUAL') NOT NULL,
  provider_reference VARCHAR(120) NULL,
  access_code VARCHAR(120) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KES',
  status ENUM('INITIALIZED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'INITIALIZED',
  paid_at TIMESTAMP NULL,
  metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_membership_payments_reference (provider_reference),
  KEY idx_membership_payments_membership (membership_id),
  CONSTRAINT fk_membership_payments_membership
    FOREIGN KEY (membership_id) REFERENCES memberships (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO membership_plans (code, name, audience, billing_period, price, currency, description, features, sort_order)
VALUES
  (
    'LITE_FARMER',
    'Lite Farmer',
    'FARMER',
    'MONTHLY',
    0.00,
    'KES',
    'Starter access for farmers entering the marketplace.',
    JSON_ARRAY('List produce', 'Basic field records', 'Buyer discovery', 'Basic profile'),
    1
  ),
  (
    'PRO_FARMER',
    'Pro Farmer',
    'FARMER',
    'MONTHLY',
    1500.00,
    'KES',
    'Premium farmer toolkit with weather intelligence and advisory support.',
    JSON_ARRAY('Specialist advice', 'Weather updates', 'Scouting notes', 'Farm reports', 'Expenses and income'),
    2
  )
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  audience = VALUES(audience),
  billing_period = VALUES(billing_period),
  price = VALUES(price),
  currency = VALUES(currency),
  description = VALUES(description),
  features = VALUES(features),
  sort_order = VALUES(sort_order);
