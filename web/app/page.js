"use client";

import { useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  getStoredSession,
  loginUser,
  registerUser,
  saveSession
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
  minimumOrderQuantity: "",
  status: "ACTIVE"
};

const emptyOrderDraft = {};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [listings, setListings] = useState([]);
  const [farms, setFarms] = useState([]);
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [farmForm, setFarmForm] = useState(emptyFarmForm);
  const [listingForm, setListingForm] = useState(emptyListingForm);
  const [orderDraft, setOrderDraft] = useState(emptyOrderDraft);
  const [activePanel, setActivePanel] = useState("buyer");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState({
    listings: false,
    register: false,
    login: false,
    farm: false,
    listing: false,
    order: false,
    payment: false
  });

  const isFarmer = session?.user?.role === "FARMER";
  const isBuyer = session?.user?.role === "BUYER";

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
      setActivePanel(stored.user.role === "FARMER" ? "farmer" : "buyer");
    }
  }, []);

  useEffect(() => {
    void loadPublicData();
  }, []);

  useEffect(() => {
    if (session?.token && isFarmer) {
      void loadFarms(session.token, session.user.id);
    }
  }, [session, isFarmer]);

  const featuredStats = useMemo(
    () => [
      { label: "Live listings", value: listings.length || "00" },
      { label: "Seed products", value: products.length || "00" },
      { label: "MVP focus", value: "Farm -> Buyer -> Pay" }
    ],
    [listings.length, products.length]
  );

  async function loadPublicData() {
    setLoading((current) => ({ ...current, listings: true }));
    try {
      const [productsData, listingsData] = await Promise.all([
        apiRequest("/products"),
        apiRequest("/listings")
      ]);

      setProducts(productsData);
      setListings(listingsData);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, listings: false }));
    }
  }

  async function loadFarms(token, farmerId) {
    try {
      const farmData = await apiRequest(`/farms?farmerId=${farmerId}`, {
        token
      });

      setFarms(farmData);
      setListingForm((current) => ({
        ...current,
        farmId: farmData[0]?.id ? String(farmData[0].id) : ""
      }));
    } catch (error) {
      setFeedback(error.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, register: true }));
    setFeedback("");

    try {
      await registerUser(registerForm);
      setFeedback("Account created. Log in to continue.");
      setRegisterForm(emptyRegisterForm);
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
      setActivePanel(nextSession.user.role === "FARMER" ? "farmer" : "buyer");
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
      await loadFarms(session.token, session.user.id);
      setFeedback("Farm profile created.");
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
      await apiRequest("/listings", {
        method: "POST",
        token: session.token,
        body: {
          ...listingForm,
          farmId: Number(listingForm.farmId),
          productId: Number(listingForm.productId),
          quantityAvailable: Number(listingForm.quantityAvailable),
          pricePerUnit: Number(listingForm.pricePerUnit),
          minimumOrderQuantity: Number(listingForm.minimumOrderQuantity || 1)
        }
      });

      setListingForm((current) => ({
        ...emptyListingForm,
        farmId: current.farmId,
        productId: current.productId
      }));
      await loadPublicData();
      setFeedback("Listing published successfully.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, listing: false }));
    }
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();
    setLoading((current) => ({ ...current, order: true }));
    setFeedback("");

    try {
      const order = await apiRequest("/orders", {
        method: "POST",
        token: session.token,
        body: {
          listingId: Number(orderDraft.listingId),
          quantity: Number(orderDraft.quantity),
          deliveryAddress: orderDraft.deliveryAddress,
          deliveryNotes: orderDraft.deliveryNotes
        }
      });

      setOrderDraft({ orderId: order.id, listingId: order.listing_id });
      await loadPublicData();
      setFeedback(`Order #${order.id} created. You can now start payment.`);
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
          metadata: {
            source: "agrinova-web"
          }
        }
      });

      setFeedback("Payment session created. Opening Paystack checkout.");
      window.open(response.checkout.authorization_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading((current) => ({ ...current, payment: false }));
    }
  }

  function logout() {
    localStorage.removeItem("agrinova_session");
    setSession(null);
    setFarms([]);
    setActivePanel("buyer");
    setFeedback("Signed out.");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">AgriNova Marketplace MVP</span>
          <h1>The operating layer for farmers, buyers, and fast local trade.</h1>
          <p>
            Log in locally, publish produce, place orders, and launch a live Paystack
            checkout flow from one streamlined interface.
          </p>

          <div className="stats-grid">
            {featuredStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>

          <div className="hero-banner">
            <span>Current API target</span>
            <code>{process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1"}</code>
          </div>
        </div>

        <div className="auth-panel">
          <div className="panel-tabs">
            <button
              className={activePanel === "buyer" ? "active" : ""}
              onClick={() => setActivePanel("buyer")}
              type="button"
            >
              Buyer View
            </button>
            <button
              className={activePanel === "farmer" ? "active" : ""}
              onClick={() => setActivePanel("farmer")}
              type="button"
            >
              Farmer View
            </button>
          </div>

          {!session ? (
            <div className="panel-grid">
              <form className="glass-card" onSubmit={handleLogin}>
                <h2>Login</h2>
                <label>
                  Phone
                  <input
                    value={loginForm.phone}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    placeholder="+2547..."
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Your password"
                  />
                </label>
                <button className="primary-button" disabled={loading.login} type="submit">
                  {loading.login ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <form className="glass-card" onSubmit={handleRegister}>
                <h2>Create Account</h2>
                <div className="split-fields">
                  <label>
                    Full name
                    <input
                      value={registerForm.fullName}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, fullName: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Role
                    <select
                      value={registerForm.role}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, role: event.target.value }))
                      }
                    >
                      <option value="FARMER">Farmer</option>
                      <option value="BUYER">Buyer</option>
                    </select>
                  </label>
                </div>
                <div className="split-fields">
                  <label>
                    Phone
                    <input
                      value={registerForm.phone}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="split-fields">
                  <label>
                    County
                    <input
                      value={registerForm.county}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, county: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Sub-county
                    <input
                      value={registerForm.subCounty}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, subCounty: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <label>
                  Password
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </label>
                <button className="primary-button" disabled={loading.register} type="submit">
                  {loading.register ? "Creating..." : "Create Account"}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card session-card">
              <div className="session-topline">
                <div>
                  <span className="badge">{session.user.role}</span>
                  <h2>{session.user.full_name}</h2>
                </div>
                <button className="ghost-button" onClick={logout} type="button">
                  Sign Out
                </button>
              </div>
              <p>
                {isFarmer
                  ? "You can register farms and publish fresh produce for buyers."
                  : "You can browse listings, place orders, and start secure checkout."}
              </p>
            </div>
          )}

          {feedback ? <p className="feedback">{feedback}</p> : null}
        </div>
      </section>

      <section className="workspace">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Live marketplace</span>
            <h2>Fresh listings from the backend</h2>
          </div>
          {loading.listings ? <span className="loading-pill">Refreshing...</span> : null}
        </div>

        <div className="listings-grid">
          {listings.map((listing) => (
            <article className="listing-card" key={listing.id}>
              <div className="listing-meta">
                <span>{listing.product_name}</span>
                <span>{listing.county}</span>
              </div>
              <h3>{listing.title}</h3>
              <p>{listing.description || "Fresh produce ready for delivery."}</p>
              <div className="listing-metrics">
                <strong>{formatMoney(listing.price_per_unit)}</strong>
                <span>per {listing.unit}</span>
              </div>
              <div className="listing-footer">
                <span>
                  {listing.quantity_available} {listing.unit} available
                </span>
                <span>Farmer: {listing.farmer_name}</span>
              </div>

              {isBuyer ? (
                <form className="inline-order-form" onSubmit={handleOrderSubmit}>
                  <input
                    type="number"
                    min={listing.minimum_order_quantity || 1}
                    placeholder={`Min ${listing.minimum_order_quantity || 1}`}
                    value={orderDraft.listingId === listing.id ? orderDraft.quantity || "" : ""}
                    onChange={(event) =>
                      setOrderDraft({
                        listingId: listing.id,
                        quantity: event.target.value,
                        deliveryAddress: orderDraft.deliveryAddress || "",
                        deliveryNotes: orderDraft.deliveryNotes || ""
                      })
                    }
                  />
                  <input
                    placeholder="Delivery address"
                    value={orderDraft.listingId === listing.id ? orderDraft.deliveryAddress || "" : ""}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        listingId: listing.id,
                        deliveryAddress: event.target.value
                      }))
                    }
                  />
                  <input
                    placeholder="Delivery notes"
                    value={orderDraft.listingId === listing.id ? orderDraft.deliveryNotes || "" : ""}
                    onChange={(event) =>
                      setOrderDraft((current) => ({
                        ...current,
                        listingId: listing.id,
                        deliveryNotes: event.target.value
                      }))
                    }
                  />
                  <button className="primary-button" disabled={loading.order} type="submit">
                    {loading.order ? "Ordering..." : "Place Order"}
                  </button>
                </form>
              ) : null}

              {isBuyer && orderDraft.orderId && orderDraft.listingId === listing.id ? (
                <button
                  className="accent-button"
                  disabled={loading.payment}
                  onClick={() => handlePaymentStart(orderDraft.orderId)}
                  type="button"
                >
                  {loading.payment ? "Opening checkout..." : "Start Paystack Checkout"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {isFarmer ? (
        <section className="workspace farmer-tools">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Farmer control room</span>
              <h2>Register farms and publish produce</h2>
            </div>
          </div>

          <div className="panel-grid">
            <form className="glass-card" onSubmit={handleCreateFarm}>
              <h3>Create Farm</h3>
              <div className="split-fields">
                <label>
                  Farm name
                  <input
                    value={farmForm.farmName}
                    onChange={(event) =>
                      setFarmForm((current) => ({ ...current, farmName: event.target.value }))
                    }
                  />
                </label>
                <label>
                  County
                  <input
                    value={farmForm.county}
                    onChange={(event) =>
                      setFarmForm((current) => ({ ...current, county: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="split-fields">
                <label>
                  Sub-county
                  <input
                    value={farmForm.subCounty}
                    onChange={(event) =>
                      setFarmForm((current) => ({ ...current, subCounty: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Village
                  <input
                    value={farmForm.village}
                    onChange={(event) =>
                      setFarmForm((current) => ({ ...current, village: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="split-fields">
                <label>
                  Acreage
                  <input
                    type="number"
                    step="0.1"
                    value={farmForm.acreage}
                    onChange={(event) =>
                      setFarmForm((current) => ({ ...current, acreage: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Soil type
                  <input
                    value={farmForm.soilType}
                    onChange={(event) =>
                      setFarmForm((current) => ({ ...current, soilType: event.target.value }))
                    }
                  />
                </label>
              </div>
              <button className="primary-button" disabled={loading.farm} type="submit">
                {loading.farm ? "Saving..." : "Save Farm"}
              </button>
            </form>

            <form className="glass-card" onSubmit={handleCreateListing}>
              <h3>Publish Listing</h3>
              <div className="split-fields">
                <label>
                  Farm
                  <select
                    value={listingForm.farmId}
                    onChange={(event) =>
                      setListingForm((current) => ({ ...current, farmId: event.target.value }))
                    }
                  >
                    <option value="">Select farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.farm_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Product
                  <select
                    value={listingForm.productId}
                    onChange={(event) =>
                      setListingForm((current) => ({ ...current, productId: event.target.value }))
                    }
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Title
                <input
                  value={listingForm.title}
                  onChange={(event) =>
                    setListingForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label>
                Description
                <textarea
                  value={listingForm.description}
                  onChange={(event) =>
                    setListingForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>
              <div className="split-fields">
                <label>
                  Quantity
                  <input
                    type="number"
                    value={listingForm.quantityAvailable}
                    onChange={(event) =>
                      setListingForm((current) => ({
                        ...current,
                        quantityAvailable: event.target.value
                      }))
                    }
                  />
                </label>
                <label>
                  Unit
                  <input
                    value={listingForm.unit}
                    onChange={(event) =>
                      setListingForm((current) => ({ ...current, unit: event.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="split-fields">
                <label>
                  Price per unit
                  <input
                    type="number"
                    value={listingForm.pricePerUnit}
                    onChange={(event) =>
                      setListingForm((current) => ({
                        ...current,
                        pricePerUnit: event.target.value
                      }))
                    }
                  />
                </label>
                <label>
                  Minimum order
                  <input
                    type="number"
                    value={listingForm.minimumOrderQuantity}
                    onChange={(event) =>
                      setListingForm((current) => ({
                        ...current,
                        minimumOrderQuantity: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
              <button className="primary-button" disabled={loading.listing} type="submit">
                {loading.listing ? "Publishing..." : "Publish Listing"}
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </main>
  );
}
