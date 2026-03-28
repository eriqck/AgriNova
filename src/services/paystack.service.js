import { env } from "../config/env.js";

async function paystackRequest(path, options = {}) {
  if (!env.paystackSecretKey) {
    const error = new Error("PAYSTACK_SECRET_KEY is not configured.");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${env.paystackBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.status === false) {
    const error = new Error(payload?.message || "Paystack request failed.");
    error.statusCode = response.status || 502;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function convertMajorToSubunit(amount) {
  return String(Math.round(Number(amount) * 100));
}

export async function initializeTransaction({
  email,
  amount,
  currency,
  reference,
  callbackUrl,
  metadata
}) {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: convertMajorToSubunit(amount),
      currency,
      reference,
      callback_url: callbackUrl || undefined,
      metadata: JSON.stringify(metadata || {})
    })
  });
}

export async function verifyTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET"
  });
}
