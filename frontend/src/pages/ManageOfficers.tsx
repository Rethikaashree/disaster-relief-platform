import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, UserPlus, UserRoundCheck, UserRoundX, XCircle } from "lucide-react";
import { officerApi } from "../api";

type Officer = {
  id: number;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  last_login_at: string | null;
};

const emptyForm = { name: "", email: "", password: "", confirm_password: "" };

export function ManageOfficers() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [resetTarget, setResetTarget] = useState<Officer | null>(null);
  const [resetForm, setResetForm] = useState({
    password: "",
    confirm_password: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const { data } = await officerApi.list();
      setOfficers(data.items);
    } catch (err) {
      setError(apiError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.password !== form.confirm_password) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await officerApi.create(form);
      setMessage("Verification officer account created.");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (officer: Officer) => {
    setError("");
    setMessage("");
    try {
      await officerApi.setStatus(
        officer.id,
        officer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      );
      setMessage(
        `${officer.name}'s account is now ${officer.status === "ACTIVE" ? "inactive" : "active"}.`,
      );
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!resetTarget) return;
    setError("");
    setMessage("");
    if (resetForm.password !== resetForm.confirm_password) {
      setError("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await officerApi.resetPassword(resetTarget.id, resetForm);
      setMessage(
        `${resetTarget.name}'s password was reset. They must change it at next login.`,
      );
      setResetTarget(null);
      setResetForm({ password: "", confirm_password: "" });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAIN ADMIN ONLY</span>
          <h1>Manage verification officers</h1>
          <p>
            Create and manage accounts authorized to review beneficiary
            applications.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        >
          <UserPlus size={17} />{" "}
          {showForm ? "Close form" : "Add verification officer"}
        </button>
      </div>
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
      {resetTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card sm">
            <div className="modal-header">
              <div className="modal-header-content">
                <h2>Reset password for {resetTarget.name}</h2>
                <p>The officer will be required to choose a new password at next sign in.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setResetTarget(null)}
                title="Close dialog"
                aria-label="Close dialog"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form id="resetOfficerForm" onSubmit={resetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                    Temporary password (min 12 characters)
                  </label>
                  <input
                    required
                    minLength={12}
                    type="password"
                    autoComplete="new-password"
                    value={resetForm.password}
                    onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                    Confirm password
                  </label>
                  <input
                    required
                    minLength={12}
                    type="password"
                    autoComplete="new-password"
                    value={resetForm.confirm_password}
                    onChange={(e) => setResetForm({ ...resetForm, confirm_password: e.target.value })}
                    style={{ width: "100%", height: "38px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "13px" }}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button btn-md"
                onClick={() => setResetTarget(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="resetOfficerForm"
                className="primary-button btn-md"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <form className="form-card officer-create-form" onSubmit={create}>
          <div className="form-section">
            <div className="section-title">
              <span>+</span>
              <div>
                <h2>New officer account</h2>
                <p>
                  Credentials are stored as a password hash. Share the initial
                  password securely.
                </p>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Official email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Temporary password
                <input
                  required
                  minLength={12}
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </label>
              <label>
                Confirm password
                <input
                  required
                  minLength={12}
                  type="password"
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={(e) =>
                    setForm({ ...form, confirm_password: e.target.value })
                  }
                />
              </label>
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      )}
      <section className="panel officers-panel">
        <div className="table-meta">
          <span>{officers.length} verification officers</span>
          <span>Only the Main Admin can manage these accounts</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Officer</th>
                <th>Email</th>
                <th>Created</th>
                <th>Last login</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {officers.length ? (
                officers.map((officer) => (
                  <tr key={officer.id}>
                    <td>
                      <strong>{officer.name}</strong>
                    </td>
                    <td>{officer.email}</td>
                    <td>{new Date(officer.created_at).toLocaleDateString()}</td>
                    <td>
                      {officer.last_login_at
                        ? new Date(officer.last_login_at).toLocaleString()
                        : "Never"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${officer.status.toLowerCase()}`}
                      >
                        {officer.status}
                      </span>
                    </td>
                    <td>
                      <div className="officer-row-actions" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          className="secondary-button btn-sm"
                          onClick={() => void toggleStatus(officer)}
                        >
                          {officer.status === "ACTIVE" ? (
                            <UserRoundX size={15} />
                          ) : (
                            <UserRoundCheck size={15} />
                          )}
                          {officer.status === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                        <button
                          className="secondary-button btn-sm"
                          onClick={() => {
                            setResetTarget(officer);
                            setResetForm({
                              password: "",
                              confirm_password: "",
                            });
                          }}
                        >
                          <KeyRound size={15} />
                          Reset password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    No verification officers have been created.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function apiError(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } })
      .response;
    return (
      response?.data?.detail || "The officer action could not be completed."
    );
  }
  return "Unable to reach the officer service.";
}
