import Link from "next/link";
import FeaturedMarketplace from "./featured-marketplace";

export default function MarketplaceLandingPage() {
  const stats = [
    { label: "Farmers onboarded", value: "2,400+" },
    { label: "Produce orders", value: "18K+" },
    { label: "Advisory requests", value: "9,600+" }
  ];

  const features = [
    {
      title: "Sell produce directly",
      description:
        "List vegetables, grains, fruits, dairy, and other farm products in a trusted marketplace built for farmers and buyers.",
      icon: "\u{1F33E}"
    },
    {
      title: "Field management",
      description:
        "Let farmers map and organize fields, track crop stages, and manage work from multiple plots in one place.",
      icon: "\u{1F5FA}\u{FE0F}"
    },
    {
      title: "Access expert farm advice",
      description:
        "Connect farmers with specialists for crop disease protection, treatment guidance, and better day-to-day farm decisions.",
      icon: "\u{1FA7A}"
    },
    {
      title: "Live weather and farm planning",
      description:
        "Show weather updates, seasonal forecasts, and practical farming procedures from land preparation to harvesting.",
      icon: "\u{1F326}\u{FE0F}"
    },
    {
      title: "Scouting and notes",
      description:
        "Capture field observations, pest sightings, farm notes, and follow-up actions from the office or while in the field.",
      icon: "\u{1F4DD}"
    },
    {
      title: "Storefront and buyer access",
      description:
        "Give each farmer a clean produce storefront so buyers can browse, compare, and place orders with confidence.",
      icon: "\u{1F6D2}"
    },
    {
      title: "Reports, expenses, and income",
      description:
        "Generate reports, monitor farm performance, and track expenses and income for stronger decision-making.",
      icon: "\u{1F4C8}"
    },
    {
      title: "Membership subscriptions",
      description:
        "Unlock premium weather intelligence, specialist support, advanced reports, and buyer tools through subscriptions.",
      icon: "\u{1F4B3}"
    }
  ];

  const steps = [
    {
      title: "Join as a farmer",
      description: "Create your farmer account, set up your profile, and unlock the tools needed to sell and manage your farm digitally."
    },
    {
      title: "Subscribe for premium tools",
      description: "Upgrade to premium membership for specialist advice, weather intelligence, and advanced farm reporting."
    },
    {
      title: "Sell, learn, and grow",
      description: "Farmers publish produce, access expert guidance, generate reports, and reach ready buyers while visitors can order through guest checkout."
    }
  ];

  const plans = [
    {
      code: "LITE_FARMER",
      name: "Lite Farmer",
      price: "KSh 0/mo",
      points: ["List produce", "Basic field records", "Buyer discovery", "Basic profile"],
      highlight: false
    },
    {
      code: "PRO_FARMER",
      name: "Pro Farmer",
      price: "KSh 1,500/mo",
      points: ["Specialist advice", "Weather updates", "Scouting notes", "Farm reports", "Expenses and income"],
      highlight: true
    }
  ];

  const tools = [
    {
      eyebrow: "Monitor fields from anywhere",
      title: "Fields management",
      description:
        "Add plots, organize crop activities, and view farm operations from one clean dashboard built for both office work and field movement.",
      accent: "Field map and crop cards"
    },
    {
      eyebrow: "Make smarter daily decisions",
      title: "Weather intelligence",
      description:
        "Use live local weather, rainfall outlooks, and temperature patterns to plan irrigation, spraying, planting, and harvesting at the right time.",
      accent: "Live weather panel"
    },
    {
      eyebrow: "Add notes from the farm",
      title: "Scouting and notes",
      description:
        "Record pest issues, disease observations, field photos, and action notes so specialists and farm teams can respond faster.",
      accent: "Scouting log and reminders"
    },
    {
      eyebrow: "Sell directly to buyers",
      title: "Farmer storefront",
      description:
        "Each farmer gets a clean storefront for produce listings, pricing, stock visibility, and faster checkout by buyers.",
      accent: "Produce catalog and cart"
    },
    {
      eyebrow: "Stay aware of your business",
      title: "Expenses and income",
      description:
        "Track input costs, sales, and profit trends while generating reports that help farmers understand farm performance month by month.",
      accent: "Income charts and summaries"
    }
  ];

  const clients = ["Cooperatives", "Agrovets", "Export Buyers", "Farm Groups", "Processors"];

  return (
    <main className="min-h-screen bg-lime-50/40 text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-emerald-100 via-lime-100/60 to-transparent" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-bold text-white shadow-lg shadow-emerald-700/20">
            FM
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">FarmMarket</p>
            <p className="text-xs text-slate-500">Farmers. Buyers. Experts.</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          <a href="#features" className="transition hover:text-slate-900">Features</a>
          <a href="#market" className="transition hover:text-slate-900">Marketplace</a>
          <a href="#membership" className="transition hover:text-slate-900">Membership</a>
          <Link href="/login" className="transition hover:text-slate-900">Login</Link>
        </nav>

        <Link
          href="/signup"
          className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
        >
          Join now
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-14 px-6 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-medium text-emerald-800 shadow-sm">
            Subscription-based agricultural marketplace
          </div>

          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            Where <span className="text-emerald-700">farmers and buyers</span> meet, trade, and grow smarter.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            A premium platform for selling farm produce, accessing specialist advice, monitoring live weather, learning best farming procedures, and generating farm reports under one membership experience.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Start as a farmer
            </Link>
            <a
              href="#market"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Explore produce
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-lg shadow-slate-200/60 backdrop-blur">
                <p className="text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-4 top-12 hidden h-36 w-36 rounded-full bg-emerald-200/60 blur-3xl lg:block" />
          <div className="absolute left-8 top-0 hidden h-24 w-24 rounded-full bg-lime-200/80 blur-2xl lg:block" />

          <div className="relative rounded-[32px] border border-white/70 bg-white p-4 shadow-2xl shadow-slate-300/40">
            <div className="rounded-[28px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-lime-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-200">Farm dashboard</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">Manage produce, weather, and advisory</h2>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/80">Live</div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-white/60">Produce sold</p>
                  <p className="mt-2 text-xl font-semibold">3.4 tons</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-white/60">Rain chance</p>
                  <p className="mt-2 text-xl font-semibold">72%</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-white/60">Advice requests</p>
                  <p className="mt-2 text-xl font-semibold">18</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Quick produce listing</p>
                      <p className="mt-1 text-sm text-slate-500">Add harvest details and reach buyers quickly</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Fast listing</span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-500">Product</label>
                      <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">Fresh Tomatoes</div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-500">Quantity</label>
                        <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">120 Crates</div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium text-slate-500">Price</label>
                        <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">KSh 2,500</div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/seller"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Publish produce
                  </Link>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Weather update</p>
                    <p className="mt-3 text-2xl font-semibold">18{"\u00B0"}C {"\u00B7"} Light rainfall</p>
                    <p className="mt-2 text-sm text-white/70">Good day for transplanting and soil moisture retention.</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Expert advice</p>
                    <p className="mt-3 text-base font-semibold">Possible early blight detected</p>
                    <p className="mt-2 text-sm text-white/70">Review leaf spots, isolate affected plants, and request specialist guidance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Core platform features</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Everything needed to support produce sales, farm decisions, and subscription-driven growth.
          </h3>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                {feature.icon}
              </div>
              <h4 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{feature.title}</h4>
              <p className="mt-3 text-base leading-7 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Platform tools</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">All the tools farmers need to grow and sell better.</h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            From field records to weather, scouting, storefront management, and farm finance reports, the interface supports the full agricultural workflow.
          </p>
        </div>

        <div className="mt-14 space-y-10">
          {tools.map((tool, index) => (
            <div key={tool.title} className="grid items-center gap-8 lg:grid-cols-2">
              <div className={`${index % 2 === 1 ? "lg:order-2" : ""}`}>
                <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60">
                  <div className="rounded-[24px] bg-gradient-to-br from-white to-emerald-50 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Dashboard preview</p>
                        <h4 className="mt-2 text-lg font-semibold text-slate-950">{tool.accent}</h4>
                      </div>
                      <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Live module</div>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-[0.34fr_0.66fr]">
                      <div className="rounded-2xl bg-slate-950 p-4 text-white">
                        <div className="space-y-2 text-xs text-white/70">
                          <div className="rounded-lg bg-white/10 px-3 py-2">Overview</div>
                          <div className="rounded-lg bg-white/10 px-3 py-2">Fields</div>
                          <div className="rounded-lg bg-white/10 px-3 py-2">Weather</div>
                          <div className="rounded-lg bg-white/10 px-3 py-2">Reports</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="h-28 rounded-2xl bg-gradient-to-br from-lime-100 to-emerald-100" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="h-3 w-16 rounded bg-slate-200" />
                            <div className="mt-3 h-8 w-12 rounded bg-emerald-100" />
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="h-3 w-16 rounded bg-slate-200" />
                            <div className="mt-3 h-8 w-12 rounded bg-emerald-100" />
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="h-3 w-16 rounded bg-slate-200" />
                            <div className="mt-3 h-8 w-12 rounded bg-emerald-100" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{tool.eyebrow}</p>
                <h4 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{tool.title}</h4>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">{tool.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-4 lg:px-8 lg:py-8">
        <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-sm lg:px-10">
          <p className="text-2xl font-semibold tracking-tight text-slate-950">Featured clients</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {clients.map((client) => (
              <div key={client} className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-stone-50 text-sm font-semibold text-slate-600">
                {client}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="market" className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Marketplace</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Fresh farm produce featured from live published listings.</h3>
          </div>
          <Link href="/seller" className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800">
            Browse all produce {"\u2192"}
          </Link>
        </div>
        <FeaturedMarketplace />
      </section>

      <section id="membership" className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Membership plans</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Subscription access for farmers who want deeper tools.</h3>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Use recurring subscriptions to unlock premium specialist advice, local weather intelligence, and deeper farm reporting tools.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[28px] border p-7 shadow-sm ${
                  plan.highlight
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-xl shadow-emerald-700/20"
                    : "border-slate-200 bg-stone-50 text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold tracking-tight">{plan.name}</h4>
                  {plan.highlight ? (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">Most popular</span>
                  ) : null}
                </div>
                <p className={`mt-4 text-3xl font-semibold ${plan.highlight ? "text-white" : "text-slate-950"}`}>{plan.price}</p>
                <div className="mt-6 space-y-3">
                  {plan.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm">
                      <span className={`mt-0.5 ${plan.highlight ? "text-emerald-100" : "text-emerald-700"}`}>{"\u2713"}</span>
                      <span className={plan.highlight ? "text-white/85" : "text-slate-600"}>{point}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/membership?plan=${plan.code}`}
                  className={`mt-7 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-white text-emerald-800 hover:bg-emerald-50"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                >
                  Sign up
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm lg:p-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">How it works</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">A simple path from onboarding to better farm income.</h3>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-[28px] bg-stone-50 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-semibold text-white">
                  0{index + 1}
                </div>
                <h4 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{step.title}</h4>
                <p className="mt-3 text-base leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-4 lg:px-8 lg:pb-24">
        <div className="overflow-hidden rounded-[36px] bg-slate-950 px-8 py-12 text-white shadow-2xl shadow-slate-300/30 lg:px-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Grow with confidence</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Give farmers better tools. Give buyers better access.
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                This concept is now tailored for an agricultural marketplace with subscriptions, specialist support, live farm intelligence, and reporting built into the experience.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                Create farmer account
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Join as buyer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
