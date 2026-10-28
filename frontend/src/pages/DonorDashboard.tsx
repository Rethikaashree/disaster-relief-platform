import { useEffect, useState, type FormEvent } from "react";
import { Filter, HandCoins, MapPin, RefreshCw, Search } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { donorApi, getUser } from "../api";
import { NotificationsPanel } from "../components/NotificationsPanel";

type Overview = {
  registered_beneficiaries: number;
  verified_beneficiaries: number;
  disaster_summary: { type: string; applications: number }[];
};
type Pledge = {
  id: number;
  amount: string;
  campaign: string;
  message: string | null;
  created_at: string;
};

export function DonorDashboard() {
  const user = getUser();
  const [overview, setOverview] = useState<Overview>({
    registered_beneficiaries: 0,
    verified_beneficiaries: 0,
    disaster_summary: [],
  });
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [campaign, setCampaign] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food kits");
  const [availability, setAvailability] = useState("READY");
  const [address, setAddress] = useState(user?.address || "");
  const [coordinates, setCoordinates] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const refresh = async () => {
    setRefreshing(true);
    try {
      const [overviewResponse, pledgeResponse] = await Promise.all([
        donorApi.overview(),
        donorApi.pledges(),
      ]);
      setOverview(overviewResponse.data);
      setPledges(pledgeResponse.data.items);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await donorApi.createPledge({
        amount,
        campaign: category,
        message:
          [
            `Campaign: ${campaign}`,
            `Availability: ${availability}`,
            `Address: ${address || "Not provided"}`,
            `Coordinates: ${coordinates || "Manual address only"}`,
            message,
          ]
            .filter(Boolean)
            .join(" | ") || undefined,
      });
      setMessage(data.message);
      setAmount("");
      setCampaign("");
      setCoordinates("");
      setAddress(user?.address || "");
      await refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredPledges = pledges.filter((pledge) => {
    const haystack = `${pledge.campaign} ${pledge.amount} ${pledge.message || ""}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus =
      status === "all" ||
      (pledge.message || "").toLowerCase().includes(status.toLowerCase());
    return matchesQuery && matchesStatus;
  });
  const totalValue = pledges.reduce((sum, pledge) => sum + pledgeValue(pledge), 0);
  const completed = pledges.filter((pledge) =>
    (pledge.message || "").includes("ALLOCATED"),
  ).length;
  const categoryChart = Object.values(
    pledges.reduce<Record<string, { category: string; value: number; count: number }>>(
      (acc, pledge) => {
        acc[pledge.campaign] ||= { category: pledge.campaign, value: 0, count: 0 };
        acc[pledge.campaign].value += pledgeValue(pledge);
        acc[pledge.campaign].count += 1;
        return acc;
      },
      {},
    ),
  );
  const timeChart = pledges
    .map((pledge) => ({
      date: new Date(pledge.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      value: pledgeValue(pledge),
    }))
    .reverse();
  const pieColors = ["#0f766e", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#059669"];

  return (
    <div className="role-page">
      <header className="role-page-header">
        <div>
          <span className="eyebrow">DONOR PORTAL</span>
          <h1>Welcome, {user?.name || "Donor"}</h1>
          <p>
            Follow public, aggregated relief information and record your
            donation interest.
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => void refresh()}
          disabled={refreshing}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>
      {error && (
        <div role="alert" className="alert danger">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="alert success">
          {message}
        </div>
      )}
      <div className="demo-banner">
        <HandCoins size={16} />
        Donation pledges are synthetic demo records and do not process payment.
      </div>
      <section className="role-summary-row four">
        <SummaryTile label="Total pledges" value={pledges.length} />
        <SummaryTile label="Pending contributions" value={pledges.length - completed} />
        <SummaryTile label="Completed allocations" value={completed} />
        <SummaryTile label="Estimated value" value={totalValue} prefix="₹" />
      </section>
      <div className="donor-grid">
        <section className="role-section">
          <div className="role-section-heading">
            <div>
              <h2>Relief activity</h2>
              <p>Aggregated application counts by disaster type.</p>
            </div>
          </div>
          <div className="activity-summary">
            {overview.disaster_summary.length ? (
              overview.disaster_summary.map((item) => (
                <div key={item.type}>
                  <span>{item.type}</span>
                  <strong>{item.applications}</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No public disaster summaries available.
              </div>
            )}
          </div>
          <div className="mini-chart donor-mini-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryChart} dataKey="count" nameKey="category" innerRadius={42} outerRadius={74}>
                  {categoryChart.map((entry, index) => (
                    <Cell key={entry.category} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="role-section pledge-section">
          <div className="role-section-heading">
            <div>
              <h2>Donation interest</h2>
              <p>
                This records a pledge of interest only. No payment is collected.
              </p>
            </div>
            <HandCoins size={21} />
          </div>
          <form className="pledge-form" onSubmit={submit}>
            <label>
              Campaign or disaster
              <input
                required
                minLength={2}
                maxLength={160}
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="Flood relief - district"
              />
            </label>
            <label>
              Resource category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Food kits</option>
                <option>Drinking water</option>
                <option>Clothing</option>
                <option>Medicine</option>
                <option>Shelter supplies</option>
                <option>Sanitation</option>
              </select>
            </label>
            <label>
              Quantity or value
              <input
                required
                minLength={1}
                maxLength={40}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount and currency"
              />
            </label>
            <label>
              Availability
              <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                <option value="READY">Ready now</option>
                <option value="PENDING_PICKUP">Pending pickup</option>
                <option value="ALLOCATED">Allocated</option>
              </select>
            </label>
            <label>
              Pickup address
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, district"
              />
            </label>
            <label>
              GPS coordinates <span className="optional-label">Optional</span>
              <input
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                placeholder="12.9716, 80.2210"
              />
            </label>
            <label>
              Message <span className="optional-label">Optional</span>
              <textarea
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <button className="primary-button" disabled={loading}>
              {loading ? "Recording..." : "Record donation pledge"}
            </button>
          </form>
          <div className="map-preview">
            <MapPin size={18} />
            <div>
              <strong>{address || "No address entered"}</strong>
              <span>{coordinates || "Manual location preview only"}</span>
            </div>
          </div>
        </section>
      </div>
      <section className="insight-grid donor-analytics">
        <article className="panel">
          <div className="panel-header compact">
            <div>
              <h2>Donations over time</h2>
              <p>Estimated from pledge quantities and values</p>
            </div>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0f766e" fill="#ccfbf1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel">
          <div className="panel-header compact">
            <div>
              <h2>Resources by category</h2>
              <p>Same pledge history, grouped for scanning</p>
            </div>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
      <NotificationsPanel />
      <section className="role-section pledge-history">
        <div className="role-section-heading">
          <div>
            <h2>Your pledge history</h2>
            <p>Only your own pledges are displayed here.</p>
          </div>
        </div>
        <section className="toolbar embedded-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pledge history"
            />
          </label>
          <label className="select-box">
            <Filter size={17} />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="READY">Ready</option>
              <option value="PENDING_PICKUP">Pending pickup</option>
              <option value="ALLOCATED">Allocated</option>
            </select>
          </label>
        </section>
        {filteredPledges.length ? (
          filteredPledges.map((pledge) => (
            <article className="application-row" key={pledge.id}>
              <span className="application-file">
                <HandCoins size={19} />
              </span>
              <div className="application-main">
                <strong>{pledge.campaign}</strong>
                <span>
                  {pledge.amount} ·{" "}
                  {new Date(pledge.created_at).toLocaleDateString()}
                </span>
                {pledge.message && <p>{pledge.message}</p>}
              </div>
              <span className="status-badge pending">INTEREST ONLY</span>
            </article>
          ))
        ) : (
          <div className="empty-state">No pledges match the current filters.</div>
        )}
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  prefix = "",
}: {
  label: string;
  value: number;
  prefix?: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>
        {prefix}
        {value.toLocaleString()}
      </strong>
    </div>
  );
}

function pledgeValue(pledge: Pledge): number {
  const match = pledge.amount.match(/\d[\d,]*/);
  if (!match) return 0;
  return Number(match[0].replace(/,/g, ""));
}

function apiError(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } })
      .response;
    return response?.data?.detail || "The request could not be completed.";
  }
  return "Unable to reach the relief service.";
}
