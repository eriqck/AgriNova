"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, toAssetUrl } from "../lib/api";

export default function FeaturedMarketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadListings() {
      try {
        const response = await apiRequest("/listings?status=ACTIVE");
        if (!active) {
          return;
        }

        setListings(response.slice(0, 4));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.message || "Unable to load featured products.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadListings();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[4/3] animate-pulse bg-gradient-to-br from-lime-100 to-emerald-50" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-10 w-full animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="mt-8 rounded-[28px] border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-950">No published products yet.</p>
        <p className="mt-2 text-sm text-slate-500">
          As soon as sellers publish listings with images, they will appear here.
        </p>
        <Link
          href="/seller"
          className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          Publish a product
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {listings.map((listing) => (
        <article
          key={listing.id}
          className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-lime-100 to-emerald-50 text-sm text-slate-500">
            {listing.images?.[0]?.image_url ? (
              <img
                alt={listing.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                src={toAssetUrl(listing.images[0].image_url)}
              />
            ) : (
              "No product image"
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-medium text-lime-700">
                {listing.county || listing.product_name || "Featured"}
              </span>
              <span className="text-xs text-slate-400">{listing.quantity_available} {listing.unit}</span>
            </div>
            <h4 className="mt-4 text-lg font-semibold tracking-tight text-slate-950 transition group-hover:text-emerald-700">
              {listing.title}
            </h4>
            <p className="mt-1 text-sm text-slate-500">by {listing.seller_name}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-lg font-semibold text-slate-950">
                {formatCurrency(listing.price_per_unit)} / {listing.unit}
              </p>
              <Link
                href={`/listings/${listing.id}`}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                View
              </Link>
            </div>
          </div>
        </article>
      ))}
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
