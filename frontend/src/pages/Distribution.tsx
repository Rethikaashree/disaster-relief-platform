import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Filter,
  Layers,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Warehouse,
  XCircle,
  PlusCircle,
  Edit,
  Clock,
} from "lucide-react";
import { distributionApi, beneficiaryApi, supplyRequestApi } from "../api";
import type { DistributionCentre, SupplyInventory, Beneficiary, DistributionTrackingSummary, BeneficiarySupplyRequest } from "../types";

const DISTRICTS = [
  "All",
  "Chennai",
  "Cuddalore",
  "Villupuram",
  "Nagapattinam",
  "Thanjavur",
  "Tiruvallur",
  "Chengalpattu",
  "Tirunelveli",
  "Thoothukudi",
  "Mayiladuthurai",
];

const CATEGORIES = [
  "All",
  "Water",
  "Food",
  "Nutrition",
  "Medical",
  "Hygiene",
  "Baby Care",
  "Shelter & Bedding",
  "Clothing",
  "Emergency Equipment",
];

export function Distribution() {
  const [centres, setCentres] = useState<DistributionCentre[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<DistributionCentre | null>(null);
  const [district, setDistrict] = useState("All");
  const [category, setCategory] = useState("All");
  const [stockStatus, setStockStatus] = useState("All");
  const [viewTab, setViewTab] = useState<"centres" | "inventory" | "awaiting" | "tracking" | "requests">("centres");
  const [trackingSummary, setTrackingSummary] = useState<DistributionTrackingSummary | null>(null);
  const [allSupplyRequests, setAllSupplyRequests] = useState<BeneficiarySupplyRequest[]>([]);
  const [requestsFilter, setRequestsFilter] = useState("All");

  // Modals for inventory management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState<SupplyInventory | null>(null);
  const [modalMode, setModalMode] = useState<"restock" | "edit">("restock");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState("");
  const [modalError, setModalError] = useState("");

  // New inventory form
  const [newInvForm, setNewInvForm] = useState({
    item_name: "",
    category: "Food",
    unit: "packets",
    quantity_available: 50,
    low_stock_threshold: 10,
    storage_location: "Main Bay",
    description: "",
  });

  // Restock / Edit form
  const [restockQty, setRestockQty] = useState(25);
  const [restockNotes, setRestockNotes] = useState("");
  const [editInvForm, setEditInvForm] = useState({
    item_name: "",
    category: "",
    unit: "",
    low_stock_threshold: 10,
    storage_location: "",
    description: "",
  });
  const [trackingSearch, setTrackingSearch] = useState("");
  const [trackingStatusFilter, setTrackingStatusFilter] = useState("All");
  const [awaitingRequests, setAwaitingRequests] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [centresRes, benRes, trackRes, reqRes] = await Promise.all([
        distributionApi.centres(district !== "All" ? district : undefined),
        beneficiaryApi.list(),
        distributionApi.trackingSummary().catch(() => ({ data: null })),
        supplyRequestApi.all().catch(() => ({ data: { items: [], total: 0 } })),
      ]);
      setAllSupplyRequests(reqRes.data.items || []);
      if (trackRes.data) {
        setTrackingSummary(trackRes.data);
      }
      setCentres(centresRes.data.items);
      if (centresRes.data.items.length > 0) {
        if (!selectedCentre || !centresRes.data.items.some((c) => c.id === selectedCentre.id)) {
          setSelectedCentre(centresRes.data.items[0]);
        } else {
          const updated = centresRes.data.items.find((c) => c.id === selectedCentre.id);
          if (updated) setSelectedCentre(updated);
        }
      }
      const waiting = (benRes.data || []).filter(
        (b: Beneficiary) =>
          b.verification_status === "VERIFIED" &&
          (b.allocation_status === "AWAITING_SUPPLIES" || b.allocation_status === "UNALLOCATED")
      );
      setAwaitingRequests(waiting);
    } catch {
      setError("Unable to load distribution centres and inventory records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [district]);

  const totalStock = centres.reduce(
    (acc, c) => acc + (c.inventories || []).reduce((s, i) => s + i.quantity_available, 0),
    0
  );
  const totalAllocated = centres.reduce(
    (acc, c) => acc + (c.inventories || []).reduce((s, i) => s + i.quantity_allocated, 0),
    0
  );
  const totalLowStock = centres.reduce((acc, c) => acc + c.low_stock_count, 0);
  const totalOutOfStock = centres.reduce((acc, c) => acc + c.out_of_stock_count, 0);

  const currentInventories = (selectedCentre ? selectedCentre.inventories || [] : []).filter((inv) => {
    const matchCat = category === "All" || inv.category === category;
    const matchStatus = stockStatus === "All" || inv.stock_status === stockStatus;
    return matchCat && matchStatus;
  });

  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre) {
      setModalError("Please select a distribution centre first.");
      return;
    }
    if (!newInvForm.item_name.trim()) {
      setModalError("Item name is required.");
      return;
    }
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      await distributionApi.createInventory({
        centre_id: selectedCentre.id,
        item_name: newInvForm.item_name.trim(),
        category: newInvForm.category,
        unit: newInvForm.unit.trim() || "units",
        quantity_available: Number(newInvForm.quantity_available),
        low_stock_threshold: Number(newInvForm.low_stock_threshold),
        storage_location: newInvForm.storage_location.trim() || "Main Bay",
        description: newInvForm.description.trim() || undefined,
      });
      setModalSuccess("New supply item registered into centre inventory!");
      setNewInvForm({
        item_name: "",
        category: "Food",
        unit: "packets",
        quantity_available: 50,
        low_stock_threshold: 10,
        storage_location: "Main Bay",
        description: "",
      });
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess("");
      }, 1200);
      await loadData();
    } catch (err: any) {
      setModalError(
        typeof err === "object" && err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to add new inventory item."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRestockModal) return;
    if (restockQty <= 0) {
      setModalError("Please enter a quantity greater than zero.");
      return;
    }
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      await distributionApi.restockInventory(showRestockModal.id, {
        quantity_added: Number(restockQty),
        source_notes: restockNotes.trim() || undefined,
      });
      setModalSuccess(`Successfully added +${restockQty} ${showRestockModal.unit} to stock!`);
      setTimeout(() => {
        setShowRestockModal(null);
        setModalSuccess("");
      }, 1000);
      await loadData();
    } catch (err: any) {
      setModalError(
        typeof err === "object" && err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to restock item."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditInvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRestockModal) return;
    setModalLoading(true);
    setModalError("");
    setModalSuccess("");
    try {
      await distributionApi.updateInventory(showRestockModal.id, {
        item_name: editInvForm.item_name.trim() || undefined,
        category: editInvForm.category || undefined,
        unit: editInvForm.unit.trim() || undefined,
        low_stock_threshold: Number(editInvForm.low_stock_threshold),
        storage_location: editInvForm.storage_location.trim() || undefined,
        description: editInvForm.description.trim() || undefined,
      });
      setModalSuccess("Item details updated successfully!");
      setTimeout(() => {
        setShowRestockModal(null);
        setModalSuccess("");
      }, 1000);
      await loadData();
    } catch (err: any) {
      setModalError(
        typeof err === "object" && err?.response?.data?.detail
          ? err.response.data.detail
          : "Failed to update item."
      );
    } finally {
      setModalLoading(false);
    }
  };

  const openRestockModal = (inv: SupplyInventory, mode: "restock" | "edit" = "restock") => {
    setShowRestockModal(inv);
    setModalMode(mode);
    setRestockQty(25);
    setRestockNotes("");
    setEditInvForm({
      item_name: inv.item_name,
      category: inv.category,
      unit: inv.unit,
      low_stock_threshold: inv.low_stock_threshold,
      storage_location: inv.storage_location,
      description: inv.description || "",
    });
    setModalError("");
    setModalSuccess("");
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RELIEF LOGISTICS & HUBS</span>
          <h1>Relief supplies & distribution network</h1>
          <p>
            Monitor real-time inventory levels, distribution warehouses across Tamil Nadu, and pending beneficiary supply needs.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="demo-live-badge">DEMO LOGISTICS</span>
          <button className="secondary-button" onClick={loadData} disabled={loading}>
            <RefreshCw size={15} /> Refresh stock
          </button>
        </div>
      </div>

      <div className="demo-banner">
        <ShieldCheck size={16} />
        DEMO INVENTORY: Stock levels and relief distribution centres simulate verified supply management for Tamil Nadu disaster relief operations.
      </div>

      {/* METRIC CARDS */}
      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-icon teal"><Warehouse /></div>
          <div>
            <span>Active centres</span>
            <strong>{centres.length}</strong>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-icon blue"><Boxes /></div>
          <div>
            <span>Available supply units</span>
            <strong>{totalStock.toLocaleString()}</strong>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-icon green"><PackageCheck /></div>
          <div>
            <span>Allocated supply units</span>
            <strong>{totalAllocated.toLocaleString()}</strong>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-icon amber"><AlertTriangle /></div>
          <div>
            <span>Low stock alerts</span>
            <strong>{totalLowStock} items</strong>
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-icon red"><Truck /></div>
          <div>
            <span>Awaiting supplies</span>
            <strong>{awaitingRequests.length} verified cases</strong>
          </div>
        </article>
      </section>

      {/* LOW STOCK WARNING ALERT */}
      {(totalLowStock > 0 || totalOutOfStock > 0) && (
        <div className="alert" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderRadius: "8px" }}>
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <strong>Supply stock warning:</strong> There are <strong>{totalLowStock} low-stock</strong> and <strong>{totalOutOfStock} out-of-stock</strong> items across regional warehouses. Inspect inventory thresholds before committing bulk allocations.
          </div>
        </div>
      )}

      {error && <div className="alert danger">{error}</div>}

      {/* VIEW TABS */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginTop: "12px" }}>
        <button
          className={viewTab === "centres" ? "primary-button" : "secondary-button"}
          onClick={() => setViewTab("centres")}
        >
          <Warehouse size={16} /> Regional distribution map & centres ({centres.length})
        </button>
        <button
          className={viewTab === "inventory" ? "primary-button" : "secondary-button"}
          onClick={() => setViewTab("inventory")}
        >
          <Boxes size={16} /> Centre inventory detail ({selectedCentre ? selectedCentre.name : "All"})
        </button>
        <button
          className={viewTab === "awaiting" ? "primary-button" : "secondary-button"}
          onClick={() => setViewTab("awaiting")}
        >
          <Truck size={16} /> Awaiting supplies ({awaitingRequests.length})
        </button>
        <button
          className={viewTab === "tracking" ? "primary-button" : "secondary-button"}
          onClick={() => setViewTab("tracking")}
        >
          <PackageCheck size={16} /> Distribution & Receipt Tracking
        </button>
        <button
          className={viewTab === "requests" ? "primary-button" : "secondary-button"}
          onClick={() => setViewTab("requests")}
        >
          <Boxes size={16} /> Beneficiary Requests ({allSupplyRequests.length})
        </button>
      </div>

      {/* TAB 1: REGIONAL MAP & CENTRES */}
      {viewTab === "centres" && (
        <section className="dashboard-grid" style={{ gridTemplateColumns: "1.4fr 1fr", marginTop: "16px" }}>
          {/* Map Vector Panel */}
          <article className="panel">
            <div className="panel-header">
              <div>
                <h2>Distribution Centres map</h2>
                <p>Select a hub across affected Tamil Nadu zones</p>
              </div>
              <label className="select-box compact-select">
                <Filter size={14} />
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d === "All" ? "All Districts" : d}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ position: "relative", minHeight: "420px", background: "#0f172a", borderRadius: "8px", overflow: "hidden", margin: "16px" }}>
              <svg viewBox="0 0 1000 650" style={{ width: "100%", height: "100%", display: "block" }}>
                <defs>
                  <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
                <rect width="1000" height="650" fill="#090d16" />
                <path
                  d="M 140,50 Q 320,40 540,80 Q 660,110 720,140 Q 780,180 790,250 Q 800,330 750,400 Q 730,440 770,500 Q 760,560 680,600 Q 570,635 430,625 Q 320,615 250,555 Q 190,485 160,385 Q 130,265 140,50 Z"
                  fill="url(#mapGrad)"
                  stroke="#38bdf8"
                  strokeOpacity="0.35"
                  strokeWidth="2"
                />
                <text x="830" y="290" fill="#64748b" fontSize="13" letterSpacing="3" fontWeight="700">
                  BAY OF BENGAL
                </text>
                <text x="270" y="240" fill="#334155" fontSize="20" letterSpacing="5" fontWeight="900" opacity="0.35">
                  TAMIL NADU RELIEF NETWORK
                </text>
              </svg>

              {/* Pins on the SVG canvas */}
              {centres.map((c) => {
                const isSelected = selectedCentre?.id === c.id;
                const hasLow = c.low_stock_count > 0;
                const hasOut = c.out_of_stock_count > 0;
                const color = hasOut ? "#ef4444" : hasLow ? "#f59e0b" : "#0d9488";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCentre(c)}
                    title={`${c.name} (${c.district})`}
                    style={{
                      position: "absolute",
                      left: `${c.map_x}%`,
                      top: `${c.map_y}%`,
                      transform: "translate(-50%, -50%)",
                      width: isSelected ? "40px" : "32px",
                      height: isSelected ? "40px" : "32px",
                      borderRadius: "50%",
                      background: color,
                      border: isSelected ? "3px solid #ffffff" : "2px solid rgba(255,255,255,0.7)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isSelected ? "0 0 20px rgba(255,255,255,0.5)" : "0 4px 10px rgba(0,0,0,0.4)",
                      cursor: "pointer",
                      zIndex: isSelected ? 10 : 2,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Warehouse size={isSelected ? 18 : 14} />
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "20px", margin: "0 20px 16px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#0d9488" }} /> In Stock
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} /> Low Stock warning
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} /> Out of Stock item
              </span>
            </div>
          </article>

          {/* Centre Overview Card */}
          <article className="panel">
            {selectedCentre ? (
              <div>
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">{selectedCentre.code} · {selectedCentre.district}</span>
                    <h2>{selectedCentre.name}</h2>
                  </div>
                  <span className="status-badge verified">{selectedCentre.operating_status}</span>
                </div>
                <div style={{ padding: "20px" }}>
                  <div className="detail-grid" style={{ marginBottom: "20px" }}>
                    <div className="detail-item">
                      <span>District</span>
                      <strong>{selectedCentre.district}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Contact Officer</span>
                      <strong>{selectedCentre.contact_person}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Phone</span>
                      <strong>{selectedCentre.contact_phone}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Coordinates</span>
                      <strong>{selectedCentre.latitude.toFixed(4)}° N, {selectedCentre.longitude.toFixed(4)}° E</strong>
                    </div>
                    <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                      <span>Address</span>
                      <strong>{selectedCentre.address}</strong>
                    </div>
                  </div>

                  <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>Stock summary</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
                    <div style={{ background: "#f0fdf4", padding: "12px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: "11px", color: "#166534" }}>In Stock</span>
                      <strong style={{ display: "block", fontSize: "18px", color: "#15803d" }}>{selectedCentre.in_stock_count}</strong>
                    </div>
                    <div style={{ background: "#fefce8", padding: "12px", borderRadius: "6px", border: "1px solid #fef08a" }}>
                      <span style={{ fontSize: "11px", color: "#854d0e" }}>Low Stock</span>
                      <strong style={{ display: "block", fontSize: "18px", color: "#a16207" }}>{selectedCentre.low_stock_count}</strong>
                    </div>
                    <div style={{ background: "#fef2f2", padding: "12px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                      <span style={{ fontSize: "11px", color: "#991b1b" }}>Out of Stock</span>
                      <strong style={{ display: "block", fontSize: "18px", color: "#b91c1c" }}>{selectedCentre.out_of_stock_count}</strong>
                    </div>
                  </div>

                  <button
                    className="primary-button"
                    style={{ width: "100%" }}
                    onClick={() => setViewTab("inventory")}
                  >
                    <Boxes size={16} /> View all {selectedCentre.total_items_count} inventory supplies
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">Select a distribution centre from the map to view details.</div>
            )}
          </article>
        </section>
      )}

      {/* TAB 2: INVENTORY LIST TABLE */}
      {viewTab === "inventory" && (
        <section className="panel table-panel" style={{ marginTop: "16px" }}>
          <div className="toolbar" style={{ padding: "16px", borderBottom: "1px solid var(--line)" }}>
            <label className="select-box">
              <Warehouse size={16} />
              <select
                value={selectedCentre ? selectedCentre.id : ""}
                onChange={(e) => {
                  const c = centres.find((item) => item.id === Number(e.target.value));
                  if (c) setSelectedCentre(c);
                }}
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.district})</option>
                ))}
              </select>
            </label>
            <label className="select-box">
              <Layers size={16} />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                ))}
              </select>
            </label>
            <label className="select-box">
              <Filter size={16} />
              <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
                <option value="All">All stock statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </label>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setShowAddModal(true);
                setModalError("");
                setModalSuccess("");
              }}
              style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", padding: "0.4rem 0.85rem" }}
            >
              <PlusCircle size={15} /> Add New Relief Supply
            </button>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Relief supply name</th>
                  <th>Category</th>
                  <th>Storage location</th>
                  <th>Available</th>
                  <th>Allocated</th>
                  <th>Delivered</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInventories.length ? (
                  currentInventories.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.item_name}</strong>
                      </td>
                      <td>{inv.category}</td>
                      <td><code>{inv.storage_location}</code></td>
                      <td>
                        <strong style={{ color: inv.quantity_available <= 0 ? "#dc2626" : inv.quantity_available <= inv.low_stock_threshold ? "#d97706" : "#0f766e" }}>
                          {inv.quantity_available} {inv.unit}
                        </strong>
                      </td>
                      <td>{inv.quantity_allocated} {inv.unit}</td>
                      <td>{inv.quantity_delivered} {inv.unit}</td>
                      <td>{inv.low_stock_threshold} {inv.unit}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            inv.stock_status === "In Stock"
                              ? "verified"
                              : inv.stock_status === "Low Stock"
                              ? "pending"
                              : "rejected"
                          }`}
                        >
                          {inv.stock_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            className="secondary-button btn-sm"
                            onClick={() => openRestockModal(inv, "restock")}
                            title="Restock inventory"
                          >
                            <PlusCircle size={14} /> Restock
                          </button>
                          <button
                            type="button"
                            className="secondary-button btn-sm"
                            onClick={() => openRestockModal(inv, "edit")}
                            title="Edit details"
                          >
                            <Edit size={14} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "24px" }}>
                      No supplies match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: AWAITING SUPPLIES REQUESTS */}
      {viewTab === "awaiting" && (
        <section className="panel table-panel" style={{ marginTop: "16px" }}>
          <div className="panel-header">
            <div>
              <h2>Verified requests waiting for supplies</h2>
              <p>Disaster victims verified by officers pending warehouse allocation</p>
            </div>
            <span className="demo-live-badge">{awaitingRequests.length} pending cases</span>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Beneficiary</th>
                  <th>Application ID</th>
                  <th>District / Locality</th>
                  <th>Disaster</th>
                  <th>Priority</th>
                  <th>Allocation status</th>
                  <th>Supplies needed</th>
                </tr>
              </thead>
              <tbody>
                {awaitingRequests.length ? (
                  awaitingRequests.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.name}</strong>
                      </td>
                      <td><code>{b.application_id}</code></td>
                      <td>{b.district}</td>
                      <td>{b.disaster_type}</td>
                      <td>
                        <span className={`status-badge ${b.priority_level === "URGENT" ? "rejected" : "pending"}`}>
                          {b.priority_level || "NORMAL"}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge pending">
                          {b.allocation_status?.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {(b.request_items || []).map((it) => (
                            <span
                              key={it.id}
                              style={{
                                fontSize: "11px",
                                padding: "2px 6px",
                                background: "#f1f5f9",
                                borderRadius: "4px",
                                border: "1px solid #cbd5e1",
                              }}
                            >
                              {it.item_name} ({it.quantity_requested} {it.unit})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "24px" }}>
                      All verified requests currently have allocated supplies.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {/* TAB 4: DISTRIBUTION & BENEFICIARY RECEIPT TRACKING */}
      {viewTab === "tracking" && (
        <section style={{ marginTop: "16px" }}>
          {/* TRACKING METRIC CARDS */}
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "16px" }}>
            <article className="metric-card">
              <div className="metric-icon blue"><Boxes /></div>
              <div>
                <span>Beneficiaries with allocations</span>
                <strong>{trackingSummary?.total_beneficiaries_with_allocations ?? 0}</strong>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon green"><CheckCircle2 color="#059669" /></div>
              <div>
                <span>Distributions completed</span>
                <strong>{trackingSummary?.total_distributions_completed ?? 0}</strong>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon teal"><ShieldCheck color="#0d9488" /></div>
              <div>
                <span>Receipts confirmed</span>
                <strong>{trackingSummary?.beneficiaries_confirmed_receipt ?? 0} citizens</strong>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon amber"><Truck color="#d97706" /></div>
              <div>
                <span>Pending confirmations</span>
                <strong>{trackingSummary?.pending_confirmations ?? 0}</strong>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon amber"><AlertTriangle color="#ea580c" /></div>
              <div>
                <span>Partial / unsuccessful</span>
                <strong>{trackingSummary?.partial_or_unsuccessful ?? 0}</strong>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-icon red"><ShieldAlert color="#dc2626" /></div>
              <div>
                <span>Reported discrepancies</span>
                <strong>{trackingSummary?.reported_discrepancies ?? 0} cases</strong>
              </div>
            </article>
          </div>

          {/* DISTRIBUTION REGISTRY TABLE */}
          <section className="panel table-panel">
            <div className="panel-header" style={{ flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2>Relief distribution & receipt confirmation registry</h2>
                <p>Auditable log of supplies handed over, unique reference IDs, and beneficiary confirmation statuses</p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label className="search-box compact-search">
                  <Search size={14} />
                  <input
                    placeholder="Search ref ID, beneficiary, or item..."
                    value={trackingSearch}
                    onChange={(e) => setTrackingSearch(e.target.value)}
                  />
                </label>

                <label className="select-box compact-select">
                  <Filter size={14} />
                  <select value={trackingStatusFilter} onChange={(e) => setTrackingStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Distributed – Awaiting Beneficiary Confirmation">Awaiting Confirmation</option>
                    <option value="Fully Received – Confirmed">Fully Received</option>
                    <option value="Partially Received">Partially Received</option>
                    <option value="Not Received">Not Received</option>
                    <option value="Issue Reported">Issue Reported</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Distribution Ref</th>
                    <th>Beneficiary</th>
                    <th>Handover Details</th>
                    <th>Supplies Distributed</th>
                    <th>Confirmation Status</th>
                    <th>Beneficiary Feedback / Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = (trackingSummary?.distributions || []).filter((d) => {
                      const matchSearch =
                        trackingSearch === "" ||
                        d.distribution_ref.toLowerCase().includes(trackingSearch.toLowerCase()) ||
                        (d.beneficiary_name || "").toLowerCase().includes(trackingSearch.toLowerCase()) ||
                        (d.application_id || "").toLowerCase().includes(trackingSearch.toLowerCase()) ||
                        d.items.some((it) => it.item_name.toLowerCase().includes(trackingSearch.toLowerCase()));
                      const matchStatus =
                        trackingStatusFilter === "All" || d.status === trackingStatusFilter;
                      return matchSearch && matchStatus;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                            {trackingSummary?.distributions?.length === 0
                              ? "No supply distributions have been recorded yet. Mark allocations as distributed from the Beneficiary Review portal."
                              : "No distribution records match the selected filters."}
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <code style={{ fontWeight: 700, color: "#0f766e" }}>{d.distribution_ref}</code>
                          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                            {d.centre_name || "Regional Hub"}
                          </span>
                        </td>
                        <td>
                          <strong>{d.beneficiary_name || "Citizen"}</strong>
                          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                            <code>{d.application_id}</code>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", display: "block" }}>
                            {new Date(d.distributed_at).toLocaleDateString()} {new Date(d.distributed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            By {d.officer_name || "Officer"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {d.items.map((it) => (
                              <span key={it.id} style={{ fontSize: "12px" }}>
                                • <strong>{it.item_name}</strong>: {it.quantity_distributed} {it.unit}
                                {it.quantity_received !== null && (
                                  <span style={{ color: it.quantity_missing ? "#dc2626" : "#059669", marginLeft: "4px" }}>
                                    (rec: {it.quantity_received}{it.quantity_missing ? `, miss: ${it.quantity_missing}` : ""})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              d.status === "Fully Received – Confirmed"
                                ? "verified"
                                : d.status === "Distributed – Awaiting Beneficiary Confirmation"
                                ? "pending"
                                : d.status === "Partially Received"
                                ? "under_review"
                                : "rejected"
                            }`}
                            style={{ fontSize: "11px" }}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td>
                          {d.discrepancy_details ? (
                            <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 500 }}>
                              ⚠ {d.discrepancy_details}
                            </span>
                          ) : d.beneficiary_feedback ? (
                            <span style={{ fontSize: "12px", color: "#334155" }}>
                              "{d.beneficiary_feedback}"
                            </span>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {d.status === "Distributed – Awaiting Beneficiary Confirmation" ? "Awaiting feedback" : "No remarks"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      )}

      {/* TAB 5: BENEFICIARY SUPPLY REQUESTS QUEUE */}
      {viewTab === "requests" && (
        <section className="panel table-panel" style={{ marginTop: "16px" }}>
          <div className="panel-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Beneficiary Relief Supply Requests Queue</h2>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                Monitor and review emergency supply requests submitted by verified beneficiaries across all disaster relief camps.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label className="select-box" style={{ margin: 0 }}>
                <Filter size={15} />
                <select value={requestsFilter} onChange={(e) => setRequestsFilter(e.target.value)}>
                  <option value="All">All Statuses ({allSupplyRequests.length})</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Fully Approved</option>
                  <option value="PARTIALLY_APPROVED">Partially Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Request Ref</th>
                  <th>Beneficiary Name</th>
                  <th>Location & Priority</th>
                  <th>Requested Supplies</th>
                  <th>Submission Date</th>
                  <th>Review Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allSupplyRequests.filter((r) => requestsFilter === "All" || r.status === requestsFilter).length ? (
                  allSupplyRequests
                    .filter((r) => requestsFilter === "All" || r.status === requestsFilter)
                    .map((req) => (
                      <tr key={req.id}>
                        <td>
                          <code style={{ fontWeight: 700, color: "#0f766e" }}>{req.request_ref}</code>
                        </td>
                        <td>
                          <strong>{req.beneficiary_name || `Beneficiary #${req.beneficiary_id}`}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>Family size: {req.family_size ?? "N/A"}</div>
                        </td>
                        <td>
                          <span>{req.district || "Relief Zone"}</span>
                          <div>
                            <span className={`status-badge ${req.priority_level === "HIGH" ? "rejected" : "verified"}`} style={{ fontSize: "10px", padding: "1px 4px" }}>
                              {req.priority_level || "NORMAL"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            {req.items.map((it) => (
                              <div key={it.id} style={{ fontSize: "12px" }}>
                                <strong>{it.item_name}</strong>: {it.quantity_requested} {it.unit}
                                {it.status !== "PENDING" && (
                                  <span style={{ color: it.status === "APPROVED" || it.status === "PARTIALLY_APPROVED" ? "#0f766e" : "#dc2626", marginLeft: "4px" }}>
                                    (Appr: {it.quantity_approved})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              req.status === "APPROVED"
                                ? "verified"
                                : req.status === "PARTIALLY_APPROVED"
                                ? "under_review"
                                : req.status === "REJECTED"
                                ? "rejected"
                                : "pending"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/review/${req.beneficiary_id}`}
                            className="primary-button"
                            style={{ fontSize: "11px", padding: "4px 8px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {req.status === "PENDING" ? "Review Request" : "View Record"}
                          </Link>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "24px" }}>
                      No beneficiary supply requests match the selected status filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MODAL: ADD NEW RELIEF SUPPLY */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card md">
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>Add New Relief Supply Item</h2>
                <p>Register a new aid inventory item and assign initial quantities to a regional hub.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
                title="Close modal"
                aria-label="Close dialog"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body">
              {modalSuccess && <div className="alert success" style={{ marginBottom: "14px" }}>{modalSuccess}</div>}
              {modalError && <div className="alert danger" style={{ marginBottom: "14px" }}>{modalError}</div>}

              <form id="addSupplyForm" onSubmit={handleCreateInventory} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                    Distribution Centre:
                  </label>
                  <select
                    value={selectedCentre ? selectedCentre.id : ""}
                    onChange={(e) => {
                      const c = centres.find((item) => item.id === Number(e.target.value));
                      if (c) setSelectedCentre(c);
                    }}
                    style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                  >
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.district})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                    Supply Item Name *:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baby Formula Milk (400g), ORS Sachets..."
                    value={newInvForm.item_name}
                    onChange={(e) => setNewInvForm({ ...newInvForm, item_name: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Category:
                    </label>
                    <select
                      value={newInvForm.category}
                      onChange={(e) => setNewInvForm({ ...newInvForm, category: e.target.value })}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Unit of Measure:
                    </label>
                    <input
                      type="text"
                      placeholder="packets, bottles, litres, pieces, kits..."
                      value={newInvForm.unit}
                      onChange={(e) => setNewInvForm({ ...newInvForm, unit: e.target.value })}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Initial Stock Quantity:
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newInvForm.quantity_available}
                      onChange={(e) => setNewInvForm({ ...newInvForm, quantity_available: Number(e.target.value) })}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Low Stock Threshold:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newInvForm.low_stock_threshold}
                      onChange={(e) => setNewInvForm({ ...newInvForm, low_stock_threshold: Number(e.target.value) })}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                    Storage Bay / Location:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bay 2, Shelf B, Cold Room..."
                    value={newInvForm.storage_location}
                    onChange={(e) => setNewInvForm({ ...newInvForm, storage_location: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                    Description / Specification (optional):
                  </label>
                  <textarea
                    placeholder="Detailed specifications for beneficiaries and warehouse staff..."
                    value={newInvForm.description}
                    onChange={(e) => setNewInvForm({ ...newInvForm, description: e.target.value })}
                    rows={2}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px", resize: "vertical" }}
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button btn-md"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="addSupplyForm"
                className="primary-button btn-md"
                disabled={modalLoading}
              >
                {modalLoading ? "Saving..." : "Add to Inventory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESTOCK / EDIT SUPPLY */}
      {showRestockModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card sm">
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>
                  {modalMode === "restock" ? `Restock: ${showRestockModal.item_name}` : `Edit: ${showRestockModal.item_name}`}
                </h2>
                <p>
                  Current Stock: <strong>{showRestockModal.quantity_available} {showRestockModal.unit}</strong> ({showRestockModal.stock_status})
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowRestockModal(null)}
                title="Close modal"
                aria-label="Close dialog"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* MODE SWITCHER */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <button
                  type="button"
                  className={modalMode === "restock" ? "primary-button btn-sm" : "secondary-button btn-sm"}
                  onClick={() => setModalMode("restock")}
                  style={{ flex: 1 }}
                >
                  <PlusCircle size={14} /> Add Stock (Restock)
                </button>
                <button
                  type="button"
                  className={modalMode === "edit" ? "primary-button btn-sm" : "secondary-button btn-sm"}
                  onClick={() => setModalMode("edit")}
                  style={{ flex: 1 }}
                >
                  <Edit size={14} /> Edit Item Details
                </button>
              </div>

              {modalSuccess && <div className="alert success" style={{ marginBottom: "14px" }}>{modalSuccess}</div>}
              {modalError && <div className="alert danger" style={{ marginBottom: "14px" }}>{modalError}</div>}

              {modalMode === "restock" ? (
                <form id="restockForm" onSubmit={handleRestockSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Quantity Arrived (+{showRestockModal.unit}):
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={restockQty}
                      onChange={(e) => setRestockQty(Number(e.target.value))}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Source / Donation Notes (optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NGO shipment from Red Cross, corporate donation..."
                      value={restockNotes}
                      onChange={(e) => setRestockNotes(e.target.value)}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                    />
                  </div>
                </form>
              ) : (
                <form id="editForm" onSubmit={handleEditInvSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Item Name:
                    </label>
                    <input
                      type="text"
                      value={editInvForm.item_name}
                      onChange={(e) => setEditInvForm({ ...editInvForm, item_name: e.target.value })}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                        Category:
                      </label>
                      <select
                        value={editInvForm.category}
                        onChange={(e) => setEditInvForm({ ...editInvForm, category: e.target.value })}
                        style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                      >
                        {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                        Unit:
                      </label>
                      <input
                        type="text"
                        value={editInvForm.unit}
                        onChange={(e) => setEditInvForm({ ...editInvForm, unit: e.target.value })}
                        style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Low Stock Threshold:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editInvForm.low_stock_threshold}
                      onChange={(e) => setEditInvForm({ ...editInvForm, low_stock_threshold: Number(e.target.value) })}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Storage Location:
                    </label>
                    <input
                      type="text"
                      value={editInvForm.storage_location}
                      onChange={(e) => setEditInvForm({ ...editInvForm, storage_location: e.target.value })}
                      style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                      Description:
                    </label>
                    <textarea
                      value={editInvForm.description}
                      onChange={(e) => setEditInvForm({ ...editInvForm, description: e.target.value })}
                      rows={2}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px", resize: "vertical" }}
                    />
                  </div>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button btn-md"
                onClick={() => setShowRestockModal(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form={modalMode === "restock" ? "restockForm" : "editForm"}
                className="primary-button btn-md"
                disabled={modalLoading}
              >
                {modalLoading ? "Saving..." : modalMode === "restock" ? `Confirm Restock (+${restockQty})` : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
