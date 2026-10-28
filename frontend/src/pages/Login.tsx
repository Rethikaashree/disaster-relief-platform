import { useState, type FormEvent } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { authApi } from "../api";
import type { User } from "../types";

export function Login({
  onAuthenticated,
}: {
  onAuthenticated: (user: User) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuthenticated(data.user);
    } catch (err: unknown) {
      const message = axiosError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <ShieldCheck size={30} />
          <div>
            <strong>Relief Verification</strong>
            <span>Authorized beneficiary review</span>
          </div>
        </div>
        <div className="login-heading">
          <span>SECURE ACCESS</span>
          <h1>Verify disaster beneficiaries</h1>
          <p>
            Document-based Aadhaar review with transparent status decisions and
            audit records.
          </p>
        </div>
        <form onSubmit={submit} className="login-form">
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
              <LockKeyhole size={18} />
            </div>
          </label>
          {error && <div className="alert danger">{error}</div>}
          <button className="primary-button full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in securely"}
          </button>
        </form>
        <div className="privacy-note">
          <strong>Privacy notice</strong>
          <p>
            This portal performs document-based OCR and internal review. It does
            not perform official UIDAI authentication.
          </p>
        </div>
      </section>
      <aside className="login-visual">
        <div className="visual-overlay">
          <span>DISASTER RESPONSE</span>
          <h2>Prepare. Verify. Protect.</h2>
          <p>
            Every decision is reviewable, auditable, and isolated from public
            document access.
          </p>
          <div className="visual-points">
            <span>✓ OCR review</span>
            <span>✓ Duplicate detection</span>
            <span>✓ Audit trail</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function axiosError(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } })
      .response;
    return response?.data?.detail || "Unable to sign in. Please try again.";
  }
  return "Unable to reach the verification service.";
}
