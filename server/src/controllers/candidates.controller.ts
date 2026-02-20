import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import CandidateData from '../models/CandidateData.model.js';
import * as XLSX from 'xlsx';

export async function createCandidate(req: AuthRequest, res: Response) {
  try {
    const data = {
      ...req.body,
      source: req.body.source || 'manual',
      uploaded_by: req.userId,
    };
    const candidate = await CandidateData.create(data);
    res.status(201).json(candidate);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create candidate record' });
  }
}

export async function createBulkCandidates(req: AuthRequest, res: Response) {
  try {
    const records = (req.body.records || []).map((r: any) => ({
      ...r,
      source: r.source || 'paste',
      uploaded_by: req.userId,
    }));
    if (records.length === 0) {
      res.status(400).json({ error: 'No records provided' });
      return;
    }
    const saved = await CandidateData.insertMany(records);
    res.status(201).json({ count: saved.length, records: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Bulk insert failed' });
  }
}

export async function listCandidates(req: AuthRequest, res: Response) {
  try {
    const candidates = await CandidateData.find({ uploaded_by: req.userId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(candidates);
  } catch {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
}

export async function deleteCandidate(req: AuthRequest, res: Response) {
  try {
    const record = await CandidateData.findOneAndDelete({
      _id: req.params.id,
      uploaded_by: req.userId,
    });
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete record' });
  }
}

export async function getStats(req: AuthRequest, res: Response) {
  try {
    const [total, paste, manual, excel] = await Promise.all([
      CandidateData.countDocuments({ uploaded_by: req.userId }),
      CandidateData.countDocuments({ uploaded_by: req.userId, source: 'paste' }),
      CandidateData.countDocuments({ uploaded_by: req.userId, source: 'manual' }),
      CandidateData.countDocuments({ uploaded_by: req.userId, source: 'excel' }),
    ]);
    res.json({ total, bySource: { paste, manual, excel } });
  } catch {
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

export async function uploadExcel(req: AuthRequest, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      res.status(400).json({ error: 'Excel file is empty' });
      return;
    }

    const candidates = rows
      .map((row) => ({
        name: row.name || row.Name || '',
        email: row.email || row.Email || '',
        phone: row.phone || row.Phone || '',
        location: row.location || row.Location || '',
        current_company: row.current_company || row['Current Company'] || '',
        current_role: row.current_role || row['Current Role'] || '',
        preferred_job_type: (row.preferred_job_type || row['Job Type'] || '').toLowerCase().replace(/\s+/g, '_'),
        expected_hourly_rate: parseFloat(row.expected_hourly_rate || row['Hourly Rate'] || '0') || undefined,
        experience_years: parseFloat(row.experience_years || row['Experience Years'] || row['Experience'] || '0') || undefined,
        skills:
          typeof (row.skills || row.Skills) === 'string'
            ? (row.skills || row.Skills).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        bio: row.bio || row.Bio || '',
        resume_summary: row.resume_summary || row['Resume Summary'] || '',
        resume_experience: row.resume_experience || row['Resume Experience'] || '',
        resume_education: row.resume_education || row['Resume Education'] || '',
        resume_achievements: row.resume_achievements || row['Resume Achievements'] || '',
        source: 'excel' as const,
        uploaded_by: req.userId,
      }))
      .filter((c) => c.name && c.email);

    if (candidates.length === 0) {
      res.status(400).json({ error: 'No valid rows found. Ensure "name" and "email" columns exist.' });
      return;
    }

    const saved = await CandidateData.insertMany(candidates);
    res.status(201).json({ count: saved.length, records: saved });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to parse Excel file' });
  }
}
