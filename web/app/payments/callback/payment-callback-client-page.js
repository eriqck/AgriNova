"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, getStoredSession } from "../../../lib/api";

export default function PaymentCallbackClientPage({ reference }) {
  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getStoredSession();

    if (!reference) {
      setStatus("error");
      setError("Missing payment reference.");
      return;
    }

    if (!session?.token) {
      setStatus("error");
      setError("Login is required to verify this payment.");
      return;
    }

    let active = true;

    async function verifyPayment() {
      try {
        const response = await apiRequest(`/payments/verify/${reference}`, {
          token: session.token
        });

        if (!active) {
          return;
        }

        setResult(response);
        setStatus(response.payment?.status === "SUCCESS" ? "success" : "pending");
      } catch (verifyError) {
        if (!active) {
          return;
        }

        setStatus("error");
        setError(verifyError.message || "Unable to verify payment.");
      }
    }

    void verifyPayment();

    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-10 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 lg:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Payment callback</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Checkout result</h1>

        {status === "loading" ? (
          <p className="mt-6 text-base leading-7 text-slate-600">
            Verifying your payment with Paystack and updating the order status.
          </p>
        ) : null}

        {status === "success" ? (
          <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-lg font-semibold text-emerald-800">Payment successful</p>
            <p className="mt-3 text-sm leading-7 text-emerald-700">
              Your payment was verified successfully for order #{result?.payment?.order_id}. The buyer dashboard will show the updated payment status.
            </p>
          </div>
        ) : null}

        {status === "pending" ? (
          <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-6">
            <p className="text-lg font-semibold text-amber-900">Payment still pending</p>
            <p className="mt-3 text-sm leading-7 text-amber-800">
              We received the callback, but the transaction is not marked as successful yet. Please check the buyer dashboard again shortly.
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-6">
            <p className="text-lg font-semibold text-rose-900">Payment verification failed</p>
            <p className="mt-3 text-sm leading-7 text-rose-700">{error}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            href="/buyer"
          >
            Go to buyer dashboard
          </Link>
          <Link
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            href="/"
          >
            Back to marketplace
          </Link>
        </div>
      </div>
    </main>
  );
}
