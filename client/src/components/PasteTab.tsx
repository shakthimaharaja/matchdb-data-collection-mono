import React, { useState } from "react";
import CandidateForm from "./CandidateForm";
import JobForm from "./JobForm";

interface Props {
  type: "candidate" | "job";
  onSave: (data: any) => Promise<void>;
}

const CANDIDATE_TEMPLATE = `Name: John Doe
Email: john.doe@email.com
Phone: 555-123-4567
Location: New York, NY
Current Company: Tech Corp
Current Role: Senior Developer
Preferred Job Type: full_time
Experience Years: 5
Expected Hourly Rate: 75
Skills: React, Node.js, TypeScript, MongoDB, AWS
Bio: Experienced full-stack developer with a passion for building scalable applications.
Resume Summary: Full-stack developer with 5+ years of experience building enterprise-grade web apps.
Resume Experience: Senior Developer at Tech Corp (2020-present) — Led a team of 5 engineers.
Resume Education: BS Computer Science, MIT, 2018
Resume Achievements: Led migration to microservices, reducing deploy time by 60%`;

const JOB_TEMPLATE = `Title: Senior React Developer
Company: Innovation Labs
Location: San Francisco, CA
Description: We are looking for an experienced React developer to lead our frontend architecture. Must have strong TypeScript skills.
Job Type: full_time
Sub Type: w2
Work Mode: hybrid
Salary Min: 130000
Salary Max: 165000
Skills Required: React, TypeScript, Redux, GraphQL, CSS, Jest
Experience Required: 5
Recruiter Name: Emily Watson
Recruiter Email: emily@innovationlabs.com
Recruiter Phone: 555-111-2222`;

function parseCandidateText(text: string) {
  const get = (key: string): string => {
    const regex = new RegExp(`^${key}\\s*[:=]\\s*(.+)$`, "im");
    return regex.exec(text)?.[1]?.trim() || "";
  };
  return {
    name: get("Name"),
    email: get("Email"),
    phone: get("Phone"),
    location: get("Location"),
    current_company: get("Current Company") || get("Company"),
    current_role: get("Current Role") || get("Role"),
    preferred_job_type: (get("Preferred Job Type") || get("Job Type"))
      .toLowerCase()
      .replace(/\s+/g, "_"),
    expected_hourly_rate:
      parseFloat(get("Expected Hourly Rate") || get("Hourly Rate")) ||
      undefined,
    experience_years:
      parseFloat(get("Experience Years") || get("Experience")) || undefined,
    skills: (get("Skills") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    bio: get("Bio"),
    resume_summary: get("Resume Summary") || get("Summary"),
    resume_experience: get("Resume Experience") || get("Experience Details"),
    resume_education: get("Resume Education") || get("Education"),
    resume_achievements: get("Resume Achievements") || get("Achievements"),
  };
}

function parseJobText(text: string) {
  const get = (key: string): string => {
    const regex = new RegExp(`^${key}\\s*[:=]\\s*(.+)$`, "im");
    return regex.exec(text)?.[1]?.trim() || "";
  };
  return {
    title: get("Title") || get("Job Title") || get("Position"),
    description: get("Description") || get("Job Description"),
    company: get("Company"),
    location: get("Location"),
    job_type: (get("Job Type") || get("Type"))
      .toLowerCase()
      .replace(/\s+/g, "_"),
    job_subtype: (get("Sub Type") || get("Subtype") || get("Job Subtype"))
      .toLowerCase()
      .replace(/[\s-]+/g, "_"),
    work_mode: (get("Work Mode") || get("Mode")).toLowerCase(),
    salary_min: parseFloat(get("Salary Min") || get("Min Salary")) || undefined,
    salary_max: parseFloat(get("Salary Max") || get("Max Salary")) || undefined,
    pay_per_hour:
      parseFloat(get("Pay Per Hour") || get("Hourly Pay")) || undefined,
    skills_required: (
      get("Skills Required") ||
      get("Skills") ||
      get("Required Skills")
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    experience_required:
      parseFloat(get("Experience Required") || get("Required Experience")) ||
      undefined,
    recruiter_name: get("Recruiter Name") || get("Recruiter"),
    recruiter_email: get("Recruiter Email"),
    recruiter_phone: get("Recruiter Phone"),
  };
}

export default function PasteTab({ type, onSave }: Props) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const isCandidate = type === "candidate";

  const handleParse = () => {
    if (!text.trim()) return;
    const data = isCandidate ? parseCandidateText(text) : parseJobText(text);
    setParsed(data);
  };

  const handleSave = async (data: any) => {
    await onSave(data);
    setParsed(null);
    setText("");
  };

  if (parsed) {
    return (
      <div className="paste-preview">
        <div className="preview-header">
          <h3>Review Parsed Data</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setParsed(null)}
          >
            ← Back to Paste
          </button>
        </div>
        {isCandidate ? (
          <CandidateForm
            initialData={parsed}
            onSubmit={handleSave}
            submitLabel="Save Candidate"
          />
        ) : (
          <JobForm
            initialData={parsed}
            onSubmit={handleSave}
            submitLabel="Save Job"
          />
        )}
      </div>
    );
  }

  return (
    <div className="paste-tab">
      <p className="tab-description">
        Paste {isCandidate ? "candidate" : "job"} details using the{" "}
        <strong>Key: Value</strong> format below. Fields will be automatically
        extracted and shown for review before saving.
      </p>
      <textarea
        className="paste-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isCandidate ? CANDIDATE_TEMPLATE : JOB_TEMPLATE}
        rows={16}
      />
      <div className="paste-actions">
        <button
          className="btn btn-primary"
          onClick={handleParse}
          disabled={!text.trim()}
        >
          Parse & Preview
        </button>
        <button
          className="btn btn-ghost"
          onClick={() =>
            setText(isCandidate ? CANDIDATE_TEMPLATE : JOB_TEMPLATE)
          }
        >
          Load Example
        </button>
        {text && (
          <button className="btn btn-ghost" onClick={() => setText("")}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
