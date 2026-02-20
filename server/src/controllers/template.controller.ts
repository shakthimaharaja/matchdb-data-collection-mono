import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import * as XLSX from "xlsx";

// ── Column definitions with human-friendly headers, hints, and dropdowns ──

const JOB_COLUMNS = [
  { header: "Title", key: "title", hint: "Sr. Java Developer", required: true },
  {
    header: "Description",
    key: "description",
    hint: "Full job posting text or summary",
    required: true,
  },
  { header: "Company", key: "company", hint: "Acme Corp", required: true },
  {
    header: "Location",
    key: "location",
    hint: "Des Moines, IA",
    required: true,
  },
  {
    header: "Job Type",
    key: "job_type",
    hint: "full_time",
    required: true,
    dropdown: ["full_time", "part_time", "contract"],
  },
  {
    header: "Sub Type",
    key: "job_subtype",
    hint: "c2h",
    required: false,
    dropdown: ["c2c", "c2h", "w2", "1099", "direct_hire", "salary"],
  },
  {
    header: "Work Mode",
    key: "work_mode",
    hint: "hybrid",
    required: false,
    dropdown: ["remote", "onsite", "hybrid"],
  },
  { header: "Salary Min", key: "salary_min", hint: "80000", required: false },
  { header: "Salary Max", key: "salary_max", hint: "120000", required: false },
  { header: "Pay Per Hour", key: "pay_per_hour", hint: "65", required: false },
  {
    header: "Skills Required",
    key: "skills_required",
    hint: "Java, Spring Boot, AWS, Kafka",
    required: false,
  },
  {
    header: "Experience Required",
    key: "experience_required",
    hint: "5",
    required: false,
  },
  {
    header: "Recruiter Name",
    key: "recruiter_name",
    hint: "Jane Smith",
    required: false,
  },
  {
    header: "Recruiter Email",
    key: "recruiter_email",
    hint: "jane@recruiter.com",
    required: false,
  },
  {
    header: "Recruiter Phone",
    key: "recruiter_phone",
    hint: "555-987-6543",
    required: false,
  },
];

const CANDIDATE_COLUMNS = [
  { header: "Name", key: "name", hint: "John Doe", required: true },
  { header: "Email", key: "email", hint: "john@email.com", required: true },
  { header: "Phone", key: "phone", hint: "555-123-4567", required: false },
  {
    header: "Location",
    key: "location",
    hint: "New York, NY",
    required: false,
  },
  {
    header: "Current Company",
    key: "current_company",
    hint: "Tech Corp",
    required: false,
  },
  {
    header: "Current Role",
    key: "current_role",
    hint: "Senior Developer",
    required: false,
  },
  {
    header: "Job Type",
    key: "preferred_job_type",
    hint: "full_time",
    required: false,
    dropdown: ["full_time", "part_time", "contract"],
  },
  {
    header: "Experience Years",
    key: "experience_years",
    hint: "5",
    required: false,
  },
  {
    header: "Hourly Rate",
    key: "expected_hourly_rate",
    hint: "75",
    required: false,
  },
  {
    header: "Skills",
    key: "skills",
    hint: "React, Node.js, TypeScript",
    required: false,
  },
  {
    header: "Bio",
    key: "bio",
    hint: "Full-stack developer passionate about scalable apps",
    required: false,
  },
  {
    header: "Resume Summary",
    key: "resume_summary",
    hint: "5+ years building enterprise web apps",
    required: false,
  },
  {
    header: "Resume Experience",
    key: "resume_experience",
    hint: "Senior Dev at Tech Corp 2020-present",
    required: false,
  },
  {
    header: "Resume Education",
    key: "resume_education",
    hint: "BS Computer Science, MIT, 2018",
    required: false,
  },
  {
    header: "Resume Achievements",
    key: "resume_achievements",
    hint: "Led migration to microservices",
    required: false,
  },
];

export async function downloadTemplate(req: AuthRequest, res: Response) {
  try {
    const type = req.params.type as "job" | "candidate";
    const columns = type === "candidate" ? CANDIDATE_COLUMNS : JOB_COLUMNS;
    const filename =
      type === "candidate"
        ? "MatchDB_Candidate_Template.xlsx"
        : "MatchDB_Job_Template.xlsx";

    // ── Build worksheet data ──────────────────────────────────
    // Row 1: Headers
    const headers = columns.map((c) =>
      c.required ? `${c.header} *` : c.header,
    );

    // Row 2: Sample / hint row (italic grey in real Excel — hints for user)
    const sampleRow = columns.map((c) => c.hint);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

    // ── Column widths (auto-fit based on header + hint length) ──
    ws["!cols"] = columns.map((c) => ({
      wch: Math.max(c.header.length + 2, c.hint.length + 2, 14),
    }));

    // ── Data validation (dropdowns) for columns that have enums ──
    // XLSX doesn't natively support data validation in the community edition,
    // so we add a "Valid Values" comment in the header instead.

    // ── Instructions sheet ───────────────────────────────────
    const instructions = [
      ["MatchDB Upload Template — Instructions"],
      [""],
      ["1. Fill in the 'Data' sheet with your records (one row per record)."],
      ["2. Columns marked with * are required."],
      ["3. Delete the sample row (row 2) before uploading."],
      [
        '4. Skills should be comma-separated within a single cell (e.g. "React, Node.js, TypeScript").',
      ],
      [
        "5. Numeric fields (salary, experience, hourly rate) should be plain numbers — no $ or commas.",
      ],
      [""],
      ["Valid Values for Dropdown Fields:"],
    ];

    // Add dropdown hints
    for (const col of columns) {
      if (col.dropdown) {
        instructions.push([`  ${col.header}: ${col.dropdown.join("  |  ")}`]);
      }
    }

    instructions.push(
      [""],
      ["6. Save the file and upload it on the Excel Upload tab in MatchDB."],
    );
    instructions.push(
      [""],
      [`Generated: ${new Date().toISOString().split("T")[0]}`],
    );

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions["!cols"] = [{ wch: 80 }];

    // ── Build workbook ───────────────────────────────────────
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // ── Send as downloadable .xlsx ───────────────────────────
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: err.message || "Failed to generate template" });
  }
}
