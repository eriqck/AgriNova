"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  apiRequest,
  getActiveMode,
  getAvailableModes,
  getStoredSession,
  isBuyerMode,
  setActiveMode,
  toAssetUrl
} from "../../../lib/api";

const initialOrderForm = {
  quantity: "",
  deliveryAddress: "",
  deliveryNotes: ""
};

export default function ListingDetailsPage({ listingId }) {
  const [listing, setListing] = useState(null);
  const [session, setSession] = useState(null);
  const [activeMode, setActiveModeState] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [loading, setLoading] = useState({ page: true, order: false });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const availableModes = getAvailableModes(session?.user?.role);
  const buyerModeEnabled = isBuyerMode(session);

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);
    setActiveModeState(getActiveMode(stored));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadListing() {
      setLoading((current) => ({ ...current, page: true }));
      setError("");

      try {
        const response = await apiRequest(`/listings/${listingId}`);

        if (!active) {
          return;
        }

        setListing(response);
        setSelectedImage(response.images?.[0]?.image_url || "");
        setOrderForm((current) => ({
          ...current,
          quantity: current.quantity || String(response.minimum_order_quantity || 1)
        }));
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load this product.");
        }
      } finally {
        if (active) {
          setLoading((current) => ({ ...current, page: false }));
        }
      }
    }

    void loadListing();

    return () => {
      active = false;
    };
  }, [listingId]);

  async function handleOrderSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!session?.token) {
      setError("Login as a buyer to place an order.");
      return;
    }

    if (!buyerModeEnabled) {
      setError("Switch this account to buyer mode before placing an order.");
      return;
    }

    setLoading((current) => ({ ...current, order: true }));

    try {
      const createdOrder = await apiRequest("/orders", {
        method: "POST",
        token: session.token,
        body: {
          listingId,
          quantity: Number(orderForm.quantity),
          deliveryAddress: orderForm.deliveryAddress,
          deliveryNotes: orderForm.deliveryNotes
        }
      });

      setMessage(`Order #${createdOrder.id} created successfully. Open the buyer dashboard to complete payment and track delivery.`);
      setOrderForm((current) => ({
        ...current,
        deliveryAddress: "",
        deliveryNotes: ""
      }));

      const refreshedListing = await apiRequest(`/listings/${listingId}`);
      setListing(refreshedListing);
      setOrderForm((current) => ({
        ...current,
        quantity: String(refreshedListing.minimum_order_quantity || 1)
      }));
    } catch (submitError) {
      setError(submitError.message || "Unable to place order.");
    } finally {
      setLoading((current) => ({ ...current, order: false }));
    }
  }

  function handleModeChange(mode) {
    if (!session) {
      return;
    }

    setActiveMode(mode, session);
    setActiveModeState(mode);
    setMessage(mode === "BUYER" ? "Buyer mode enabled on this account." : "");
    setError("");
  }

  if (loading.page) {
    return (
      <main className="min-h-screen bg-lime-50 px-6 py-10 text-slate-900 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="mt-6 aspect-[16/8] rounded-[28px] bg-slate-100" />
          <div className="mt-6 h-8 w-2/3 rounded bg-slate-200" />
          <div className="mt-4 h-5 w-1/2 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  if (error && !listing) {
    return (
      <main className="min-h-screen bg-lime-50 px-6 py-10 text-slate-900 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
          <p className="text-lg font-semibold">Unable to load product</p>
          <p className="mt-3 text-sm">{error}</p>
          <Link
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            href="/"
          >
            Back to marketplace
          </Link>
        </div>
      </main>
    );
  }

  const minimumOrder = Number(listing?.minimum_order_quantity || 1);
  const availableQuantity = Number(listing?.quantity_available || 0);
  const selectedImageUrl = selectedImage ? toAssetUrl(selectedImage) : "";
  const canOrder = listing?.status === "ACTIVE" && availableQuantity > 0;

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-10 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Marketplace listing</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">{listing.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Sold by {listing.seller_name} from {listing.county}, {listing.sub_county || "Kenya"}.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              href="/"
            >
              Back home
            </Link>
            {!session?.token ? (
              <Link
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href="/login"
              >
                Login to order
              </Link>
            ) : null}
            {session?.token && buyerModeEnabled ? (
              <Link
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href="/buyer"
              >
                Buyer dashboard
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-lime-100 to-emerald-50">
              {selectedImageUrl ? (
                <img alt={listing.title} className="aspect-[16/10] w-full object-cover" src={selectedImageUrl} />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center text-sm text-slate-500">
                  No product image uploaded
                </div>
              )}
            </div>

            {listing.images?.length ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {listing.images.map((image) => {
                  const imageUrl = toAssetUrl(image.image_url);
                  const isSelected = selectedImage === image.image_url;

                  return (
                    <button
                      key={image.id}
                      className={`overflow-hidden rounded-2xl border transition ${
                        isSelected ? "border-emerald-600 shadow-md" : "border-slate-200 hover:border-emerald-300"
                      }`}
                      onClick={() => setSelectedImage(image.image_url)}
                      type="button"
                    >
                      <img
                        alt={image.original_name || listing.title}
                        className="h-20 w-20 object-cover"
                        src={imageUrl}
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard label="Price" value={`${formatCurrency(listing.price_per_unit)} / ${listing.unit}`} />
              <MetricCard label="Available" value={`${listing.quantity_available} ${listing.unit}`} />
              <MetricCard label="Minimum order" value={`${listing.minimum_order_quantity} ${listing.unit}`} />
            </div>

            <div className="mt-8 rounded-[28px] bg-stone-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Product details</p>
              <p className="mt-4 text-base leading-8 text-slate-700">
                {listing.description || "The seller has not added extra product notes yet."}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DetailRow label="Product" value={listing.product_name} />
                <DetailRow label="Quality grade" value={listing.quality_grade || "Standard"} />
                <DetailRow label="Farm" value={listing.farm_name} />
                <DetailRow label="Status" value={listing.status} />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300/30">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Seller overview</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{listing.seller_name}</h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Contact phone: {listing.seller_phone}. This listing is currently {listing.status.toLowerCase()} and ready for buyer review.
              </p>
              {session?.token && availableModes.length > 1 ? (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Account mode</p>
                  <div className="mt-3 flex rounded-2xl border border-white/15 bg-white/5 p-1">
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
                </div>
              ) : null}
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Place order</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Order this product</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  canOrder ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {canOrder ? "Available" : "Unavailable"}
                </span>
              </div>

              {!session?.token ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Login with a buyer account to place an order.
                </div>
              ) : null}

              {session?.token && !buyerModeEnabled ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You are signed in as {session.user.role}. Switch to buyer mode to place orders without creating another account.
                </div>
              ) : null}

              {error && listing ? (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              <form className="mt-6 space-y-4" onSubmit={handleOrderSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Quantity</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                    max={availableQuantity || undefined}
                    min={minimumOrder}
                    onChange={(event) => setOrderForm((current) => ({ ...current, quantity: event.target.value }))}
                    type="number"
                    value={orderForm.quantity}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Delivery address</span>
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                    onChange={(event) => setOrderForm((current) => ({ ...current, deliveryAddress: event.target.value }))}
                    placeholder="Where should the seller or transporter deliver?"
                    value={orderForm.deliveryAddress}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-600">Delivery notes</span>
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                    onChange={(event) => setOrderForm((current) => ({ ...current, deliveryNotes: event.target.value }))}
                    placeholder="Gate instructions, preferred timing, or contact details."
                    value={orderForm.deliveryNotes}
                  />
                </label>

                <button
                  className="w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading.order || !canOrder}
                  type="submit"
                >
                  {loading.order ? "Placing order..." : "Place order"}
                </button>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}
