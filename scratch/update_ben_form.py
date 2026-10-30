path = r'FloodReliefPortal/frontend/src/pages/BeneficiaryDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add applicationSupplies state
app_supplies_state = '''  // Supplies attached to application form
  const [applicationSupplies, setApplicationSupplies] = useState<
    Array<{ name: string; category: string; unit: string; qty: number; selected: boolean }>
  >([
    { name: "Drinking Water Cans (20L)", category: "Water", unit: "cans", qty: 4, selected: true },
    { name: "Ready-to-Eat Meal Packets", category: "Food", unit: "packets", qty: 12, selected: true },
    { name: "Blankets & Bedsheets", category: "Shelter & Bedding", unit: "pieces", qty: 4, selected: true },
    { name: "First-Aid Emergency Kits", category: "Medical", unit: "kits", qty: 1, selected: false },
    { name: "Family Hygiene Kits", category: "Hygiene", unit: "kits", qty: 1, selected: true },
    { name: "Rice, Wheat & Staple Grains (10kg)", category: "Food", unit: "bags", qty: 1, selected: false },
    { name: "Baby-Care & Infant Supplies", category: "Baby Care", unit: "kits", qty: 1, selected: false },
    { name: "Mosquito Nets", category: "Shelter & Bedding", unit: "pieces", qty: 2, selected: false },
  ]);
'''

if 'const [applicationSupplies, setApplicationSupplies]' not in text:
    target_state = '  const [showForm, setShowForm] = useState(false);'
    assert target_state in text, "showForm target not found"
    text = text.replace(target_state, target_state + '\n' + app_supplies_state, 1)

# 2. Update createApplication to include requested_supplies
old_create_payload = '''      const payload = {
        ...form,
        aadhaar_identifier: (form.aadhaar_identifier || "").trim() || null,
        date_of_birth: form.date_of_birth || null,
        date_affected: form.date_affected || null,
        family_size: Number(form.family_size),
        number_of_dependents: Number(form.number_of_dependents),
      };'''

new_create_payload = '''      const selectedSupplies = applicationSupplies
        .filter((it) => it.selected && it.qty > 0)
        .map((it) => ({
          item_name: it.name,
          category: it.category,
          quantity_requested: it.qty,
          unit: it.unit,
        }));

      const payload = {
        ...form,
        aadhaar_identifier: (form.aadhaar_identifier || "").trim() || null,
        date_of_birth: form.date_of_birth || null,
        date_affected: form.date_affected || null,
        family_size: Number(form.family_size),
        number_of_dependents: Number(form.number_of_dependents),
        requested_supplies: selectedSupplies.length > 0 ? selectedSupplies : undefined,
      };'''

assert old_create_payload in text, "old_create_payload not found"
text = text.replace(old_create_payload, new_create_payload, 1)

# 3. Insert Section 04 Needed Relief Supplies before Aadhaar section / form actions
section_04 = '''          <section className="form-section">
            <div className="section-title">
              <span>04</span>
              <div>
                <h2>Needed Relief Supplies</h2>
                <p>
                  Choose the emergency supplies and quantities needed for your household.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
              {applicationSupplies.map((item, idx) => (
                <div
                  key={item.name}
                  style={{
                    border: item.selected ? "1.5px solid #0d9488" : "1px solid var(--border, #e2e8f0)",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    background: item.selected ? "#f0fdfa" : "var(--bg-subtle, #f8fafc)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => {
                          const updated = [...applicationSupplies];
                          updated[idx].selected = e.target.checked;
                          setApplicationSupplies(updated);
                        }}
                      />
                      {item.name}
                    </label>
                    <span className="status-badge" style={{ fontSize: "0.68rem", padding: "0.15rem 0.4rem" }}>
                      {item.category}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", paddingTop: "0.5rem", borderTop: "1px dashed #e2e8f0" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Quantity Needed:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={item.qty}
                        disabled={!item.selected}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          const updated = [...applicationSupplies];
                          updated[idx].qty = val;
                          setApplicationSupplies(updated);
                        }}
                        style={{
                          width: "70px",
                          padding: "0.25rem 0.4rem",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                          fontSize: "0.85rem",
                          textAlign: "center",
                          opacity: item.selected ? 1 : 0.5,
                        }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
'''

target_form_end = '          {error && (\n            <div role="alert" className="alert danger role-form-alert">'
if 'Needed Relief Supplies</h2>' not in text:
    assert target_form_end in text, "target_form_end not found"
    text = text.replace(target_form_end, section_04 + target_form_end, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("BeneficiaryDashboard.tsx updated with supplies in application form!")
