import { pool } from "../config/db.js";

export async function createFarm(req, res) {
  const {
    farmName,
    county,
    subCounty,
    village,
    acreage,
    soilType,
    latitude,
    longitude
  } = req.body;

  const farmerId = req.user?.role === "ADMIN" ? req.body.farmerId : req.user?.id;

  if (!farmerId || !farmName || !county) {
    return res.status(400).json({
      message: "farmerId, farmName, and county are required."
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO farms
      (farmer_id, farm_name, county, sub_county, village, acreage, soil_type, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      farmerId,
      farmName,
      county,
      subCounty || null,
      village || null,
      acreage || null,
      soilType || null,
      latitude || null,
      longitude || null
    ]
  );

  const [rows] = await pool.execute("SELECT * FROM farms WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function listFarms(req, res) {
  const { farmerId } = req.query;
  let sql = "SELECT * FROM farms";
  const params = [];

  if (farmerId) {
    sql += " WHERE farmer_id = ?";
    params.push(farmerId);
  }

  sql += " ORDER BY created_at DESC";

  const [rows] = await pool.execute(sql, params);
  res.json(rows);
}
