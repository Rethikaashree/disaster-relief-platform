import { useState, type ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  Boxes,
  FileCheck2,
  History,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { User } from "../types";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Activity },
  { to: "/beneficiaries", label: "Beneficiaries", icon: FileCheck2 },
  { to: "/distribution", label: "Supplies & Hubs", icon: Boxes },
  { to: "/new-beneficiary", label: "New Verification", icon: BadgeCheck },
  { to: "/duplicates", label: "Duplicate Flags", icon: ShieldCheck },
  { to: "/history", label: "Verification History", icon: History },
];

export function Layout({
  user,
  onLogout,
  children,
}: {
  user: User;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="portal-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={24} />
          </div>
          <div>
            <strong>Relief Verification</strong>
            <span>Authorized portal</span>
          </div>
        </div>
        <nav>
          {[
            ...nav,
            ...(user.role === "MAIN_ADMIN"
              ? [
                  { to: "/audit", label: "Audit Logs", icon: Activity },
                  {
                    to: "/manage-officers",
                    label: "Manage Officers",
                    icon: UsersRound,
                  },
                ]
              : []),
          ].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/profile" onClick={() => setOpen(false)}>
            <UserRound size={19} />
            Profile
          </NavLink>
          <button onClick={onLogout}>
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
          <div className="topbar-title">
            <span className="role-pill">
              {user.role === "MAIN_ADMIN"
                ? "MAIN ADMIN"
                : "VERIFICATION OFFICER"}
            </span>
            <strong>Disaster Beneficiary Verification</strong>
          </div>
          <div className="topbar-user">
            <span>{user.name}</span>
            <span className="avatar">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
      {open && (
        <button
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  );
}
