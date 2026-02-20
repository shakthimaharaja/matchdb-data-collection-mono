import React, { useState } from "react";
import type { JobData } from "../types";

interface Props {
  initialData?: Partial<JobData>;
  onSubmit: (data: JobData) => Promise<void>;
  submitLabel?: string;
}

const EMPTY: Partial<JobData> = {
  title: "",
  description: "",
  company: "",
  location: "",
  job_type: "",
  job_subtype: "",
  work_mode: "",
  salary_min: undefined,
  salary_max: undefined,
  pay_per_hour: undefined,
  skills_required: [],
  experience_required: undefined,
  recruiter_name: "",
  recruiter_email: "",
  recruiter_phone: "",
};

export default function JobForm({
  initialData,
  onSubmit,
  submitLabel = "Save Job",
}: Props) {
  const [form, setForm] = useState<Partial<JobData>>({
    ...EMPTY,
    ...initialData,
  });
  const [skillInput, setSkillInput] = useState(
    initialData?.skills_required?.join(", ") || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.company?.trim() || !form.job_type) {
      setError("Title, Company, and Job Type are required");
      return;
    }
    if (!form.description?.trim() || !form.location?.trim()) {
      setError("Description and Location are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const skills_required = skillInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSubmit({ ...form, skills_required } as JobData);
      setForm({ ...EMPTY });
      setSkillInput("");
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <fieldset className="form-section">
        <legend className="section-title">Job Information</legend>
        <div className="form-grid">
          <div className="form-group">
            <label>Job Title *</label>
            <input
              value={form.title || ""}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Senior React Developer"
              required
            />
          </div>
          <div className="form-group">
            <label>Company *</label>
            <input
              value={form.company || ""}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Innovation Labs"
              required
            />
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input
              value={form.location || ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="San Francisco, CA"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={form.description || ""}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            placeholder="Job description…"
            required
          />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Employment Details</legend>
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label>Job Type *</label>
            <select
              value={form.job_type || ""}
              onChange={(e) => set("job_type", e.target.value)}
              required
            >
              <option value="">Select…</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div className="form-group">
            <label>Sub Type</label>
            <select
              value={form.job_subtype || ""}
              onChange={(e) => set("job_subtype", e.target.value)}
            >
              <option value="">Select…</option>
              <option value="c2c">C2C</option>
              <option value="c2h">C2H</option>
              <option value="w2">W2</option>
              <option value="1099">1099</option>
              <option value="direct_hire">Direct Hire</option>
              <option value="salary">Salary</option>
            </select>
          </div>
          <div className="form-group">
            <label>Work Mode</label>
            <select
              value={form.work_mode || ""}
              onChange={(e) => set("work_mode", e.target.value)}
            >
              <option value="">Select…</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Compensation</legend>
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label>Salary Min ($)</label>
            <input
              type="number"
              min="0"
              value={form.salary_min ?? ""}
              onChange={(e) =>
                set(
                  "salary_min",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
          <div className="form-group">
            <label>Salary Max ($)</label>
            <input
              type="number"
              min="0"
              value={form.salary_max ?? ""}
              onChange={(e) =>
                set(
                  "salary_max",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
          <div className="form-group">
            <label>Pay Per Hour ($)</label>
            <input
              type="number"
              min="0"
              value={form.pay_per_hour ?? ""}
              onChange={(e) =>
                set(
                  "pay_per_hour",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Requirements</legend>
        <div className="form-grid">
          <div className="form-group">
            <label>Required Skills (comma-separated)</label>
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="React, TypeScript, Node.js, AWS"
            />
            {skillInput && (
              <div className="skill-preview">
                {skillInput
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s, i) => (
                    <span key={i} className="skill-tag">
                      {s}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Experience Required (years)</label>
            <input
              type="number"
              min="0"
              max="30"
              value={form.experience_required ?? ""}
              onChange={(e) =>
                set(
                  "experience_required",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Recruiter Contact</legend>
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.recruiter_name || ""}
              onChange={(e) => set("recruiter_name", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.recruiter_email || ""}
              onChange={(e) => set("recruiter_email", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              value={form.recruiter_phone || ""}
              onChange={(e) => set("recruiter_phone", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-sm" /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
