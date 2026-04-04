"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredSession, loginUser, registerUser, saveSession } from "../../lib/api";

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  role: "FARMER",
  county: "",
  subCounty: ""
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
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
      await registerUser(form);
      const session = await loginUser({
        phone: form.phone,
        password: form.password
      });
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
        <section className="rounded-[32px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-lime-900 p-8 text-white shadow-2xl shadow-slate-300/30 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Create account</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Join as a farmer.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
            Create your farmer account, unlock seller tools, and start uploading produce listings with images from your device.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Step 1</p>
              <p className="mt-2 text-base font-semibold">Create profile</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Step 2</p>
              <p className="mt-2 text-base font-semibold">Open seller area</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Step 3</p>
              <p className="mt-2 text-base font-semibold">Upload products</p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 lg:p-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Membership access</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sign up</h2>
            </div>
            <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-800" href="/">
              Back home
            </Link>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Full name</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} value={form.fullName} />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Phone</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" value={form.email} />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">County</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setForm((current) => ({ ...current, county: event.target.value }))} value={form.county} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">Sub-county</span>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setForm((current) => ({ ...current, subCounty: event.target.value }))} value={form.subCounty} />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Password</span>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500" onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} type="password" value={form.password} />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button className="w-full rounded-2xl bg-emerald-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
              Login here
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
