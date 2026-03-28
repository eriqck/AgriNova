import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export async function registerUser(req, res) {
  const { fullName, phone, email, password, role, county, subCounty } = req.body;

  if (!fullName || !phone || !password || !role) {
    return res.status(400).json({
      message: "fullName, phone, password, and role are required."
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [result] = await pool.execute(
    `INSERT INTO users (full_name, phone, email, password_hash, role, county, sub_county)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [fullName, phone, email || null, passwordHash, role, county || null, subCounty || null]
  );

  const [rows] = await pool.execute(
    `SELECT id, full_name, phone, email, role, county, sub_county, is_active, created_at
     FROM users
     WHERE id = ?`,
    [result.insertId]
  );

  res.status(201).json(rows[0]);
}

export async function loginUser(req, res) {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({
      message: "phone and password are required."
    });
  }

  const [rows] = await pool.execute(
    `SELECT id, full_name, phone, email, password_hash, role, county, sub_county, is_active
     FROM users
     WHERE phone = ?`,
    [phone]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "Invalid phone or password." });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid phone or password." });
  }

  if (!user.is_active) {
    return res.status(403).json({ message: "This account is inactive." });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      phone: user.phone
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      county: user.county,
      sub_county: user.sub_county
    }
  });
}

export async function getUserById(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, phone, email, role, county, sub_county, is_active, created_at
     FROM users
     WHERE id = ?`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "User not found." });
  }

  res.json(rows[0]);
}
