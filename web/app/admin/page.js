"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, clearSession, getStoredSession } from "../../lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    role: "",
    status: "ALL",
    q: ""
  });
  const [loading, setLoading] = useState({
    page: true,
    users: true,
    actionId: null
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = getStoredSession();

    if (!stored?.token) {
      router.replace("/login");
      return;
    }

    if (stored.user?.role !== "ADMIN") {
      router.replace("/seller");
      return;
    }

    setSession(stored);
    void Promise.all([loadOverview(stored.token), loadUsers(stored.token, filters)]);
  }, [router]);

  async function loadOverview(token) {
    setLoading((current) => ({ ...current, page: true }));

    try {
      const payload = await apiRequest("/admin/overview", { token });
      setOverview(payload);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading((current) => ({ ...current, page: false }));
    }
  }

  async function loadUsers(token, nextFilters = filters) {
    setLoading((current) => ({ ...current, users: true }));

    try {
      const params = new URLSearchParams();

      if (nextFilters.role) {
        params.set("role", nextFilters.role);
      }

      if (nextFilters.status) {
        params.set("status", nextFilters.status);
      }

      if (nextFilters.q) {
        params.set("q", nextFilters.q);
      }

      const payload = await apiRequest(`/admin/users?${params.toString()}`, { token });
      setUsers(payload);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading((current) => ({ ...current, users: false }));
    }
  }

  async function handleRefresh() {
    if (!session?.token) {
      return;
    }

    setError("");
    setMessage("");
    await Promise.all([loadOverview(session.token), loadUsers(session.token)]);
  }

  async function handleUserUpdate(userId, payload) {
    if (!session?.token) {
      return;
    }

    setLoading((current) => ({ ...current, actionId: userId }));
    setError("");
    setMessage("");

    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: "PATCH",
        token: session.token,
        body: payload
      });
      setMessage("User account updated.");
      await Promise.all([loadOverview(session.token), loadUsers(session.token)]);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setLoading((current) => ({ ...current, actionId: null }));
    }
  }

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  const roleCards = useMemo(() => overview?.usersByRole || [], [overview]);

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-8 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 rounded-[32px] bg-slate-950 px-8 py-8 text-white shadow-2xl shadow-slate-300/30 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Admin dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Premium oversight and user management.</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-white/70">
              Signed in as {session?.user?.full_name || "Admin"}. Review marketplace performance, monitor premium intelligence, and manage user accounts from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5" href="/">
              Marketplace
            </Link>
            <button className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5" onClick={handleRefresh} type="button">
              Refresh
            </button>
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

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total users" value={String(overview?.stats.totalUsers || 0)} />
          <StatCard label="Active users" value={String(overview?.stats.activeUsers || 0)} />
          <StatCard label="Pro farmers" value={String(overview?.stats.proFarmers || 0)} />
          <StatCard label="Mapped fields" value={String(overview?.stats.mappedFields || 0)} />
          <StatCard label="Revenue" value={formatCurrency(overview?.stats.grossRevenue || 0)} />
        </div>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Premium intelligence</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Platform-wide live overview</h2>
            </div>
            <div className="rounded-2xl bg-[#eef3e7] px-4 py-3 text-sm font-semibold text-emerald-800">
              {overview?.premiumOverview.onlineSensors || 0}/{overview?.premiumOverview.totalSensors || 0} sensors online
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-stone-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Users by role</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {roleCards.map((item) => (
                  <div key={item.role} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.role}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{item.total}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-stone-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Recent weather snapshots</p>
              <div className="mt-5 space-y-3">
                {(overview?.premiumOverview.recentWeather || []).map((item, index) => (
                  <div key={`${item.farmName}-${index}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{item.farmName}</p>
                        <p className="text-sm text-slate-500">{item.farmerName}</p>
                      </div>
                      <div className="text-right text-sm text-slate-600">
                        <p>{item.summaryLabel || "Weather pending"}</p>
                        <p>{item.currentTemperatureC ?? "--"}°C</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!overview?.premiumOverview.recentWeather?.length ? (
                  <p className="text-sm text-slate-500">No live weather snapshots yet.</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-slate-200 bg-stone-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Recent sensors</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(overview?.premiumOverview.recentSensors || []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.farmName}</p>
                      <p className="text-sm text-slate-500">{item.farmerName}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "online" ? "bg-emerald-100 text-emerald-700" : item.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>{item.provider}</span>
                    <span>Battery {item.batteryLevel ?? "--"}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">User accounts</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Manage platform users</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                value={filters.role}
              >
                <option value="">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="FARMER">Farmer</option>
                <option value="BUYER">Buyer</option>
                <option value="EXPERT">Expert</option>
                <option value="TRANSPORTER">Transporter</option>
              </select>
              <select
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                value={filters.status}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active only</option>
                <option value="INACTIVE">Inactive only</option>
              </select>
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                placeholder="Search name, phone, email"
                value={filters.q}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              onClick={() => loadUsers(session?.token, filters)}
              type="button"
            >
              Apply filters
            </button>
          </div>

          {loading.users ? (
            <div className="mt-8 text-sm text-slate-500">Loading user accounts...</div>
          ) : null}

          {!loading.users ? (
            <div className="mt-8 overflow-hidden rounded-[28px] border border-slate-200">
              <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1.1fr] gap-3 bg-[#f5f7ef] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 lg:grid">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Farms</span>
                <span>Listings</span>
                <span>Membership</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-slate-200">
                {users.map((user) => (
                  <div key={user.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.8fr_1fr_1.1fr] lg:items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{user.full_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{user.phone}{user.email ? ` · ${user.email}` : ""}</p>
                    </div>
                    <span className="text-sm text-slate-700">{user.role}</span>
                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-sm text-slate-700">{user.farms_count}</span>
                    <span className="text-sm text-slate-700">{user.listings_count}</span>
                    <span className="text-sm text-slate-700">{user.active_membership_name || "None"}</span>
                    <div className="flex flex-wrap gap-2">
                      <select
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-500"
                        defaultValue={user.role}
                        onChange={(event) => handleUserUpdate(user.id, { role: event.target.value })}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="FARMER">Farmer</option>
                        <option value="BUYER">Buyer</option>
                        <option value="EXPERT">Expert</option>
                        <option value="TRANSPORTER">Transporter</option>
                      </select>
                      <button
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                        disabled={loading.actionId === user.id}
                        onClick={() => handleUserUpdate(user.id, { isActive: !Boolean(user.is_active) })}
                        type="button"
                      >
                        {loading.actionId === user.id ? "Saving..." : user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}
