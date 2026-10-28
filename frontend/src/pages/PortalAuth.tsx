import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CloudRain,
  Eye,
  EyeOff,
  Flame,
  HandHeart,
  HeartHandshake,
  HousePlug,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Waves,
  Wind,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import type { User } from "../types";

type PortalRole = "BENEFICIARY" | "DONOR" | "OFFICER";
type RegistrationFields = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
};

const emptyForm: RegistrationFields = {
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


const DEMO_ACCOUNTS: Record<
  PortalRole,
  {
    email: string;
    password: string;
    name?: string;
    phone?: string;
    district?: string;
  }
> = {
  BENEFICIARY: {
    email: "beneficiary@example.com",
    password: "ExamplePass123!",
    name: "Asha Raman",
    phone: "9876543210",
    district: "Chennai",
  },
  DONOR: {
    email: "donor@example.com",
    password: "ExamplePass123!",
    name: "Tamil Relief Foundation",
    phone: "9876543211",
    district: "Chennai",
  },
  OFFICER: {
    email: "officer@example.com",
    password: "ExamplePass123!",
    name: "Verification Officer",
    district: "Chennai",
  },
};

const disasterTiles = [
  { label: "Floods", icon: Waves },
  { label: "Cyclones", icon: Wind },
  { label: "Fires", icon: Flame },
  { label: "Shelter", icon: HousePlug },
];

export function PortalAuth({
  portalRole,
  onAuthenticated,
}: {
  portalRole: PortalRole;
  onAuthenticated: (user: User) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const registering =
    portalRole !== "OFFICER" && location.pathname.endsWith("/register");
  const [form, setForm] = useState(emptyForm);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const basePath =
    portalRole === "OFFICER" ? "/officer" : `/${portalRole.toLowerCase()}`;
  const title =
    portalRole === "OFFICER"
      ? "Officer sign in"
      : portalRole === "DONOR"
        ? "Donor portal"
        : "Beneficiary portal";
  const sampleEmail =
    portalRole === "OFFICER"
      ? "officer@example.com"
      : portalRole === "DONOR"
        ? "donor@example.com"
        : "beneficiary@example.com";
  const portalCopy = {
    BENEFICIARY: {
      label: "Request verified assistance",
      detail: "Submit applications, upload evidence, and track relief status.",
    },
    DONOR: {
      label: "Offer transparent support",
      detail: "Record aid offers and review public relief demand summaries.",
    },
    OFFICER: {
      label: "Command center review",
      detail: "Verify records, inspect flags, and protect beneficiary privacy.",
    },
  }[portalRole];

  const autoFillDemo = () => {
    const cred = DEMO_ACCOUNTS[portalRole];
    if (registering) {
      setForm({
        name: cred.name || "Demo User",
        email: `demo.${portalRole.toLowerCase()}@example.com`,
        phone: cred.phone || "9876543210",
        password: "ExamplePass123!",
        confirm_password: "ExamplePass123!",
        address: "12, Relief Camp Road",
        district: cred.district || "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
      });
      setMessage("Sample registration details auto-filled.");
    } else {
      setForm((current) => ({ ...current, email: cred.email }));
      setPassword(cred.password);
      setMessage(`Auto-filled demo credentials for ${portalRole.toLowerCase()}.`);
    }
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (registering && form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (registering) {
        const payload =
          portalRole === "BENEFICIARY"
            ? form
            : {
                name: form.name,
                email: form.email,
                phone: form.phone || null,
                password: form.password,
                confirm_password: form.confirm_password,
              };
        await authApi.register(portalRole, payload);
        setMessage("Account created. Sign in with your new credentials.");
        navigate(`${basePath}/login`, { replace: true });
        return;
      }
      const { data } = await authApi.login(form.email, password);
      const allowed =
        portalRole === "OFFICER"
          ? ["MAIN_ADMIN", "VERIFICATION_OFFICER"].includes(data.user.role)
          : data.user.role === portalRole;
      if (!allowed) {
        setError("This account belongs to a different portal.");
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuthenticated(data.user as User);
    } catch (err: unknown) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-showcase">
      <nav className="auth-nav">
        <Link to="/" className="auth-nav-brand">
          <ShieldCheck size={24} />
          <span>
            <strong>Relief Grid</strong>
            <small>Verified aid platform</small>
          </span>
        </Link>
        <div className="auth-nav-links">
          <Link to="/beneficiary/login">Assistance</Link>
          <Link to="/donor/login">Donate</Link>
          <Link to="/officer/login">Officer</Link>
        </div>
      </nav>
      <section className="auth-hero-panel">
        <div className="auth-hero-copy">
          <span className="hero-kicker">RELIEF OPERATIONS</span>
          <h1>Helping communities recover with verified aid.</h1>
          <p>
            A disaster-response portal for applications, donations, officer
            review, and transparent relief coordination.
          </p>
          <div className="auth-hero-actions">
            <Link className="primary-button" to="/beneficiary/login">
              Request Assistance
            </Link>
            <Link className="secondary-button light" to="/donor/login">
              Donate Aid
            </Link>
          </div>
        </div>
        <div className="disaster-tile-grid" aria-label="Disaster categories">
          {disasterTiles.map(({ label, icon: Icon }) => (
            <button type="button" key={label} className="disaster-tile">
              <Icon size={25} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="auth-card">
        <Link to="/" className="auth-back">
          <ArrowLeft size={17} /> Back to choices
        </Link>
        <div className="demo-role-cards" style={{ marginBottom: "18px" }}>
          {(["BENEFICIARY", "DONOR", "OFFICER"] as PortalRole[]).map((role) => (
            <Link
              className={role === portalRole ? "active" : ""}
              to={`${role === "OFFICER" ? "/officer" : `/${role.toLowerCase()}`}/login`}
              key={role}
            >
              {role === "BENEFICIARY" ? (
                <HandHeart size={16} />
              ) : role === "DONOR" ? (
                <HeartHandshake size={16} />
              ) : (
                <ShieldCheck size={16} />
              )}
              {role.replace("_", " ")}
            </Link>
          ))}
        </div>
        <div className="login-brand">
          <ShieldCheck size={30} />
          <div>
            <strong>{title}</strong>
            <span>{portalCopy.label}</span>
          </div>
        </div>
        <div className="login-heading">
          <span>
            {portalRole === "OFFICER"
              ? "RESTRICTED ACCESS"
              : registering
                ? "CREATE ACCOUNT"
                : "SECURE ACCESS"}
          </span>
          <h1>
            {registering
              ? `Create your ${title.toLowerCase()} account`
              : `Enter the ${title.toLowerCase()}`}
          </h1>
          <p>{portalCopy.detail}</p>
        </div>
        <form className="login-form auth-form" onSubmit={submit}>
          {registering && (
            <label>
              Full name
              <input
                required
                minLength={2}
                maxLength={120}
                placeholder="e.g. Asha Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              required
              type="email"
              placeholder={
                portalRole === "OFFICER"
                  ? "officer@organization.gov"
                  : portalRole === "DONOR"
                    ? "donor@example.com"
                    : "beneficiary@example.com"
              }
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </label>
          {registering && (
            <label>
              Phone number
              {portalRole === "DONOR" && (
                <span className="optional-label">Optional</span>
              )}
              <input
                required={portalRole === "BENEFICIARY"}
                type="tel"
                maxLength={30}
                placeholder="e.g. 9000000001"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
              />
            </label>
          )}
          {registering && portalRole === "BENEFICIARY" && (
            <>
              <label className="auth-wide">
                Address
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  placeholder="House, street, and locality"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  autoComplete="street-address"
                />
              </label>
              <label>
                District
                <input
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value })
                  }
                />
              </label>
              <label>
                State
                <input
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </label>
              <label>
                PIN code
                <input
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value })
                  }
                  autoComplete="postal-code"
                />
              </label>
            </>
          )}
          <label>
            Password
            <div className="password-field">
              <input
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                placeholder={
                  registering ? "At least 8 characters" : "Enter your account password"
                }
                value={registering ? form.password : password}
                onChange={(e) =>
                  registering
                    ? setForm({ ...form, password: e.target.value })
                    : setPassword(e.target.value)
                }
                autoComplete={registering ? "new-password" : "current-password"}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {registering && (
            <label>
              Confirm password
              <div className="password-field">
                <input
                  required
                  minLength={8}
                  type={showConfirmation ? "text" : "password"}
                  value={form.confirm_password}
                  onChange={(e) =>
                    setForm({ ...form, confirm_password: e.target.value })
                  }
                  autoComplete="new-password"
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={
                    showConfirmation
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={showConfirmation}
                  onClick={() => setShowConfirmation(!showConfirmation)}
                >
                  {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )}
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              alignItems: "stretch",
            }}
          >
            <button
              className="primary-button"
              disabled={loading}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "0.9rem",
                padding: "0.5rem 0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              {loading
                ? "Please wait..."
                : registering
                  ? "Create account"
                  : "Sign in securely"}
            </button>
            <button
              type="button"
              className="secondary-button"
              aria-label="Fill example"
              onClick={autoFillDemo}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                fontWeight: 600,
                fontSize: "0.85rem",
                padding: "0.5rem 0.5rem",
                whiteSpace: "nowrap",
              }}
            >
              <Sparkles size={15} />
              {registering ? "Auto-fill sample" : "Auto-fill demo"}
            </button>
          </div>
        </form>
        {portalRole !== "OFFICER" && (
          <p className="auth-switch">
            {registering ? "Already registered?" : "New here?"}{" "}
            <Link to={`${basePath}/${registering ? "login" : "register"}`}>
              {registering ? "Sign in" : "Create an account"}
            </Link>
          </p>
        )}
        <div className="privacy-note">
          <strong>Privacy notice</strong>
          <p>
            Aadhaar review is document-based and does not perform official UIDAI
            authentication. Donation pledges are not processed payments.
          </p>
        </div>
      </section>
      <section className="auth-campaign-strip">
        <article>
          <CloudRain size={22} />
          <strong>Flood Relief</strong>
          <span>Applications, supplies, and district-level demand.</span>
        </article>
        <article>
          <MapPinned size={22} />
          <strong>Aid Map</strong>
          <span>Fictional demo locations for safe presentations.</span>
        </article>
        <article>
          <HeartHandshake size={22} />
          <strong>Donor Offers</strong>
          <span>Food, water, medicine, clothing, and shelter pledges.</span>
        </article>
      </section>
    </main>
  );
}


function apiError(error: unknown): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } })
      .response;
    return (
      response?.data?.detail ||
      "Unable to complete the request. Please try again."
    );
  }
  return "Unable to reach the service. Check that the backend is running.";
}
