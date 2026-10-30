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
import { beneficiaryApi, distributionApi, supplyRequestApi } from "../api";
import type { Beneficiary, ReliefDistribution, SupplyAllocation, BeneficiarySupplyRequest, DistributionCentre, SupplyInventory } from "../types";

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
  // Manage Distribution Modal State
  const [showManageDistModal, setShowManageDistModal] = useState(false);
  const [centres, setCentres] = useState<DistributionCentre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<number | null>(null);
  const [allocInputs, setAllocInputs] = useState<Record<number, number>>({});
  const [extraAllocInvId, setExtraAllocInvId] = useState<number | "">("");
  const [extraAllocQty, setExtraAllocQty] = useState<number>(1);
  const [extraAllocs, setExtraAllocs] = useState<Array<{ inventory_id: number; quantity: number }>>([]);
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocModalError, setAllocModalError] = useState("");
  const [allocModalSuccess, setAllocModalSuccess] = useState("");

  const [supplyRequests, setSupplyRequests] = useState<BeneficiarySupplyRequest[]>([]);
  const [reviewDecisions, setReviewDecisions] = useState<
    Record<number, { action: string; quantity_approved: number; reason: string }>
  >({});
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadBeneficiaryData = async () => {
    try {
      const [benRes, histRes, allocRes, distRes, reqRes] = await Promise.all([
        beneficiaryApi.get(id),
        beneficiaryApi.history(id),
        distributionApi.allocations(id).catch(() => ({ data: { items: [], total: 0 } })),
        distributionApi.beneficiaryDistributions(id).catch(() => ({ data: { items: [], total: 0 } })),
        supplyRequestApi.beneficiaryRequests(id).catch(() => ({ data: { items: [], total: 0 } })),
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

      const reqs = reqRes.data.items || [];
      setSupplyRequests(reqs);
      const initialDecisions: Record<number, { action: string; quantity_approved: number; reason: string }> = {};
      reqs.forEach((r: BeneficiarySupplyRequest) => {
        if (r.status === "PENDING" || r.status === "PARTIALLY_APPROVED") {
          r.items.forEach((it) => {
            if (it.status === "PENDING") {
              initialDecisions[it.id] = {
                action: "APPROVE_FULL",
                quantity_approved: it.quantity_requested,
                reason: "",
              };
            }
          });
        }
      });
      setReviewDecisions((prev) => ({ ...initialDecisions, ...prev }));
    } catch {
      setError("Unable to load beneficiary details and supply allocations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBeneficiaryData();
  }, [id]);

  const openManageDistribution = async () => {
    setAllocModalError("");
    setAllocModalSuccess("");
    setShowManageDistModal(true);
    try {
      let currentCentres = centres;
      if (currentCentres.length === 0) {
        const res = await distributionApi.centres();
        currentCentres = res.data.items || [];
        setCentres(currentCentres);
      }
      // Pick matching centre or first
      let chosenCentre = currentCentres[0];
      if (item?.district) {
        const match = currentCentres.find(
          (c) => Boolean(item?.district && c.district.toLowerCase() === item.district.toLowerCase())
        );
        if (match) chosenCentre = match;
      }
      if (chosenCentre) {
        setSelectedCentreId(chosenCentre.id);
        initAllocInputsForCentre(chosenCentre);
      }
    } catch {
      setAllocModalError("Failed to load distribution centres inventory.");
    }
  };

  const initAllocInputsForCentre = (c: DistributionCentre) => {
    if (!item?.request_items) return;
    const inputs: Record<number, number> = {};
    item.request_items.forEach((req) => {
      const remainingNeeded = Math.max(0, req.quantity_requested - req.quantity_allocated);
      // match inventory item by name at this centre
      const inv = (c.inventories || []).find(
        (i) => i.item_name.toLowerCase().trim() === req.item_name.toLowerCase().trim()
      );
      const stock = inv ? inv.quantity_available : 0;
      if (stock <= 0) {
        inputs[req.id] = 0;
      } else {
        inputs[req.id] = Math.min(remainingNeeded, stock);
      }
    });
    setAllocInputs(inputs);
    setExtraAllocs([]);
  };

  const handleCentreChange = (centreId: number) => {
    setSelectedCentreId(centreId);
    const c = centres.find((x) => x.id === centreId);
    if (c) {
      initAllocInputsForCentre(c);
    }
  };

  const handleAddExtraItem = () => {
    if (!extraAllocInvId || extraAllocQty <= 0) return;
    const curCentre = centres.find((c) => c.id === selectedCentreId);
    const inv = curCentre?.inventories?.find((i) => i.id === Number(extraAllocInvId));
    if (!inv) return;
    if (extraAllocQty > inv.quantity_available) {
      setAllocModalError(`Cannot allocate more than available stock (${inv.quantity_available} ${inv.unit}).`);
      return;
    }
    setExtraAllocs((prev) => [
      ...prev.filter((x) => x.inventory_id !== inv.id),
      { inventory_id: inv.id, quantity: extraAllocQty },
    ]);
    setExtraAllocInvId("");
    setExtraAllocQty(1);
    setAllocModalError("");
  };

  const handleConfirmAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentreId) {
      setAllocModalError("Please select a distribution centre.");
      return;
    }
    const curCentre = centres.find((c) => c.id === selectedCentreId);
    if (!curCentre) return;

    // Build allocations payload
    const allocationsPayload: Array<{
      inventory_id: number;
      request_item_id?: number | null;
      quantity: number;
      notes?: string;
    }> = [];

    // 1. Requested items
    if (item?.request_items) {
      for (const req of item.request_items) {
        const qty = allocInputs[req.id] || 0;
        if (qty > 0) {
          const inv = (curCentre.inventories || []).find(
            (i) => i.item_name.toLowerCase().trim() === req.item_name.toLowerCase().trim()
          );
          if (!inv) {
            setAllocModalError(`Inventory item for '${req.item_name}' not available at this centre.`);
            return;
          }
          if (qty > inv.quantity_available) {
            setAllocModalError(`Insufficient stock for '${inv.item_name}': available ${inv.quantity_available}, attempting to allocate ${qty}.`);
            return;
          }
          allocationsPayload.push({
            inventory_id: inv.id,
            request_item_id: req.id,
            quantity: qty,
            notes: `Allocated for beneficiary request: ${req.item_name}`,
          });
        }
      }
    }

    // 2. Extra items
    for (const ex of extraAllocs) {
      const inv = (curCentre.inventories || []).find((i) => i.id === ex.inventory_id);
      if (inv && ex.quantity > 0) {
        if (ex.quantity > inv.quantity_available) {
          setAllocModalError(`Insufficient stock for '${inv.item_name}'.`);
          return;
        }
        allocationsPayload.push({
          inventory_id: inv.id,
          quantity: ex.quantity,
          notes: `Additional supply allocated by officer`,
        });
      }
    }

    if (allocationsPayload.length === 0) {
      setAllocModalError("Please specify at least one item and quantity to allocate.");
      return;
    }

    setAllocLoading(true);
    setAllocModalError("");
    setAllocModalSuccess("");
    try {
      await distributionApi.allocate(id, {
        centre_id: selectedCentreId,
        allocations: allocationsPayload,
      });
      setAllocModalSuccess("Supplies successfully allocated! Warehouse stock has been reduced.");
      setTimeout(async () => {
        setShowManageDistModal(false);
        setAllocModalSuccess("");
        await loadBeneficiaryData();
      }, 1000);
    } catch (err: any) {
      setAllocModalError(
        typeof err === "object" && err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to allocate supplies. Please check available stock."
      );
    } finally {
      setAllocLoading(false);
    }
  };

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
  const handleReviewRequestSubmit = async (requestId: number) => {
    const targetReq = supplyRequests.find((r) => r.id === requestId);
    if (!targetReq) return;
    const pendingItems = targetReq.items.filter((i) => i.status === "PENDING");
    if (pendingItems.length === 0) return;

    const decisionsPayload = pendingItems.map((item) => {
      const d = reviewDecisions[item.id] || {
        action: "APPROVE_FULL",
        quantity_approved: item.quantity_requested,
        reason: "",
      };
      return {
        item_id: item.id,
        action: d.action,
        quantity_approved:
          d.action === "APPROVE_FULL"
            ? item.quantity_requested
            : d.action === "REJECT"
            ? 0
            : Number(d.quantity_approved),
        reason: d.reason ? d.reason.trim() : undefined,
      };
    });

    for (const d of decisionsPayload) {
      if (d.action === "APPROVE_PARTIAL") {
        if (!d.quantity_approved || d.quantity_approved <= 0) {
          setError("Please specify a valid quantity greater than 0 for partially approved items.");
          return;
        }
        if (!d.reason) {
          setError("Please provide a reason for partial approval.");
          return;
        }
      }
      if (d.action === "REJECT" && !d.reason) {
        setError("Please provide a reason for rejecting an item.");
        return;
      }
    }

    setReviewLoading(true);
    setMessage("");
    setError("");
    try {
      await supplyRequestApi.review(requestId, {
        items: decisionsPayload,
        officer_remarks: reviewRemarks || undefined,
      });
      setMessage("Supply request reviewed! Approved items are now allocated to the beneficiary.");
      setReviewRemarks("");
      await loadBeneficiaryData();
    } catch (err: any) {
      setError(
        typeof err === "object" && err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to process supply request review."
      );
    } finally {
      setReviewLoading(false);
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
              <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e8f0ee", paddingTop: "1.25rem", paddingLeft: "24px", paddingRight: "24px", paddingBottom: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                      Requested Relief Supplies
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px", display: "block" }}>
                      Allocations and requested emergency aid items
                    </span>
                  </div>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openManageDistribution}
                    style={{
                      fontSize: "0.825rem",
                      padding: "0.45rem 0.95rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontWeight: 700,
                      borderRadius: "8px",
                      border: "1.5px solid #0d9488",
                      background: "#f0fdfa",
                      color: "#0f766e",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(13, 148, 136, 0.08)",
                      transition: "all 0.15s ease",
                    }}
                    title="Allocate supplies from available warehouse stock directly to this beneficiary"
                  >
                    <Boxes size={16} color="#0d9488" /> Manage Distribution
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                  {item.request_items.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: "16px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "120px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Top row: Title and Status Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: "0.875rem", color: "#0f172a", lineHeight: 1.35, display: "block", wordBreak: "break-word" }}>
                            {req.item_name}
                          </strong>
                          {req.category && (
                            <span style={{
                              display: "inline-block",
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              padding: "1px 7px",
                              borderRadius: "10px",
                              background: "#f1f5f9",
                              color: "#475569",
                              marginTop: "4px",
                            }}>
                              {req.category}
                            </span>
                          )}
                        </div>
                        <span
                          className={`status-badge ${req.status === "FULFILLED" ? "verified" : req.status === "PARTIAL" ? "under_review" : "pending"}`}
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "12px",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            fontWeight: 700,
                          }}
                        >
                          {req.status}
                        </span>
                      </div>

                      {/* Bottom row: Quantities */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "10px",
                        borderTop: "1px dashed #e2e8f0",
                        marginTop: "12px",
                        fontSize: "0.78rem",
                        color: "#64748b",
                      }}>
                        <span>Needed: <strong style={{ color: "#0f172a", fontWeight: 700 }}>{req.quantity_requested} {req.unit}</strong></span>
                        <span>Allocated: <strong style={{ color: req.quantity_allocated > 0 ? "#0f766e" : "#64748b", fontWeight: 700 }}>{req.quantity_allocated} {req.unit}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          
          {/* BENEFICIARY SUPPLY REQUESTS REVIEW SECTION */}
          {supplyRequests.length > 0 && (
            <article className="panel" style={{ marginTop: "1.5rem" }}>
              <div className="panel-header">
                <div>
                  <h2>Beneficiary Supply Requests</h2>
                  <p>Review requested supplies from this beneficiary, approve or adjust quantities based on available stock.</p>
                </div>
                <Boxes size={20} color="#08736a" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "18px 20px" }}>
                {supplyRequests.map((req) => {
                  const hasPending = req.items.some((i) => i.status === "PENDING");
                  return (
                    <div
                      key={req.id}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: "10px",
                        padding: "16px 18px",
                        background: "var(--cream)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                        <div>
                          <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Supply Request #{req.id}</strong>
                          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "0.75rem" }}>
                            Submitted on {new Date(req.created_at).toLocaleString()}
                          </span>
                        </div>
                        <span
                          className={`status-badge ${
                            req.status === "APPROVED"
                              ? "verified"
                              : req.status === "PARTIALLY_APPROVED"
                              ? "under-review"
                              : req.status === "REJECTED"
                              ? "rejected"
                              : "pending"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {req.notes && (
                        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "0 0 0.75rem 0", fontStyle: "italic" }}>
                          Beneficiary Note: "{req.notes}"
                        </p>
                      )}

                      {/* ITEMS TABLE / LIST */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {req.items.map((it) => {
                          const decision = reviewDecisions[it.id] || {
                            action: "APPROVE_FULL",
                            quantity_approved: it.quantity_requested,
                            reason: "",
                          };

                          return (
                            <div key={it.id} className="request-review-card">
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                <div>
                                  <strong style={{ fontSize: "14px", color: "var(--ink)" }}>{it.item_name}</strong>
                                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                                    Requested: <strong>{it.quantity_requested} {it.unit}</strong> · Current In-Stock: <strong>{it.available_stock ?? "N/A"} {it.unit}</strong>
                                  </div>
                                </div>
                                <span
                                  className={`status-badge ${
                                    it.status === "APPROVED"
                                      ? "verified"
                                      : it.status === "PARTIALLY_APPROVED"
                                      ? "under-review"
                                      : it.status === "REJECTED"
                                      ? "rejected"
                                      : "pending"
                                  }`}
                                  style={{ fontSize: "11px" }}
                                >
                                  {it.status} {it.quantity_approved > 0 ? `(${it.quantity_approved} ${it.unit})` : ""}
                                </span>
                              </div>

                              {it.decision_reason && (
                                <p style={{ fontSize: "12px", color: "var(--teal)", margin: "6px 0 0 0", fontWeight: 500 }}>
                                  Officer reason: {it.decision_reason}
                                </p>
                              )}

                              {it.status === "PENDING" && (
                                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed var(--line)" }}>
                                  <div className="request-radio-group" style={{ margin: 0, padding: 0, border: "none" }}>
                                    <label className="request-radio-label">
                                      <input
                                        type="radio"
                                        name={`action_${it.id}`}
                                        value="APPROVE_FULL"
                                        checked={decision.action === "APPROVE_FULL"}
                                        onChange={() =>
                                          setReviewDecisions((prev) => ({
                                            ...prev,
                                            [it.id]: { action: "APPROVE_FULL", quantity_approved: it.quantity_requested, reason: "" },
                                          }))
                                        }
                                      />
                                      Approve Full ({it.quantity_requested} {it.unit})
                                    </label>
                                    <label className="request-radio-label">
                                      <input
                                        type="radio"
                                        name={`action_${it.id}`}
                                        value="APPROVE_PARTIAL"
                                        checked={decision.action === "APPROVE_PARTIAL"}
                                        onChange={() =>
                                          setReviewDecisions((prev) => ({
                                            ...prev,
                                            [it.id]: { action: "APPROVE_PARTIAL", quantity_approved: Math.min(1, it.quantity_requested), reason: "" },
                                          }))
                                        }
                                      />
                                      Approve Smaller Qty
                                    </label>
                                    <label className="request-radio-label">
                                      <input
                                        type="radio"
                                        name={`action_${it.id}`}
                                        value="REJECT"
                                        checked={decision.action === "REJECT"}
                                        onChange={() =>
                                          setReviewDecisions((prev) => ({
                                            ...prev,
                                            [it.id]: { action: "REJECT", quantity_approved: 0, reason: "" },
                                          }))
                                        }
                                      />
                                      Reject Item
                                    </label>
                                  </div>

                                  {decision.action === "APPROVE_PARTIAL" && (
                                    <div className="request-partial-row">
                                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px" }}>
                                        Approved Qty:
                                        <input
                                          type="number"
                                          min={1}
                                          max={it.quantity_requested}
                                          value={decision.quantity_approved}
                                          onChange={(e) =>
                                            setReviewDecisions((prev) => ({
                                              ...prev,
                                              [it.id]: { ...decision, quantity_approved: Number(e.target.value) },
                                            }))
                                          }
                                          style={{ width: "84px", height: "32px", textAlign: "center", padding: "0 6px", borderRadius: "6px", border: "1px solid var(--line)" }}
                                        />
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Reason for partial approval (e.g. limited stock)..."
                                        value={decision.reason}
                                        onChange={(e) =>
                                          setReviewDecisions((prev) => ({
                                            ...prev,
                                            [it.id]: { ...decision, reason: e.target.value },
                                          }))
                                        }
                                        style={{ flex: 1, minWidth: "220px", height: "32px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px" }}
                                      />
                                    </div>
                                  )}

                                  {decision.action === "REJECT" && (
                                    <div style={{ marginTop: "8px" }}>
                                      <input
                                        type="text"
                                        placeholder="Reason for rejection (e.g. item out of stock / already supplied)..."
                                        value={decision.reason}
                                        onChange={(e) =>
                                          setReviewDecisions((prev) => ({
                                            ...prev,
                                            [it.id]: { ...decision, reason: e.target.value },
                                          }))
                                        }
                                        style={{ width: "100%", height: "34px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--line)", fontSize: "12px" }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {hasPending && (
                        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <input
                            type="text"
                            placeholder="Overall officer remarks (optional)..."
                            value={reviewRemarks}
                            onChange={(e) => setReviewRemarks(e.target.value)}
                            style={{ flex: 1, maxWidth: "350px", height: "38px", padding: "0 12px", fontSize: "13px", borderRadius: "8px", border: "1px solid var(--line)" }}
                          />
                          <button
                            type="button"
                            className="primary-button btn-md"
                            disabled={reviewLoading}
                            onClick={() => handleReviewRequestSubmit(req.id)}
                          >
                            {reviewLoading ? "Confirming..." : "Confirm Request Decisions"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          )}

          {/* RELIEF SUPPLY DISTRIBUTION & RECEIPT CONFIRMATION PANEL */}
          <article className="panel distribution-handover-panel" style={{ marginTop: "1.5rem" }}>
            <div className="panel-header" style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>Relief Supply Handover & Tracking</h2>
                <p style={{ fontSize: "0.825rem", color: "#64748b", margin: 0 }}>Record actual quantities handed over to the verified beneficiary and monitor receipt confirmation.</p>
              </div>
              <Truck size={22} color="#08736a" style={{ flexShrink: 0, marginTop: "2px" }} />
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              {/* FORM TO ENTER ACTUAL QUANTITIES AND MARK DISTRIBUTED */}
              {allocations.length > 0 ? (
                <form onSubmit={handleMarkDistributed} style={{ marginBottom: "1.5rem", padding: "18px 20px", background: "#f8fafc", borderRadius: "10px", border: "1.5px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                    Enter Actual Quantities Handed Over
                  </h3>
                  <p style={{ margin: "0 0 14px 0", fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
                    Verify the physical items handed over at the relief post. A unique distribution reference ID will be generated upon submission.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                    {allocations.map((alloc) => (
                      <div key={alloc.id} className="handover-item-card" style={{ padding: "12px 14px", background: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                        <div>
                          <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>{alloc.item_name || "Relief Item"}</strong>
                          <span style={{ fontSize: "12px", color: "#64748b", display: "block", marginTop: "2px" }}>
                            Allocated: <strong>{alloc.quantity_allocated} {alloc.unit}</strong> from {alloc.centre_name || "Hub"}
                          </span>
                        </div>
                        <div className="handover-input-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <label style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>
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
                            className="handover-input"
                            style={{ width: "70px", height: "34px", textAlign: "center", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "13px", fontWeight: 700 }}
                            required
                          />
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{alloc.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Officer Distribution Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Handed over at relief camp booth 2, recipient signed register."
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={handoverLoading}
                    style={{ height: "40px", padding: "0 18px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <Truck size={16} />
                    {handoverLoading ? "Recording Handover..." : "Mark as Distributed"}
                  </button>
                </form>
              ) : (
                <div style={{ padding: "18px 20px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>No supplies allocated yet</strong>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      Allocate supplies from regional warehouses before handing them over to the beneficiary.
                    </p>
                  </div>
                  <Link to="/distribution" className="secondary-button" style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "6px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    Go to Logistics Hub
                  </Link>
                </div>
              )}

            {/* DISTRIBUTION RECORDS & BENEFICIARY RECEIPT CONFIRMATION STATUS */}
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                Distribution Records & Beneficiary Confirmation
              </h3>

              {distributions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                          padding: "14px 16px",
                          borderRadius: "8px",
                          border: isIssue || isNotReceived ? "1.5px solid var(--red)" : isPartial ? "1.5px solid var(--amber)" : "1px solid var(--line)",
                          background: isIssue || isNotReceived ? "#fef2f2" : "#ffffff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "8px" }}>
                          <div>
                            <span style={{ fontSize: "12px", color: "var(--muted)" }}>Ref: </span>
                            <code style={{ fontSize: "13px", fontWeight: 700, color: "var(--teal-dark)" }}>{dist.distribution_ref}</code>
                            <small style={{ color: "var(--muted)", display: "block", marginTop: "2px" }}>
                              Distributed {new Date(dist.distributed_at).toLocaleString()} by {dist.officer_name || "Officer"}
                            </small>
                          </div>
                          <span
                            className={`status-badge ${
                              isConfirmed ? "verified" : isPending ? "pending" : isPartial ? "under_review" : "rejected"
                            }`}
                            style={{ fontSize: "11px" }}
                          >
                            {dist.status}
                          </span>
                        </div>

                        {/* ITEMS SUMMARY */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                          {dist.items.map((it) => (
                            <span
                              key={it.id}
                              style={{
                                fontSize: "12px",
                                padding: "4px 8px",
                                background: "var(--cream)",
                                borderRadius: "6px",
                                border: "1px solid var(--line)",
                              }}
                            >
                              <strong>{it.item_name}</strong>: {it.quantity_distributed} {it.unit} distributed
                              {it.quantity_received !== null && (
                                <span style={{ color: it.quantity_missing ? "var(--red)" : "var(--green)", marginLeft: "4px", fontWeight: 600 }}>
                                  ({it.quantity_received} received{it.quantity_missing ? `, ${it.quantity_missing} missing` : ""})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>

                        {/* DISCREPANCY OR CONFIRMATION NOTES */}
                        {dist.discrepancy_details && (
                          <div style={{ padding: "8px 12px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px", fontSize: "12px", marginBottom: "6px", border: "1px solid #fecaca" }}>
                            <strong>Reported Discrepancy:</strong> {dist.discrepancy_details}
                          </div>
                        )}
                        {dist.beneficiary_feedback && (
                          <div style={{ padding: "8px 12px", background: "var(--cream)", color: "var(--ink)", borderRadius: "6px", fontSize: "12px", border: "1px solid var(--line)" }}>
                            <strong>Beneficiary Remarks:</strong> {dist.beneficiary_feedback}
                          </div>
                        )}
                        {isPending && (
                          <div style={{ fontSize: "12px", color: "var(--amber)", display: "flex", alignItems: "center", gap: "5px", marginTop: "6px", fontWeight: 500 }}>
                            <Clock size={13} /> Pending beneficiary receipt confirmation on their dashboard.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "24px 20px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                  No distributions have been recorded for this beneficiary yet. Hand over allocated supplies above to initiate the confirmation workflow.
                </div>
              )}
            </div>
          </div>
        </article>
        </div>
        <aside className="review-side">
          <article className="panel decision-panel">
            <div className="panel-header" style={{ padding: "18px 20px" }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>Review decision</h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Record an officer decision</p>
              </div>
            </div>
            <div style={{ padding: "18px 20px 20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Remarks <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <textarea
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Explain the review decision..."
                style={{
                  width: "100%",
                  minHeight: "92px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  resize: "vertical",
                  boxSizing: "border-box",
                  marginBottom: "14px",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  className="approve-button"
                  onClick={() => decision("VERIFIED")}
                  style={{
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    background: "#e6f5ee",
                    color: "#16815d",
                    border: "1.5px solid #b8e2cc",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(22, 129, 93, 0.08)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Check size={17} strokeWidth={2.5} />
                  Verify
                </button>
                <button
                  type="button"
                  className="reject-button"
                  onClick={() => decision("REJECTED")}
                  style={{
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    background: "#faecec",
                    color: "#b54141",
                    border: "1.5px solid #ecc0c0",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(181, 65, 65, 0.08)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <XCircle size={17} strokeWidth={2.2} />
                  Reject
                </button>
                <button
                  type="button"
                  className="flag-button"
                  onClick={() => decision("DUPLICATE_FLAGGED")}
                  style={{
                    gridColumn: "1 / -1",
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "13px",
                    background: "#fff4e9",
                    color: "#b75c21",
                    border: "1.5px solid #f4dfc9",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(183, 92, 33, 0.08)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <ShieldAlert size={17} strokeWidth={2.2} />
                  Flag duplicate
                </button>
              </div>
            </div>
          </article>

          <article className="panel history-panel">
            <div className="panel-header" style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>Decision history</h2>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>All prior review actions</p>
              </div>
              <History size={18} color="#64748b" style={{ flexShrink: 0, marginTop: "2px" }} />
            </div>
            <div className="history-list" style={{ padding: "0 20px 20px" }}>
              {history.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {history.map((record) => (
                    <div key={record.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span className={`history-icon ${record.new_status.toLowerCase()}`} style={{ flexShrink: 0, marginTop: "2px" }}>
                        <BadgeCheck size={16} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>{record.new_status.replace("_", " ")}</strong>
                        <p style={{ margin: "2px 0 4px 0", fontSize: "0.8rem", color: "#475569" }}>{record.remarks}</p>
                        <small style={{ color: "#94a3b8", fontSize: "0.75rem", display: "block" }}>
                          {record.officer} · {new Date(record.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "26px 16px", textAlign: "center", color: "#94a3b8", fontSize: "0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #e2e8f0" }}>
                  No decisions recorded yet.
                </div>
              )}
            </div>
          </article>
        </aside>
      </section>

      {/* MANAGE DISTRIBUTION & RESOURCE ALLOCATION MODAL */}
      {showManageDistModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card lg">
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>Manage Relief Distribution & Resource Allocation</h2>
                <p>
                  Allocate emergency supplies to <strong>{item?.name}</strong>. Stock is automatically deducted from inventory.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowManageDistModal(false)}
                title="Close modal"
                aria-label="Close dialog"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body">
              {allocModalSuccess && (
                <div className="alert success" style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={16} /> {allocModalSuccess}
                </div>
              )}

              {allocModalError && (
                <div className="alert danger" style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={16} /> {allocModalError}
                </div>
              )}

              <form id="allocForm" onSubmit={handleConfirmAllocation}>
                {/* CENTRE SELECTOR */}
                <div className="warehouse-selector-box">
                  <label className="warehouse-selector-label">
                    Source Distribution Centre / Warehouse:
                  </label>
                  <select
                    className="warehouse-select"
                    value={selectedCentreId || ""}
                    onChange={(e) => handleCentreChange(Number(e.target.value))}
                  >
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district}) · {c.operating_status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BENEFICIARY REQUESTED SUPPLIES ALLOCATION LIST */}
                <div style={{ marginBottom: "12px" }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                    Requested Supplies & Stock Availability
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>
                    Choose the quantities to allocate. If an item has no stock available, it is marked as Out of Supply.
                  </p>
                </div>

                <div className="supply-alloc-list">
                  {item?.request_items && item.request_items.length > 0 ? (
                    item.request_items.map((req) => {
                      const curCentre = centres.find((c) => c.id === selectedCentreId);
                      const inv = (curCentre?.inventories || []).find(
                        (i) => i.item_name.toLowerCase().trim() === req.item_name.toLowerCase().trim()
                      );
                      const availableStock = inv ? inv.quantity_available : 0;
                      const isOutOfStock = availableStock <= 0;
                      const allocatedVal = allocInputs[req.id] ?? 0;
                      const remainingNeeded = Math.max(0, req.quantity_requested - req.quantity_allocated);

                      return (
                        <div
                          key={req.id}
                          className={`supply-alloc-card ${isOutOfStock ? "out-of-stock" : ""}`}
                        >
                          <div className="supply-alloc-header">
                            <div className="supply-alloc-title-group">
                              <div className="supply-alloc-title">{req.item_name}</div>
                              <div className="supply-alloc-meta">
                                Beneficiary Needed: <strong>{req.quantity_requested} {req.unit}</strong> · Already Allocated: <strong>{req.quantity_allocated}</strong> · Remaining: <strong>{remainingNeeded} {req.unit}</strong>
                              </div>
                            </div>

                            <span
                              className={`supply-stock-pill ${isOutOfStock ? "out-of-stock" : "in-stock"}`}
                            >
                              {isOutOfStock
                                ? "Out of Supply"
                                : `${availableStock} ${req.unit} Available in Stock`}
                            </span>
                          </div>

                          {/* ALLOCATION INPUT */}
                          <div className="supply-alloc-action-row">
                            <span className="supply-alloc-label">
                              Amount to Allocate:
                            </span>

                            {isOutOfStock ? (
                              <span style={{ fontSize: "12px", color: "var(--red)", fontWeight: 600 }}>
                                Cannot allocate (0 stock remaining)
                              </span>
                            ) : (
                              <div className="supply-alloc-input-group">
                                <input
                                  type="number"
                                  min={0}
                                  max={availableStock}
                                  value={allocatedVal}
                                  onChange={(e) => {
                                    const val = Math.max(0, Math.min(Number(e.target.value), availableStock));
                                    setAllocInputs((prev) => ({ ...prev, [req.id]: val }));
                                  }}
                                  className="supply-alloc-input"
                                />
                                <span className="supply-alloc-unit">{req.unit}</span>
                                <span className="supply-alloc-remaining">
                                  (Remaining stock: {availableStock - allocatedVal})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ color: "var(--muted)", fontSize: "13px", margin: "8px 0" }}>
                      No specific supplies requested in application.
                    </p>
                  )}
                </div>

                {/* EXTRA SUPPLIES FROM CENTRE */}
                <div className="extra-supply-box">
                  <div className="extra-supply-title">
                    + Allocate Additional Supplies from Warehouse (Optional)
                  </div>
                  <div className="extra-supply-row">
                    <select
                      value={extraAllocInvId}
                      onChange={(e) => setExtraAllocInvId(e.target.value ? Number(e.target.value) : "")}
                      className="extra-supply-select"
                    >
                      <option value="">Select an additional item in stock...</option>
                      {centres
                        .find((c) => c.id === selectedCentreId)
                        ?.inventories?.filter((i) => i.quantity_available > 0)
                        .map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.item_name} ({inv.quantity_available} {inv.unit} in stock)
                          </option>
                        ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      value={extraAllocQty}
                      onChange={(e) => setExtraAllocQty(Math.max(1, Number(e.target.value)))}
                      className="extra-supply-input"
                    />

                    <button
                      type="button"
                      className="secondary-button extra-supply-btn"
                      onClick={handleAddExtraItem}
                    >
                      + Add Item
                    </button>
                  </div>

                  {extraAllocs.length > 0 && (
                    <div className="extra-supply-tag-list">
                      {extraAllocs.map((ex) => {
                        const curCentre = centres.find((c) => c.id === selectedCentreId);
                        const inv = curCentre?.inventories?.find((i) => i.id === ex.inventory_id);
                        if (!inv) return null;
                        return (
                          <span key={ex.inventory_id} className="extra-supply-tag">
                            {inv.item_name}: {ex.quantity} {inv.unit}
                            <button
                              type="button"
                              className="extra-supply-remove"
                              onClick={() => setExtraAllocs((prev) => prev.filter((x) => x.inventory_id !== ex.inventory_id))}
                              title="Remove item"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* MODAL ACTIONS */}
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button btn-md"
                onClick={() => setShowManageDistModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="allocForm"
                className="primary-button btn-md"
                disabled={allocLoading}
              >
                {allocLoading ? "Allocating & Deducting Stock..." : "Confirm Allocation & Deduct Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

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
