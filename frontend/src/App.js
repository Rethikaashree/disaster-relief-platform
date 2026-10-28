import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

const portalConfig = {
  beneficiary: {
    title: "Get Help",
    subtitle:
      "Register or sign in to request flood relief support and verification.",
    accent: "#1d7c62",
    loginLabel: "Beneficiary Login",
    registerLabel: "Create Beneficiary Account",
    loginEndpoint: `${API_BASE}/api/auth/login`,
    registerEndpoint: `${API_BASE}/api/auth/beneficiary/register`,
    registerFields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone number", type: "tel", required: true },
      { name: "address", label: "Address", type: "text", required: true },
      { name: "district", label: "District", type: "text", required: true },
      { name: "state", label: "State", type: "text", required: true },
      { name: "pincode", label: "Pincode", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: true },
      {
        name: "confirm_password",
        label: "Confirm password",
        type: "password",
        required: true,
      },
    ],
  },
  donor: {
    title: "Donate",
    subtitle: "Support relief efforts and record your donation intent.",
    accent: "#d97706",
    loginLabel: "Donor Login",
    registerLabel: "Create Donor Account",
    loginEndpoint: `${API_BASE}/api/auth/login`,
    registerEndpoint: `${API_BASE}/api/auth/donor/register`,
    registerFields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone number", type: "tel" },
      { name: "password", label: "Password", type: "password", required: true },
      {
        name: "confirm_password",
        label: "Confirm password",
        type: "password",
        required: true,
      },
    ],
  },
  officer: {
    title: "Authorized Officer",
    subtitle:
      "Verification officers and admin staff sign in to review applications.",
    accent: "#2563eb",
    loginLabel: "Officer Login",
    registerLabel: "Officer account",
    loginEndpoint: `${API_BASE}/api/auth/login`,
    registerEndpoint: null,
    registerFields: [],
  },
};

const defaultForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  address: "",
  district: "",
  state: "",
  pincode: "",
};

function App() {
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("relief_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("relief_token") || "",
  );

  const activePortal = useMemo(
    () => (selectedPortal ? portalConfig[selectedPortal] : null),
    [selectedPortal],
  );

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("relief_token");
      return;
    }
    localStorage.setItem("relief_token", token);
  }, [token]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem("relief_user");
      return;
    }
    localStorage.setItem("relief_user", JSON.stringify(user));
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    setSelectedPortal(null);
    setMode("login");
    setForm(defaultForm);
    setStatus("Signed out successfully.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPortal) {
      setStatus("Please choose a portal first.");
      return;
    }

    const config = portalConfig[selectedPortal];
    const url =
      mode === "login" ? config.loginEndpoint : config.registerEndpoint;

    if (mode === "register" && !url) {
      setStatus("Officer accounts are created only by the Main Admin.");
      return;
    }

    const payload =
      mode === "login"
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
            confirm_password: form.confirm_password,
            ...(selectedPortal === "beneficiary"
              ? {
                  address: form.address,
                  district: form.district,
                  state: form.state,
                  pincode: form.pincode,
                }
              : {}),
          };

    if (
      !payload.email ||
      !payload.password ||
      (mode === "register" && !payload.name)
    ) {
      setStatus("Please provide the required information.");
      return;
    }

    if (mode === "register" && payload.password !== payload.confirm_password) {
      setStatus("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Request failed.");
      }

      if (mode === "login") {
        setToken(data.access_token);
        setUser(data.user);
        setStatus(`${data.user.role} login successful.`);
        return;
      }

      setMode("login");
      setStatus("Account created successfully. You can sign in now.");
      setForm({ ...defaultForm, email: payload.email });
    } catch (error) {
      setStatus(error.message || "Unable to reach the backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoggedInState = () => (
    <div className="portal-shell">
      <div className="status-card success-card">
        <div className="status-badge">Logged in</div>
        <h1>Welcome back, {user?.name || "User"}</h1>
        <p>
          Portal: <strong>{user?.role}</strong>
        </p>
        <p>
          Email: <strong>{user?.email}</strong>
        </p>
        <div className="action-row">
          <button
            type="button"
            className="primary-btn"
            onClick={() => setSelectedPortal(null)}
          >
            Choose another portal
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );

  const renderLanding = () => (
    <div className="portal-shell">
      <div className="landing-panel">
        <div className="landing-header">
          <span className="eyebrow">Disaster Relief Portal</span>
          <h1>Welcome! How would you like to participate?</h1>
          <p>Choose the portal that matches your need and continue securely.</p>
        </div>

        <div className="portal-grid">
          {Object.entries(portalConfig).map(([key, portal]) => (
            <button
              key={key}
              type="button"
              className="portal-card"
              style={{ borderColor: portal.accent }}
              onClick={() => {
                setSelectedPortal(key);
                setMode("login");
                setStatus("");
              }}
            >
              <span
                className="portal-icon"
                style={{ background: portal.accent }}
              >
                {key === "beneficiary" ? "🤝" : key === "donor" ? "💙" : "🛡️"}
              </span>
              <strong>{portal.title}</strong>
              <small>{portal.subtitle}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPortalForm = () => {
    if (!activePortal) return renderLanding();

    return (
      <div className="portal-shell">
        <div
          className="auth-card"
          style={{ borderTop: `6px solid ${activePortal.accent}` }}
        >
          <div className="auth-header">
            <span className="eyebrow">{activePortal.title}</span>
            <h2>
              {mode === "login"
                ? activePortal.loginLabel
                : activePortal.registerLabel}
            </h2>
            <p>{activePortal.subtitle}</p>
          </div>

          <div className="switch-row">
            <button
              type="button"
              className={mode === "login" ? "tab active" : "tab"}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            {activePortal.registerEndpoint && (
              <button
                type="button"
                className={mode === "register" ? "tab active" : "tab"}
                onClick={() => setMode("register")}
              >
                Register
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" &&
              activePortal.registerFields.map((field) => (
                <label key={field.name} className="field">
                  <span>{field.label}</span>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    required={field.required}
                  />
                </label>
              ))}

            {mode === "login" && (
              <>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </label>
              </>
            )}

            {status && <div className="status-box">{status}</div>}

            <div className="action-row">
              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Processing..."
                  : mode === "login"
                    ? activePortal.loginLabel
                    : activePortal.registerLabel}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setSelectedPortal(null)}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (user && token) {
    return renderLoggedInState();
  }

  return selectedPortal ? renderPortalForm() : renderLanding();
}

export default App;
