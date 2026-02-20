import mongoose, { Schema, Document } from "mongoose";

export interface ICandidateData extends Document {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  current_company?: string;
  current_role?: string;
  preferred_job_type?: string;
  expected_hourly_rate?: number;
  experience_years?: number;
  skills: string[];
  bio?: string;
  resume_summary?: string;
  resume_experience?: string;
  resume_education?: string;
  resume_achievements?: string;
  is_duplicate: boolean;
  source: "paste" | "manual" | "excel";
  uploaded_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateDataSchema = new Schema<ICandidateData>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    current_company: { type: String, trim: true },
    current_role: { type: String, trim: true },
    preferred_job_type: {
      type: String,
      enum: ["full_time", "part_time", "contract", ""],
    },
    expected_hourly_rate: Number,
    experience_years: Number,
    skills: { type: [String], default: [] },
    bio: String,
    resume_summary: String,
    resume_experience: String,
    resume_education: String,
    resume_achievements: String,
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

export default mongoose.model<ICandidateData>(
  "CandidateData",
  CandidateDataSchema,
);
