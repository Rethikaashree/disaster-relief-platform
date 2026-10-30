path = r'FloodReliefPortal/frontend/src/pages/Review.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update imports
if 'DistributionCentre' not in text:
    text = text.replace(
        'import type { Beneficiary, ReliefDistribution, SupplyAllocation, BeneficiarySupplyRequest } from "../types";',
        'import type { Beneficiary, ReliefDistribution, SupplyAllocation, BeneficiarySupplyRequest, DistributionCentre, SupplyInventory } from "../types";'
    )

# 2. Add state for Manage Distribution modal
dist_modal_state = '''  // Manage Distribution Modal State
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
'''

if 'const [showManageDistModal, setShowManageDistModal]' not in text:
    anchor = '  const [handoverLoading, setHandoverLoading] = useState(false);'
    assert anchor in text, "handoverLoading anchor not found"
    text = text.replace(anchor, anchor + '\n' + dist_modal_state, 1)

# 3. Add openManageDistribution and handleConfirmAllocation handlers
handlers = '''  const openManageDistribution = async () => {
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
          (c) => c.district.toLowerCase() === item.district.toLowerCase()
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
'''

if 'const openManageDistribution' not in text:
    anchor2 = '  const handleMarkDistributed = async (e: React.FormEvent) => {'
    assert anchor2 in text, "handleMarkDistributed anchor not found"
    text = text.replace(anchor2, handlers + '\n' + anchor2, 1)

# 4. Replace Link to="/distribution" with button onClick={openManageDistribution}
link_pattern = '''                  <Link
                    to="/distribution"
                    className="secondary-button"
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.35rem 0.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      textDecoration: "none",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                    }}
                  >
                    <Boxes size={15} color="#0d9488" /> Manage Distribution
                  </Link>'''

button_replacement = '''                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openManageDistribution}
                    style={{
                      fontSize: "0.8rem",
                      padding: "0.35rem 0.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      textDecoration: "none",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: "1.5px solid #0d9488",
                      background: "#f0fdfa",
                      color: "#0f766e",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(13, 148, 136, 0.1)",
                    }}
                    title="Allocate supplies from available warehouse stock directly to this beneficiary"
                  >
                    <Boxes size={15} color="#0d9488" /> Manage Distribution
                  </button>'''

if link_pattern in text:
    text = text.replace(link_pattern, button_replacement, 1)

# 5. Add Manage Distribution Modal at bottom of Review component
modal_ui = '''
      {/* MANAGE DISTRIBUTION & RESOURCE ALLOCATION MODAL */}
      {showManageDistModal && (
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
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "10px",
              padding: "1.5rem",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div>
                <h2 style={{ margin: "0 0 0.25rem 0", fontSize: "1.2rem", color: "#0f172a" }}>
                  Manage Relief Distribution & Resource Allocation
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Allocate emergency supplies to <strong>{item?.name}</strong>. Stock is automatically deducted from inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManageDistModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {allocModalSuccess && (
              <div className="alert success" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} /> {allocModalSuccess}
              </div>
            )}

            {allocModalError && (
              <div className="alert danger" style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={16} /> {allocModalError}
              </div>
            )}

            <form onSubmit={handleConfirmAllocation}>
              {/* CENTRE SELECTOR */}
              <div style={{ marginBottom: "1.25rem", background: "var(--bg-subtle, #f8fafc)", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                  Source Distribution Centre / Warehouse:
                </label>
                <select
                  value={selectedCentreId || ""}
                  onChange={(e) => handleCentreChange(Number(e.target.value))}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 500 }}
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district}) · {c.operating_status}
                    </option>
                  ))}
                </select>
              </div>

              {/* BENEFICIARY REQUESTED SUPPLIES ALLOCATION LIST */}
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>
                Requested Supplies & Stock Availability
              </h3>
              <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", color: "#64748b" }}>
                Choose the quantities to allocate. If an item has no stock available, it is marked as Out of Supply.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
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
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          padding: "0.85rem",
                          background: isOutOfStock ? "#fff5f5" : "#ffffff",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div>
                            <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{req.item_name}</strong>
                            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.15rem" }}>
                              Beneficiary Needed: <strong>{req.quantity_requested} {req.unit}</strong> · Already Allocated: <strong>{req.quantity_allocated}</strong> · Remaining: <strong>{remainingNeeded} {req.unit}</strong>
                            </div>
                          </div>

                          {isOutOfStock ? (
                            <span className="status-badge rejected" style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}>
                              Out of Supply
                            </span>
                          ) : (
                            <span className="status-badge verified" style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}>
                              {availableStock} {req.unit} Available in Stock
                            </span>
                          )}
                        </div>

                        {/* ALLOCATION INPUT */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", paddingTop: "0.5rem", borderTop: "1px dashed #e2e8f0" }}>
                          <span style={{ fontSize: "0.8rem", color: "#334155" }}>
                            Amount to Allocate:
                          </span>

                          {isOutOfStock ? (
                            <span style={{ fontSize: "0.8rem", color: "#dc2626", fontStyle: "italic" }}>
                              Cannot allocate (0 stock remaining)
                            </span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <input
                                type="number"
                                min={0}
                                max={availableStock}
                                value={allocatedVal}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(Number(e.target.value), availableStock));
                                  setAllocInputs((prev) => ({ ...prev, [req.id]: val }));
                                }}
                                style={{
                                  width: "90px",
                                  padding: "0.35rem 0.5rem",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "0.9rem",
                                  textAlign: "center",
                                  fontWeight: 600,
                                }}
                              />
                              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{req.unit}</span>
                              <span style={{ fontSize: "0.75rem", color: "#0f766e", marginLeft: "0.5rem" }}>
                                (Remaining stock: {availableStock - allocatedVal})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No specific supplies requested in application.</p>
                )}
              </div>

              {/* EXTRA SUPPLIES FROM CENTRE */}
              <div style={{ marginBottom: "1.5rem", padding: "0.85rem", background: "var(--bg-subtle, #f8fafc)", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <strong style={{ display: "block", fontSize: "0.85rem", color: "#334155", marginBottom: "0.5rem" }}>
                  + Allocate Additional Supplies from Warehouse (Optional)
                </strong>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <select
                    value={extraAllocInvId}
                    onChange={(e) => setExtraAllocInvId(e.target.value ? Number(e.target.value) : "")}
                    style={{ flex: 1, minWidth: "200px", padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.825rem" }}
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
                    style={{ width: "70px", padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.825rem", textAlign: "center" }}
                  />

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleAddExtraItem}
                    style={{ padding: "0.4rem 0.75rem", fontSize: "0.825rem" }}
                  >
                    + Add Item
                  </button>
                </div>

                {extraAllocs.length > 0 && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {extraAllocs.map((ex) => {
                      const curCentre = centres.find((c) => c.id === selectedCentreId);
                      const inv = curCentre?.inventories?.find((i) => i.id === ex.inventory_id);
                      if (!inv) return null;
                      return (
                        <span
                          key={ex.inventory_id}
                          style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "15px",
                            fontSize: "0.78rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          {inv.item_name}: {ex.quantity} {inv.unit}
                          <button
                            type="button"
                            onClick={() => setExtraAllocs((prev) => prev.filter((x) => x.inventory_id !== ex.inventory_id))}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#0369a1", fontWeight: "bold" }}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MODAL ACTIONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowManageDistModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={allocLoading}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  {allocLoading ? "Allocating & Deducting Stock..." : "Confirm Allocation & Deduct Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
'''

if 'MANAGE DISTRIBUTION & RESOURCE ALLOCATION MODAL' not in text:
    last_div = '    </div>\n  );\n}'
    assert last_div in text, "last_div not found"
    text = text.replace(last_div, modal_ui + '\n' + last_div, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Review.tsx updated with Manage Distribution modal!")
