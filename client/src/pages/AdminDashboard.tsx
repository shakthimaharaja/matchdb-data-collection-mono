import React, { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";

interface UserStat {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
  };
  stats: {
    total: number;
    duplicates: number;
    unique: number;
    bySource: { paste: number; manual: number; excel: number };
    byMonth: Array<{ month: string; count: number; duplicates: number }>;
  };
}

interface AdminData {
  totals: {
    totalRecords: number;
    totalDuplicates: number;
    totalUnique: number;
    totalUsers: number;
  };
  users: UserStat[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/admin/stats")
      .then((r) => setData(r.data))
      .catch((err) => console.error("Admin stats error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <Navbar />
        <main className="dashboard-content">
          <div className="loading-screen">
            <div className="spinner" />
            <p>Loading admin data…</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard">
        <Navbar />
        <main className="dashboard-content">
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p>Failed to load admin stats</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard-content">
        <h2 className="admin-title">Admin Dashboard</h2>
        <p className="admin-subtitle">
          Platform-wide usage &amp; billing overview
        </p>

        {/* ── Platform Totals ──────────────────────── */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{data.totals.totalUsers}</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-card stat-paste">
            <span className="stat-value">{data.totals.totalRecords}</span>
            <span className="stat-label">Total Records</span>
          </div>
          <div className="stat-card stat-manual">
            <span className="stat-value">{data.totals.totalUnique}</span>
            <span className="stat-label">Unique Records</span>
          </div>
          <div className="stat-card stat-dup">
            <span className="stat-value">{data.totals.totalDuplicates}</span>
            <span className="stat-label">Duplicates</span>
          </div>
        </div>

        {/* ── Per-User Breakdown ───────────────────── */}
        <div className="admin-users-section">
          <h3>User Breakdown</h3>
          <div className="admin-users-grid">
            {data.users.map((u) => (
              <div key={u.user.id} className="admin-user-card">
                <div className="admin-user-header">
                  <div className="admin-user-info">
                    <span className="admin-user-name">{u.user.name}</span>
                    <span className="admin-user-email">{u.user.email}</span>
                  </div>
                  <span
                    className={`role-badge ${u.user.role === "candidate_uploader" ? "role-candidate" : "role-job"}`}
                  >
                    {u.user.role === "candidate_uploader"
                      ? "👤 Candidates"
                      : "💼 Jobs"}
                  </span>
                </div>

                <div className="admin-user-stats">
                  <div className="admin-mini-stat">
                    <span className="admin-mini-value">{u.stats.total}</span>
                    <span className="admin-mini-label">Total</span>
                  </div>
                  <div className="admin-mini-stat">
                    <span className="admin-mini-value">{u.stats.unique}</span>
                    <span className="admin-mini-label">Unique</span>
                  </div>
                  <div className="admin-mini-stat admin-mini-dup">
                    <span className="admin-mini-value">
                      {u.stats.duplicates}
                    </span>
                    <span className="admin-mini-label">Duplicates</span>
                  </div>
                </div>

                <div className="admin-source-bar">
                  <span className="admin-src admin-src-paste">
                    📋 {u.stats.bySource.paste}
                  </span>
                  <span className="admin-src admin-src-manual">
                    ✏️ {u.stats.bySource.manual}
                  </span>
                  <span className="admin-src admin-src-excel">
                    📁 {u.stats.bySource.excel}
                  </span>
                </div>

                {/* Monthly expand toggle */}
                {u.stats.byMonth.length > 0 && (
                  <>
                    <button
                      className="btn btn-ghost btn-sm admin-expand-btn"
                      onClick={() =>
                        setExpanded(expanded === u.user.id ? null : u.user.id)
                      }
                    >
                      {expanded === u.user.id
                        ? "▲ Hide Monthly"
                        : "▼ Monthly Breakdown"}
                    </button>

                    {expanded === u.user.id && (
                      <div className="admin-monthly-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Records</th>
                              <th>Duplicates</th>
                              <th>Billable</th>
                            </tr>
                          </thead>
                          <tbody>
                            {u.stats.byMonth.map((m) => (
                              <tr key={m.month}>
                                <td>{m.month}</td>
                                <td>{m.count}</td>
                                <td className="cell-dup">{m.duplicates}</td>
                                <td className="cell-billable">
                                  {m.count - m.duplicates}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
