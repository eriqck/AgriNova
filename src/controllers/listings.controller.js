import { pool } from "../config/db.js";

export async function createListing(req, res) {
  const {
    farmId,
    productId,
    title,
    description,
    quantityAvailable,
    unit,
    pricePerUnit,
    minimumOrderQuantity,
    qualityGrade,
    harvestDate,
    availableFrom,
    availableUntil,
    status
  } = req.body;

  const farmerId = req.user?.role === "ADMIN" ? req.body.farmerId : req.user?.id;

  if (!farmerId || !farmId || !productId || !title || !quantityAvailable || !unit || !pricePerUnit) {
    return res.status(400).json({
      message: "farmerId, farmId, productId, title, quantityAvailable, unit, and pricePerUnit are required."
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO listings
      (farmer_id, farm_id, product_id, title, description, quantity_available, unit, price_per_unit,
       minimum_order_quantity, quality_grade, harvest_date, available_from, available_until, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      farmerId,
      farmId,
      productId,
      title,
      description || null,
      quantityAvailable,
      unit,
      pricePerUnit,
      minimumOrderQuantity || 1,
      qualityGrade || null,
      harvestDate || null,
      availableFrom || null,
      availableUntil || null,
      status || "ACTIVE"
    ]
  );

  const [rows] = await pool.execute(
    `SELECT l.*, p.name AS product_name
     FROM listings l
     JOIN products p ON p.id = l.product_id
     WHERE l.id = ?`,
    [result.insertId]
  );

  res.status(201).json(rows[0]);
}

export async function listListings(req, res) {
  const { productId, county, status = "ACTIVE" } = req.query;
  let sql = `
    SELECT
      l.*,
      p.name AS product_name,
      f.farm_name,
      f.county,
      u.full_name AS farmer_name,
      u.phone AS farmer_phone
    FROM listings l
    JOIN products p ON p.id = l.product_id
    JOIN farms f ON f.id = l.farm_id
    JOIN users u ON u.id = l.farmer_id
    WHERE 1 = 1
  `;
  const params = [];

  if (status) {
    sql += " AND l.status = ?";
    params.push(status);
  }

  if (productId) {
    sql += " AND l.product_id = ?";
    params.push(productId);
  }

  if (county) {
    sql += " AND f.county = ?";
    params.push(county);
  }

  sql += " ORDER BY l.created_at DESC";

  const [rows] = await pool.execute(sql, params);
  res.json(rows);
}

export async function getListingById(req, res) {
  const [rows] = await pool.execute(
    `SELECT
      l.*,
      p.name AS product_name,
      p.category,
      f.farm_name,
      f.county,
      f.sub_county,
      u.full_name AS farmer_name,
      u.phone AS farmer_phone
     FROM listings l
     JOIN products p ON p.id = l.product_id
     JOIN farms f ON f.id = l.farm_id
     JOIN users u ON u.id = l.farmer_id
     WHERE l.id = ?`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Listing not found." });
  }

  res.json(rows[0]);
}
