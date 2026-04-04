USE smart_agriculture;

INSERT INTO users (full_name, phone, email, password_hash, role, county, sub_county, is_active)
VALUES (
  'AgriNova Admin',
  '0700000000',
  'admin@agrinova.app',
  '$2b$12$mM8TD01NioXMT3DqQD6m/ufpeZGaAjU5rh2HcgKuTjdHJsLPI7Tne',
  'ADMIN',
  'Nairobi',
  'Westlands',
  1
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  is_active = VALUES(is_active);
