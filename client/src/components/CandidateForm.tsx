import React, { useState } from "react";
import type { CandidateData } from "../types";

interface Props {
  initialData?: Partial<CandidateData>;
  onSubmit: (data: CandidateData) => Promise<void>;
  submitLabel?: string;
}

const EMPTY: Partial<CandidateData> = {
  name: "",
  email: "",
  phone: "",
  location: "",
  current_company: "",
  current_role: "",
  preferred_job_type: "",
  expected_hourly_rate: undefined,
  experience_years: undefined,
  skills: [],
  bio: "",
  resume_summary: "",
  resume_experience: "",
  resume_education: "",
  resume_achievements: "",
};

export default function CandidateForm({
  initialData,
  onSubmit,
  submitLabel = "Save Candidate",
}: Props) {
  const [form, setForm] = useState<Partial<CandidateData>>({
    ...EMPTY,
    ...initialData,
  });
  const [skillInput, setSkillInput] = useState(
    initialData?.skills?.join(", ") || "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.email?.trim()) {
      setError("Name and Email are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const skills = skillInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await onSubmit({ ...form, skills } as CandidateData);
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
        <legend className="section-title">Personal Information</legend>
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={form.email || ""}
              onChange={(e) => set("email", e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              value={form.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="555-123-4567"
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              value={form.location || ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City, State"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Professional Details</legend>
        <div className="form-grid">
          <div className="form-group">
            <label>Current Company</label>
            <input
              value={form.current_company || ""}
              onChange={(e) => set("current_company", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Current Role</label>
            <input
              value={form.current_role || ""}
              onChange={(e) => set("current_role", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Preferred Job Type</label>
            <select
              value={form.preferred_job_type || ""}
              onChange={(e) => set("preferred_job_type", e.target.value)}
            >
              <option value="">Select…</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div className="form-group">
            <label>Experience (years)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={form.experience_years ?? ""}
              onChange={(e) =>
                set(
                  "experience_years",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
          <div className="form-group">
            <label>Expected Hourly Rate ($)</label>
            <input
              type="number"
              min="0"
              value={form.expected_hourly_rate ?? ""}
              onChange={(e) =>
                set(
                  "expected_hourly_rate",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Skills</legend>
        <div className="form-group">
          <label>Skills (comma-separated)</label>
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="React, Node.js, TypeScript, MongoDB"
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
      </fieldset>

      <fieldset className="form-section">
        <legend className="section-title">Resume</legend>
        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={form.bio || ""}
            onChange={(e) => set("bio", e.target.value)}
            rows={2}
            placeholder="Brief professional summary…"
          />
        </div>
        <div className="form-group">
          <label>Resume Summary</label>
          <textarea
            value={form.resume_summary || ""}
            onChange={(e) => set("resume_summary", e.target.value)}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Experience Details</label>
          <textarea
            value={form.resume_experience || ""}
            onChange={(e) => set("resume_experience", e.target.value)}
            rows={3}
          />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Education</label>
            <textarea
              value={form.resume_education || ""}
              onChange={(e) => set("resume_education", e.target.value)}
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>Achievements</label>
            <textarea
              value={form.resume_achievements || ""}
              onChange={(e) => set("resume_achievements", e.target.value)}
              rows={2}
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
