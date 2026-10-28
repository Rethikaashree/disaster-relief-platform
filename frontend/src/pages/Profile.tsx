import {
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { User } from "../types";
export function Profile({ user }: { user: User }) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SECURE ACCOUNT</span>
          <h1>Profile</h1>
          <p>Current authorization and access details.</p>
        </div>
      </div>
      <section className="profile-grid">
        <article className="panel profile-card">
          <div className="profile-avatar">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="role-pill">
            {user.role === "MAIN_ADMIN"
              ? "MAIN ADMIN"
              : user.role === "VERIFICATION_OFFICER"
                ? "VERIFICATION OFFICER"
                : user.role}
          </span>
        </article>
        <article className="panel security-card">
          <div className="panel-header">
            <div>
              <h2>Security status</h2>
              <p>Authorization controls for this session</p>
            </div>
            <ShieldCheck />
          </div>
          <div className="security-list">
            <div>
              <LockKeyhole />
              <span>
                <strong>JWT session</strong>
                <small>Active for this browser session</small>
              </span>
              <CheckCircle2 />
            </div>
            <div>
              <KeyRound />
              <span>
                <strong>Role-based access</strong>
                <small>
                  {user.role === "MAIN_ADMIN"
                    ? "Main Admin permissions enabled"
                    : user.role === "VERIFICATION_OFFICER"
                      ? "Verification officer permissions enabled"
                      : `${user.role} permissions enabled`}
                </small>
              </span>
              <CheckCircle2 />
            </div>
            <div>
              <UserRound />
              <span>
                <strong>Identity masking</strong>
                <small>Raw identifiers are not returned to the UI</small>
              </span>
              <CheckCircle2 />
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
