CREATE DATABASE IF NOT EXISTS smart_agriculture;
USE smart_agriculture;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(160) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('FARMER', 'BUYER', 'EXPERT', 'TRANSPORTER', 'ADMIN') NOT NULL,
  county VARCHAR(80) NULL,
  sub_county VARCHAR(80) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS farms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  farmer_id BIGINT UNSIGNED NOT NULL,
  farm_name VARCHAR(120) NOT NULL,
  county VARCHAR(80) NOT NULL,
  sub_county VARCHAR(80) NULL,
  village VARCHAR(120) NULL,
  acreage DECIMAL(10,2) NULL,
  soil_type VARCHAR(80) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_farms_farmer (farmer_id),
  CONSTRAINT fk_farms_farmer
    FOREIGN KEY (farmer_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  unit_of_measure VARCHAR(30) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_name (name),
  KEY idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  farmer_id BIGINT UNSIGNED NOT NULL,
  farm_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  quantity_available DECIMAL(12,2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  price_per_unit DECIMAL(12,2) NOT NULL,
  minimum_order_quantity DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  quality_grade VARCHAR(30) NULL,
  harvest_date DATE NULL,
  available_from DATE NULL,
  available_until DATE NULL,
  status ENUM('DRAFT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_listings_farmer (farmer_id),
  KEY idx_listings_product (product_id),
  KEY idx_listings_status (status),
  CONSTRAINT fk_listings_farmer
    FOREIGN KEY (farmer_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_listings_farm
    FOREIGN KEY (farm_id) REFERENCES farms (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_listings_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit VARCHAR(30) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'KES',
  delivery_address VARCHAR(255) NULL,
  delivery_notes TEXT NULL,
  status ENUM('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_listing (listing_id),
  KEY idx_orders_buyer (buyer_id),
  KEY idx_orders_seller (seller_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_listing
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_buyer
    FOREIGN KEY (buyer_id) REFERENCES users (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_seller
    FOREIGN KEY (seller_id) REFERENCES users (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
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
  UNIQUE KEY uq_payments_provider_reference (provider_reference),
  KEY idx_payments_order (order_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  transporter_id BIGINT UNSIGNED NULL,
  transporter_name VARCHAR(120) NULL,
  transporter_phone VARCHAR(20) NULL,
  vehicle_registration VARCHAR(40) NULL,
  pickup_location VARCHAR(255) NULL,
  dropoff_location VARCHAR(255) NULL,
  status ENUM('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'PENDING',
  dispatched_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_deliveries_order (order_id),
  KEY idx_deliveries_status (status),
  CONSTRAINT fk_deliveries_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_deliveries_transporter
    FOREIGN KEY (transporter_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO products (name, category, unit_of_measure, description)
VALUES
  ('Maize', 'Cereal', 'kg', 'Dry maize grains for wholesale and retail buyers'),
  ('Tomatoes', 'Vegetable', 'crate', 'Fresh tomatoes for market and hospitality buyers'),
  ('Onions', 'Vegetable', 'bag', 'Red or white onions for local and export buyers')
ON DUPLICATE KEY UPDATE
  category = VALUES(category),
  unit_of_measure = VALUES(unit_of_measure),
  description = VALUES(description);
