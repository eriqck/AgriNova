import { pool } from "../config/db.js";

export async function createProduct(req, res) {
  const { name, category, unitOfMeasure, description } = req.body;

  if (!name || !category || !unitOfMeasure) {
    return res.status(400).json({
      message: "name, category, and unitOfMeasure are required."
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO products (name, category, unit_of_measure, description)
     VALUES (?, ?, ?, ?)`,
    [name, category, unitOfMeasure, description || null]
  );

  const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function listProducts(req, res) {
  const [rows] = await pool.execute(
    "SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC"
  );

  res.json(rows);
}
