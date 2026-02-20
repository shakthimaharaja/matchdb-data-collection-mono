import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import JobData from "../models/JobData.model.js";
import * as XLSX from "xlsx";

export async function createJob(req: AuthRequest, res: Response) {
  try {
    const data = {
      ...req.body,
      source: req.body.source || "manual",
      uploaded_by: req.userId,
    };
    const job = await JobData.create(data);
    res.status(201).json(job);
  } catch (err: any) {
    res
      .status(400)
      .json({ error: err.message || "Failed to create job record" });
  }
}

export async function createBulkJobs(req: AuthRequest, res: Response) {
  try {
    const records = (req.body.records || []).map((r: any) => ({
      ...r,
      source: r.source || "paste",
      uploaded_by: req.userId,
    }));
    if (records.length === 0) {
      res.status(400).json({ error: "No records provided" });
      return;
    }
    const saved = await JobData.insertMany(records);
    res.status(201).json({ count: saved.length, records: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bulk insert failed" });
  }
}

export async function listJobs(req: AuthRequest, res: Response) {
  try {
    const jobs = await JobData.find({ uploaded_by: req.userId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(jobs);
  } catch {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}

export async function deleteJob(req: AuthRequest, res: Response) {
  try {
    const record = await JobData.findOneAndDelete({
      _id: req.params.id,
      uploaded_by: req.userId,
    });
    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    res.json({ message: "Deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete record" });
  }
}

export async function getStats(req: AuthRequest, res: Response) {
  try {
    const [total, paste, manual, excel] = await Promise.all([
      JobData.countDocuments({ uploaded_by: req.userId }),
      JobData.countDocuments({ uploaded_by: req.userId, source: "paste" }),
      JobData.countDocuments({ uploaded_by: req.userId, source: "manual" }),
      JobData.countDocuments({ uploaded_by: req.userId, source: "excel" }),
    ]);
    res.json({ total, bySource: { paste, manual, excel } });
  } catch {
    res.status(500).json({ error: "Failed to get stats" });
  }
}

export async function uploadExcel(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      res.status(400).json({ error: "Excel file is empty" });
      return;
    }

    const normalize = (val: string) =>
      val.toLowerCase().replace(/[\s-]+/g, "_");

    const jobs = rows
      .map((row) => ({
        title: row.title || row.Title || row["Job Title"] || "",
        description:
          row.description || row.Description || row["Job Description"] || "",
        company: row.company || row.Company || "",
        location: row.location || row.Location || "",
        job_type: normalize(
          row.job_type || row["Job Type"] || row.Type || "full_time",
        ),
        job_subtype: normalize(
          row.job_subtype || row["Sub Type"] || row.Subtype || "",
        ),
        work_mode: normalize(
          row.work_mode || row["Work Mode"] || row.Mode || "",
        ),
        salary_min:
          parseFloat(
            row.salary_min || row["Salary Min"] || row["Min Salary"] || "0",
          ) || undefined,
        salary_max:
          parseFloat(
            row.salary_max || row["Salary Max"] || row["Max Salary"] || "0",
          ) || undefined,
        pay_per_hour:
          parseFloat(
            row.pay_per_hour || row["Pay Per Hour"] || row["Hourly Pay"] || "0",
          ) || undefined,
        skills_required:
          typeof (
            row.skills_required ||
            row["Skills Required"] ||
            row.Skills
          ) === "string"
            ? (row.skills_required || row["Skills Required"] || row.Skills)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        experience_required:
          parseFloat(
            row.experience_required ||
              row["Experience Required"] ||
              row.Experience ||
              "0",
          ) || undefined,
        recruiter_name:
          row.recruiter_name || row["Recruiter Name"] || row.Recruiter || "",
        recruiter_email: row.recruiter_email || row["Recruiter Email"] || "",
        recruiter_phone: row.recruiter_phone || row["Recruiter Phone"] || "",
        source: "excel" as const,
        uploaded_by: req.userId,
      }))
      .filter((j) => j.title && j.company);

    if (jobs.length === 0) {
      res
        .status(400)
        .json({
          error:
            'No valid rows found. Ensure "title" and "company" columns exist.',
        });
      return;
    }

    const saved = await JobData.insertMany(jobs);
    res.status(201).json({ count: saved.length, records: saved });
  } catch (err: any) {
    res
      .status(400)
      .json({ error: err.message || "Failed to parse Excel file" });
  }
}
