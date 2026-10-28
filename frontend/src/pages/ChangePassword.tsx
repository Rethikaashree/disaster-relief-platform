import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { authApi } from "../api";
import type { User } from "../types";

export function ChangePassword({
  onUpdated,
}: {
  onUpdated: (user: User) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.changePassword({
        current_password: currentPassword,
        password,
        confirm_password: confirmation,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onUpdated(data.user as User);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <section className="panel password-change-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">ACCOUNT SECURITY</span>
            <h2>Set a new password</h2>
            <p>
              Your temporary password must be changed before you can review
              applications.
            </p>
          </div>
          <KeyRound />
        </div>
        <form className="password-change-form" onSubmit={submit}>
          <label>
            Temporary password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label>
            New password
            <input
              required
              minLength={12}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirm new password
            <input
              required
              minLength={12}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          {error && (
            <div role="alert" className="alert danger">
              {error}
            </div>
          )}
          <button className="primary-button" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}

function apiError(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } })
      .response;
    return response?.data?.detail || "Password could not be updated.";
  }
  return "Unable to reach the authentication service.";
}
