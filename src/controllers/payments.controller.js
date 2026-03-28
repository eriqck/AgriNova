import { pool } from "../config/db.js";
import crypto from "crypto";
import { env } from "../config/env.js";
import { initializeTransaction, verifyTransaction } from "../services/paystack.service.js";

function buildPlaceholderReference(orderId) {
  return `PAY-${orderId}-${Date.now()}`;
}

export async function initializePayment(req, res) {
  const { orderId, provider = "PAYSTACK", metadata } = req.body;

  if (!orderId) {
    return res.status(400).json({
      message: "orderId is required."
    });
  }

  const [orderRows] = await pool.execute(
    `SELECT
      o.id,
      o.buyer_id,
      o.total_amount,
      o.currency,
      o.status,
      buyer.email AS buyer_email,
      buyer.full_name AS buyer_name
     FROM orders o
     JOIN users buyer ON buyer.id = o.buyer_id
     WHERE o.id = ?`,
    [orderId]
  );

  if (!orderRows.length) {
    return res.status(404).json({ message: "Order not found." });
  }

  const order = orderRows[0];

  if (order.status === "CANCELLED") {
    return res.status(400).json({ message: "Cannot initialize payment for a cancelled order." });
  }

  if (provider !== "PAYSTACK") {
    return res.status(400).json({ message: "Only PAYSTACK is supported in this version." });
  }

  if (!order.buyer_email) {
    return res.status(400).json({ message: "Buyer email is required for Paystack payments." });
  }

  if (req.user?.role !== "ADMIN" && Number(req.user?.id) !== Number(order.buyer_id)) {
    return res.status(403).json({ message: "You can only initialize payment for your own order." });
  }

  const providerReference = buildPlaceholderReference(orderId);
  const paystackResponse = await initializeTransaction({
    email: order.buyer_email,
    amount: order.total_amount,
    currency: order.currency,
    reference: providerReference,
    callbackUrl: env.paystackCallbackUrl,
    metadata: {
      orderId: order.id,
      buyerName: order.buyer_name,
      ...(metadata || {})
    }
  });

  const [result] = await pool.execute(
    `INSERT INTO payments
      (order_id, provider, provider_reference, access_code, amount, status, metadata)
     VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
    [
      orderId,
      provider,
      providerReference,
      paystackResponse.data.access_code || null,
      order.total_amount,
      JSON.stringify({
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        ...metadata
      })
    ]
  );

  const [rows] = await pool.execute("SELECT * FROM payments WHERE id = ?", [result.insertId]);
  res.status(201).json({
    payment: rows[0],
    checkout: paystackResponse.data
  });
}

export async function updatePaymentStatus(req, res) {
  const { status, paidAt, providerReference } = req.body;

  if (!status) {
    return res.status(400).json({ message: "status is required." });
  }

  await pool.execute(
    `UPDATE payments
     SET status = ?, paid_at = ?, provider_reference = COALESCE(?, provider_reference)
     WHERE id = ?`,
    [status, paidAt || null, providerReference || null, req.params.id]
  );

  const [paymentRows] = await pool.execute("SELECT * FROM payments WHERE id = ?", [req.params.id]);

  if (!paymentRows.length) {
    return res.status(404).json({ message: "Payment not found." });
  }

  const payment = paymentRows[0];

  if (status === "SUCCESS") {
    await pool.execute("UPDATE orders SET status = 'PAID' WHERE id = ?", [payment.order_id]);
  }

  res.json(payment);
}

export async function verifyPaystackPayment(req, res) {
  const reference = req.params.reference || req.body.reference;

  if (!reference) {
    return res.status(400).json({ message: "reference is required." });
  }

  const paystackResponse = await verifyTransaction(reference);
  const paystackStatus = paystackResponse.data?.status;
  const normalizedStatus =
    paystackStatus === "success"
      ? "SUCCESS"
      : paystackStatus === "pending" || paystackStatus === "processing" || paystackStatus === "ongoing"
        ? "PENDING"
        : "FAILED";

  await pool.execute(
    `UPDATE payments
     SET status = ?,
         paid_at = ?,
         metadata = JSON_SET(COALESCE(metadata, JSON_OBJECT()), '$.verification', CAST(? AS JSON))
     WHERE provider = 'PAYSTACK' AND provider_reference = ?`,
    [
      normalizedStatus,
      paystackResponse.data?.paid_at || null,
      JSON.stringify(paystackResponse.data || {}),
      reference
    ]
  );

  const [paymentRows] = await pool.execute(
    "SELECT * FROM payments WHERE provider = 'PAYSTACK' AND provider_reference = ?",
    [reference]
  );

  if (!paymentRows.length) {
    return res.status(404).json({ message: "Payment not found for reference." });
  }

  if (normalizedStatus === "SUCCESS") {
    await pool.execute("UPDATE orders SET status = 'PAID' WHERE id = ?", [paymentRows[0].order_id]);
  }

  res.json({
    payment: paymentRows[0],
    paystack: paystackResponse.data
  });
}

export async function handlePaystackWebhook(req, res) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const signature = req.headers["x-paystack-signature"];
  const expectedSignature = crypto
    .createHmac("sha512", env.paystackSecretKey)
    .update(rawBody)
    .digest("hex");

  if (!signature || signature !== expectedSignature) {
    return res.status(401).json({ message: "Invalid Paystack signature." });
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  const reference = event?.data?.reference;
  const paidAt = event?.data?.paid_at || event?.data?.paidAt || null;
  const status = event?.event === "charge.success" ? "SUCCESS" : "FAILED";

  if (!reference) {
    return res.status(400).json({ message: "Missing payment reference." });
  }

  const [result] = await pool.execute(
    `UPDATE payments
     SET status = ?, paid_at = ?
     WHERE provider = 'PAYSTACK' AND provider_reference = ?`,
    [status, paidAt, reference]
  );

  if (result.affectedRows > 0 && status === "SUCCESS") {
    const [paymentRows] = await pool.execute(
      "SELECT order_id FROM payments WHERE provider_reference = ?",
      [reference]
    );

    if (paymentRows.length) {
      await pool.execute("UPDATE orders SET status = 'PAID' WHERE id = ?", [paymentRows[0].order_id]);
    }
  }

  res.status(200).json({ received: true });
}
