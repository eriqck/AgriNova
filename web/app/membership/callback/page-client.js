"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, getStoredSession } from "../../../lib/api";

export default function MembershipCallbackClientPage({ reference }) {
  const [status, setStatus] = useState("loading");
  const [membership, setMembership] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getStoredSession();

    if (!reference) {
      setStatus("error");
      setError("Missing membership payment reference.");
      return;
    }

    if (!session?.token) {
      setStatus("error");
      setError("Login is required to verify this membership payment.");
      return;
    }

    let active = true;

    async function verifyMembership() {
      try {
        const response = await apiRequest(`/memberships/payments/verify/${reference}`, {
          token: session.token
        });

        if (!active) {
          return;
        }

        setMembership(response.membership);
        setStatus(response.membership?.status === "ACTIVE" ? "success" : "pending");
      } catch (verifyError) {
        if (!active) {
          return;
        }

        setStatus("error");
        setError(verifyError.message || "Unable to verify membership payment.");
      }
    }

    void verifyMembership();

    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-10 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 lg:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Membership callback</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Membership payment result</h1>

        {status === "loading" ? (
          <p className="mt-6 text-base leading-7 text-slate-600">
            Verifying your membership payment and activating the selected plan.
          </p>
        ) : null}

        {status === "success" ? (
          <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-lg font-semibold text-emerald-800">Membership activated</p>
            <p className="mt-3 text-sm leading-7 text-emerald-700">
              {membership?.plan_name} is now active on your account.
              {membership?.expires_at ? ` It renews manually after ${formatDate(membership.expires_at)}.` : ""}
            </p>
          </div>
        ) : null}

        {status === "pending" ? (
          <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-6">
            <p className="text-lg font-semibold text-amber-900">Payment still pending</p>
            <p className="mt-3 text-sm leading-7 text-amber-800">
              We received the callback, but the membership payment is not confirmed yet. Please reopen the membership page shortly.
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="mt-6 rounded-[28px] border border-rose-200 bg-rose-50 p-6">
            <p className="text-lg font-semibold text-rose-900">Membership verification failed</p>
            <p className="mt-3 text-sm leading-7 text-rose-700">{error}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            href="/membership"
          >
            Open membership page
          </Link>
          <Link
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            href="/"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium"
  }).format(new Date(value));
}
