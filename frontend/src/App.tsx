import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Beneficiaries } from "./pages/Beneficiaries";
import { NewBeneficiary } from "./pages/NewBeneficiary";
import { Scanner } from "./pages/Scanner";
import { Review } from "./pages/Review";
import { DuplicateFlags } from "./pages/DuplicateFlags";
import { History } from "./pages/History";
import { AuditLogs } from "./pages/AuditLogs";
import { Profile } from "./pages/Profile";
import { NotFound } from "./pages/NotFound";
import { authApi, getUser } from "./api";
import type { User } from "./types";
import { Landing } from "./pages/Landing";
import { PortalAuth } from "./pages/PortalAuth";
import { BeneficiaryDashboard } from "./pages/BeneficiaryDashboard";
import { DonorDashboard } from "./pages/DonorDashboard";
import { ManageOfficers } from "./pages/ManageOfficers";
import { ChangePassword } from "./pages/ChangePassword";
import { Distribution } from "./pages/Distribution";
import "./styles.css";

export default function App() {
  const [user, setUser] = useState<User | null>(() =>
    localStorage.getItem("access_token") ? getUser() : null,
  );
  const [checkingSession, setCheckingSession] = useState(
    Boolean(localStorage.getItem("access_token")),
  );

  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    authApi
      .me()
      .then(({ data }) => {
        setUser(data as User);
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear the local session even if the API is unreachable.
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  if (checkingSession)
    return <div className="app-loader">Checking secure session...</div>;

  return (
    <BrowserRouter>
      {user ? (
        <SignedInApp
          user={user}
          onLogout={() => void logout()}
          onUserUpdated={setUser}
        />
      ) : (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/beneficiary/login"
            element={
              <PortalAuth portalRole="BENEFICIARY" onAuthenticated={setUser} />
            }
          />
          <Route
            path="/beneficiary/register"
            element={
              <PortalAuth portalRole="BENEFICIARY" onAuthenticated={setUser} />
            }
          />
          <Route
            path="/donor/login"
            element={
              <PortalAuth portalRole="DONOR" onAuthenticated={setUser} />
            }
          />
          <Route
            path="/donor/register"
            element={
              <PortalAuth portalRole="DONOR" onAuthenticated={setUser} />
            }
          />
          <Route
            path="/officer/login"
            element={
              <PortalAuth portalRole="OFFICER" onAuthenticated={setUser} />
            }
          />
          <Route path="*" element={<Landing />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

function SignedInApp({
  user,
  onLogout,
  onUserUpdated,
}: {
  user: User;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
}) {
  const officer =
    user.role === "MAIN_ADMIN" || user.role === "VERIFICATION_OFFICER";
  if (officer) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <Routes>
          <Route
            path="/change-password"
            element={<ChangePassword onUpdated={onUserUpdated} />}
          />
          {!user.must_change_password && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/beneficiaries" element={<Beneficiaries />} />
              <Route path="/distribution" element={<Distribution />} />
              <Route path="/new-beneficiary" element={<NewBeneficiary />} />
              <Route path="/scanner/:beneficiaryId" element={<Scanner />} />
              <Route path="/review/:beneficiaryId" element={<Review />} />
              <Route path="/duplicates" element={<DuplicateFlags />} />
              <Route path="/history" element={<History />} />
              {user.role === "MAIN_ADMIN" && (
                <Route path="/audit" element={<AuditLogs />} />
              )}
              {user.role === "MAIN_ADMIN" && (
                <Route path="/manage-officers" element={<ManageOfficers />} />
              )}
              <Route path="/profile" element={<Profile user={user} />} />
            </>
          )}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  user.must_change_password ? "/change-password" : "/dashboard"
                }
                replace
              />
            }
          />
        </Routes>
      </Layout>
    );
  }

  return (
    <div className="role-shell">
      <header className="role-shell-header">
        <Link className="purpose-brand" to="/dashboard">
          <span className="purpose-brand-mark">RV</span>
          <span>
            <strong>Relief Verification</strong>
            <small>
              {user.role === "BENEFICIARY"
                ? "Beneficiary portal"
                : "Donor portal"}
            </small>
          </span>
        </Link>
        <div className="role-shell-account">
          <span>{user.name}</span>
          <button className="secondary-button" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="role-shell-content">
        <Routes>
          {user.role === "BENEFICIARY" && (
            <Route path="/dashboard" element={<BeneficiaryDashboard />} />
          )}
          {user.role === "DONOR" && (
            <Route path="/dashboard" element={<DonorDashboard />} />
          )}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
