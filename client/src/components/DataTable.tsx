import React from "react";

interface Props {
  records: any[];
  type: "candidate" | "job";
  onDelete: (id: string) => void;
}

const SOURCE_CONFIG: Record<string, { label: string; cls: string }> = {
  paste: { label: "📋 Paste", cls: "badge-blue" },
  manual: { label: "✏️ Manual", cls: "badge-green" },
  excel: { label: "📁 Excel", cls: "badge-purple" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DataTable({ records, type, onDelete }: Props) {
  if (records.length === 0) {
    return (
      <div className="data-table-section">
        <div className="section-header">
          <h3>Recent Records</h3>
        </div>
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>No records yet</p>
          <p className="empty-hint">
            Start by adding data using the tabs above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-section">
      <div className="section-header">
        <h3>
          Recent Records{" "}
          <span className="record-count">({records.length})</span>
        </h3>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {type === "candidate" ? (
                <>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Location</th>
                  <th>Skills</th>
                  <th>Exp</th>
                </>
              ) : (
                <>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Skills</th>
                </>
              )}
              <th>Source</th>
              <th>Dup</th>
              <th>Date</th>
              <th className="th-action"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                {type === "candidate" ? (
                  <>
                    <td className="cell-primary">{r.name}</td>
                    <td className="cell-email">{r.email}</td>
                    <td>{r.location || "—"}</td>
                    <td>
                      <span className="skills-cell">
                        {r.skills?.slice(0, 3).join(", ")}
                        {r.skills?.length > 3 && (
                          <span className="more-badge">
                            +{r.skills.length - 3}
                          </span>
                        )}
                      </span>
                    </td>
                    <td>
                      {r.experience_years ? `${r.experience_years}y` : "—"}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="cell-primary">{r.title}</td>
                    <td>{r.company}</td>
                    <td>{r.location || "—"}</td>
                    <td className="cell-type">
                      {r.job_type?.replace(/_/g, " ") || "—"}
                    </td>
                    <td>
                      <span className="skills-cell">
                        {r.skills_required?.slice(0, 3).join(", ")}
                        {r.skills_required?.length > 3 && (
                          <span className="more-badge">
                            +{r.skills_required.length - 3}
                          </span>
                        )}
                      </span>
                    </td>
                  </>
                )}
                <td>
                  <span
                    className={`badge ${SOURCE_CONFIG[r.source]?.cls || ""}`}
                  >
                    {SOURCE_CONFIG[r.source]?.label || r.source}
                  </span>
                </td>
                <td>
                  {r.is_duplicate && (
                    <span className="badge badge-dup" title="Duplicate entry">
                      ⚠️ Dup
                    </span>
                  )}
                </td>
                <td className="cell-date">{fmtDate(r.createdAt)}</td>
                <td className="cell-action">
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(r._id)}
                    title="Delete record"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
