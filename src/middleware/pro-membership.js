import { pool } from "../config/db.js";

export async function requireProFarmer(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (req.user.role === "ADMIN") {
    req.proMembership = {
      code: "PRO_FARMER",
      status: "ACTIVE"
    };

    return next();
  }

  const [rows] = await pool.execute(
    `SELECT
      m.id,
      m.user_id,
      m.status,
      m.started_at,
      m.expires_at,
      mp.code,
      mp.name
     FROM memberships m
     JOIN membership_plans mp ON mp.id = m.plan_id
     WHERE m.user_id = ? AND m.status = 'ACTIVE' AND mp.code = 'PRO_FARMER'
     ORDER BY m.updated_at DESC
     LIMIT 1`,
    [req.user.id]
  );

  if (!rows.length) {
    return res.status(403).json({
      message: "An active Pro Farmer membership is required for this feature."
    });
  }

  req.proMembership = rows[0];
  next();
}
