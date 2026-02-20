import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import User from "../models/User.model.js";
import JobData from "../models/JobData.model.js";
import CandidateData from "../models/CandidateData.model.js";
import mongoose from "mongoose";

// ── GET /api/admin/users — list all non-admin users ──────
export async function listUsers(_req: AuthRequest, res: Response) {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// ── GET /api/admin/stats — aggregate stats for all users ─
export async function adminStats(_req: AuthRequest, res: Response) {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .lean();

    const userStats = await Promise.all(
      users.map(async (user) => {
        const userId = user._id;
        const isJobUploader = user.role === "job_uploader";
        const Model = isJobUploader ? JobData : CandidateData;

        const filter = { uploaded_by: userId };

        const [total, paste, manual, excel, duplicates, byMonth] =
          await Promise.all([
            Model.countDocuments(filter),
            Model.countDocuments({ ...filter, source: "paste" }),
            Model.countDocuments({ ...filter, source: "manual" }),
            Model.countDocuments({ ...filter, source: "excel" }),
            Model.countDocuments({ ...filter, is_duplicate: true }),
            Model.aggregate([
              {
                $match: {
                  uploaded_by: new mongoose.Types.ObjectId(String(userId)),
                },
              },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m", date: "$createdAt" },
                  },
                  count: { $sum: 1 },
                  duplicates: {
                    $sum: { $cond: ["$is_duplicate", 1, 0] },
                  },
                },
              },
              { $sort: { _id: -1 } },
              { $limit: 12 },
            ]),
          ]);

        return {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
          stats: {
            total,
            duplicates,
            unique: total - duplicates,
            bySource: { paste, manual, excel },
            byMonth: byMonth.map((m) => ({
              month: m._id,
              count: m.count,
              duplicates: m.duplicates,
            })),
          },
        };
      }),
    );

    // Platform-wide totals
    const totals = userStats.reduce(
      (acc, u) => ({
        totalRecords: acc.totalRecords + u.stats.total,
        totalDuplicates: acc.totalDuplicates + u.stats.duplicates,
        totalUnique: acc.totalUnique + u.stats.unique,
        totalUsers: acc.totalUsers + 1,
      }),
      { totalRecords: 0, totalDuplicates: 0, totalUnique: 0, totalUsers: 0 },
    );

    res.json({ totals, users: userStats });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
}
