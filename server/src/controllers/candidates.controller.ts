import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import CandidateData from "../models/CandidateData.model.js";
import * as XLSX from "xlsx";

// ── Duplicate detection helper ────────────────────────────
function buildCandidateDupQuery(name: string, email: string, userId: any) {
  return {
    uploaded_by: userId,
    name:  { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim()}$`, "i") },
    email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim()}$`, "i") },
  };
}

export async function createCandidate(req: AuthRequest, res: Response) {
  try {
    const data = {
      ...req.body,
      source: req.body.source || "manual",
      uploaded_by: req.userId,
      is_duplicate: false,
    };

    // ── Duplicate check — flag but still save ────────────────
    if (data.name && data.email) {
      const existing = await CandidateData.findOne(
        buildCandidateDupQuery(data.name, data.email, req.userId)
      ).lean();
      if (existing) {
        data.is_duplicate = true;
      }
    }

    const candidate = await CandidateData.create(data);
    res.status(201).json(candidate);
  } catch (err: any) {
    res
      .status(400)
      .json({ error: err.message || "Failed to create candidate record" });
  }
}

export async function createBulkCandidates(req: AuthRequest, res: Response) {
  try {
    const records = (req.body.records || []).map((r: any) => ({
      ...r,
      source: r.source || "paste",
      uploaded_by: req.userId,
      is_duplicate: false,
    }));
    if (records.length === 0) {
      res.status(400).json({ error: "No records provided" });
      return;
    }

    // ── Flag duplicates ──────────────────────────────────────
    let dupCount = 0;
    for (const rec of records) {
      if (rec.name && rec.email) {
        const dup = await CandidateData.findOne(
          buildCandidateDupQuery(rec.name, rec.email, req.userId)
        ).lean();
        if (dup) {
          rec.is_duplicate = true;
          dupCount++;
        }
      }
    }

    const saved = await CandidateData.insertMany(records);
    res.status(201).json({
      count: saved.length,
      duplicatesFound: dupCount,
      records: saved,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Bulk insert failed" });
  }
}

export async function listCandidates(req: AuthRequest, res: Response) {
  try {
    const candidates = await CandidateData.find({ uploaded_by: req.userId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(candidates);
  } catch {
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
}

export async function deleteCandidate(req: AuthRequest, res: Response) {
  try {
    const record = await CandidateData.findOneAndDelete({
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
    const filter = { uploaded_by: req.userId };
    const [total, paste, manual, excel, duplicates, byMonth] = await Promise.all([
      CandidateData.countDocuments(filter),
      CandidateData.countDocuments({ ...filter, source: "paste" }),
      CandidateData.countDocuments({ ...filter, source: "manual" }),
      CandidateData.countDocuments({ ...filter, source: "excel" }),
      CandidateData.countDocuments({ ...filter, is_duplicate: true }),
      CandidateData.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            duplicates: { $sum: { $cond: ["$is_duplicate", 1, 0] } },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);
    res.json({
      total,
      duplicates,
      bySource: { paste, manual, excel },
      byMonth: byMonth.map((m) => ({
        month: m._id,
        count: m.count,
        duplicates: m.duplicates,
      })),
    });
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
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rawRows.length === 0) {
      res.status(400).json({ error: "Excel file is empty" });
      return;
    }

    // Normalize column headers: strip trailing " *", trim whitespace
    const rows = rawRows.map((row) => {
      const clean: any = {};
      for (const [key, val] of Object.entries(row)) {
        clean[key.replace(/\s*\*\s*$/, "").trim()] = val;
      }
      return clean;
    });

    const candidates = rows
      .map((row) => ({
        name: row.name || row.Name || "",
        email: row.email || row.Email || "",
        phone: row.phone || row.Phone || "",
        location: row.location || row.Location || "",
        current_company: row.current_company || row["Current Company"] || "",
        current_role: row.current_role || row["Current Role"] || "",
        preferred_job_type: (row.preferred_job_type || row["Job Type"] || "")
          .toLowerCase()
          .replace(/\s+/g, "_"),
        expected_hourly_rate:
          parseFloat(row.expected_hourly_rate || row["Hourly Rate"] || "0") ||
          undefined,
        experience_years:
          parseFloat(
            row.experience_years ||
              row["Experience Years"] ||
              row["Experience"] ||
              "0",
          ) || undefined,
        skills:
          typeof (row.skills || row.Skills) === "string"
            ? (row.skills || row.Skills)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        bio: row.bio || row.Bio || "",
        resume_summary: row.resume_summary || row["Resume Summary"] || "",
        resume_experience:
          row.resume_experience || row["Resume Experience"] || "",
        resume_education: row.resume_education || row["Resume Education"] || "",
        resume_achievements:
          row.resume_achievements || row["Resume Achievements"] || "",
        source: "excel" as const,
        uploaded_by: req.userId,
      }))
      .filter((c) => c.name && c.email);

    if (candidates.length === 0) {
      res
        .status(400)
        .json({
          error:
            'No valid rows found. Ensure "name" and "email" columns exist.',
        });
      return;
    }

    // ── Flag duplicates ──────────────────────────────────────
    let dupCount = 0;
    for (const c of candidates) {
      if (c.name && c.email) {
        const dup = await CandidateData.findOne(
          buildCandidateDupQuery(c.name, c.email, req.userId)
        ).lean();
        if (dup) {
          (c as any).is_duplicate = true;
          dupCount++;
        }
      }
    }

    const saved = await CandidateData.insertMany(candidates);
    res.status(201).json({
      count: saved.length,
      duplicatesFound: dupCount,
      records: saved,
    });
  } catch (err: any) {
    res
      .status(400)
      .json({ error: err.message || "Failed to parse Excel file" });
  }
}
