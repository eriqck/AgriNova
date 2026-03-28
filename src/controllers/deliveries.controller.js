import { pool } from "../config/db.js";

export async function createDelivery(req, res) {
  const {
    orderId,
    transporterId,
    transporterName,
    transporterPhone,
    vehicleRegistration,
    pickupLocation,
    dropoffLocation,
    notes
  } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required." });
  }

  const [result] = await pool.execute(
    `INSERT INTO deliveries
      (order_id, transporter_id, transporter_name, transporter_phone, vehicle_registration,
       pickup_location, dropoff_location, notes, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED')`,
    [
      orderId,
      transporterId || null,
      transporterName || null,
      transporterPhone || null,
      vehicleRegistration || null,
      pickupLocation || null,
      dropoffLocation || null,
      notes || null
    ]
  );

  await pool.execute("UPDATE orders SET status = 'PROCESSING' WHERE id = ?", [orderId]);

  const [rows] = await pool.execute("SELECT * FROM deliveries WHERE id = ?", [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function updateDeliveryStatus(req, res) {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "status is required." });
  }

  const dispatchTimestamp = status === "PICKED_UP" ? new Date() : null;
  const deliveryTimestamp = status === "DELIVERED" ? new Date() : null;

  await pool.execute(
    `UPDATE deliveries
     SET status = ?,
         dispatched_at = COALESCE(?, dispatched_at),
         delivered_at = COALESCE(?, delivered_at)
     WHERE id = ?`,
    [status, dispatchTimestamp, deliveryTimestamp, req.params.id]
  );

  const [rows] = await pool.execute("SELECT * FROM deliveries WHERE id = ?", [req.params.id]);

  if (!rows.length) {
    return res.status(404).json({ message: "Delivery not found." });
  }

  const delivery = rows[0];

  if (status === "IN_TRANSIT") {
    await pool.execute("UPDATE orders SET status = 'IN_TRANSIT' WHERE id = ?", [delivery.order_id]);
  }

  if (status === "DELIVERED") {
    await pool.execute("UPDATE orders SET status = 'DELIVERED' WHERE id = ?", [delivery.order_id]);
  }

  res.json(rows[0]);
}
