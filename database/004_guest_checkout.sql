USE smart_agriculture;

ALTER TABLE orders
  ADD COLUMN guest_full_name VARCHAR(120) NULL AFTER buyer_id,
  ADD COLUMN guest_phone VARCHAR(20) NULL AFTER guest_full_name,
  ADD COLUMN guest_email VARCHAR(160) NULL AFTER guest_phone,
  ADD COLUMN guest_checkout_token VARCHAR(120) NULL AFTER guest_email;

ALTER TABLE orders
  ADD UNIQUE KEY uq_orders_guest_checkout_token (guest_checkout_token);

DELETE mp
FROM membership_payments mp
JOIN memberships m ON m.id = mp.membership_id
JOIN membership_plans p ON p.id = m.plan_id
WHERE p.code = 'BUYER_PLUS';

DELETE m
FROM memberships m
JOIN membership_plans p ON p.id = m.plan_id
WHERE p.code = 'BUYER_PLUS';

DELETE FROM membership_plans
WHERE code = 'BUYER_PLUS';
