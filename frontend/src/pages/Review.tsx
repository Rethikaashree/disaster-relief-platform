import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  Check,
  History,
  PackageCheck,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { beneficiaryApi } from "../api";
import type { Beneficiary } from "../types";

export function Review() {
  const { beneficiaryId } = useParams();
  const id = Number(beneficiaryId);
  const navigate = useNavigate();
  const [item, setItem] = useState<Beneficiary | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([beneficiaryApi.get(id), beneficiaryApi.history(id)])
      .then(([a, h]) => {
        setItem(a.data);
        setHistory(h.data.records);
      })
      .catch(() => setError("Unable to load beneficiary."))
      .finally(() => setLoading(false));
  }, [id]);
  const decision = async (newStatus: string) => {
    if (!remarks.trim()) return setError("A review remark is required.");
    setError("");
    try {
      await beneficiaryApi.verify(id, { new_status: newStatus, remarks });
      setMessage(`Status changed to ${newStatus}.`);
      const refreshed = await beneficiaryApi.get(id);
      setItem(refreshed.data);
      const h = await beneficiaryApi.history(id);
      setHistory(h.data.records);
    } catch (err) {
      setError(
        typeof err === "object" && err && "response" in err
          ? (err as any).response?.data?.detail ||
              "Decision could not be saved."
          : "Decision could not be saved.",
      );
    }
  };
  if (loading) return <div className="app-loader">Loading review...</div>;
  if (!item) return <div className="alert danger">Beneficiary not found.</div>;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MANUAL REVIEW</span>
          <h1>{item.name}</h1>
          <p>
            {item.application_id}{item.masked_aadhaar ? ` · ${item.masked_aadhaar}` : ""}
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => navigate("/beneficiaries")}
        >
          Back to registry
        </button>
      </div>
      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert danger">{error}</div>}
      <section className="review-layout">
        <div className="review-main">
          <article className="panel record-panel">
            <div className="panel-header">
              <div>
                <h2>Application record</h2>
                <p>Details submitted by the beneficiary</p>
              </div>
              <span
                className={`status-badge ${item.verification_status.toLowerCase()}`}
              >
                {item.verification_status}
              </span>
            </div>
            <div className="detail-grid">
              <Detail label="Date of birth" value={item.date_of_birth || "—"} />
              <Detail label="Gender" value={item.gender || "—"} />
              <Detail label="Phone" value={item.phone || "—"} />
              <Detail
                label="District / State"
                value={`${item.district || "—"} / ${item.state || "—"}`}
              />
              <Detail label="PIN" value={item.pincode || "—"} />
              <Detail label="Disaster" value={item.disaster_type || "—"} />
              <Detail
                label="Affected location"
                value={item.affected_location || "—"}
              />
              <Detail label="Date affected" value={item.date_affected || "—"} />
              <Detail
                label="Family size"
                value={String(item.family_size || "—")}
              />
              <Detail
                label="Dependents"
                value={String(item.number_of_dependents || "—")}
              />
              <Detail
                label="Triage priority"
                value={item.priority_level || "NORMAL"}
              />
              <Detail
                label="Supply allocation"
                value={item.allocation_status || "PENDING"}
              />
            </div>
            {item.request_items && item.request_items.length > 0 && (
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border, #e2e8f0)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>Requested Relief Supplies</h3>
                  <Link
                    to="/distribution"
                    className="secondary-button"
                    style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Boxes size={14} /> Manage Distribution
                  </Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
                  {item.request_items.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: "0.6rem 0.75rem",
                        background: "var(--bg-subtle, #f8fafc)",
                        borderRadius: "6px",
                        border: "1px solid var(--border, #e2e8f0)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <strong style={{ display: "block", fontSize: "0.85rem" }}>{req.item_name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          Needed: {req.quantity_requested} {req.unit} · Allocated: {req.quantity_allocated}
                        </span>
                      </div>
                      <span
                        className={`status-badge ${req.status === "FULFILLED" ? "verified" : req.status === "PARTIAL" ? "under_review" : "pending"}`}
                        style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
        <aside className="review-side">
          <article className="panel decision-panel">
            <div className="panel-header">
              <div>
                <h2>Review decision</h2>
                <p>Record an officer decision</p>
              </div>
            </div>
            <label className="decision-label">
              Remarks
              <textarea
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Explain the review decision"
              />
            </label>
            <div className="decision-actions">
              <button
                className="approve-button"
                onClick={() => decision("VERIFIED")}
              >
                <Check size={18} />
                Verify
              </button>
              <button
                className="reject-button"
                onClick={() => decision("REJECTED")}
              >
                <XCircle size={18} />
                Reject
              </button>
              <button
                className="flag-button"
                onClick={() => decision("DUPLICATE_FLAGGED")}
              >
                <ShieldAlert size={18} />
                Flag duplicate
              </button>
            </div>
          </article>
          <article className="panel history-panel">
            <div className="panel-header">
              <div>
                <h2>Decision history</h2>
                <p>All prior review actions</p>
              </div>
              <History />
            </div>
            <div className="history-list">
              {history.length ? (
                history.map((record) => (
                  <div key={record.id}>
                    <span
                      className={`history-icon ${record.new_status.toLowerCase()}`}
                    >
                      <BadgeCheck size={15} />
                    </span>
                    <div>
                      <strong>{record.new_status.replace("_", " ")}</strong>
                      <p>{record.remarks}</p>
                      <small>
                        {record.officer} ·{" "}
                        {new Date(record.created_at).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No decisions recorded yet.</div>
              )}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
