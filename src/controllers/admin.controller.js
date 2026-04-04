import { pool } from "../config/db.js";

export async function getAdminOverview(req, res) {
  const [
    [userCountRows],
    [roleRows],
    [farmRows],
    [listingRows],
    [orderRows],
    [paymentRows],
    [proMemberRows],
    [sensorRows],
    [weatherRows]
  ] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total, SUM(is_active = 1) AS active_total FROM users"),
    pool.execute(
      `SELECT role, COUNT(*) AS total
       FROM users
       GROUP BY role`
    ),
    pool.execute("SELECT COUNT(*) AS total FROM farms"),
    pool.execute("SELECT COUNT(*) AS total, SUM(status = 'ACTIVE') AS active_total FROM listings"),
    pool.execute(
      `SELECT COUNT(*) AS total,
              SUM(status IN ('PAID', 'PROCESSING', 'IN_TRANSIT', 'DELIVERED')) AS paid_total
       FROM orders`
    ),
    pool.execute(
      `SELECT COALESCE(SUM(amount), 0) AS gross_revenue
       FROM payments
       WHERE status = 'SUCCESS'`
    ),
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM memberships m
       JOIN membership_plans mp ON mp.id = m.plan_id
       WHERE m.status = 'ACTIVE' AND mp.code = 'PRO_FARMER'`
    ),
    pool.execute(
      `SELECT
        d.id,
        d.provider,
        d.status,
        d.battery_level,
        d.last_seen_at,
        f.farm_name,
        u.full_name
       FROM pro_sensor_devices d
       JOIN farms f ON f.id = d.farm_id
       JOIN users u ON u.id = d.user_id
       ORDER BY COALESCE(d.last_seen_at, d.updated_at) DESC
       LIMIT 6`
    ),
    pool.execute(
      `SELECT
        w.summary_label,
        w.current_temperature_c,
        w.precipitation_probability_pct,
        w.fetched_at,
        f.farm_name,
        u.full_name
       FROM pro_weather_snapshots w
       JOIN farms f ON f.id = w.farm_id
       JOIN users u ON u.id = f.farmer_id
       ORDER BY w.fetched_at DESC
       LIMIT 6`
    )
  ]);

  const [mappedFieldRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM farms
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
  );

  res.json({
    stats: {
      totalUsers: Number(userCountRows[0]?.total || 0),
      activeUsers: Number(userCountRows[0]?.active_total || 0),
      farms: Number(farmRows[0]?.total || 0),
      listings: Number(listingRows[0]?.total || 0),
      activeListings: Number(listingRows[0]?.active_total || 0),
      orders: Number(orderRows[0]?.total || 0),
      paidOrders: Number(orderRows[0]?.paid_total || 0),
      grossRevenue: Number(paymentRows[0]?.gross_revenue || 0),
      proFarmers: Number(proMemberRows[0]?.total || 0),
      mappedFields: Number(mappedFieldRows[0]?.total || 0)
    },
    usersByRole: roleRows.map((row) => ({
      role: row.role,
      total: Number(row.total || 0)
    })),
    premiumOverview: {
      onlineSensors: sensorRows.filter((row) => row.status === "online").length,
      totalSensors: sensorRows.length,
      recentSensors: sensorRows.map((row) => ({
        id: row.id,
        provider: row.provider,
        status: row.status,
        batteryLevel: row.battery_level,
        lastSeenAt: row.last_seen_at,
        farmName: row.farm_name,
        farmerName: row.full_name
      })),
      recentWeather: weatherRows.map((row) => ({
        summaryLabel: row.summary_label,
        currentTemperatureC: row.current_temperature_c,
        precipitationProbabilityPct: row.precipitation_probability_pct,
        fetchedAt: row.fetched_at,
        farmName: row.farm_name,
        farmerName: row.full_name
      }))
    }
  });
}

export async function listUsersForAdmin(req, res) {
  const { role, status = "ALL", q = "" } = req.query;
  let sql = `
    SELECT
      u.id,
      u.full_name,
      u.phone,
      u.email,
      u.role,
      u.county,
      u.sub_county,
      u.is_active,
      u.created_at,
      COUNT(DISTINCT f.id) AS farms_count,
      COUNT(DISTINCT l.id) AS listings_count,
      MAX(CASE WHEN m.status = 'ACTIVE' THEN mp.name ELSE NULL END) AS active_membership_name,
      MAX(CASE WHEN m.status = 'ACTIVE' THEN mp.code ELSE NULL END) AS active_membership_code
    FROM users u
    LEFT JOIN farms f ON f.farmer_id = u.id
    LEFT JOIN listings l ON l.farmer_id = u.id
    LEFT JOIN memberships m ON m.user_id = u.id
    LEFT JOIN membership_plans mp ON mp.id = m.plan_id
    WHERE 1 = 1
  `;
  const params = [];

  if (role) {
    sql += " AND u.role = ?";
    params.push(role);
  }

  if (status !== "ALL") {
    sql += " AND u.is_active = ?";
    params.push(status === "ACTIVE" ? 1 : 0);
  }

  if (q) {
    sql += " AND (u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  sql += `
    GROUP BY
      u.id, u.full_name, u.phone, u.email, u.role, u.county, u.sub_county, u.is_active, u.created_at
    ORDER BY u.created_at DESC
  `;

  const [rows] = await pool.execute(sql, params);
  res.json(
    rows.map((row) => ({
      ...row,
      farms_count: Number(row.farms_count || 0),
      listings_count: Number(row.listings_count || 0)
    }))
  );
}

export async function updateUserForAdmin(req, res) {
  const userId = Number(req.params.id);
  const { role, isActive } = req.body;

  const [rows] = await pool.execute(
    `SELECT id, role, is_active
     FROM users
     WHERE id = ?`,
    [userId]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "User not found." });
  }

  await pool.execute(
    `UPDATE users
     SET role = COALESCE(?, role),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [role || null, typeof isActive === "boolean" ? Number(isActive) : null, userId]
  );

  const [updatedRows] = await pool.execute(
    `SELECT id, full_name, phone, email, role, county, sub_county, is_active, created_at
     FROM users
     WHERE id = ?`,
    [userId]
  );

  res.json(updatedRows[0]);
}
