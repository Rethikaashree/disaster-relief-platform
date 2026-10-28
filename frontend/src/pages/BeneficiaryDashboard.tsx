import { useEffect, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  FilePlus2,
  FileText,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import {
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
import { beneficiaryApi, documentApi, getUser } from "../api";
import { NotificationsPanel } from "../components/NotificationsPanel";
import type { Beneficiary } from "../types";

type ApplicationForm = {
  name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  disaster_type: string;
  affected_location: string;
  date_affected: string;
  family_size: string;
  number_of_dependents: string;
};

function createInitialForm(): ApplicationForm {
  const user = getUser();
  return {
    name: user?.name || "",
    date_of_birth: "",
    gender: "",
    phone: user?.phone || "",
    address: user?.address || "",
    district: user?.district || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    disaster_type: "Flood",
    affected_location: "",
    date_affected: "",
    family_size: "1",
    number_of_dependents: "0",
  };
}

export function BeneficiaryDashboard() {
  const user = getUser();
  const [applications, setApplications] = useState<Beneficiary[]>([]);
  const [form, setForm] = useState(createInitialForm);
  const [file, setFile] = useState<File | null>(null);
  const [ocr, setOcr] = useState<Record<string, string> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const generateRandomInputs = () => {
    const districts = ["Cuddalore", "Nagapattinam", "Thanjavur", "Chennai", "Tiruvallur", "Madurai"];
    const names = ["Asha Raman", "Kavin Prakash", "Nila Subramani", "Rohan Vel", "Meera Anand", "Dinesh Pillai"];
    const disasterTypes = ["Flood", "Cyclone", "Water shortage", "Shelter damage", "Medical need"];
    const locs = [
      "Low-lying coastal settlement near Marina beach",
      "Flooded roadside settlement near railway bridge",
      "Cyclone shelter camp block B",
      "Temporary shelter near Kaveri flood bund",
    ];
    const pickedDistrict = districts[Math.floor(Math.random() * districts.length)];
    setForm({
      name: names[Math.floor(Math.random() * names.length)],
      date_of_birth: "1988-06-15",
      gender: "Female",
      phone: `90000${Math.floor(10000 + Math.random() * 89999)}`,
      address: `${Math.floor(10 + Math.random() * 80)}, Relief Camp Colony, ${pickedDistrict}`,
      district: pickedDistrict,
      state: "Tamil Nadu",
      pincode: String(600000 + Math.floor(Math.random() * 29999)).padStart(6, "0"),
      disaster_type: disasterTypes[Math.floor(Math.random() * disasterTypes.length)],
      affected_location: locs[Math.floor(Math.random() * locs.length)],
      date_affected: "2024-11-20",
      family_size: String(Math.floor(2 + Math.random() * 5)),
      number_of_dependents: String(Math.floor(1 + Math.random() * 3)),
    });
    setMessage("Generated realistic demonstration values. (DEMO DATA)");
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const { data } = await beneficiaryApi.mine();
      setApplications(data.items);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const createApplication = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Select an Aadhaar document before submitting.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    let uploadedForManualReview = false;
    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
        date_affected: form.date_affected || null,
        family_size: Number(form.family_size),
        number_of_dependents: Number(form.number_of_dependents),
      };
      const { data } = await beneficiaryApi.create(payload);
      const applicationId = data.beneficiary.id as number;
      try {
        const scan = await documentApi.scan(applicationId, file);
        setOcr(scan.data.extracted_fields);
      } catch {
        await documentApi.upload(applicationId, file);
        uploadedForManualReview = true;
      }
      await beneficiaryApi.submit(applicationId);
      setMessage(
        uploadedForManualReview
          ? "Application submitted for review. OCR was unavailable, so an officer will review the uploaded document manually."
          : "Application and document submitted for officer review.",
      );
      setShowForm(false);
      setFile(null);
      setForm(createInitialForm());
      await refresh();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((item) => {
    const haystack = `${item.application_id} ${item.disaster_type || ""} ${item.district || ""} ${item.verification_status}`.toLowerCase();
    return (
      (status === "all" || item.verification_status === status) &&
      haystack.includes(query.toLowerCase())
    );
  });
  const verified = applications.filter(
    (item) => item.verification_status === "VERIFIED",
  );
  const pending = applications.filter((item) =>
    ["PENDING", "UNDER_REVIEW", "DUPLICATE_FLAGGED"].includes(
      item.verification_status,
    ),
  );
  const latestApplication = applications[0];
  const aidHistory = verified.flatMap((item, index) => {
    if (item.allocations && item.allocations.length > 0) {
      return item.allocations.map((alloc) => ({
        id: alloc.id,
        date: alloc.allocated_at,
        type: alloc.item_name || "Relief Supplies",
        quantity: `${alloc.quantity_allocated} units (${alloc.centre_name || "Centre"})`,
        status: alloc.status || "ALLOCATED",
        district: item.district || "Tamil Nadu",
      }));
    }
    return [{
      id: item.id,
      date: item.updated_at,
      type: item.request_items && item.request_items.length > 0
        ? item.request_items.map((r) => r.item_name).slice(0, 2).join(", ")
        : index % 2 === 0 ? "Food and hygiene kit" : "Shelter supplies",
      quantity: `${Math.max(1, item.family_size || 1)} family unit${(item.family_size || 1) > 1 ? "s" : ""}`,
      status: item.allocation_status === "ALLOCATED" ? "ALLOCATED" : "Under Allocation",
      district: item.district || "Tamil Nadu",
    }];
  });
  const statusChart = statusBuckets(applications).filter((item) => item.value);
  const districtChart = Object.values(
    applications.reduce<Record<string, { district: string; applications: number }>>(
      (acc, item) => {
        const districtName = item.district || "Unspecified";
        acc[districtName] ||= { district: districtName, applications: 0 };
        acc[districtName].applications += 1;
        return acc;
      },
      {},
    ),
  );

  return (
    <div className="role-page">
      <header className="role-page-header">
        <div>
          <span className="eyebrow">BENEFICIARY PORTAL</span>
          <h1>Welcome, {user?.name || "Beneficiary"}</h1>
          <p>
            Your application details are visible only to you and authorized
            verification staff.
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
      <div className="demo-banner">
        <ShieldCheck size={16} />
        Demo mode: synthetic records are clearly marked and are not live relief
        data.
      </div>
      <section className="role-summary-row four">
        <SummaryTile label="Submitted applications" value={applications.length} />
        <SummaryTile label="Pending verification" value={pending.length} />
        <SummaryTile label="Verified applications" value={verified.length} />
        <SummaryTile label="Aid allocations" value={aidHistory.length} />
      </section>
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
      {ocr && (
        <section className="ocr-review">
          <ShieldCheck size={18} />
          <div>
            <strong>OCR extracted information for review</strong>
            <p>
              {ocr.name || "Name not detected"} ·{" "}
              {ocr.date_of_birth || "Date of birth not detected"} ·{" "}
              {ocr.gender || "Gender not detected"} ·{" "}
              {ocr.masked_aadhaar || "Identifier not detected"}
            </p>
            <small>
              OCR is only a reading aid. It does not verify identity or
              eligibility.
            </small>
          </div>
        </section>
      )}
      <div className="role-section-heading">
        <div>
          <h2>Applications and aid status</h2>
          <p>Track verification, notifications, and synthetic aid allocations.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        >
          <FilePlus2 size={17} /> {showForm ? "Close form" : "New application"}
        </button>
      </div>
      <section className="insight-grid beneficiary-insights">
        <article className="panel">
          <div className="panel-header compact">
            <div>
              <h2>Application progress</h2>
              <p>{latestApplication?.application_id || "No application selected"}</p>
            </div>
          </div>
          <div className="progress-track">
            {[
              ["Submitted", Boolean(latestApplication)],
              [
                "Under review",
                Boolean(
                  latestApplication &&
                    latestApplication.verification_status !== "DRAFT",
                ),
              ],
              [
                "Verified",
                latestApplication?.verification_status === "VERIFIED",
              ],
              ["Aid ready", aidHistory.length > 0],
            ].map(([label, active]) => (
              <div className={`progress-step ${active ? "active" : ""}`} key={String(label)}>
                <span>
                  <BadgeCheck size={14} />
                </span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-header compact">
            <div>
              <h2>Verification mix</h2>
              <p>Based on your visible applications</p>
            </div>
          </div>
          <div className="mini-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={46}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {statusChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel">
          <div className="panel-header compact">
            <div>
              <h2>Nearby availability</h2>
              <p>District-level demo availability</p>
            </div>
            <MapPin size={18} />
          </div>
          <div className="availability-map">
            {districtChart.slice(0, 5).map((item, index) => (
              <button
                className="map-marker"
                style={{ left: `${18 + index * 16}%`, top: `${30 + (index % 3) * 18}%` }}
                title={`${item.district}: ${item.applications} application(s)`}
                key={item.district}
              >
                {item.applications}
              </button>
            ))}
          </div>
        </article>
      </section>
      {showForm && (
        <form className="form-card role-form" onSubmit={createApplication}>
          <section className="form-section">
            <div className="section-title">
              <span>01</span>
              <div>
                <h2>Personal details</h2>
                <p>Confirm the information for this application.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                style={{ marginLeft: "auto" }}
                onClick={generateRandomInputs}
              >
                <RefreshCw size={15} /> GENERATE RANDOM INPUTS
              </button>
            </div>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Date of birth
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    setForm({ ...form, date_of_birth: e.target.value })
                  }
                />
              </label>
              <label>
                Gender
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Phone
                <input
                  required
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label className="auth-wide">
                Address
                <textarea
                  required
                  minLength={5}
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </label>
              <label>
                District
                <input
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value })
                  }
                />
              </label>
              <label>
                State
                <input
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </label>
              <label>
                PIN code
                <input
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value })
                  }
                />
              </label>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title">
              <span>02</span>
              <div>
                <h2>Disaster impact</h2>
                <p>Describe where and when you were affected.</p>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Disaster type
                <select
                  value={form.disaster_type}
                  onChange={(e) =>
                    setForm({ ...form, disaster_type: e.target.value })
                  }
                >
                  <option>Flood</option>
                  <option>Cyclone</option>
                  <option>Earthquake</option>
                  <option>Landslide</option>
                  <option>Tsunami</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Affected location
                <input
                  required
                  value={form.affected_location}
                  onChange={(e) =>
                    setForm({ ...form, affected_location: e.target.value })
                  }
                />
              </label>
              <label>
                Date affected
                <input
                  type="date"
                  value={form.date_affected}
                  onChange={(e) =>
                    setForm({ ...form, date_affected: e.target.value })
                  }
                />
              </label>
              <label>
                Family size
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={form.family_size}
                  onChange={(e) =>
                    setForm({ ...form, family_size: e.target.value })
                  }
                />
              </label>
              <label>
                Dependents
                <input
                  type="number"
                  min="0"
                  max="1000"
                  required
                  value={form.number_of_dependents}
                  onChange={(e) =>
                    setForm({ ...form, number_of_dependents: e.target.value })
                  }
                />
              </label>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title">
              <span>03</span>
              <div>
                <h2>Aadhaar document</h2>
                <p>
                  Upload a clear image. The number is stored as a masked value
                  and hash.
                </p>
              </div>
            </div>
            <label className="file-drop">
              <input
                required
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <UploadCloud size={28} />
              <strong>{file?.name || "Choose an Aadhaar image"}</strong>
              <span>JPG or PNG, maximum 10 MB</span>
            </label>
          </section>
          {error && (
            <div role="alert" className="alert danger role-form-alert">
              {error}
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={loading}>
              {loading ? "Uploading and submitting..." : "Submit application"}
            </button>
          </div>
        </form>
      )}
      <NotificationsPanel />
      <section className="role-section aid-history">
        <div className="role-section-heading embedded">
          <div>
            <h2>Aid distribution history</h2>
            <p>Derived from verified synthetic demo applications.</p>
          </div>
          <CalendarDays size={18} />
        </div>
        {aidHistory.length ? (
          aidHistory.map((item) => (
            <article className="application-row" key={item.id}>
              <span className="application-file">
                <Bell size={18} />
              </span>
              <div className="application-main">
                <strong>{item.type}</strong>
                <span>
                  {item.quantity} - {item.district} -{" "}
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
              <span className="status-badge verified">{item.status}</span>
            </article>
          ))
        ) : (
          <div className="empty-state">No aid allocations are visible yet.</div>
        )}
      </section>
      <section className="toolbar role-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search application, district, or disaster"
          />
        </label>
        <label className="select-box">
          <Filter size={17} />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="DUPLICATE_FLAGGED">Flagged</option>
          </select>
        </label>
      </section>
      <section className="application-list">
        {filteredApplications.length ? (
          filteredApplications.map((item) => (
            <article className="application-row" key={item.id}>
              <span className="application-file">
                <FileText size={20} />
              </span>
              <div className="application-main">
                <strong>{item.application_id}</strong>
                <span>
                  {item.disaster_type || "Disaster application"} ·{" "}
                  {item.district}, {item.state}
                </span>
                {item.verification_remarks && (
                  <p>Officer remarks: {item.verification_remarks}</p>
                )}
              </div>
              <span
                className={`status-badge ${item.verification_status.toLowerCase()}`}
              >
                {item.verification_status.replace(/_/g, " ")}
              </span>
            </article>
          ))
        ) : (
          <div className="empty-state role-empty">
            No applications match the current filters.
          </div>
        )}
      </section>
      {districtChart.length > 0 && (
        <section className="panel beneficiary-chart-panel">
          <div className="panel-header">
            <div>
              <h2>Applications by district</h2>
              <p>Uses the same beneficiary dataset shown above.</p>
            </div>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="district" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="applications" fill="#0f766e" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}

function statusBuckets(applications: Beneficiary[]) {
  const colors: Record<string, string> = {
    PENDING: "#d97706",
    UNDER_REVIEW: "#2563eb",
    VERIFIED: "#059669",
    REJECTED: "#dc2626",
    DUPLICATE_FLAGGED: "#ea580c",
  };
  return Object.entries(
    applications.reduce<Record<string, number>>((acc, item) => {
      acc[item.verification_status] = (acc[item.verification_status] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
    color: colors[name] || "#64748b",
  }));
}

function apiError(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } })
      .response;
    return response?.data?.detail || "The application could not be saved.";
  }
  return "Unable to reach the verification service.";
}
