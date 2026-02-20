import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const isCandidate = user?.role === "candidate_uploader";
  const isAdmin = user?.role === "admin";

  const roleBadge = isAdmin
    ? { cls: "role-admin", label: "🛡️ Admin" }
    : isCandidate
      ? { cls: "role-candidate", label: "👤 Candidate Uploader" }
      : { cls: "role-job", label: "💼 Job Uploader" };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <svg
          className="navbar-logo"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <span>
          MatchDB <span className="brand-light">Data Collection</span>
        </span>
      </div>
      <div className="navbar-right">
        <span className={`role-badge ${roleBadge.cls}`}>
          {roleBadge.label}
        </span>
        <span className="user-name">{user?.name}</span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
