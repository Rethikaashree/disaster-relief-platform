import { useEffect, useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Truck,
  Clock,
  Package,
  Boxes,
  Check,
  History,
  PackageCheck,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { beneficiaryApi, distributionApi } from "../api";
import type { Beneficiary, ReliefDistribution, SupplyAllocation } from "../types";

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
  const [allocations, setAllocations] = useState<SupplyAllocation[]>([]);
  const [distributions, setDistributions] = useState<ReliefDistribution[]>([]);
  const [handoverQuantities, setHandoverQuantities] = useState<Record<number, number>>({});
  const [officerNotes, setOfficerNotes] = useState("");
  const [handoverLoading, setHandoverLoading] = useState(false);

  const loadBeneficiaryData = async () => {
    try {
      const [benRes, histRes, allocRes, distRes] = await Promise.all([
        beneficiaryApi.get(id),
        beneficiaryApi.history(id),
        distributionApi.allocations(id).catch(() => ({ data: { items: [], total: 0 } })),
        distributionApi.beneficiaryDistributions(id).catch(() => ({ data: { items: [], total: 0 } })),
      ]);
      setItem(benRes.data);
      setHistory(histRes.data.records);
      const allocs = allocRes.data.items || [];
      setAllocations(allocs);
      setDistributions(distRes.data.items || []);
      const initialQtys: Record<number, number> = {};
      allocs.forEach((a: SupplyAllocation) => {
        initialQtys[a.id] = a.quantity_allocated;
      });
      setHandoverQuantities(initialQtys);
    } catch {
      setError("Unable to load beneficiary details and supply allocations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBeneficiaryData();
  }, [id]);

  const handleMarkDistributed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allocations.length === 0) return;
    setHandoverLoading(true);
    setMessage("");
    setError("");
    try {
      const itemsPayload = allocations.map((alloc) => ({
        allocation_id: alloc.id,
        quantity_distributed: handoverQuantities[alloc.id] ?? alloc.quantity_allocated,
        notes: `Handed over by officer. Allocated: ${alloc.quantity_allocated} ${alloc.unit}`,
      }));
      const res = await distributionApi.handover({
        beneficiary_id: id,
        centre_id: allocations[0]?.centre_id,
        officer_notes: officerNotes || "Supplies handed over at relief post",
        items: itemsPayload,
      });
      setMessage(`Supplies marked as distributed! Reference ID: ${res.data.distribution.distribution_ref}`);
      setOfficerNotes("");
      await loadBeneficiaryData();
    } catch (err: any) {
      setError(
        typeof err === "object" && err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to mark supplies as distributed."
      );
    } finally {
      setHandoverLoading(false);
    }
  };
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

          {/* RELIEF SUPPLY DISTRIBUTION & RECEIPT CONFIRMATION PANEL */}
          <article className="panel distribution-handover-panel" style={{ marginTop: "1.5rem" }}>
            <div className="panel-header">
              <div>
                <h2>Relief Supply Handover & Tracking</h2>
                <p>Record actual quantities handed over to the verified beneficiary and monitor receipt confirmation.</p>
              </div>
              <Truck size={20} color="#0d9488" />
            </div>

            {/* FORM TO ENTER ACTUAL QUANTITIES AND MARK DISTRIBUTED */}
            {allocations.length > 0 ? (
              <form onSubmit={handleMarkDistributed} style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border, #e2e8f0)" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600 }}>
                  Enter Actual Quantities Handed Over
                </h3>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.8rem", color: "#64748b" }}>
                  Verify the physical items handed over at the relief post. A unique distribution reference ID will be generated upon submission.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                  {allocations.map((alloc) => (
                    <div
                      key={alloc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0.75rem",
                        background: "#ffffff",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <div>
                        <strong>{alloc.item_name || "Relief Item"}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>
                          Allocated: {alloc.quantity_allocated} {alloc.unit} from {alloc.centre_name || "Hub"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.8rem", color: "#334155", fontWeight: 500 }}>
                          Qty Handed Over:
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={handoverQuantities[alloc.id] ?? alloc.quantity_allocated}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setHandoverQuantities((prev) => ({ ...prev, [alloc.id]: val }));
                          }}
                          style={{ width: "80px", padding: "0.35rem 0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", textAlign: "center" }}
                          required
                        />
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{alloc.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Officer Distribution Notes
                  <input
                    type="text"
                    placeholder="e.g. Handed over at relief camp booth 2, recipient signed register."
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    style={{ padding: "0.45rem 0.65rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  />
                </label>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={handoverLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <Truck size={16} />
                  {handoverLoading ? "Recording Handover..." : "Mark as Distributed"}
                </button>
              </form>
            ) : (
              <div style={{ padding: "1rem", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <strong style={{ fontSize: "0.9rem" }}>No supplies allocated yet</strong>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                    Allocate supplies from regional warehouses before handing them over to the beneficiary.
                  </p>
                </div>
                <Link to="/distribution" className="secondary-button" style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}>
                  Go to Logistics Hub
                </Link>
              </div>
            )}

            {/* DISTRIBUTION RECORDS & BENEFICIARY RECEIPT CONFIRMATION STATUS */}
            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem", fontWeight: 600 }}>
                Distribution Records & Beneficiary Confirmation
              </h3>

              {distributions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {distributions.map((dist) => {
                    const isPending = dist.status === "Distributed – Awaiting Beneficiary Confirmation";
                    const isConfirmed = dist.status === "Fully Received – Confirmed";
                    const isPartial = dist.status === "Partially Received";
                    const isNotReceived = dist.status === "Not Received";
                    const isIssue = dist.status === "Issue Reported";

                    return (
                      <div
                        key={dist.id}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "6px",
                          border: isIssue || isNotReceived ? "1.5px solid #ef4444" : isPartial ? "1.5px solid #f59e0b" : "1px solid #cbd5e1",
                          background: isIssue || isNotReceived ? "#fef2f2" : "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Ref: </span>
                            <code style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f766e" }}>{dist.distribution_ref}</code>
                            <small style={{ color: "#64748b", display: "block" }}>
                              Distributed {new Date(dist.distributed_at).toLocaleString()} by {dist.officer_name || "Officer"}
                            </small>
                          </div>
                          <span
                            className={`status-badge ${
                              isConfirmed ? "verified" : isPending ? "pending" : isPartial ? "under_review" : "rejected"
                            }`}
                            style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                          >
                            {dist.status}
                          </span>
                        </div>

                        {/* ITEMS SUMMARY */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          {dist.items.map((it) => (
                            <span
                              key={it.id}
                              style={{
                                fontSize: "0.8rem",
                                padding: "0.25rem 0.5rem",
                                background: "var(--bg-subtle, #f1f5f9)",
                                borderRadius: "4px",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <strong>{it.item_name}</strong>: {it.quantity_distributed} {it.unit} distributed
                              {it.quantity_received !== null && (
                                <span style={{ color: it.quantity_missing ? "#dc2626" : "#059669", marginLeft: "0.25rem" }}>
                                  ({it.quantity_received} received{it.quantity_missing ? `, ${it.quantity_missing} missing` : ""})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>

                        {/* DISCREPANCY OR CONFIRMATION NOTES */}
                        {dist.discrepancy_details && (
                          <div style={{ padding: "0.4rem 0.6rem", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", fontSize: "0.75rem", marginBottom: "0.4rem" }}>
                            <strong>Reported Discrepancy:</strong> {dist.discrepancy_details}
                          </div>
                        )}
                        {dist.beneficiary_feedback && (
                          <div style={{ padding: "0.4rem 0.6rem", background: "#f8fafc", color: "#334155", borderRadius: "4px", fontSize: "0.75rem" }}>
                            <strong>Beneficiary Remarks:</strong> {dist.beneficiary_feedback}
                          </div>
                        )}
                        {isPending && (
                          <div style={{ fontSize: "0.75rem", color: "#d97706", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem" }}>
                            <Clock size={13} /> Pending beneficiary receipt confirmation on their dashboard.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  No distributions have been recorded for this beneficiary yet. Hand over allocated supplies above to initiate the confirmation workflow.
                </p>
              )}
            </div>
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
