"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, downloadApiFile } from "../../lib/api";

const sectionItems = [
  { id: "map", label: "Map View", short: "Map" },
  { id: "sensors", label: "IoT Sensors", short: "Sensors" },
  { id: "microbiome", label: "Microbiome Insights", short: "Microbiome" },
  { id: "recommendations", label: "Recommendations", short: "Advice" },
  { id: "interventions", label: "Interventions", short: "Actions" },
  { id: "reports", label: "Reports", short: "Reports" }
];

const emptyDashboard = {
  summary: {
    fieldCount: 0,
    avgHealth: 0,
    totalAcres: 0,
    sampleCount: 0,
    reportCount: 0
  },
  fields: [],
  sensors: [],
  sensorSummary: [],
  microbiome: {
    summary: {
      avgAlphaDiversity: 0,
      functionalPathways: 0,
      beneficialRatio: 0,
      diseaseRisk: "Low"
    },
    composition: [],
    trend: [],
    fieldComparisons: [],
    latestSample: null
  },
  recommendations: [],
  projectedImpact: [],
  treatmentEffectiveness: [],
  interventions: {
    list: [],
    trend: []
  },
  reports: []
};

export default function ProFarmerSuite({ farmerName, farmName, membershipName, token }) {
  const [activeSection, setActiveSection] = useState("map");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyKey, setBusyKey] = useState("");

  async function loadDashboard() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = await apiRequest("/pro-farmer/dashboard", { token });
      setDashboard(payload);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [token]);

  const stats = useMemo(
    () => [
      { label: "Fields", value: String(dashboard.summary.fieldCount) },
      { label: "Avg Health", value: String(dashboard.summary.avgHealth) },
      { label: "Total Acres", value: String(Math.round(dashboard.summary.totalAcres || 0)) }
    ],
    [dashboard.summary]
  );

  async function handleDownload(path, fallbackName) {
    setBusyKey(path);
    setMessage("");
    setError("");

    try {
      const { blob, filename } = await downloadApiFile(path, {
        token,
        filename: fallbackName
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setMessage(`Downloaded ${filename}.`);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setBusyKey("");
    }
  }

  async function handlePrint() {
    setBusyKey("print");
    setMessage("");
    setError("");

    try {
      const { blob } = await downloadApiFile("/pro-farmer/reports/print", {
        token,
        filename: "pro-farmer-report.html"
      });
      const html = await blob.text();
      const printWindow = window.open("", "_blank", "noopener,noreferrer");

      if (!printWindow) {
        throw new Error("Allow popups to open the printable report.");
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch (printError) {
      setError(printError.message);
    } finally {
      setBusyKey("");
    }
  }

  async function handleScheduleRecommendation(recommendationId) {
    setBusyKey(`recommendation-${recommendationId}`);
    setMessage("");
    setError("");

    try {
      const payload = await apiRequest(`/pro-farmer/recommendations/${recommendationId}/schedule`, {
        method: "POST",
        token
      });
      setMessage(payload.message || "Intervention scheduled.");
      await loadDashboard();
      setActiveSection("interventions");
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyKey("");
    }
  }

  const primarySensor = dashboard.sensors[0] || null;
  const fieldData = dashboard.fields;
  const microbiome = dashboard.microbiome;

  return (
    <section className="mt-8 overflow-hidden rounded-[36px] border border-emerald-100 bg-[#f5f7ef] shadow-2xl shadow-emerald-100/50">
      <div className="grid xl:grid-cols-[260px_1fr]">
        <aside className="border-b border-emerald-100 bg-white/90 px-5 py-6 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ScienceIcon />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">SoilzePro</p>
              <p className="text-xs text-slate-500">{membershipName || "Pro Farmer Suite"}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            {sectionItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-lg shadow-emerald-700/20"
                      : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                  onClick={() => setActiveSection(item.id)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <span className={`text-xs ${isActive ? "text-white/70" : "text-slate-400"}`}>{item.short}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 rounded-[28px] border border-emerald-100 bg-[#eef3e7] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white">
                {getInitials(farmerName)}
              </div>
              <div>
                <p className="font-semibold text-slate-950">{farmerName}</p>
                <p className="text-sm text-slate-500">{farmName || "Green Valley Farms"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
            Live exports, schedule tracking, and field diagnostics are enabled for this plan.
          </div>
        </aside>

        <div className="px-5 py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Pro farmer dashboard</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Premium intelligence across map, sensors, microbiome, and interventions.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                This suite is now backed by your live AgriNova data, with export-ready CSV files and printable reports.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-[28px] border border-emerald-100 bg-white px-4 py-3 shadow-sm">
              {stats.map((item) => (
                <Metric key={item.label} label={item.label} value={item.value} />
              ))}
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

          <div className="mt-6 flex flex-wrap gap-3">
            {sectionItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-emerald-100 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
                  }`}
                  onClick={() => setActiveSection(item.id)}
                  type="button"
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="mt-6 rounded-[28px] border border-emerald-100 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
              Loading Pro Farmer intelligence...
            </div>
          ) : null}

          {!loading && !fieldData.length ? (
            <div className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-10 text-center text-sm text-amber-800 shadow-sm">
              Add at least one farm workspace to activate your Pro Farmer map, sensor, and soil insights.
            </div>
          ) : null}

          {!loading && fieldData.length ? (
            <div className="mt-6">
              {activeSection === "map" ? (
                <MapSection
                  averageHealth={dashboard.summary.avgHealth}
                  fieldData={fieldData}
                  totalAcres={dashboard.summary.totalAcres}
                />
              ) : null}
              {activeSection === "sensors" ? (
                <SensorsSection primarySensor={primarySensor} sensorSummaries={dashboard.sensorSummary} sensors={dashboard.sensors} />
              ) : null}
              {activeSection === "microbiome" ? <MicrobiomeSection microbiome={microbiome} /> : null}
              {activeSection === "recommendations" ? (
                <RecommendationsSection
                  busyKey={busyKey}
                  onSchedule={handleScheduleRecommendation}
                  projectedImpact={dashboard.projectedImpact}
                  recommendations={dashboard.recommendations}
                  treatmentEffectiveness={dashboard.treatmentEffectiveness}
                />
              ) : null}
              {activeSection === "interventions" ? (
                <InterventionsSection interventions={dashboard.interventions} />
              ) : null}
              {activeSection === "reports" ? (
                <ReportsSection
                  averageHealth={dashboard.summary.avgHealth}
                  busyKey={busyKey}
                  fieldCount={dashboard.summary.fieldCount}
                  onDownload={handleDownload}
                  onPrint={handlePrint}
                  reportCount={dashboard.summary.reportCount}
                  reports={dashboard.reports}
                  sampleCount={dashboard.summary.sampleCount}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MapSection({ fieldData, averageHealth, totalAcres }) {
  const positions = [
    "left-[16%] top-[68%]",
    "left-[43%] top-[52%]",
    "left-[60%] top-[30%]",
    "left-[75%] top-[70%]"
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
      <div className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4">
          <div className="flex flex-wrap gap-3">
            {["Standard", "Satellite", "Terrain"].map((layer, index) => (
              <button
                key={layer}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${index === 0 ? "bg-emerald-700 text-white" : "bg-[#f4f7ef] text-slate-600"}`}
                type="button"
              >
                {layer}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-[#eef3e7] px-4 py-2 text-sm font-medium text-slate-600">
            {fieldData.length} fields
          </span>
        </div>

        <div className="p-4">
          <div className="relative min-h-[470px] overflow-hidden rounded-[28px] border border-emerald-100 bg-[radial-gradient(circle_at_20%_20%,rgba(186,214,176,0.38),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(214,226,194,0.42),transparent_28%),linear-gradient(135deg,#ecf3df,#f8fbf3)]">
            <div className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-200/60">
              Farm Field Overview
            </div>
            <div className="absolute right-5 top-5 flex flex-col gap-3">
              {["+", "-", "↗"].map((item) => (
                <button key={item} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-slate-700 shadow-lg shadow-slate-200/60" type="button">
                  {item}
                </button>
              ))}
            </div>

            {fieldData.map((field, index) => (
              <div key={field.id} className={`absolute ${positions[index] || positions[index % positions.length]}`}>
                <div className="rounded-[20px] border border-emerald-200 bg-emerald-700/90 px-3 py-2 text-xs font-semibold text-white shadow-xl shadow-emerald-700/20">
                  <div>{field.name}</div>
                  <div className="mt-1 text-[11px] text-emerald-100">{field.crop}</div>
                </div>
              </div>
            ))}

            <div className="absolute bottom-5 left-5 rounded-[24px] bg-white px-4 py-4 shadow-lg shadow-slate-200/60">
              <p className="text-sm font-semibold text-slate-700">Soil Health Index</p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500">
                <LegendDot color="bg-emerald-700" label="Excellent (80+)" />
                <LegendDot color="bg-lime-400" label="Good (65-79)" />
                <LegendDot color="bg-amber-400" label="Fair (50-64)" />
                <LegendDot color="bg-rose-500" label="Poor (<50)" />
              </div>
            </div>

            <div className="absolute bottom-5 right-5 rounded-full bg-white px-5 py-3 text-xs text-slate-500 shadow-lg shadow-slate-200/60">
              0m    500m    1km
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <SummaryCard title="Fields" value={`${fieldData.length}`} detail="Active mapped fields" />
          <SummaryCard title="Avg Health" value={`${averageHealth}`} detail="Composite soil health score" />
          <SummaryCard title="Total Acres" value={`${Math.round(totalAcres)}`} detail="Monitored acreage" />
        </div>

        <div className="rounded-[32px] border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">All Fields</h3>
            <span className="text-sm text-slate-500">{fieldData.length} total</span>
          </div>
          <div className="mt-5 space-y-4">
            {fieldData.map((field) => (
              <div key={field.id} className="rounded-[24px] border border-slate-200 bg-[#fafcf7] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{field.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{field.crop} · {field.acreage.toFixed(1)} acres</p>
                  </div>
                  <span className="mt-2 h-3 w-3 rounded-full bg-emerald-700" />
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-slate-200">
                  <div className="h-2.5 rounded-full bg-emerald-700" style={{ width: `${field.health}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{field.soil}</span>
                  <span>{field.health}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SensorsSection({ sensorSummaries, sensors, primarySensor }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sensorSummaries.map((item) => (
          <SummaryCard key={item.label} title={item.label} value={item.value} detail={item.detail} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Active Sensors</h3>
          <div className="mt-5 space-y-3">
            {sensors.map((sensor, index) => (
              <div key={sensor.id} className={`rounded-[24px] border p-4 ${index === 0 ? "border-emerald-200 bg-[#eef3e7]" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{sensor.fieldName} - {sensor.zoneName}</p>
                    <p className="mt-1 text-sm text-slate-500">Battery: {sensor.batteryLevel}%</p>
                  </div>
                  <span className="text-sm text-slate-500">{sensor.lastSeenMinutes} min ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {primarySensor ? (
          <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{primarySensor.fieldName} - {primarySensor.zoneName}</h3>
                <p className="mt-2 text-sm text-slate-500">{primarySensor.sensorType} · Updated {primarySensor.lastSeenMinutes} min ago</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${primarySensor.status === "online" ? "bg-emerald-100 text-emerald-700" : primarySensor.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700"}`}>
                {primarySensor.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 rounded-[28px] bg-[#f2f6ec] p-5 sm:grid-cols-4">
              <StatPanel label="Temperature" value={`${primarySensor.temperature}°C`} />
              <StatPanel label="Moisture" value={`${primarySensor.moisture}%`} />
              <StatPanel label="EC" value={`${primarySensor.ec} dS/m`} />
              <StatPanel label="pH" value={`${primarySensor.ph}`} />
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Battery Level</span>
                <span>{primarySensor.batteryLevel}%</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-200">
                <div className="h-3 rounded-full bg-emerald-700" style={{ width: `${primarySensor.batteryLevel}%` }} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MicrobiomeSection({ microbiome }) {
  const composition = microbiome.composition || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Avg Alpha Diversity" value={`${microbiome.summary.avgAlphaDiversity}`} detail="Across recorded samples" />
        <SummaryCard title="Functional Pathways" value={`${microbiome.summary.functionalPathways}`} detail="Detected in recent analysis" />
        <SummaryCard title="Beneficial Ratio" value={`${microbiome.summary.beneficialRatio}%`} detail="Beneficial bacteria + fungi" />
        <SummaryCard title="Disease Risk" value={microbiome.summary.diseaseRisk} detail="Based on latest pathogen load" />
      </div>

      <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Microbiome composition</p>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative h-64 w-64 rounded-full" style={{ background: buildCompositionGradient(composition) }}>
                <div className="absolute inset-[22%] rounded-full bg-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {composition.map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200 bg-[#fafcf7] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${item.tone}`} />
                    <span className="font-semibold text-slate-800">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{item.value}%</span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-slate-200">
                  <div className={`h-2.5 rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendCard title="Seasonal Microbiome Trends" subtitle="Recent trend showing diversity and population changes">
          <div className="grid grid-cols-7 gap-3">
            {microbiome.trend.map((point) => (
              <div key={point.month} className="flex flex-col items-center gap-3">
                <div className="flex h-56 items-end gap-1.5">
                  <div className="w-8 rounded-t-[10px] bg-emerald-700/90" style={{ height: `${point.bacteria * 2.1}px` }} />
                  <div className="w-8 rounded-t-[10px] bg-lime-300" style={{ height: `${point.fungi * 2.1}px` }} />
                  <div className="w-8 rounded-t-[10px] bg-rose-400" style={{ height: `${point.pathogens * 2.1}px` }} />
                </div>
                <span className="text-xs font-medium text-slate-500">{point.month}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
            <LegendDot color="bg-emerald-700" label="Bacteria %" />
            <LegendDot color="bg-lime-300" label="Fungi %" />
            <LegendDot color="bg-rose-400" label="Pathogens %" />
          </div>
        </TrendCard>

        <TrendCard title="Alpha & Beta Diversity Comparison" subtitle="Latest field-level microbiome comparison">
          <div className="space-y-5">
            {microbiome.fieldComparisons.map((item) => (
              <div key={item.field} className="space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{item.field}</span>
                  <span>Alpha {item.alpha} · Beta {item.beta}</span>
                </div>
                <div className="h-4 rounded-full bg-slate-200">
                  <div className="h-4 rounded-full bg-emerald-700" style={{ width: `${Math.min(item.alpha * 24, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </TrendCard>
      </div>
    </div>
  );
}

function RecommendationsSection({ recommendations, projectedImpact, treatmentEffectiveness, onSchedule, busyKey }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        {recommendations.map((item) => (
          <div key={item.id} className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.impact === "high" ? "bg-amber-100 text-amber-700" : "bg-lime-100 text-lime-700"}`}>
                {item.impact}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-500">
              <p>{item.result}</p>
              <p>{item.savings}</p>
              <p>{item.field}</p>
            </div>
            <button
              className="mt-5 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={busyKey === `recommendation-${item.id}` || item.status !== "open"}
              onClick={() => onSchedule(item.id)}
              type="button"
            >
              {item.status === "scheduled"
                ? "Already scheduled"
                : busyKey === `recommendation-${item.id}`
                  ? "Scheduling..."
                  : "Schedule intervention"}
            </button>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendCard title="Projected Impact by Field" subtitle="Expected yield increase, cost savings, and health improvement">
          <div className="grid grid-cols-4 gap-6">
            {projectedImpact.map((item) => (
              <div key={item.field} className="text-center">
                <div className="flex h-52 items-end justify-center gap-2">
                  <div className="w-6 rounded-t-[10px] bg-emerald-700" style={{ height: `${item.yieldIncrease * 2.4}px` }} />
                  <div className="w-6 rounded-t-[10px] bg-lime-300" style={{ height: `${item.costSavings * 2.4}px` }} />
                  <div className="w-6 rounded-t-[10px] bg-amber-300" style={{ height: `${item.healthImprovement * 2.4}px` }} />
                </div>
                <p className="mt-3 text-xs font-medium text-slate-500">{item.field}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
            <LegendDot color="bg-emerald-700" label="Yield Increase %" />
            <LegendDot color="bg-lime-300" label="Cost Savings %" />
            <LegendDot color="bg-amber-300" label="Health Improvement %" />
          </div>
        </TrendCard>

        <TrendCard title="Treatment Effectiveness" subtitle="Historical effectiveness of prescribed treatments">
          <div className="space-y-4">
            {treatmentEffectiveness.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-4 rounded-full bg-slate-200">
                  <div className="h-4 rounded-full bg-emerald-700" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </TrendCard>
      </div>
    </div>
  );
}

function InterventionsSection({ interventions }) {
  return (
    <div className="space-y-6">
      <TrendCard title="Intervention Effectiveness Over Time" subtitle="Average effectiveness rating across recorded interventions">
        <div className="relative h-64 rounded-[28px] border border-slate-200 bg-[#fafcf7] p-6">
          <div className="absolute inset-x-6 bottom-14 top-6">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polyline
                fill="none"
                points={interventions.trend.map((item, index) => `${(index * 100) / Math.max(interventions.trend.length - 1, 1)},${100 - item.value}`).join(" ")}
                stroke="#4f8b3a"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
              {interventions.trend.map((item, index) => (
                <circle
                  key={item.week}
                  cx={(index * 100) / Math.max(interventions.trend.length - 1, 1)}
                  cy={100 - item.value}
                  fill="#4f8b3a"
                  r="2.5"
                />
              ))}
            </svg>
          </div>
          <div className="absolute inset-x-6 bottom-5 grid text-center text-xs font-medium text-slate-500" style={{ gridTemplateColumns: `repeat(${Math.max(interventions.trend.length, 1)}, minmax(0, 1fr))` }}>
            {interventions.trend.map((point) => (
              <span key={point.week}>{point.week}</span>
            ))}
          </div>
        </div>
      </TrendCard>

      <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">All Interventions</h3>
          <span className="text-sm text-slate-500">{interventions.list.length} recorded</span>
        </div>
        <div className="mt-5 space-y-4">
          {interventions.list.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-slate-200 bg-[#fafcf7] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{item.field}</p>
                </div>
                <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoTag label="Date" value={formatDate(item.date)} />
                  <InfoTag label="Effectiveness" value={item.effectiveness ? `${item.effectiveness}%` : "Pending"} />
                  <InfoTag label="Owner" value="Field team" />
                </div>
              </div>
              {item.notes ? <p className="mt-4 text-sm leading-7 text-slate-600">{item.notes}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsSection({ reports, fieldCount, sampleCount, averageHealth, reportCount, onDownload, onPrint, busyKey }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Reports</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Export soil health and microbiome intelligence.</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            disabled={busyKey === "/pro-farmer/reports/summary/download"}
            onClick={() => onDownload("/pro-farmer/reports/summary/download", "pro-farmer-summary-report.csv")}
            type="button"
          >
            Export Data
          </button>
          <button
            className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            disabled={busyKey === "print"}
            onClick={onPrint}
            type="button"
          >
            Print Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Fields" value={`${fieldCount}`} detail="Mapped in Pro suite" />
        <SummaryCard title="Total Samples" value={`${sampleCount}`} detail="Ready for comparison" />
        <SummaryCard title="Avg Soil Health" value={`${averageHealth}`} detail="Across the premium dashboard" />
        <SummaryCard title="Generated Reports" value={`${reportCount}`} detail="Live downloadable files" />
      </div>

      <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Generated Reports</h3>
        <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="hidden grid-cols-[2fr_1fr_1fr_0.6fr_0.8fr_0.8fr_0.8fr] gap-3 bg-[#f5f7ef] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:grid">
            <span>Report</span>
            <span>Type</span>
            <span>Date</span>
            <span>Fields</span>
            <span>Status</span>
            <span>Size</span>
            <span>Action</span>
          </div>
          <div className="divide-y divide-slate-200">
            {reports.map((item) => (
              <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[2fr_1fr_1fr_0.6fr_0.8fr_0.8fr_0.8fr] md:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500 md:hidden">{item.type} · {formatDate(item.date)}</p>
                </div>
                <span className="hidden text-sm text-slate-600 md:block">{item.type}</span>
                <span className="hidden text-sm text-slate-600 md:block">{formatDate(item.date)}</span>
                <span className="hidden text-sm text-slate-600 md:block">{item.fields}</span>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${item.status === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-lime-100 text-lime-700"}`}>
                  {item.status}
                </span>
                <span className="text-sm text-slate-600">{item.size}</span>
                <button
                  className="w-fit rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={item.status !== "ready" || busyKey === `/pro-farmer/reports/${item.id}/download`}
                  onClick={() => onDownload(`/pro-farmer/reports/${item.id}/download`, `${item.title}.csv`)}
                  type="button"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TrendCard title="Field Data Export" subtitle="Export all field data including soil health scores, diversity indices, and crop information.">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            disabled={busyKey === "/pro-farmer/exports/fields.csv"}
            onClick={() => onDownload("/pro-farmer/exports/fields.csv", "pro-farmer-fields.csv")}
            type="button"
          >
            Export Fields CSV
          </button>
        </TrendCard>
        <TrendCard title="Sample Data Export" subtitle="Export all soil sample data including pH, moisture, and microbiome diversity.">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            disabled={busyKey === "/pro-farmer/exports/samples.csv"}
            onClick={() => onDownload("/pro-farmer/exports/samples.csv", "pro-farmer-samples.csv")}
            type="button"
          >
            Export Samples CSV
          </button>
        </TrendCard>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, detail }) {
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function TrendCard({ title, subtitle, children }) {
  return (
    <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-[84px] text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function StatPanel({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function InfoTag({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function ScienceIcon() {
  return (
    <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path d="M10 3v4.3l-4.8 8.2A4 4 0 0 0 8.7 21h6.6a4 4 0 0 0 3.5-5.5L14 7.3V3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 11h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function getInitials(name = "John Farmer") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildCompositionGradient(composition) {
  if (!composition.length) {
    return "conic-gradient(#3f7f2f 0 100%)";
  }

  const toneToColor = {
    "bg-emerald-700": "#3f7f2f",
    "bg-lime-400": "#a3ce8b",
    "bg-amber-400": "#f4c74a",
    "bg-sky-400": "#8bb6db",
    "bg-rose-500": "#dd5959"
  };

  let start = 0;
  const stops = composition.map((item) => {
    const end = start + item.value;
    const stop = `${toneToColor[item.tone] || "#3f7f2f"} ${start}% ${end}%`;
    start = end;
    return stop;
  });

  return `conic-gradient(${stops.join(", ")})`;
}
