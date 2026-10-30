import { formatApiError } from "../utils/formatApiError";
import { scanAadhaarImage } from "../utils/aadhaarOcr";
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
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  Truck,
  ShieldAlert,
  FileQuestion,
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
import { beneficiaryApi, documentApi, distributionApi, getUser } from "../api";
import type { ReliefDistribution } from "../types";
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
  aadhaar_identifier?: string;
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
    aadhaar_identifier: "",
  };
}

export function BeneficiaryDashboard() {
  const user = getUser();
  const [applications, setApplications] = useState<Beneficiary[]>([]);
  const [form, setForm] = useState(createInitialForm);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [ocr, setOcr] = useState<Record<string, string> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [distributions, setDistributions] = useState<ReliefDistribution[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    dist: ReliefDistribution;
    action: "CONFIRM_ALL" | "PARTIALLY_RECEIVED" | "NOT_RECEIVED" | "REPORT_ISSUE";
  } | null>(null);
  const [missingItemsState, setMissingItemsState] = useState<
    Record<number, { received: number; missing: number; reason: string }>
  >({});
  const [confirmFeedback, setConfirmFeedback] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) return;
    setScanning(true);
    setScanMessage("Scanning Aadhaar image...");
    try {
      const parsed = await scanAadhaarImage(selectedFile);
      if (parsed.aadhaarNumber) {
        setForm((prev) => ({
          ...prev,
          aadhaar_identifier: parsed.aadhaarNumber,
          name: parsed.name || prev.name,
          date_of_birth: parsed.dateOfBirth || prev.date_of_birth,
          gender: parsed.gender || prev.gender,
        }));
        setScanMessage(`Aadhaar detected: ${parsed.aadhaarNumber}`);
      } else {
        setScanMessage("Aadhaar uploaded. Please confirm or enter the 12-digit number manually.");
      }
    } catch (err) {
      console.warn("Auto-scan notice:", err);
      setScanMessage("Aadhaar image selected. Manual verification will proceed.");
    } finally {
      setScanning(false);
    }
  };

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
      const [appRes, distRes] = await Promise.all([
        beneficiaryApi.mine(),
        distributionApi.myDistributions().catch(() => ({ data: { items: [], total: 0 } })),
      ]);
      setApplications(appRes.data.items);
      setDistributions(distRes.data.items || []);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setRefreshing(false);
    }
  };

  const openConfirmModal = (
    dist: ReliefDistribution,
    action: "CONFIRM_ALL" | "PARTIALLY_RECEIVED" | "NOT_RECEIVED" | "REPORT_ISSUE"
  ) => {
    const initialMissing: Record<number, { received: number; missing: number; reason: string }> = {};
    dist.items.forEach((it) => {
      if (action === "CONFIRM_ALL") {
        initialMissing[it.id] = { received: it.quantity_distributed, missing: 0, reason: "" };
      } else if (action === "NOT_RECEIVED") {
        initialMissing[it.id] = { received: 0, missing: it.quantity_distributed, reason: "Item not received" };
      } else {
        initialMissing[it.id] = { received: it.quantity_distributed, missing: 0, reason: "" };
      }
    });
    setMissingItemsState(initialMissing);
    setConfirmFeedback("");
    setConfirmModal({ dist, action });
  };

  const handleConfirmSubmit = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    setError("");
    try {
      const missingPayload = Object.entries(missingItemsState).map(([itemId, val]) => ({
        item_id: Number(itemId),
        quantity_received: val.received,
        quantity_missing: val.missing,
        reason: val.reason,
      }));

      await distributionApi.confirmReceipt(confirmModal.dist.id, {
        action: confirmModal.action,
        feedback: confirmFeedback,
        missing_items: missingPayload,
      });

      setMessage(`Receipt confirmation recorded for ${confirmModal.dist.distribution_ref}.`);
      setConfirmModal(null);
      await refresh();
    } catch (err: any) {
      setError(
        typeof err === "object" && err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to record receipt confirmation."
      );
    } finally {
      setConfirmLoading(false);
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
        aadhaar_identifier: (form.aadhaar_identifier || "").trim() || null,
        date_of_birth: form.date_of_birth || null,
        date_affected: form.date_affected || null,
        family_size: Number(form.family_size),
        number_of_dependents: Number(form.number_of_dependents),
      };
      const { data } = await beneficiaryApi.create(payload);
      const applicationId = data.beneficiary.id as number;
      try {
        const scan = await documentApi.scan(applicationId, file);
        if (scan?.data?.extracted_fields && typeof scan.data.extracted_fields === "object") {
          setOcr(scan.data.extracted_fields);
        }
      } catch {
        try {
          await documentApi.upload(applicationId, file);
        } catch (uploadErr) {
          console.warn("Upload fallback notice:", uploadErr);
        }
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
  const aidHistory = (verified || []).flatMap((item, index) => {
    if (!item) return [];
    if (item.allocations && item.allocations.length > 0) {
      return item.allocations.map((alloc) => ({
        id: alloc?.id || index,
        date: alloc?.allocated_at || item.updated_at,
        type: alloc?.item_name || "Relief Supplies",
        quantity: `${alloc?.quantity_allocated ?? 1} units (${alloc?.centre_name || "Centre"})`,
        status: alloc?.status || "ALLOCATED",
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
              {typeof ocr.name === "string" ? ocr.name : "Name not detected"} ·{" "}
              {typeof ocr.date_of_birth === "string" ? ocr.date_of_birth : "Date of birth not detected"} ·{" "}
              {typeof ocr.gender === "string" ? ocr.gender : "Gender not detected"} ·{" "}
              {typeof ocr.masked_aadhaar === "string" ? ocr.masked_aadhaar : "Identifier not detected"}
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
              {user?.email && (user.email.includes("demo") || user.email.includes("example.com")) && (
                <button
                  type="button"
                  className="secondary-button"
                  style={{ marginLeft: "auto" }}
                  onClick={generateRandomInputs}
                >
                  <RefreshCw size={15} /> GENERATE RANDOM INPUTS
                </button>
              )}
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
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              <UploadCloud size={28} />
              <strong>{file?.name || "Choose an Aadhaar image"}</strong>
              <span>JPG or PNG, maximum 10 MB</span>
            </label>
            {scanning && (
              <p style={{ marginTop: "0.5rem", color: "#3b82f6", fontWeight: 500 }}>
                🔍 Scanning Aadhaar image with OCR...
              </p>
            )}
            {scanMessage && !scanning && (
              <p style={{ marginTop: "0.5rem", color: "#10b981", fontWeight: 500 }}>
                ✓ {scanMessage}
              </p>
            )}
            <div style={{ marginTop: "1rem" }}>
              <label>
                Aadhaar Number (Auto-extracted or Manual)
                <input
                  type="text"
                  placeholder="12-digit Aadhaar UID"
                  value={form.aadhaar_identifier || ""}
                  onChange={(e) =>
                    setForm({ ...form, aadhaar_identifier: e.target.value })
                  }
                />
              </label>
            </div>
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
      {/* RECEIPT CONFIRMATION MODAL */}
      {confirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            className="panel"
            style={{
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border, #cbd5e1)",
            }}
          >
            <div className="panel-header" style={{ marginBottom: "1rem" }}>
              <div>
                <h2>
                  {confirmModal.action === "CONFIRM_ALL" && "Confirm All Supplies Received"}
                  {confirmModal.action === "PARTIALLY_RECEIVED" && "Confirm Partial Supply Receipt"}
                  {confirmModal.action === "NOT_RECEIVED" && "Report Supplies Not Received"}
                  {confirmModal.action === "REPORT_ISSUE" && "Report Missing or Incorrect Items"}
                </h2>
                <p>Distribution Ref: <code>{confirmModal.dist.distribution_ref}</code></p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmModal(null)}
                style={{ padding: "0.3rem 0.6rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#64748b" }}>
              {confirmModal.action === "CONFIRM_ALL" && (
                <p>
                  You are confirming that you have received all distributed quantities in good order. This will officially close the handover record.
                </p>
              )}
              {confirmModal.action === "PARTIALLY_RECEIVED" && (
                <p>
                  Please specify the actual quantity you received and any missing quantity for each item below:
                </p>
              )}
              {confirmModal.action === "NOT_RECEIVED" && (
                <p style={{ color: "#dc2626" }}>
                  You are reporting that you have not received the distributed packages. This discrepancy will be immediately flagged to the relief officer.
                </p>
              )}
              {confirmModal.action === "REPORT_ISSUE" && (
                <p style={{ color: "#d97706" }}>
                  Please detail any missing, damaged, or incorrect items so relief officers can investigate and dispatch replacements.
                </p>
              )}
            </div>

            {/* ITEM BREAKDOWN */}
            {(confirmModal.action === "PARTIALLY_RECEIVED" ||
              confirmModal.action === "REPORT_ISSUE" ||
              confirmModal.action === "NOT_RECEIVED") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                {confirmModal.dist.items.map((it) => {
                  const state = missingItemsState[it.id] || {
                    received: it.quantity_distributed,
                    missing: 0,
                    reason: "",
                  };
                  return (
                    <div
                      key={it.id}
                      style={{
                        padding: "0.75rem",
                        background: "var(--bg-subtle, #f8fafc)",
                        borderRadius: "6px",
                        border: "1px solid var(--border, #e2e8f0)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <strong>{it.item_name}</strong>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          Distributed: {it.quantity_distributed} {it.unit}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" }}>
                        <label style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          Quantity Received ({it.unit})
                          <input
                            type="number"
                            min={0}
                            max={it.quantity_distributed}
                            value={state.received}
                            disabled={confirmModal.action === "NOT_RECEIVED"}
                            onChange={(e) => {
                              const rec = Math.max(0, Math.min(it.quantity_distributed, Number(e.target.value) || 0));
                              const miss = it.quantity_distributed - rec;
                              setMissingItemsState((prev) => ({
                                ...prev,
                                [it.id]: { ...state, received: rec, missing: miss },
                              }));
                            }}
                            style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                          />
                        </label>
                        <label style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          Quantity Missing ({it.unit})
                          <input
                            type="number"
                            min={0}
                            max={it.quantity_distributed}
                            value={state.missing}
                            disabled={confirmModal.action === "NOT_RECEIVED"}
                            onChange={(e) => {
                              const miss = Math.max(0, Math.min(it.quantity_distributed, Number(e.target.value) || 0));
                              const rec = it.quantity_distributed - miss;
                              setMissingItemsState((prev) => ({
                                ...prev,
                                [it.id]: { ...state, received: rec, missing: miss },
                              }));
                            }}
                            style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                          />
                        </label>
                      </div>
                      <label style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        Item Note / Reason for missing or damage
                        <input
                          type="text"
                          placeholder="e.g. 1 can was punctured, or item not handed over"
                          value={state.reason}
                          onChange={(e) =>
                            setMissingItemsState((prev) => ({
                              ...prev,
                              [it.id]: { ...state, reason: e.target.value },
                            }))
                          }
                          style={{ padding: "0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {/* OVERALL FEEDBACK */}
            <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
              Beneficiary Feedback & Remarks (Optional)
              <textarea
                rows={3}
                placeholder="Add any remarks regarding the condition, distribution camp, or officer handover..."
                value={confirmFeedback}
                onChange={(e) => setConfirmFeedback(e.target.value)}
                style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirmModal(null)}
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmSubmit}
                disabled={confirmLoading}
              >
                {confirmLoading ? "Submitting confirmation..." : "Submit Confirmation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY RELIEF DISTRIBUTION SECTION */}
      <section className="role-section my-relief-distribution" style={{ marginTop: "1.5rem" }}>
        <div className="role-section-heading embedded">
          <div>
            <h2>My Relief Distribution</h2>
            <p>Track allocated emergency supplies, verify officer handovers, and confirm package receipts.</p>
          </div>
          <Truck size={20} color="#0d9488" />
        </div>

        {distributions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {distributions.map((dist) => {
              const isPendingConfirm = dist.status === "Distributed – Awaiting Beneficiary Confirmation";
              return (
                <article
                  key={dist.id}
                  className="panel"
                  style={{
                    padding: "1.25rem",
                    border: isPendingConfirm ? "1.5px solid #f59e0b" : "1px solid var(--border, #cbd5e1)",
                    background: "var(--bg-panel, #ffffff)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>DISTRIBUTION REF</span>
                        <code style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f766e" }}>{dist.distribution_ref}</code>
                      </div>
                      <small style={{ color: "#64748b", display: "block", marginTop: "0.25rem" }}>
                        Handed over on {new Date(dist.distributed_at).toLocaleString()} {dist.officer_name ? `by ${dist.officer_name}` : ""}
                        {dist.centre_name ? ` · ${dist.centre_name}` : ""}
                      </small>
                    </div>
                    <span
                      className={`status-badge ${
                        dist.status === "Fully Received – Confirmed"
                          ? "verified"
                          : dist.status === "Distributed – Awaiting Beneficiary Confirmation"
                          ? "pending"
                          : dist.status === "Partially Received"
                          ? "under_review"
                          : "rejected"
                      }`}
                      style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
                    >
                      {dist.status}
                    </span>
                  </div>

                  {/* ITEMS TABLE */}
                  <div className="table-scroll" style={{ marginBottom: "1rem" }}>
                    <table style={{ width: "100%", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-subtle, #f8fafc)", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ textAlign: "left", padding: "0.5rem" }}>Supply Item</th>
                          <th style={{ textAlign: "center", padding: "0.5rem" }}>Allocated</th>
                          <th style={{ textAlign: "center", padding: "0.5rem" }}>Distributed</th>
                          <th style={{ textAlign: "center", padding: "0.5rem" }}>Received</th>
                          <th style={{ textAlign: "center", padding: "0.5rem" }}>Missing</th>
                          <th style={{ textAlign: "right", padding: "0.5rem" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dist.items.map((it) => (
                          <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.5rem" }}>
                              <strong>{it.item_name}</strong>
                              {it.category && <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>{it.category}</span>}
                            </td>
                            <td style={{ textAlign: "center", padding: "0.5rem" }}>
                              {it.quantity_allocated} {it.unit}
                            </td>
                            <td style={{ textAlign: "center", padding: "0.5rem", fontWeight: 600 }}>
                              {it.quantity_distributed} {it.unit}
                            </td>
                            <td style={{ textAlign: "center", padding: "0.5rem", color: it.quantity_received !== null ? "#0f766e" : "#64748b" }}>
                              {it.quantity_received !== null ? `${it.quantity_received} ${it.unit}` : "—"}
                            </td>
                            <td style={{ textAlign: "center", padding: "0.5rem", color: (it.quantity_missing || 0) > 0 ? "#dc2626" : "#64748b" }}>
                              {(it.quantity_missing || 0) > 0 ? `${it.quantity_missing} ${it.unit}` : "0"}
                            </td>
                            <td style={{ textAlign: "right", padding: "0.5rem" }}>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.15rem 0.4rem",
                                  borderRadius: "4px",
                                  background: it.item_status === "Fully Received – Confirmed" ? "#dcfce7" : "#fef3c7",
                                  color: it.item_status === "Fully Received – Confirmed" ? "#166534" : "#92400e",
                                }}
                              >
                                {it.item_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* FEEDBACK / DISCREPANCY DISPLAY */}
                  {dist.discrepancy_details && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "#fef2f2", color: "#991b1b", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "0.75rem", border: "1px solid #fecaca" }}>
                      <strong>Reported Discrepancy:</strong> {dist.discrepancy_details}
                    </div>
                  )}

                  {dist.beneficiary_feedback && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "var(--bg-subtle, #f8fafc)", color: "#334155", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "0.75rem", border: "1px solid #e2e8f0" }}>
                      <strong>Your Feedback:</strong> {dist.beneficiary_feedback}
                      {dist.confirmed_at && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "0.5rem" }}>
                          (Confirmed {new Date(dist.confirmed_at).toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}

                  {/* ACTIONS FOR PENDING CONFIRMATION */}
                  {isPendingConfirm && (
                    <div style={{ borderTop: "1px solid var(--border, #e2e8f0)", paddingTop: "0.75rem" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.5rem" }}>
                        Action required: Verify and confirm received supplies
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => openConfirmModal(dist, "CONFIRM_ALL")}
                          style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#059669" }}
                        >
                          <CheckCircle2 size={15} /> Confirm All Received
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openConfirmModal(dist, "PARTIALLY_RECEIVED")}
                          style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <AlertCircle size={15} color="#d97706" /> Partially Received
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openConfirmModal(dist, "NOT_RECEIVED")}
                          style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <XCircle size={15} color="#dc2626" /> Not Received
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => openConfirmModal(dist, "REPORT_ISSUE")}
                          style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                        >
                          <ShieldAlert size={15} color="#b91c1c" /> Report Missing or Incorrect Items
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: "1.5rem", textAlign: "center" }}>
            <Package size={32} color="#94a3b8" style={{ margin: "0 auto 0.5rem" }} />
            <p style={{ margin: 0 }}>No relief supply distributions have been handed over for your application yet.</p>
            <small style={{ color: "#64748b" }}>Once a relief officer hands over allocated packages, your distribution reference ID and confirmation options will appear here.</small>
          </div>
        )}
      </section>

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
                className={`status-badge ${(item.verification_status || "PENDING").toLowerCase()}`}
              >
                {(item.verification_status || "PENDING").replace(/_/g, " ")}
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
    (applications || []).reduce<Record<string, number>>((acc, item) => {
      const st = item?.verification_status || "PENDING";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
    color: colors[name] || "#64748b",
  }));
}

function apiError(error: unknown): string {
  return formatApiError(error, "The application could not be saved.");
}
