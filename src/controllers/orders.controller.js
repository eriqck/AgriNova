import { pool } from "../config/db.js";

export async function createOrder(req, res) {
  const { listingId, quantity, deliveryAddress, deliveryNotes } = req.body;
  const buyerId = req.user?.role === "ADMIN" ? req.body.buyerId : req.user?.id;

  if (!listingId || !buyerId || !quantity) {
    return res.status(400).json({
      message: "listingId, buyerId, and quantity are required."
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [listingRows] = await connection.execute(
      `SELECT id, farmer_id, quantity_available, unit, price_per_unit, minimum_order_quantity, status
       FROM listings
       WHERE id = ?
       FOR UPDATE`,
      [listingId]
    );

    if (!listingRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Listing not found." });
    }

    const listing = listingRows[0];

    if (listing.status !== "ACTIVE") {
      await connection.rollback();
      return res.status(400).json({ message: "Listing is not available for ordering." });
    }

    if (Number(quantity) < Number(listing.minimum_order_quantity)) {
      await connection.rollback();
      return res.status(400).json({
        message: "Quantity is below the minimum order requirement."
      });
    }

    if (Number(quantity) > Number(listing.quantity_available)) {
      await connection.rollback();
      return res.status(400).json({
        message: "Requested quantity exceeds available stock."
      });
    }

    if (Number(buyerId) === Number(listing.farmer_id)) {
      await connection.rollback();
      return res.status(400).json({
        message: "A farmer cannot place an order on their own listing."
      });
    }

    const unitPrice = Number(listing.price_per_unit);
    const totalAmount = unitPrice * Number(quantity);

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
        (listing_id, buyer_id, seller_id, quantity, unit, unit_price, total_amount, delivery_address, delivery_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listingId,
        buyerId,
        listing.farmer_id,
        quantity,
        listing.unit,
        unitPrice,
        totalAmount,
        deliveryAddress || null,
        deliveryNotes || null
      ]
    );

    const remainingQuantity = Number(listing.quantity_available) - Number(quantity);

    await connection.execute(
      `UPDATE listings
       SET quantity_available = ?, status = ?
       WHERE id = ?`,
      [remainingQuantity, remainingQuantity === 0 ? "SOLD_OUT" : "ACTIVE", listingId]
    );

    await connection.commit();

    const [orderRows] = await pool.execute("SELECT * FROM orders WHERE id = ?", [orderResult.insertId]);
    res.status(201).json(orderRows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getOrderById(req, res) {
  const [rows] = await pool.execute(
    `SELECT
      o.*,
      l.title AS listing_title,
      buyer.full_name AS buyer_name,
      seller.full_name AS seller_name
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users buyer ON buyer.id = o.buyer_id
     JOIN users seller ON seller.id = o.seller_id
     WHERE o.id = ?`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Order not found." });
  }

  res.json(rows[0]);
}

export async function updateOrderStatus(req, res) {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "status is required." });
  }

  await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);

  const [rows] = await pool.execute("SELECT * FROM orders WHERE id = ?", [req.params.id]);

  if (!rows.length) {
    return res.status(404).json({ message: "Order not found." });
  }

  res.json(rows[0]);
}
