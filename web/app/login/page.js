"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredSession, loginUser, saveSession } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (session?.token) {
      router.replace("/seller");
    }
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await loginUser(form);
      saveSession(session);
      router.push("/seller");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-lime-50 px-6 py-10 text-slate-900 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/30 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Login</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Welcome back to FarmMarket.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
            Sign in to manage produce listings, upload farm products with images, and reach buyers faster.
          </p>
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-white/60">What you can do after login</p>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li>Create your seller workspace</li>
              <li>Upload listings with multiple product images</li>
              <li>Track marketplace activity in one place</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 lg:p-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Account access</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Login</h2>
            </div>
            <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/">
              Back home
            </Link>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Phone number</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+2547..."
                value={form.phone}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Password</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500"
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Your password"
                type="password"
                value={form.password}
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            New here?{" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/signup">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
