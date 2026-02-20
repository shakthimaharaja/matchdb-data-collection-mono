import React, { useState, useRef, useCallback } from "react";
import api from "../services/api";

interface Props {
  onUpload: (file: File) => Promise<void>;
  type: "candidate" | "job";
}

export default function ExcelUpload({ onUpload, type }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      // toast handled by parent
    } finally {
      setUploading(false);
    }
  };

  const candidateCols =
    "name, email, phone, location, current_company, current_role, preferred_job_type, experience_years, expected_hourly_rate, skills, bio";
  const jobCols =
    "title, description, company, location, job_type, job_subtype, work_mode, salary_min, salary_max, pay_per_hour, skills_required, experience_required, recruiter_name, recruiter_email, recruiter_phone";

  return (
    <div className="excel-upload">
      <p className="tab-description">
        Upload an Excel (<code>.xlsx</code>, <code>.xls</code>) or CSV (
        <code>.csv</code>) file with{" "}
        {type === "candidate" ? "candidate" : "job"} data. Rows will be
        validated and imported automatically.
      </p>

      <div
        className={`drop-zone ${dragging ? "drop-zone-active" : ""} ${file ? "drop-zone-has-file" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          hidden
        />
        {file ? (
          <div className="drop-zone-file">
            <span className="file-icon">📄</span>
            <div>
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        ) : (
          <div className="drop-zone-empty">
            <span className="upload-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <p className="drop-title">Drag & drop your file here</p>
            <p className="drop-hint">or click to browse</p>
            <span className="file-types">.xlsx · .xls · .csv</span>
          </div>
        )}
      </div>

      {file && (
        <div className="upload-actions">
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-sm" /> Uploading…
              </>
            ) : (
              `Upload ${file.name}`
            )}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove
          </button>
        </div>
      )}

      <div className="excel-help">
        <div className="template-download">
          <h4>Start with our template</h4>
          <p className="column-note">
            Download the pre-formatted Excel template with correct column
            headers, sample data, and instructions. Fill it in and upload.
          </p>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              try {
                const res = await api.get(`/api/templates/${type}`, {
                  responseType: "blob",
                });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement("a");
                a.href = url;
                a.download =
                  type === "candidate"
                    ? "MatchDB_Candidate_Template.xlsx"
                    : "MatchDB_Job_Template.xlsx";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch {
                alert("Failed to download template");
              }
            }}
          >
            📥 Download {type === "candidate" ? "Candidate" : "Job"} Template
          </button>
        </div>

        <h4>Expected Column Headers</h4>
        <div className="column-list">
          {(type === "candidate" ? candidateCols : jobCols)
            .split(", ")
            .map((col) => (
              <code key={col} className="column-tag">
                {col}
              </code>
            ))}
        </div>
        <p className="column-note">
          Skills should be comma-separated within the cell (e.g. "React,
          Node.js, TypeScript"). Column headers are case-insensitive. Spaces and
          underscores are interchangeable.
        </p>
      </div>
    </div>
  );
}
