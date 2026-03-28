import { pool } from "../config/db.js";

async function attachListingImages(rows) {
  if (!rows.length) {
    return rows;
  }

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  const [imageRows] = await pool.execute(
    `SELECT id, listing_id, image_url, original_name, sort_order
     FROM listing_images
     WHERE listing_id IN (${placeholders})
     ORDER BY listing_id ASC, sort_order ASC, id ASC`,
    ids
  );

  const imagesByListingId = imageRows.reduce((accumulator, image) => {
    if (!accumulator[image.listing_id]) {
      accumulator[image.listing_id] = [];
    }

    accumulator[image.listing_id].push({
      id: image.id,
      image_url: image.image_url,
      original_name: image.original_name,
      sort_order: image.sort_order
    });

    return accumulator;
  }, {});

  return rows.map((row) => ({
    ...row,
    images: imagesByListingId[row.id] || []
  }));
}

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
  const uploadedImages = req.files || [];

  const farmerId =
    req.user?.role === "ADMIN" ? req.body.ownerId || req.body.farmerId : req.user?.id;

  if (!farmerId || !farmId || !productId || !title || !quantityAvailable || !unit || !pricePerUnit) {
    return res.status(400).json({
      message: "farmerId, farmId, productId, title, quantityAvailable, unit, and pricePerUnit are required."
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
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

    if (uploadedImages.length) {
      const values = uploadedImages.map((file, index) => [
        result.insertId,
        `/uploads/listings/${file.filename}`,
        file.originalname,
        index
      ]);

      await connection.query(
        `INSERT INTO listing_images (listing_id, image_url, original_name, sort_order)
         VALUES ?`,
        [values]
      );
    }

    await connection.commit();

    const [rows] = await pool.execute(
      `SELECT
        l.*,
        p.name AS product_name,
        owner.full_name AS seller_name,
        owner.phone AS seller_phone
       FROM listings l
       JOIN products p ON p.id = l.product_id
       JOIN users owner ON owner.id = l.farmer_id
       WHERE l.id = ?`,
      [result.insertId]
    );

    const [listingWithImages] = await attachListingImages(rows);
    res.status(201).json(listingWithImages);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listListings(req, res) {
  const { productId, county, status = "ACTIVE", ownerId } = req.query;
  let sql = `
    SELECT
      l.*,
      p.name AS product_name,
      f.farm_name,
      f.county,
      u.full_name AS seller_name,
      u.phone AS seller_phone,
      u.role AS seller_role
    FROM listings l
    JOIN products p ON p.id = l.product_id
    JOIN farms f ON f.id = l.farm_id
    JOIN users u ON u.id = l.farmer_id
    WHERE 1 = 1
  `;
  const params = [];

  if (status && status !== "ALL") {
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

  if (ownerId) {
    sql += " AND l.farmer_id = ?";
    params.push(ownerId);
  }

  sql += " ORDER BY l.created_at DESC";

  const [rows] = await pool.execute(sql, params);
  const hydratedRows = await attachListingImages(rows);
  res.json(hydratedRows);
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
      u.full_name AS seller_name,
      u.phone AS seller_phone,
      u.role AS seller_role
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

  const [listingWithImages] = await attachListingImages(rows);
  res.json(listingWithImages);
}
