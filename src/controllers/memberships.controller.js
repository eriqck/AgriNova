import crypto from "crypto";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { initializeTransaction, verifyTransaction } from "../services/paystack.service.js";

function buildMembershipReference(membershipId) {
  return `MEM-${membershipId}-${Date.now()}`;
}

function parseFeatures(rawFeatures) {
  if (!rawFeatures) {
    return [];
  }

  if (Array.isArray(rawFeatures)) {
    return rawFeatures;
  }

  try {
    return JSON.parse(rawFeatures);
  } catch {
    return [];
  }
}

function normalizePlan(row) {
  return {
    ...row,
    features: parseFeatures(row.features)
  };
}

function calculateExpiryDate(billingPeriod, startDate = new Date()) {
  if (!billingPeriod || billingPeriod === "ONETIME") {
    return null;
  }

  const expiry = new Date(startDate);

  if (billingPeriod === "MONTHLY") {
    expiry.setMonth(expiry.getMonth() + 1);
    return expiry;
  }

  if (billingPeriod === "YEARLY") {
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry;
  }

  return null;
}

function canSubscribeToPlan(userRole, audience) {
  if (!audience || audience === "ALL" || userRole === "ADMIN") {
    return true;
  }

  if (userRole === audience) {
    return true;
  }

  return userRole === "FARMER" && audience === "BUYER";
}

async function getMembershipById(membershipId) {
  const [rows] = await pool.execute(
    `SELECT
      m.*,
      mp.code AS plan_code,
      mp.name AS plan_name,
      mp.audience AS plan_audience,
      mp.billing_period,
      mp.price,
      mp.currency,
      mp.description AS plan_description,
      mp.features
     FROM memberships m
     JOIN membership_plans mp ON mp.id = m.plan_id
     WHERE m.id = ?`,
    [membershipId]
  );

  if (!rows.length) {
    return null;
  }

  return normalizePlan(rows[0]);
}

async function activateMembership(membershipId, paidAt = new Date()) {
  const membership = await getMembershipById(membershipId);

  if (!membership) {
    return null;
  }

  const startDate = paidAt ? new Date(paidAt) : new Date();
  const expiresAt = calculateExpiryDate(membership.billing_period, startDate);

  await pool.execute(
    `UPDATE memberships
     SET status = 'ACTIVE',
         started_at = ?,
         expires_at = ?,
         cancelled_at = NULL
     WHERE id = ?`,
    [startDate, expiresAt, membershipId]
  );

  return getMembershipById(membershipId);
}

export async function listMembershipPlans(req, res) {
  const [rows] = await pool.execute(
    `SELECT id, code, name, audience, billing_period, price, currency, description, features, is_active, sort_order
     FROM membership_plans
     WHERE is_active = 1
     ORDER BY sort_order ASC, id ASC`
  );

  res.json(rows.map(normalizePlan));
}

export async function getMyMemberships(req, res) {
  const [rows] = await pool.execute(
    `SELECT
      m.*,
      mp.code AS plan_code,
      mp.name AS plan_name,
      mp.audience AS plan_audience,
      mp.billing_period,
      mp.price,
      mp.currency,
      mp.description AS plan_description,
      mp.features
     FROM memberships m
     JOIN membership_plans mp ON mp.id = m.plan_id
     WHERE m.user_id = ?
     ORDER BY
       CASE m.status
         WHEN 'ACTIVE' THEN 1
         WHEN 'PENDING_PAYMENT' THEN 2
         WHEN 'EXPIRED' THEN 3
         WHEN 'CANCELLED' THEN 4
         ELSE 5
       END,
       m.created_at DESC`,
    [req.user.id]
  );

  const memberships = rows.map(normalizePlan);
  const currentMembership =
    memberships.find((membership) => membership.status === "ACTIVE") ||
    memberships.find((membership) => membership.status === "PENDING_PAYMENT") ||
    null;

  res.json({
    currentMembership,
    memberships
  });
}

export async function createMembership(req, res) {
  const { planId, planCode } = req.body;

  if (!planId && !planCode) {
    return res.status(400).json({ message: "planId or planCode is required." });
  }

  const [planRows] = await pool.execute(
    `SELECT id, code, name, audience, billing_period, price, currency, description, features, is_active
     FROM membership_plans
     WHERE ${planId ? "id = ?" : "code = ?"}`,
    [planId || planCode]
  );

  if (!planRows.length) {
    return res.status(404).json({ message: "Membership plan not found." });
  }

  const plan = normalizePlan(planRows[0]);

  if (!plan.is_active) {
    return res.status(400).json({ message: "This membership plan is not available right now." });
  }

  if (!canSubscribeToPlan(req.user.role, plan.audience)) {
    return res.status(403).json({ message: "This membership plan is not available for your account." });
  }

  const [existingRows] = await pool.execute(
    `SELECT
      m.*,
      mp.code AS plan_code,
      mp.name AS plan_name,
      mp.audience AS plan_audience,
      mp.billing_period,
      mp.price,
      mp.currency,
      mp.description AS plan_description,
      mp.features
     FROM memberships m
     JOIN membership_plans mp ON mp.id = m.plan_id
     WHERE m.user_id = ? AND m.plan_id = ? AND m.status IN ('PENDING_PAYMENT', 'ACTIVE')
     ORDER BY m.created_at DESC
     LIMIT 1`,
    [req.user.id, plan.id]
  );

  if (existingRows.length) {
    const existingMembership = normalizePlan(existingRows[0]);

    return res.status(200).json({
      membership: existingMembership,
      plan,
      reused: true,
      requiresPayment:
        existingMembership.status === "PENDING_PAYMENT" && Number(existingMembership.price) > 0
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO memberships (user_id, plan_id, status, started_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      req.user.id,
      plan.id,
      Number(plan.price) === 0 ? "ACTIVE" : "PENDING_PAYMENT",
      Number(plan.price) === 0 ? new Date() : null,
      Number(plan.price) === 0 ? calculateExpiryDate(plan.billing_period, new Date()) : null
    ]
  );

  const membership = await getMembershipById(result.insertId);

  res.status(201).json({
    membership,
    plan,
    requiresPayment: Number(plan.price) > 0
  });
}

export async function initializeMembershipPayment(req, res) {
  const { provider = "PAYSTACK", metadata, callbackUrl } = req.body;
  const membership = await getMembershipById(req.params.id);

  if (!membership) {
    return res.status(404).json({ message: "Membership signup not found." });
  }

  if (Number(membership.user_id) !== Number(req.user.id) && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "You can only initialize payment for your own membership." });
  }

  if (membership.status === "ACTIVE") {
    return res.status(400).json({ message: "This membership is already active." });
  }

  if (provider !== "PAYSTACK") {
    return res.status(400).json({ message: "Only PAYSTACK is supported in this version." });
  }

  const [userRows] = await pool.execute(
    `SELECT id, full_name, email
     FROM users
     WHERE id = ?`,
    [membership.user_id]
  );

  if (!userRows.length) {
    return res.status(404).json({ message: "User not found for membership." });
  }

  if (!userRows[0].email) {
    return res.status(400).json({ message: "An email address is required to start membership payment." });
  }

  const providerReference = buildMembershipReference(membership.id);
  const paystackResponse = await initializeTransaction({
    email: userRows[0].email,
    amount: membership.price,
    currency: membership.currency,
    reference: providerReference,
    callbackUrl: callbackUrl || env.paystackCallbackUrl,
    metadata: {
      membershipId: membership.id,
      planCode: membership.plan_code,
      memberName: userRows[0].full_name,
      ...(metadata || {})
    }
  });

  const [result] = await pool.execute(
    `INSERT INTO membership_payments
      (membership_id, provider, provider_reference, access_code, amount, currency, status, metadata)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
    [
      membership.id,
      provider,
      providerReference,
      paystackResponse.data.access_code || null,
      membership.price,
      membership.currency,
      JSON.stringify({
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        ...metadata
      })
    ]
  );

  const [paymentRows] = await pool.execute(
    "SELECT * FROM membership_payments WHERE id = ?",
    [result.insertId]
  );

  res.status(201).json({
    membership,
    payment: paymentRows[0],
    checkout: paystackResponse.data
  });
}

export async function verifyMembershipPayment(req, res) {
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
    `UPDATE membership_payments
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
    `SELECT mp.*, m.user_id
     FROM membership_payments mp
     JOIN memberships m ON m.id = mp.membership_id
     WHERE mp.provider = 'PAYSTACK' AND mp.provider_reference = ?`,
    [reference]
  );

  if (!paymentRows.length) {
    return res.status(404).json({ message: "Membership payment not found for reference." });
  }

  const payment = paymentRows[0];

  if (req.user.role !== "ADMIN" && Number(req.user.id) !== Number(payment.user_id)) {
    return res.status(403).json({ message: "You can only verify your own membership payment." });
  }

  let membership = await getMembershipById(payment.membership_id);

  if (normalizedStatus === "SUCCESS") {
    membership = await activateMembership(payment.membership_id, paystackResponse.data?.paid_at || new Date());
  }

  res.json({
    membership,
    payment,
    paystack: paystackResponse.data
  });
}

export async function handleMembershipPaystackWebhook(req, res) {
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
    `UPDATE membership_payments
     SET status = ?, paid_at = ?
     WHERE provider = 'PAYSTACK' AND provider_reference = ?`,
    [status, paidAt, reference]
  );

  if (result.affectedRows > 0 && status === "SUCCESS") {
    const [paymentRows] = await pool.execute(
      "SELECT membership_id FROM membership_payments WHERE provider_reference = ?",
      [reference]
    );

    if (paymentRows.length) {
      await activateMembership(paymentRows[0].membership_id, paidAt || new Date());
    }
  }

  res.status(200).json({ received: true });
}
