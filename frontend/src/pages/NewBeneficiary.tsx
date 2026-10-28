import { useState, type FormEvent } from "react";
import { CheckCircle2, Plus, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { beneficiaryApi } from "../api";

const initial = {
  name: "",
  date_of_birth: "",
  gender: "Male",
  phone: "",
  address: "",
  district: "",
  state: "",
  pincode: "",
  disaster_type: "Flood",
  affected_location: "",
  date_affected: "",
  family_size: "1",
  number_of_dependents: "0",
  aadhaar_identifier: "",
};
export function NewBeneficiary() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const update = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        date_of_birth: form.date_of_birth || null,
        date_affected: form.date_affected || null,
        family_size: Number(form.family_size),
        number_of_dependents: Number(form.number_of_dependents),
      };
      const { data } = await beneficiaryApi.create(payload);
      setMessage(`Application ${data.beneficiary.application_id} created.`);
      setTimeout(() => navigate(`/review/${data.beneficiary.id}`), 500);
    } catch (err) {
      setError(
        typeof err === "object" && err && "response" in err
          ? (err as any).response?.data?.detail ||
              "Unable to create beneficiary."
          : "Unable to create beneficiary.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">NEW APPLICATION</span>
          <h1>Create beneficiary record</h1>
          <p>
            Collect identity, disaster impact, and Aadhaar details for review.
          </p>
        </div>
        <div className="secure-chip">
          <ShieldAlert size={16} />
          Sensitive data protected
        </div>
      </div>
      {message && (
        <div className="alert success">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}
      {error && <div className="alert danger">{error}</div>}
      <form className="form-card" onSubmit={submit}>
        <section className="form-section">
          <div className="section-title">
            <span>01</span>
            <div>
              <h2>Personal details</h2>
              <p>Identity information used for verification.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                const districts = ["Cuddalore", "Nagapattinam", "Thanjavur", "Chennai", "Tiruvallur", "Madurai"];
                const names = ["Asha Raman", "Kavin Prakash", "Nila Subramani", "Rohan Vel", "Meera Anand", "Dinesh Pillai"];
                const disasterTypes = ["Flood", "Cyclone", "Water shortage", "Shelter damage", "Medical need"];
                const locs = [
                  "Low-lying coastal settlement near Marina beach, Chennai",
                  "Flooded roadside settlement near railway bridge, Cuddalore",
                  "Cyclone shelter camp block B, Nagapattinam",
                  "Temporary shelter near Kaveri flood bund, Thanjavur",
                ];
                const pickedDistrict = districts[Math.floor(Math.random() * districts.length)];
                setForm({
                  name: names[Math.floor(Math.random() * names.length)],
                  date_of_birth: "1990-08-12",
                  gender: "Male",
                  phone: `90000${Math.floor(10000 + Math.random() * 89999)}`,
                  address: `${Math.floor(10 + Math.random() * 80)}, Relief Colony, ${pickedDistrict} (DEMO DATA)`,
                  district: pickedDistrict,
                  state: "Tamil Nadu",
                  pincode: String(600000 + Math.floor(Math.random() * 29999)).padStart(6, "0"),
                  disaster_type: disasterTypes[Math.floor(Math.random() * disasterTypes.length)],
                  affected_location: locs[Math.floor(Math.random() * locs.length)],
                  date_affected: "2024-11-20",
                  family_size: String(Math.floor(2 + Math.random() * 5)),
                  number_of_dependents: String(Math.floor(1 + Math.random() * 3)),
                  aadhaar_identifier: `9999 ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)}`,
                });
                setMessage("Generated safe fictional demonstration inputs. (DEMO DATA)");
              }}
            >
              GENERATE RANDOM INPUTS
            </button>
          </div>
          <div className="form-grid">
            <label>
              Full name
              <input
                required
                minLength={2}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            <label>
              Date of birth
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
              />
            </label>
            <label>
              Gender
              <select
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
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
                onChange={(e) => update("phone", e.target.value)}
                placeholder="10-digit mobile number"
              />
            </label>
            <label>
              Address
              <textarea
                required
                minLength={5}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </label>
            <label>
              District
              <input
                required
                value={form.district}
                onChange={(e) => update("district", e.target.value)}
              />
            </label>
            <label>
              State
              <input
                required
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
              />
            </label>
            <label>
              PIN code
              <input
                required
                pattern="[0-9]{6}"
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value)}
              />
            </label>
          </div>
        </section>
        <section className="form-section">
          <div className="section-title">
            <span>02</span>
            <div>
              <h2>Disaster impact</h2>
              <p>Details required for relief eligibility review.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Disaster type
              <select
                value={form.disaster_type}
                onChange={(e) => update("disaster_type", e.target.value)}
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
              <textarea
                required
                value={form.affected_location}
                onChange={(e) => update("affected_location", e.target.value)}
              />
            </label>
            <label>
              Date affected
              <input
                type="date"
                value={form.date_affected}
                onChange={(e) => update("date_affected", e.target.value)}
              />
            </label>
            <label>
              Family size
              <input
                type="number"
                min="1"
                max="1000"
                value={form.family_size}
                onChange={(e) => update("family_size", e.target.value)}
              />
            </label>
            <label>
              Number of dependents
              <input
                type="number"
                min="0"
                max="1000"
                value={form.number_of_dependents}
                onChange={(e) => update("number_of_dependents", e.target.value)}
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
                Provide the identifier for secure hashing and OCR processing.
              </p>
            </div>
          </div>
          <label className="identify-field">
            Aadhaar identifier
            <input
              required
              minLength={8}
              maxLength={64}
              value={form.aadhaar_identifier}
              onChange={(e) => update("aadhaar_identifier", e.target.value)}
              placeholder="Use the 12-digit UID or an approved document identifier"
            />
          </label>
        </section>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/beneficiaries")}
          >
            Cancel
          </button>
          <button className="primary-button" disabled={loading}>
            <Plus size={18} />
            {loading ? "Creating..." : "Create application"}
          </button>
        </div>
      </form>
    </div>
  );
}
