export interface CandidateData {
  _id?: string;
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
  source?: 'paste' | 'manual' | 'excel';
  createdAt?: string;
}

export interface JobData {
  _id?: string;
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
  source?: 'paste' | 'manual' | 'excel';
  createdAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate_uploader' | 'job_uploader';
}

export interface Stats {
  total: number;
  bySource: { paste: number; manual: number; excel: number };
}
