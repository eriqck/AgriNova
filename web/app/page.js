"use client";

import { useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  getStoredSession,
  loginUser,
  registerUser,
  saveSession,
  toAssetUrl
} from "../lib/api";

const emptyRegisterForm = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  role: "FARMER",
  county: "",
  subCounty: ""
};

const emptyFarmForm = {
  farmName: "",
  county: "",
  subCounty: "",
  village: "",
  acreage: "",
  soilType: ""
};

const emptyListingForm = {
  farmId: "",
  productId: "1",
  title: "",
  description: "",
  quantityAvailable: "",
  unit: "kg",
  pricePerUnit: "",
  minimumOrderQuantity: ""
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function ListingVisual({ listing }) {
  const image = listing.images?.[0]?.image_url;

  if (!image) {
    return <div className="listing-image listing-image--placeholder">{listing.product_name}</div>;
  }

  return <img alt={listing.title} className="listing-image" src={toAssetUrl(image)} />;
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [marketListings, setMarketListings] = useState([]);
  const [farms, setFarms] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [farmForm, setFarmForm] = useState(emptyFarmForm);
  const [listingForm, setListingForm] = useState(emptyListingForm);
  const [listingImages, setListingImages] = useState([]);
  const [orderDrafts, setOrderDrafts] = useState({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState({
    page: false,
    register: false,
    login: false,
    farm: false,
    listing: false,
    order: false,
    payment: false
  });

  const isBuyer = session?.user?.role === "BUYER";
  const canSell = Boolean(session);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
    }
    void loadPublicData();
  }, []);

  useEffect(() => {
    if (session?.token) {
      void loadPrivateData(session);
    }
  }, [session]);

  const dashboardStats = useMemo(
    () => [
      { label: "Market listings", value: marketListings.length || 0 },
      { label: "My listings", value: myListings.length || 0 },
      { label: "Tracked orders", value: buyerOrders.length + sellerOrders.length }
    ],
    [buyerOrders.length, marketListings.length, myListings.length, sellerOrders.length]
  );

  async function loadPublicData() {
    setLoading((current) => ({ ...current, page: true }));
    try {
      const [productData, listingData] = await Promise.all([
        apiRequest("/products"),
        apiRequest("/listings")
      ]);
      setProducts(productData);
      setMarketListings(listingData);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, page: false }));
    }
  }

  async function loadPrivateData(currentSession) {
    setLoading((current) => ({ ...current, page: true }));
    try {
      const [farmData, listingData, buyerOrderData, sellerOrderData] = await Promise.all([
        apiRequest(`/farms?farmerId=${currentSession.user.id}`, { token: currentSession.token }),
        apiRequest(`/listings?ownerId=${currentSession.user.id}&status=ALL`, {
          token: currentSession.token
        }),
        apiRequest(`/orders?buyerId=${currentSession.user.id}`, {
          token: currentSession.token
        }).catch(() => []),
        apiRequest(`/orders?sellerId=${currentSession.user.id}`, {
          token: currentSession.token
        }).catch(() => [])
      ]);

      setFarms(farmData);
      setMyListings(listingData);
      setBuyerOrders(buyerOrderData);
      setSellerOrders(sellerOrderData);
      setListingForm((current) => ({
        ...current,
        farmId: farmData[0]?.id ? String(farmData[0].id) : ""
      }));
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, page: false }));
    }
  }

  async function refreshEverything(currentSession = session) {
    await loadPublicData();
    if (currentSession?.token) {
      await loadPrivateData(currentSession);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, register: true }));
    setFeedback("");
    try {
      await registerUser(registerForm);
      setRegisterForm(emptyRegisterForm);
      setFeedback("Account created. You can log in now.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, register: false }));
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, login: true }));
    setFeedback("");
    try {
      const nextSession = await loginUser(loginForm);
      saveSession(nextSession);
      setSession(nextSession);
      setFeedback(`Welcome back, ${nextSession.user.full_name}.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, login: false }));
    }
  }

  async function handleCreateFarm(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, farm: true }));
    setFeedback("");
    try {
      await apiRequest("/farms", {
        method: "POST",
        token: session.token,
        body: {
          ...farmForm,
          acreage: farmForm.acreage ? Number(farmForm.acreage) : null
        }
      });
      setFarmForm(emptyFarmForm);
      await refreshEverything();
      setFeedback("Workspace saved.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, farm: false }));
    }
  }

  async function handleCreateListing(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, listing: true }));
    setFeedback("");
    try {
      const formData = new FormData();
      Object.entries({
        farmId: listingForm.farmId,
        productId: listingForm.productId,
        title: listingForm.title,
        description: listingForm.description,
        quantityAvailable: listingForm.quantityAvailable,
        unit: listingForm.unit,
        pricePerUnit: listingForm.pricePerUnit,
        minimumOrderQuantity: listingForm.minimumOrderQuantity || "1"
      }).forEach(([key, value]) => formData.append(key, value));

      listingImages.forEach((file) => formData.append("images", file));

      await apiRequest("/listings", {
        method: "POST",
        token: session.token,
        body: formData
      });

      setListingForm((current) => ({
        ...emptyListingForm,
        farmId: current.farmId,
        productId: current.productId
      }));
      setListingImages([]);
      const input = document.getElementById("listing-images");
      if (input) {
        input.value = "";
      }
      await refreshEverything();
      setFeedback("Listing published with images.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, listing: false }));
    }
  }

  async function handleCreateOrder(event, listingId) {
    event.preventDefault();
    setLoading((current) => ({ ...current, order: true }));
    setFeedback("");
    try {
      const draft = orderDrafts[listingId] || {};
      await apiRequest("/orders", {
        method: "POST",
        token: session.token,
        body: {
          listingId,
          quantity: Number(draft.quantity),
          deliveryAddress: draft.deliveryAddress,
          deliveryNotes: draft.deliveryNotes
        }
      });
      await refreshEverything();
      setFeedback("Order created. You can pay from your buyer dashboard.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, order: false }));
    }
  }

  async function handlePaymentStart(orderId) {
    setLoading((current) => ({ ...current, payment: true }));
    setFeedback("");
    try {
      const response = await apiRequest("/payments/initialize", {
        method: "POST",
        token: session.token,
        body: {
          orderId,
          provider: "PAYSTACK",
          metadata: { source: "agrinova-web" }
        }
      });
      window.open(response.checkout.authorization_url, "_blank", "noopener,noreferrer");
      setFeedback("Paystack checkout opened in a new tab.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, payment: false }));
    }
  }

  function updateOrderDraft(listingId, field, value) {
    setOrderDrafts((current) => ({
      ...current,
      [listingId]: {
        ...(current[listingId] || {}),
        [field]: value
      }
    }));
  }

  function logout() {
    localStorage.removeItem("agrinova_session");
    setSession(null);
    setFarms([]);
    setMyListings([]);
    setBuyerOrders([]);
    setSellerOrders([]);
    setFeedback("Signed out.");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AgriNova</span>
          <h1>Upload products, track orders, and sell faster.</h1>
          <p>
            Buyers and farmers can now upload listings from device storage with images,
            monitor activity, and move from order to checkout without leaving the app.
          </p>
          <div className="stats-grid">
            {dashboardStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
          <div className="hero-banner">
            <span>Backend target</span>
            <code>{process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"}</code>
          </div>
        </div>

        <div className="auth-panel">
          {!session ? (
            <div className="panel-grid">
              <form className="glass-card" onSubmit={handleLogin}>
                <h2>Login</h2>
                <label>Phone<input value={loginForm.phone} onChange={(e) => setLoginForm((c) => ({ ...c, phone: e.target.value }))} /></label>
                <label>Password<input type="password" value={loginForm.password} onChange={(e) => setLoginForm((c) => ({ ...c, password: e.target.value }))} /></label>
                <button className="primary-button" disabled={loading.login} type="submit">{loading.login ? "Signing in..." : "Sign In"}</button>
              </form>

              <form className="glass-card" onSubmit={handleRegister}>
                <h2>Create Account</h2>
                <div className="split-fields">
                  <label>Full name<input value={registerForm.fullName} onChange={(e) => setRegisterForm((c) => ({ ...c, fullName: e.target.value }))} /></label>
                  <label>Role<select value={registerForm.role} onChange={(e) => setRegisterForm((c) => ({ ...c, role: e.target.value }))}><option value="FARMER">Farmer</option><option value="BUYER">Buyer</option></select></label>
                </div>
                <div className="split-fields">
                  <label>Phone<input value={registerForm.phone} onChange={(e) => setRegisterForm((c) => ({ ...c, phone: e.target.value }))} /></label>
                  <label>Email<input value={registerForm.email} onChange={(e) => setRegisterForm((c) => ({ ...c, email: e.target.value }))} /></label>
                </div>
                <div className="split-fields">
                  <label>County<input value={registerForm.county} onChange={(e) => setRegisterForm((c) => ({ ...c, county: e.target.value }))} /></label>
                  <label>Sub-county<input value={registerForm.subCounty} onChange={(e) => setRegisterForm((c) => ({ ...c, subCounty: e.target.value }))} /></label>
                </div>
                <label>Password<input type="password" value={registerForm.password} onChange={(e) => setRegisterForm((c) => ({ ...c, password: e.target.value }))} /></label>
                <button className="primary-button" disabled={loading.register} type="submit">{loading.register ? "Creating..." : "Create Account"}</button>
              </form>
            </div>
          ) : (
            <div className="glass-card session-card">
              <div className="session-topline">
                <div>
                  <span className="badge">{session.user.role}</span>
                  <h2>{session.user.full_name}</h2>
                </div>
                <button className="ghost-button" onClick={logout} type="button">Sign Out</button>
              </div>
              <p>{isBuyer ? "You can buy and also upload product listings with images." : "You can manage your listings and incoming buyer orders."}</p>
            </div>
          )}
          {feedback ? <p className="feedback">{feedback}</p> : null}
        </div>
      </section>

      <section className="workspace">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Marketplace</span>
            <h2>Live listings</h2>
          </div>
          {loading.page ? <span className="loading-pill">Syncing...</span> : null}
        </div>
        <div className="listings-grid">
          {marketListings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <ListingVisual listing={listing} />
              <div className="listing-meta"><span>{listing.product_name}</span><span>{listing.county}</span></div>
              <h3>{listing.title}</h3>
              <p>{listing.description || "Fresh produce ready for delivery."}</p>
              <div className="listing-metrics"><strong>{formatMoney(listing.price_per_unit)}</strong><span>per {listing.unit}</span></div>
              <div className="listing-footer"><span>{listing.quantity_available} {listing.unit} available</span><span>Seller: {listing.seller_name}</span></div>
              {isBuyer ? (
                <form className="inline-order-form" onSubmit={(event) => handleCreateOrder(event, listing.id)}>
                  <input type="number" min={listing.minimum_order_quantity || 1} placeholder={`Min ${listing.minimum_order_quantity || 1}`} value={orderDrafts[listing.id]?.quantity || ""} onChange={(e) => updateOrderDraft(listing.id, "quantity", e.target.value)} />
                  <input placeholder="Delivery address" value={orderDrafts[listing.id]?.deliveryAddress || ""} onChange={(e) => updateOrderDraft(listing.id, "deliveryAddress", e.target.value)} />
                  <input placeholder="Delivery notes" value={orderDrafts[listing.id]?.deliveryNotes || ""} onChange={(e) => updateOrderDraft(listing.id, "deliveryNotes", e.target.value)} />
                  <button className="primary-button" disabled={loading.order} type="submit">{loading.order ? "Ordering..." : "Place Order"}</button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {canSell ? (
        <section className="workspace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Seller Studio</span>
              <h2>Upload products from your device</h2>
            </div>
          </div>
          <div className="panel-grid">
            <form className="glass-card" onSubmit={handleCreateFarm}>
              <h3>Workspace</h3>
              <div className="split-fields">
                <label>Name<input value={farmForm.farmName} onChange={(e) => setFarmForm((c) => ({ ...c, farmName: e.target.value }))} /></label>
                <label>County<input value={farmForm.county} onChange={(e) => setFarmForm((c) => ({ ...c, county: e.target.value }))} /></label>
              </div>
              <div className="split-fields">
                <label>Sub-county<input value={farmForm.subCounty} onChange={(e) => setFarmForm((c) => ({ ...c, subCounty: e.target.value }))} /></label>
                <label>Village<input value={farmForm.village} onChange={(e) => setFarmForm((c) => ({ ...c, village: e.target.value }))} /></label>
              </div>
              <div className="split-fields">
                <label>Acreage<input type="number" step="0.1" value={farmForm.acreage} onChange={(e) => setFarmForm((c) => ({ ...c, acreage: e.target.value }))} /></label>
                <label>Type<input value={farmForm.soilType} onChange={(e) => setFarmForm((c) => ({ ...c, soilType: e.target.value }))} /></label>
              </div>
              <button className="primary-button" disabled={loading.farm} type="submit">{loading.farm ? "Saving..." : "Save Workspace"}</button>
            </form>

            <form className="glass-card" onSubmit={handleCreateListing}>
              <h3>New listing</h3>
              <div className="split-fields">
                <label>Workspace<select value={listingForm.farmId} onChange={(e) => setListingForm((c) => ({ ...c, farmId: e.target.value }))}><option value="">Select</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.farm_name}</option>)}</select></label>
                <label>Product<select value={listingForm.productId} onChange={(e) => setListingForm((c) => ({ ...c, productId: e.target.value }))}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
              </div>
              <label>Title<input value={listingForm.title} onChange={(e) => setListingForm((c) => ({ ...c, title: e.target.value }))} /></label>
              <label>Description<textarea value={listingForm.description} onChange={(e) => setListingForm((c) => ({ ...c, description: e.target.value }))} /></label>
              <div className="split-fields">
                <label>Quantity<input type="number" value={listingForm.quantityAvailable} onChange={(e) => setListingForm((c) => ({ ...c, quantityAvailable: e.target.value }))} /></label>
                <label>Unit<input value={listingForm.unit} onChange={(e) => setListingForm((c) => ({ ...c, unit: e.target.value }))} /></label>
              </div>
              <div className="split-fields">
                <label>Price per unit<input type="number" value={listingForm.pricePerUnit} onChange={(e) => setListingForm((c) => ({ ...c, pricePerUnit: e.target.value }))} /></label>
                <label>Minimum order<input type="number" value={listingForm.minimumOrderQuantity} onChange={(e) => setListingForm((c) => ({ ...c, minimumOrderQuantity: e.target.value }))} /></label>
              </div>
              <label>Images<input accept="image/*" id="listing-images" multiple type="file" onChange={(e) => setListingImages(Array.from(e.target.files || []))} /></label>
              {listingImages.length ? <div className="file-chip-row">{listingImages.map((file) => <span className="file-chip" key={`${file.name}-${file.lastModified}`}>{file.name}</span>)}</div> : null}
              <button className="primary-button" disabled={loading.listing} type="submit">{loading.listing ? "Publishing..." : "Publish Listing"}</button>
            </form>
          </div>

          <div className="dashboard-grid">
            <div className="glass-card dashboard-card">
              <h3>My listings</h3>
              {myListings.length ? (
                <div className="mini-list">
                  {myListings.map((listing) => (
                    <article className="mini-list-item" key={listing.id}>
                      <ListingVisual listing={listing} />
                      <div>
                        <strong>{listing.title}</strong>
                        <span>{listing.quantity_available} {listing.unit}</span>
                        <span>{formatMoney(listing.price_per_unit)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p>No listings yet.</p>}
            </div>

            <div className="glass-card dashboard-card">
              <h3>Orders on my listings</h3>
              {sellerOrders.length ? (
                <div className="order-list">
                  {sellerOrders.map((order) => (
                    <article className="order-item" key={order.id}>
                      <div><strong>Order #{order.id}</strong><span>{order.listing_title}</span></div>
                      <div><span>Status: {order.status}</span><span>Payment: {order.payment_status || "Pending"}</span></div>
                      <strong>{formatMoney(order.total_amount)}</strong>
                    </article>
                  ))}
                </div>
              ) : <p>No seller-side orders yet.</p>}
            </div>
          </div>
        </section>
      ) : null}

      {isBuyer ? (
        <section className="workspace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Buyer Dashboard</span>
              <h2>My orders</h2>
            </div>
          </div>
          <div className="glass-card dashboard-card">
            {buyerOrders.length ? (
              <div className="order-list">
                {buyerOrders.map((order) => (
                  <article className="order-item" key={order.id}>
                    <div><strong>Order #{order.id}</strong><span>{order.listing_title}</span></div>
                    <div><span>Status: {order.status}</span><span>Payment: {order.payment_status || "Pending"}</span></div>
                    <div className="order-actions">
                      <strong>{formatMoney(order.total_amount)}</strong>
                      {order.status === "PENDING_PAYMENT" ? <button className="accent-button" disabled={loading.payment} onClick={() => handlePaymentStart(order.id)} type="button">Pay Now</button> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : <p>No buyer orders yet.</p>}
          </div>
        </section>
      ) : null}
    </main>
  );
}
