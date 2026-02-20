import mongoose, { Schema, Document } from "mongoose";

export interface IJobData extends Document {
  title: string;
  description: string;
  company: string;
  location: string;
  job_type: string;
  job_subtype?: string;
  work_mode?: string;
  salary_min?: number;
  salary_max?: number;
  pay_per_hour?: number;
  skills_required: string[];
  experience_required?: number;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  is_duplicate: boolean;
  source: "paste" | "manual" | "excel";
  uploaded_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobDataSchema = new Schema<IJobData>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    job_type: {
      type: String,
      required: true,
      enum: ["full_time", "part_time", "contract"],
    },
    job_subtype: {
      type: String,
      enum: ["c2c", "c2h", "w2", "1099", "direct_hire", "salary", ""],
    },
    work_mode: { type: String, enum: ["remote", "onsite", "hybrid", ""] },
    salary_min: Number,
    salary_max: Number,
    pay_per_hour: Number,
    skills_required: { type: [String], default: [] },
    experience_required: Number,
    recruiter_name: { type: String, trim: true },
    recruiter_email: { type: String, trim: true, lowercase: true },
    recruiter_phone: { type: String, trim: true },
    is_duplicate: { type: Boolean, default: false },
    source: {
      type: String,
      required: true,
      enum: ["paste", "manual", "excel"],
    },
    uploaded_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Compound index for fast duplicate detection (case-insensitive)
JobDataSchema.index(
  { title: 1, company: 1, location: 1, uploaded_by: 1 },
  { name: "unique_job_per_user" },
);

export default mongoose.model<IJobData>("JobData", JobDataSchema);
