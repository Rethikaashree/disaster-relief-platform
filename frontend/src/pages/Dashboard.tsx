import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  FileCheck2,
  Filter,
  PackageCheck,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck,
  Warehouse,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { beneficiaryApi, dashboardApi } from "../api";
import type { Beneficiary, DashboardStatistics } from "../types";

const empty = {
  total: 0,
  pending: 0,
  under_review: 0,
  verified: 0,
  rejected: 0,
  flagged: 0,
  recent_applications: [],
  recent_activity: [],
};

export function Dashboard() {
  const [data, setData] = useState<DashboardStatistics>(empty);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const [region, setRegion] = useState("all");
  useEffect(() => {
    Promise.all([dashboardApi.statistics(), beneficiaryApi.list()])
      .then(([stats, records]) => {
        setData(stats.data);
        setBeneficiaries(records.data);
      })
      .catch(() => setError("Unable to load dashboard statistics."));
  }, []);
  const filteredBeneficiaries = beneficiaries.filter((item) => {
    const inRegion = region === "all" || item.district === region;
    const createdAt = new Date(item.created_at).getTime();
    const days = Number(timeRange);
    const inTime =
      timeRange === "all" ||
      Date.now() - createdAt <= days * 24 * 60 * 60 * 1000;
    return inRegion && inTime;
  });
  const statusChart = statusBuckets(filteredBeneficiaries);
  const regionChart = Object.values(
    filteredBeneficiaries.reduce<Record<string, { region: string; applications: number; verified: number }>>(
      (acc, item) => {
        const name = item.district || "Unspecified";
        acc[name] ||= { region: name, applications: 0, verified: 0 };
        acc[name].applications += 1;
        if (item.verification_status === "VERIFIED") acc[name].verified += 1;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.applications - a.applications);
  const trendChart = buildTrend(filteredBeneficiaries);
  const resourcesChart = mostRequested(filteredBeneficiaries);
  const districts = Array.from(
    new Set(beneficiaries.map((item) => item.district).filter(Boolean)),
  ) as string[];
  const cards = [
    {
      label: "Total beneficiaries",
      value: data.total,
      icon: UserRoundCheck,
      tone: "teal",
    },
    { label: "Pending", value: data.pending, icon: SearchCheck, tone: "amber" },
    {
      label: "Under review",
      value: data.under_review,
      icon: FileCheck2,
      tone: "blue",
    },
    {
      label: "Verified",
      value: data.verified,
      icon: BadgeCheck,
      tone: "green",
    },
    {
      label: "Rejected",
      value: data.rejected,
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "Duplicate flags",
      value: data.flagged,
      icon: ShieldCheck,
      tone: "orange",
    },
  ];
  return (
    <div className="page dashboard-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMIN / OFFICER OVERVIEW</span>
          <h1>Verification dashboard</h1>
          <p>Live synchronized records from the disaster beneficiary database.</p>
        </div>
        <div className="demo-live-badge">
          <Sparkles size={14} /> DEMO DATA ENVIRONMENT
        </div>
      </div>
      <div className="demo-banner">
        <ShieldCheck size={16} />
        DEMO DATA: Beneficiary records, identities, and aid statistics shown are synthetic demonstration records for Tamil Nadu disaster scenarios.
      </div>
      <section className="toolbar dashboard-filters">
        <label className="select-box">
          <Filter size={17} />
          <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label className="select-box">
          <BarChart3 size={17} />
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="all">All regions</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      </section>
      {error && <div className="alert danger">{error}</div>}
      <section className="metric-grid">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article className="metric-card" key={label}>
            <div className={`metric-icon ${tone}`}>
              <Icon />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value.toLocaleString()}</strong>
            </div>
          </article>
        ))}
      </section>
      {data.total_available_stock !== undefined && (
        <section className="metric-grid four" style={{ marginTop: "1rem" }}>
          <article className="metric-card">
            <div className="metric-icon blue">
              <Warehouse />
            </div>
            <div>
              <span>Relief Hubs (Tamil Nadu)</span>
              <strong>{(data.total_centres ?? 10).toLocaleString()} centres</strong>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon teal">
              <Boxes />
            </div>
            <div>
              <span>Total Available Supplies</span>
              <strong>{(data.total_available_stock ?? 0).toLocaleString()} units</strong>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon green">
              <Truck />
            </div>
            <div>
              <span>Allocated / Dispatched</span>
              <strong>{(data.total_allocated_stock ?? 0).toLocaleString()} units</strong>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon amber">
              <AlertTriangle />
            </div>
            <div>
              <span>Low Stock Warnings</span>
              <strong>{(data.low_stock_count ?? 0).toLocaleString()} items</strong>
            </div>
          </article>
        </section>
      )}
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Verification status</h2>
              <p>Current database distribution</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                  {statusChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent applications</h2>
              <p>Latest registrations</p>
            </div>
          </div>
          <div className="activity-list">
            {data.recent_applications.length ? (
              data.recent_applications.map((item) => (
                <div key={item.id}>
                  <span
                    className={`status-dot ${item.verification_status.toLowerCase()}`}
                  />
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.application_id} · {item.district || "Unspecified"}
                    </small>
                  </div>
                  <span
                    className={`status-badge ${item.verification_status.toLowerCase()}`}
                  >
                    {item.verification_status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">No applications yet.</div>
            )}
          </div>
        </article>
      </section>
      <section className="dashboard-grid analytics-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Submissions and verifications</h2>
              <p>Grouped from beneficiary record dates</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="submitted" stroke="#2563eb" fill="#dbeafe" />
                <Area type="monotone" dataKey="verified" stroke="#0f766e" fill="#ccfbf1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Regional summary</h2>
              <p>Applications versus verified cases</p>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChart.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="region" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#2563eb" radius={[5, 5, 0, 0]} />
                <Bar dataKey="verified" fill="#0f766e" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel chart-panel wide-panel">
          <div className="panel-header">
            <div>
              <h2>Most requested resources</h2>
              <p>Estimated from disaster type and household size</p>
            </div>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourcesChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="resource" width={120} />
                <Tooltip />
                <Bar dataKey="requested" fill="#d97706" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}

function statusBuckets(items: Beneficiary[]) {
  const colors: Record<string, string> = {
    VERIFIED: "#0f766e",
    PENDING: "#d97706",
    UNDER_REVIEW: "#2563eb",
    REJECTED: "#dc2626",
    DUPLICATE_FLAGGED: "#ea580c",
  };
  return Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.verification_status] = (acc[item.verification_status] || 0) + 1;
      return acc;
    }, {}),
  ).map(([status, value]) => ({
    name: status.replace(/_/g, " "),
    value,
    color: colors[status] || "#64748b",
  }));
}

function buildTrend(items: Beneficiary[]) {
  const buckets = new Map<string, { date: string; submitted: number; verified: number }>();
  items.forEach((item) => {
    const key = new Date(item.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const bucket = buckets.get(key) || { date: key, submitted: 0, verified: 0 };
    bucket.submitted += 1;
    if (item.verification_status === "VERIFIED") bucket.verified += 1;
    buckets.set(key, bucket);
  });
  return Array.from(buckets.values()).slice(-30);
}

function mostRequested(items: Beneficiary[]) {
  const resourceMap: Record<string, string> = {
    Flood: "Food kits",
    Cyclone: "Shelter supplies",
    "Water shortage": "Drinking water",
    "Shelter damage": "Clothing",
    "Medical need": "Medicine",
  };
  const totals = items.reduce<Record<string, number>>((acc, item) => {
    const resource = resourceMap[item.disaster_type || ""] || "Relief kits";
    acc[resource] = (acc[resource] || 0) + Math.max(1, item.family_size || 1);
    return acc;
  }, {});
  return Object.entries(totals)
    .map(([resource, requested]) => ({ resource, requested }))
    .sort((a, b) => b.requested - a.requested);
}
