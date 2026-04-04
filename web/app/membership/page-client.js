"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, getStoredSession } from "../../lib/api";

export default function MembershipPageClient({ selectedPlanCode }) {
  const [session, setSession] = useState(null);
  const [plans, setPlans] = useState([]);
  const [membershipData, setMembershipData] = useState({ currentMembership: null, memberships: [] });
  const [loading, setLoading] = useState({ page: true, subscribePlan: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = getStoredSession();
    setSession(stored);
    void loadPage(stored);
  }, []);

  async function loadPage(activeSession = session) {
    setLoading((current) => ({ ...current, page: true }));
    setError("");

    try {
      const requests = [apiRequest("/membership-plans")];

      if (activeSession?.token) {
        requests.push(apiRequest("/memberships/me", { token: activeSession.token }));
      }

      const [planData, membershipResponse] = await Promise.all(requests);
      setPlans(planData);

      if (membershipResponse) {
        setMembershipData(membershipResponse);
      } else {
        setMembershipData({ currentMembership: null, memberships: [] });
      }
    } catch (loadError) {
      setError(loadError.message || "Unable to load membership plans.");
    } finally {
      setLoading((current) => ({ ...current, page: false }));
    }
  }

  async function handleSubscribe(planCode) {
    if (!session?.token) {
      window.location.href = "/signup";
      return;
    }

    setLoading((current) => ({ ...current, subscribePlan: planCode }));
    setError("");
    setMessage("");

    try {
      const signupResponse = await apiRequest("/memberships", {
        method: "POST",
        token: session.token,
        body: { planCode }
      });

      const membership = signupResponse.membership;

      if (!signupResponse.requiresPayment || membership.status === "ACTIVE") {
        setMessage(`${membership.plan_name} is now active on your account.`);
        await loadPage(session);
        return;
      }

      const callbackUrl = `${window.location.origin}/membership/callback`;
      const paymentResponse = await apiRequest(`/memberships/${membership.id}/initialize-payment`, {
        method: "POST",
        token: session.token,
        body: { callbackUrl }
      });

      const checkoutUrl = paymentResponse.checkout?.authorization_url;

      if (!checkoutUrl) {
        throw new Error("Membership checkout link was not returned.");
      }

      window.location.href = checkoutUrl;
    } catch (subscribeError) {
      setError(subscribeError.message || "Unable to start membership signup.");
    } finally {
      setLoading((current) => ({ ...current, subscribePlan: "" }));
    }
  }

  const highlightedPlan = useMemo(() => {
    if (!selectedPlanCode) {
      return "";
    }

    return plans.find((plan) => plan.code === selectedPlanCode)?.code || "";
  }, [plans, selectedPlanCode]);

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-10 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-300/30 lg:px-12 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Membership signup</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Choose the plan that fits how you farm.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/70">
            Membership plans unlock premium advisory support, farm reporting, and live intelligence. Paid plans use Paystack checkout and activate on successful verification.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              href="/"
            >
              Back home
            </Link>
            {session?.token ? (
              <Link
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                href={session.user?.role === "BUYER" ? "/buyer" : "/seller"}
              >
                Open dashboard
              </Link>
            ) : (
              <Link
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
                href="/signup"
              >
                Create account
              </Link>
            )}
          </div>
        </section>

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

        {membershipData.currentMembership ? (
          <section className="mt-8 rounded-[32px] border border-emerald-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Current membership</p>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {membershipData.currentMembership.plan_name}
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Status: {membershipData.currentMembership.status.replaceAll("_", " ")}
                  {membershipData.currentMembership.expires_at
                    ? ` · Expires ${formatDate(membershipData.currentMembership.expires_at)}`
                    : ""}
                </p>
              </div>
              <StatusBadge status={membershipData.currentMembership.status} />
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Plans</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Membership access for farmers
              </h2>
            </div>
            {!session?.token ? (
              <p className="text-sm text-slate-500">Create a farmer account first, then choose a plan.</p>
            ) : null}
          </div>

          {loading.page ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
                  <div className="mt-4 h-8 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="mt-6 h-32 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading.page ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {plans.map((plan) => {
                const isHighlighted = highlightedPlan === plan.code;
                const isCurrent = membershipData.currentMembership?.plan_id === plan.id;
                const subscribeLoading = loading.subscribePlan === plan.code;

                return (
                  <article
                    key={plan.id}
                    className={`rounded-[28px] border p-7 shadow-sm transition ${
                      isHighlighted
                        ? "border-emerald-700 bg-emerald-700 text-white shadow-xl shadow-emerald-700/20"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${isHighlighted ? "text-emerald-100" : "text-emerald-700"}`}>
                          {plan.audience}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-tight">{plan.name}</h3>
                      </div>
                      {isCurrent ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isHighlighted ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                          Current
                        </span>
                      ) : null}
                    </div>

                    <p className={`mt-4 text-4xl font-semibold tracking-tight ${isHighlighted ? "text-white" : "text-slate-950"}`}>
                      {formatCurrency(plan.price)}
                      <span className={`ml-2 text-base font-medium ${isHighlighted ? "text-white/70" : "text-slate-500"}`}>
                        / {plan.billing_period.toLowerCase()}
                      </span>
                    </p>

                    <p className={`mt-4 text-sm leading-7 ${isHighlighted ? "text-white/80" : "text-slate-600"}`}>
                      {plan.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3 text-sm">
                          <span className={isHighlighted ? "text-emerald-100" : "text-emerald-700"}>{"\u2713"}</span>
                          <span className={isHighlighted ? "text-white/85" : "text-slate-600"}>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {session?.token ? (
                      <button
                        className={`mt-7 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isHighlighted
                            ? "bg-white text-emerald-800 hover:bg-emerald-50"
                            : "bg-slate-950 text-white hover:bg-slate-800"
                        }`}
                        disabled={subscribeLoading}
                        onClick={() => handleSubscribe(plan.code)}
                        type="button"
                      >
                        {subscribeLoading ? "Preparing checkout..." : isCurrent ? "Manage current plan" : "Sign up"}
                      </button>
                    ) : (
                      <Link
                        className={`mt-7 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          isHighlighted
                            ? "bg-white text-emerald-800 hover:bg-emerald-50"
                            : "bg-slate-950 text-white hover:bg-slate-800"
                        }`}
                        href="/signup"
                      >
                        Create farmer account
                      </Link>
                    )}
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

function StatusBadge({ status }) {
  const tone =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700"
      : status === "PENDING_PAYMENT"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${tone}`}>
      {status.replaceAll("_", " ")}
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

function formatDate(value) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium"
  }).format(new Date(value));
}
