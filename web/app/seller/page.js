"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProFarmerSuite from "./pro-farmer-suite";
import {
  apiRequest,
  clearSession,
  getActiveMode,
  getAvailableModes,
  getStoredSession,
  setActiveMode,
  toAssetUrl
} from "../../lib/api";

const initialFarm = {
  farmName: "",
  county: "",
  subCounty: "",
  village: "",
  acreage: "",
  soilType: "",
  latitude: "",
  longitude: ""
};

const initialListing = {
  farmId: "",
  productId: "",
  title: "",
  description: "",
  quantityAvailable: "",
  unit: "kg",
  pricePerUnit: "",
  minimumOrderQuantity: "1"
};

export default function SellerPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [farms, setFarms] = useState([]);
  const [listings, setListings] = useState([]);
  const [membershipData, setMembershipData] = useState({ currentMembership: null, memberships: [] });
  const [farmForm, setFarmForm] = useState(initialFarm);
  const [listingForm, setListingForm] = useState(initialListing);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState({ page: true, farm: false, listing: false });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeMode, setActiveModeState] = useState("");
  const canPublish = Boolean(listingForm.farmId && listingForm.productId);
  const availableModes = getAvailableModes(session?.user?.role);
  const isProFarmer =
    membershipData.currentMembership?.plan_code === "PRO_FARMER" &&
    membershipData.currentMembership?.status === "ACTIVE";

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
    void loadSellerData(stored);
  }, [router]);

  function handleModeChange(mode) {
    if (!session) {
      return;
    }

    setActiveMode(mode, session);
    setActiveModeState(mode);
    setMessage(mode === "BUYER" ? "Buyer mode enabled on this account." : "Seller mode enabled on this account.");
    setError("");

    if (mode === "BUYER") {
      router.push("/buyer");
    }
  }

  async function loadSellerData(activeSession) {
    setLoading((current) => ({ ...current, page: true }));
    setError("");

    try {
      const [productData, farmData, listingData, membershipResponse] = await Promise.all([
        apiRequest("/products"),
        apiRequest(`/farms?farmerId=${activeSession.user.id}`, { token: activeSession.token }),
        apiRequest(`/listings?ownerId=${activeSession.user.id}&status=ALL`, { token: activeSession.token }),
        apiRequest("/memberships/me", { token: activeSession.token })
      ]);

      setProducts(productData);
      setFarms(farmData);
      setListings(listingData);
      setMembershipData(membershipResponse);
      setListingForm((current) => ({
        ...current,
        farmId: farmData[0]?.id ? String(farmData[0].id) : "",
        productId: current.productId || (productData[0]?.id ? String(productData[0].id) : "")
      }));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading((current) => ({ ...current, page: false }));
    }
  }

  async function handleFarmSubmit(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, farm: true }));
    setError("");
    setMessage("");

    try {
      await apiRequest("/farms", {
        method: "POST",
        token: session.token,
        body: {
          ...farmForm,
          acreage: farmForm.acreage ? Number(farmForm.acreage) : null,
          latitude: farmForm.latitude ? Number(farmForm.latitude) : null,
          longitude: farmForm.longitude ? Number(farmForm.longitude) : null
        }
      });
      setFarmForm(initialFarm);
      await loadSellerData(session);
      setMessage("Workspace created successfully.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading((current) => ({ ...current, farm: false }));
    }
  }

  async function handleListingSubmit(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, listing: true }));
    setError("");
    setMessage("");

    if (!listingForm.farmId || !listingForm.productId) {
      setLoading((current) => ({ ...current, listing: false }));
      setError("Create a seller workspace and choose a product before publishing a listing.");
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(listingForm).forEach(([key, value]) => formData.append(key, value));
      images.forEach((file) => formData.append("images", file));

      await apiRequest("/listings", {
        method: "POST",
        token: session.token,
        body: formData
      });

      setListingForm((current) => ({
        ...initialListing,
        farmId: current.farmId,
        productId: current.productId
      }));
      setImages([]);
      const imageInput = document.getElementById("seller-image-upload");
      if (imageInput) {
        imageInput.value = "";
      }
      await loadSellerData(session);
      setMessage("Product listing published.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading((current) => ({ ...current, listing: false }));
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  function useCurrentLocation() {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFarmForm((current) => ({
          ...current,
          latitude: String(position.coords.latitude.toFixed(6)),
          longitude: String(position.coords.longitude.toFixed(6))
        }));
        setMessage("Current coordinates added to the farm form.");
        setError("");
      },
      () => {
        setError("We could not read your current location. You can still enter coordinates manually.");
      }
    );
  }

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-[32px] bg-slate-950 px-8 py-8 text-white shadow-2xl shadow-slate-300/30 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Seller dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Manage your products and image uploads.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
              Signed in as {session?.user?.full_name || "Seller"}. Create your workspace, upload listings, and publish with multiple product images.
            </p>
            {activeMode ? (
              <p className="mt-3 text-sm font-medium text-emerald-200">
                Active mode: {activeMode === "BUYER" ? "Buyer" : activeMode === "FARMER" ? "Seller" : activeMode}
              </p>
            ) : null}
          </div>
          <div className="flex gap-3">
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
              Back home
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

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Membership</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {membershipData.currentMembership ? membershipData.currentMembership.plan_name : "No active plan yet"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {membershipData.currentMembership
                  ? `Status: ${membershipData.currentMembership.status.replaceAll("_", " ")}${membershipData.currentMembership.expires_at ? ` · Expires ${formatDate(membershipData.currentMembership.expires_at)}` : ""}`
                  : "Activate Lite Farmer or upgrade to Pro Farmer for premium intelligence and reporting tools."}
              </p>
            </div>
            <Link
              className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              href="/membership?plan=PRO_FARMER"
            >
              {membershipData.currentMembership ? "Manage membership" : "Choose a plan"}
            </Link>
          </div>
        </section>

        {activeMode !== "BUYER" && isProFarmer ? (
          <ProFarmerSuite
            farmerName={session?.user?.full_name || "Farmer"}
            farmName={farms[0]?.farm_name || "Green Valley Farms"}
            farms={farms}
            listings={listings}
            membershipName={membershipData.currentMembership?.plan_name}
            token={session?.token}
          />
        ) : null}

        {activeMode !== "BUYER" && !isProFarmer ? (
          <section className="mt-8 rounded-[32px] border border-emerald-100 bg-gradient-to-br from-[#eff6e8] to-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Pro farmer preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Upgrade to unlock field intelligence, sensor monitoring, microbiome analytics, and export-ready reports.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                "Interactive field map with soil health scores",
                "Live sensor panels for temperature, moisture, EC, and pH",
                "Microbiome insights with trends and diversity comparisons",
                "Recommendations, interventions, and printable reports"
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-emerald-100 bg-white p-5 text-sm leading-7 text-slate-600 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeMode === "BUYER" ? (
          <div className="mt-6 rounded-[28px] border border-emerald-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Buyer mode enabled</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              This farmer account can buy without creating a second account.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Browse the marketplace, open any product, and place orders as a buyer. Switch back to seller mode anytime when you want to manage listings again.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href="/buyer"
              >
                Open buyer dashboard
              </Link>
              <button
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => handleModeChange("FARMER")}
                type="button"
              >
                Back to seller mode
              </button>
            </div>
          </div>
        ) : null}

        {activeMode !== "BUYER" ? (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <form className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm" onSubmit={handleFarmSubmit}>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Create seller workspace</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add your farm, warehouse, or produce hub before publishing products.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Name</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, farmName: event.target.value }))} value={farmForm.farmName} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">County</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, county: event.target.value }))} value={farmForm.county} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Sub-county</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, subCounty: event.target.value }))} value={farmForm.subCounty} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Village</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, village: event.target.value }))} value={farmForm.village} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Acreage</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, acreage: event.target.value }))} type="number" value={farmForm.acreage} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Soil type</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, soilType: event.target.value }))} value={farmForm.soilType} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Latitude</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, latitude: event.target.value }))} step="any" type="number" value={farmForm.latitude} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Longitude</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setFarmForm((current) => ({ ...current, longitude: event.target.value }))} step="any" type="number" value={farmForm.longitude} />
              </label>
            </div>

                <button className="mt-4 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50" onClick={useCurrentLocation} type="button">
                  Use current location
                </button>
                <button className="mt-6 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading.farm} type="submit">
                  {loading.farm ? "Saving workspace..." : "Save workspace"}
                </button>
              </form>

              <form className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm" onSubmit={handleListingSubmit}>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Create product listing</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload your product and attach up to five images from your device.
            </p>

            {!farms.length ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Create a seller workspace first so your listing can be attached to a farm or produce hub.
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Workspace</span>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, farmId: event.target.value }))} value={listingForm.farmId}>
                  <option value="">Select workspace</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.farm_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Product</span>
                <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, productId: event.target.value }))} value={listingForm.productId}>
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Title</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, title: event.target.value }))} value={listingForm.title} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Description</span>
                <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, description: event.target.value }))} value={listingForm.description} />
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Quantity available</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, quantityAvailable: event.target.value }))} type="number" value={listingForm.quantityAvailable} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Unit</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, unit: event.target.value }))} value={listingForm.unit} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Price per unit</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, pricePerUnit: event.target.value }))} type="number" value={listingForm.pricePerUnit} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Minimum order</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setListingForm((current) => ({ ...current, minimumOrderQuantity: event.target.value }))} type="number" value={listingForm.minimumOrderQuantity} />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Images</span>
              <input
                accept="image/*"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 focus:border-emerald-500"
                id="seller-image-upload"
                multiple
                onChange={(event) => setImages(Array.from(event.target.files || []))}
                type="file"
              />
            </label>

            {images.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {images.map((file) => (
                  <span key={`${file.name}-${file.lastModified}`} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}

                <button className="mt-6 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading.listing || !canPublish} type="submit">
                  {loading.listing ? "Publishing..." : "Publish listing"}
                </button>
              </form>
            </div>

            <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">My product listings</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Published items</h2>
                </div>
                {loading.page ? <span className="text-sm font-medium text-slate-500">Loading...</span> : null}
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <article key={listing.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-stone-50 shadow-sm">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-lime-100 to-emerald-50 text-sm text-slate-500">
                      {listing.images?.[0]?.image_url ? (
                        <img
                          alt={listing.title}
                          className="h-full w-full object-cover"
                          src={toAssetUrl(listing.images[0].image_url)}
                        />
                      ) : (
                        "No product image"
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          {listing.status}
                        </span>
                        <span className="text-xs text-slate-400">{listing.quantity_available} {listing.unit}</span>
                      </div>
                      <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{listing.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{listing.description || "No description added."}</p>
                      <p className="mt-5 text-lg font-semibold text-slate-950">{formatCurrency(listing.price_per_unit)}</p>
                    </div>
                  </article>
                ))}
              </div>

              {!loading.page && !listings.length ? (
                <p className="mt-8 text-sm text-slate-500">No listings yet. Use the form above to publish your first product.</p>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium"
  }).format(new Date(value));
}
