"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  clearSession,
  getActiveMode,
  getAvailableModes,
  getStoredSession,
  isBuyerMode,
  setActiveMode
} from "../../lib/api";

export default function BuyerPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [activeMode, setActiveModeState] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState({ page: true, paymentId: null });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const availableModes = getAvailableModes(session?.user?.role);
  const buyerModeEnabled = isBuyerMode(session);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored?.token) {
      router.replace("/login");
      return;
    }

    if (stored.user?.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    setSession(stored);
    setActiveModeState(getActiveMode(stored));
    void loadOrders(stored);
  }, [router]);

  async function loadOrders(activeSession = session) {
    if (!activeSession?.token) {
      return;
    }

    setLoading((current) => ({ ...current, page: true }));
    setError("");

    try {
      const orderData = await apiRequest(`/orders?buyerId=${activeSession.user.id}`, {
        token: activeSession.token
      });
      setOrders(orderData);
    } catch (loadError) {
      setError(loadError.message || "Unable to load buyer orders.");
    } finally {
      setLoading((current) => ({ ...current, page: false }));
    }
  }

  function handleModeChange(mode) {
    if (!session) {
      return;
    }

    setActiveMode(mode, session);
    setActiveModeState(mode);
    setError("");
    setMessage(mode === "BUYER" ? "Buyer mode enabled on this account." : "Seller mode enabled on this account.");

    if (mode === "FARMER") {
      router.push("/seller");
    }
  }

  async function handlePayNow(orderId) {
    if (!session?.token) {
      return;
    }

    if (!buyerModeEnabled) {
      setError("Switch this account into buyer mode before starting payment.");
      return;
    }

    setLoading((current) => ({ ...current, paymentId: orderId }));
    setError("");
    setMessage("");

    try {
      const callbackUrl = `${window.location.origin}/payments/callback`;
      const paymentResponse = await apiRequest("/payments/initialize", {
        method: "POST",
        token: session.token,
        body: {
          orderId,
          callbackUrl
        }
      });

      const checkoutUrl = paymentResponse.checkout?.authorization_url;

      if (!checkoutUrl) {
        throw new Error("Payment checkout link was not returned.");
      }

      window.location.href = checkoutUrl;
    } catch (paymentError) {
      setError(paymentError.message || "Unable to start payment.");
    } finally {
      setLoading((current) => ({ ...current, paymentId: null }));
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingPayment = orders.filter((order) => order.payment_status !== "SUCCESS").length;
    const delivered = orders.filter((order) => order.delivery_status === "DELIVERED").length;
    const spend = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return {
      totalOrders,
      pendingPayment,
      delivered,
      spend
    };
  }, [orders]);

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-[32px] bg-slate-950 px-8 py-8 text-white shadow-2xl shadow-slate-300/30 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Buyer dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Track orders and payment progress.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
              Signed in as {session?.user?.full_name || "Buyer"}. View your purchases, follow payment status, and continue checkout for unpaid orders.
            </p>
            {activeMode ? (
              <p className="mt-3 text-sm font-medium text-emerald-200">
                Active mode: {activeMode === "BUYER" ? "Buyer" : activeMode === "FARMER" ? "Seller" : activeMode}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {availableModes.length > 1 ? (
              <div className="flex rounded-2xl border border-white/15 bg-white/5 p-1">
                {availableModes.map((mode) => {
                  const label = mode === "FARMER" ? "Seller mode" : mode === "BUYER" ? "Buyer mode" : mode;
                  const isActive = activeMode === mode;

                  return (
                    <button
                      key={mode}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        isActive ? "bg-white text-slate-950" : "text-white hover:bg-white/10"
                      }`}
                      onClick={() => handleModeChange(mode)}
                      type="button"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <Link className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5" href="/">
              Marketplace
            </Link>
            <button className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        {!buyerModeEnabled ? (
          <div className="mt-6 rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Buyer mode is off</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Switch this account into buyer mode to view orders and pay.
            </h2>
            <div className="mt-5 flex gap-3">
              <button
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                onClick={() => handleModeChange("BUYER")}
                type="button"
              >
                Enable buyer mode
              </button>
              <Link
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                href="/seller"
              >
                Back to seller tools
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total orders" value={String(stats.totalOrders)} />
          <StatCard label="Awaiting payment" value={String(stats.pendingPayment)} />
          <StatCard label="Delivered" value={String(stats.delivered)} />
          <StatCard label="Total spend" value={formatCurrency(stats.spend)} />
        </div>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Order history</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">My purchases</h2>
            </div>
            <div className="flex gap-3">
              <button
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => loadOrders()}
                type="button"
              >
                Refresh
              </button>
              <Link
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href="/"
              >
                Browse products
              </Link>
            </div>
          </div>

          {loading.page ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-[28px] border border-slate-200 bg-stone-50 p-6">
                  <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="mt-4 h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="mt-6 h-24 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading.page && !orders.length ? (
            <div className="mt-8 rounded-[28px] border border-slate-200 bg-stone-50 px-6 py-10 text-center">
              <p className="text-lg font-semibold text-slate-950">No buyer orders yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Browse published products and place your first order from the marketplace.
              </p>
              <Link
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href="/"
              >
                Explore marketplace
              </Link>
            </div>
          ) : null}

          {!loading.page && orders.length ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {orders.map((order) => {
                const paymentPending = order.payment_status !== "SUCCESS";
                const paymentLoading = loading.paymentId === order.id;
                const payDisabled = paymentLoading || !buyerModeEnabled;

                return (
                  <article key={order.id} className="rounded-[28px] border border-slate-200 bg-stone-50 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Order #{order.id}</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{order.listing_title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill label={order.status} tone="neutral" />
                        <StatusPill label={order.payment_status || "UNPAID"} tone={paymentPending ? "warning" : "success"} />
                        <StatusPill label={order.delivery_status || "NOT_SCHEDULED"} tone="neutral" />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <InfoRow label="Seller" value={order.seller_name} />
                      <InfoRow label="Quantity" value={`${order.quantity} ${order.unit}`} />
                      <InfoRow label="Unit price" value={formatCurrency(order.unit_price)} />
                      <InfoRow label="Total amount" value={formatCurrency(order.total_amount)} />
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                        href={`/listings/${order.listing_id}`}
                      >
                        View product
                      </Link>
                      {paymentPending ? (
                        <button
                          className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={payDisabled}
                          onClick={() => handlePayNow(order.id)}
                          type="button"
                        >
                          {paymentLoading ? "Starting payment..." : "Pay now"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                          Payment complete
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function StatusPill({ label, tone }) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {String(label).replaceAll("_", " ")}
    </span>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}
