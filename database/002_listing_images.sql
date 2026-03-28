USE smart_agriculture;

CREATE TABLE IF NOT EXISTS listing_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_listing_images_listing (listing_id),
  CONSTRAINT fk_listing_images_listing
    FOREIGN KEY (listing_id) REFERENCES listings (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
