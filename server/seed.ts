import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'matchdb_data_collection';

/* ── Inline schemas (so seed.ts works standalone with tsx) ── */
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['candidate_uploader', 'job_uploader'] },
  },
  { timestamps: true },
);

const CandidateDataSchema = new mongoose.Schema(
  {
    name: String, email: String, phone: String, location: String,
    current_company: String, current_role: String, preferred_job_type: String,
    expected_hourly_rate: Number, experience_years: Number, skills: [String],
    bio: String, resume_summary: String, resume_experience: String,
    resume_education: String, resume_achievements: String,
    source: String, uploaded_by: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);

const JobDataSchema = new mongoose.Schema(
  {
    title: String, description: String, company: String, location: String,
    job_type: String, job_subtype: String, work_mode: String,
    salary_min: Number, salary_max: Number, pay_per_hour: Number,
    skills_required: [String], experience_required: Number,
    recruiter_name: String, recruiter_email: String, recruiter_phone: String,
    source: String, uploaded_by: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);

const User = mongoose.model('User', UserSchema);
const CandidateData = mongoose.model('CandidateData', CandidateDataSchema);
const JobData = mongoose.model('JobData', JobDataSchema);

/* ── Seed ─────────────────────────────────────────────────── */
async function seed() {
  await mongoose.connect(`${MONGO_URI}/${MONGO_DB_NAME}`);
  console.log('✓ Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany({}), CandidateData.deleteMany({}), JobData.deleteMany({})]);
  console.log('✓ Cleared existing data');

  // ── Users ──────────────────────────────────────────────
  const hash = await bcrypt.hash('Upload1!', 10);

  const candidateUser = await User.create({
    email: 'candidate_uploader@matchdb.com',
    password: hash,
    name: 'Sarah Mitchell',
    role: 'candidate_uploader',
  });

  const jobUser = await User.create({
    email: 'job_uploader@matchdb.com',
    password: hash,
    name: 'James Parker',
    role: 'job_uploader',
  });

  console.log('✓ Users created');
  console.log('  • candidate_uploader@matchdb.com / Upload1!');
  console.log('  • job_uploader@matchdb.com       / Upload1!');

  // ── Candidate Records ──────────────────────────────────
  const candidates = [
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      phone: '555-101-2020',
      location: 'San Francisco, CA',
      current_company: 'Salesforce',
      current_role: 'Senior Full Stack Developer',
      preferred_job_type: 'full_time',
      expected_hourly_rate: 85,
      experience_years: 6,
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'GraphQL', 'Docker'],
      bio: 'Passionate full-stack developer with expertise in building scalable SaaS applications.',
      resume_summary: 'Senior Full Stack Developer with 6+ years of experience building enterprise-grade web applications. Proficient in React, Node.js, and cloud-native architectures.',
      resume_experience: 'Senior Developer at Salesforce (2021-present): Led the redesign of the Lightning Web Components platform.\nFull Stack Developer at Twilio (2019-2021): Built real-time communication dashboards using React and WebSockets.',
      resume_education: 'M.S. Computer Science, Stanford University, 2019\nB.Tech Computer Science, IIT Delhi, 2017',
      resume_achievements: 'Patent holder for real-time data synchronization algorithm.\nSalesforce Trailblazer of the Year 2023.',
      source: 'manual',
      uploaded_by: candidateUser._id,
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus.j@outlook.com',
      phone: '555-202-3030',
      location: 'Austin, TX',
      current_company: 'DataBricks',
      current_role: 'Data Engineer',
      preferred_job_type: 'contract',
      expected_hourly_rate: 95,
      experience_years: 4,
      skills: ['Python', 'Apache Spark', 'AWS', 'Kafka', 'SQL', 'Airflow', 'Terraform'],
      bio: 'Data engineer specializing in large-scale data pipelines and real-time analytics infrastructure.',
      resume_summary: 'Data Engineer with 4 years of experience in building and maintaining petabyte-scale data pipelines on AWS and Databricks.',
      resume_experience: 'Data Engineer at Databricks (2022-present): Architected ETL pipelines processing 2TB+ daily.\nJunior Data Engineer at Netflix (2020-2022): Built content recommendation data infrastructure.',
      resume_education: 'B.S. Data Science, University of Texas at Austin, 2020',
      resume_achievements: 'Reduced data pipeline latency by 70% through Spark optimization.\nAWS Certified Data Analytics Specialty.',
      source: 'paste',
      uploaded_by: candidateUser._id,
    },
    {
      name: 'Emily Chen',
      email: 'emily.chen@proton.me',
      phone: '555-303-4040',
      location: 'Seattle, WA',
      current_company: 'Freelance',
      current_role: 'Frontend Developer',
      preferred_job_type: 'contract',
      expected_hourly_rate: 65,
      experience_years: 3,
      skills: ['React', 'Vue.js', 'Angular', 'Tailwind CSS', 'TypeScript', 'Figma', 'Storybook'],
      bio: 'Creative frontend developer with a designer\'s eye. I love building beautiful, accessible user interfaces.',
      resume_summary: 'Frontend Developer with 3 years of experience across React, Vue, and Angular ecosystems. Strong design sensibility with Figma proficiency.',
      resume_experience: 'Freelance Frontend Developer (2023-present): Built 8+ client projects including e-commerce, SaaS dashboards, and web apps.\nUI Developer at Zillow (2021-2023): Implemented responsive property listing pages used by 10M+ monthly visitors.',
      resume_education: 'B.A. Interactive Media, University of Washington, 2021',
      resume_achievements: 'Winner of HackTheNorth 2022 — Best UI/UX category.\nOpen-source Tailwind component library with 2k+ GitHub stars.',
      source: 'manual',
      uploaded_by: candidateUser._id,
    },
    {
      name: 'David Kim',
      email: 'dkim.devops@gmail.com',
      phone: '555-404-5050',
      location: 'Denver, CO',
      current_company: 'HashiCorp',
      current_role: 'Senior DevOps Engineer',
      preferred_job_type: 'full_time',
      expected_hourly_rate: 110,
      experience_years: 8,
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Python', 'Linux', 'Ansible', 'Prometheus'],
      bio: 'Infrastructure as code advocate with deep expertise in cloud-native DevOps tooling.',
      resume_summary: 'Senior DevOps Engineer with 8 years of experience managing large-scale cloud infrastructure for Fortune 500 companies.',
      resume_experience: 'Senior DevOps Engineer at HashiCorp (2021-present): Core contributor to Terraform enterprise features.\nDevOps Lead at Capital One (2018-2021): Managed cloud migration for 50+ microservices.\nSystems Engineer at Lockheed Martin (2016-2018): Linux systems administration for mission-critical systems.',
      resume_education: 'B.S. Computer Engineering, Georgia Tech, 2016',
      resume_achievements: 'HashiCorp Certified Terraform Associate + Vault Associate.\nLed zero-downtime migration of 200+ services to Kubernetes.',
      source: 'excel',
      uploaded_by: candidateUser._id,
    },
    {
      name: 'Aisha Rahman',
      email: 'aisha.ml@techmail.io',
      phone: '555-505-6060',
      location: 'New York, NY',
      current_company: 'Meta',
      current_role: 'ML Engineer',
      preferred_job_type: 'full_time',
      expected_hourly_rate: 105,
      experience_years: 5,
      skills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision', 'MLOps', 'SQL'],
      bio: 'Machine learning engineer focused on NLP and recommendation systems at scale.',
      resume_summary: 'ML Engineer with 5 years of experience in NLP, recommendation systems, and production ML pipelines. Currently at Meta working on content ranking algorithms.',
      resume_experience: 'ML Engineer at Meta (2022-present): Improved content ranking model accuracy by 15%, impacting 2B+ daily recommendations.\nML Engineer at Spotify (2020-2022): Built podcast recommendation engine using collaborative filtering and transformer models.',
      resume_education: 'M.S. Machine Learning, Carnegie Mellon University, 2020\nB.S. Mathematics, NYU, 2018',
      resume_achievements: 'Published 3 papers at NeurIPS and ICML.\nPatent pending on efficient attention mechanism for long-form content.',
      source: 'paste',
      uploaded_by: candidateUser._id,
    },
    {
      name: 'Carlos Rivera',
      email: 'carlos.r@devhub.com',
      phone: '555-606-7070',
      location: 'Miami, FL',
      current_company: 'Shopify',
      current_role: 'Backend Engineer',
      preferred_job_type: 'contract',
      expected_hourly_rate: 80,
      experience_years: 4,
      skills: ['Ruby', 'Rails', 'Go', 'PostgreSQL', 'Redis', 'GraphQL', 'Docker', 'AWS'],
      bio: 'Backend engineer with a knack for building high-performance APIs and distributed systems.',
      resume_summary: 'Backend Engineer with 4 years of experience in Ruby on Rails and Go. Skilled in database optimization and distributed system design.',
      resume_experience: 'Backend Engineer at Shopify (2022-present): Built checkout optimization service handling 100k+ RPM.\nSoftware Engineer at Uber (2020-2022): Developed rider-matching backend microservices in Go.',
      resume_education: 'B.S. Computer Science, Florida International University, 2020',
      resume_achievements: 'Reduced Shopify checkout latency by 40% through Redis caching strategy.\nOpen-source GraphQL middleware with 1.5k+ stars.',
      source: 'manual',
      uploaded_by: candidateUser._id,
    },
    {
      name: 'Yuki Tanaka',
      email: 'yuki.t@codecraft.jp',
      phone: '555-707-8080',
      location: 'Portland, OR',
      current_company: 'Stripe',
      current_role: 'Security Engineer',
      preferred_job_type: 'full_time',
      expected_hourly_rate: 100,
      experience_years: 7,
      skills: ['Python', 'Go', 'AWS', 'Penetration Testing', 'OAuth', 'Cryptography', 'SOC2', 'Kubernetes'],
      bio: 'Security-focused engineer with deep expertise in application security, compliance, and secure infrastructure.',
      resume_summary: 'Security Engineer with 7 years of experience in application security, infrastructure hardening, and compliance. Currently securing payments infrastructure at Stripe.',
      resume_experience: 'Security Engineer at Stripe (2021-present): Led SOC2 Type II compliance initiative.\nSr. Security Analyst at CrowdStrike (2018-2021): Built threat detection pipelines for enterprise clients.',
      resume_education: 'M.S. Cybersecurity, MIT, 2018\nB.S. Computer Science, UC Berkeley, 2016',
      resume_achievements: 'OSCP and CISSP certified.\nIdentified and responsibly disclosed 12 CVEs in open-source software.',
      source: 'excel',
      uploaded_by: candidateUser._id,
    },
  ];

  await CandidateData.insertMany(candidates);
  console.log(`✓ ${candidates.length} candidate records seeded`);

  // ── Job Records ────────────────────────────────────────
  const jobs = [
    {
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer to lead our frontend architecture. You will work closely with design and backend teams to build a next-generation SaaS dashboard. Must have strong TypeScript skills and experience with state management libraries.',
      company: 'Innovation Labs',
      location: 'San Francisco, CA',
      job_type: 'full_time',
      job_subtype: 'w2',
      work_mode: 'hybrid',
      salary_min: 130000,
      salary_max: 165000,
      skills_required: ['React', 'TypeScript', 'Redux', 'GraphQL', 'CSS', 'Jest', 'Webpack'],
      experience_required: 5,
      recruiter_name: 'Emily Watson',
      recruiter_email: 'emily@innovationlabs.com',
      recruiter_phone: '555-111-2222',
      source: 'manual',
      uploaded_by: jobUser._id,
    },
    {
      title: 'Cloud Solutions Architect',
      description: 'Design and implement cloud infrastructure solutions for enterprise clients. Lead cloud migration projects, define architecture patterns, and mentor junior engineers. Deep AWS expertise required with multi-cloud experience preferred.',
      company: 'CloudFirst Inc',
      location: 'Remote',
      job_type: 'contract',
      job_subtype: 'c2c',
      work_mode: 'remote',
      pay_per_hour: 95,
      skills_required: ['AWS', 'Azure', 'Terraform', 'Docker', 'Kubernetes', 'Python', 'CloudFormation'],
      experience_required: 8,
      recruiter_name: 'Michael Torres',
      recruiter_email: 'mtorres@cloudfirst.io',
      recruiter_phone: '555-333-4444',
      source: 'paste',
      uploaded_by: jobUser._id,
    },
    {
      title: 'Data Analyst — Business Intelligence',
      description: 'Join our analytics team to transform raw data into actionable business insights. Build dashboards, write SQL queries, and present findings to stakeholders. Experience with Tableau or Power BI strongly preferred.',
      company: 'DataDriven Co',
      location: 'New York, NY',
      job_type: 'full_time',
      job_subtype: 'salary',
      work_mode: 'onsite',
      salary_min: 95000,
      salary_max: 125000,
      skills_required: ['SQL', 'Python', 'Tableau', 'Excel', 'Statistics', 'Power BI'],
      experience_required: 3,
      recruiter_name: 'Lisa Park',
      recruiter_email: 'lisa.park@datadriven.co',
      recruiter_phone: '555-555-6666',
      source: 'manual',
      uploaded_by: jobUser._id,
    },
    {
      title: 'Mobile Developer (iOS + Android)',
      description: 'Build and maintain cross-platform mobile applications using React Native. Collaborate with UX designers to implement pixel-perfect interfaces. Experience with native modules and app store deployment required.',
      company: 'MobileFirst',
      location: 'Austin, TX',
      job_type: 'contract',
      job_subtype: 'c2h',
      work_mode: 'hybrid',
      pay_per_hour: 75,
      skills_required: ['React Native', 'TypeScript', 'iOS', 'Android', 'Redux', 'Firebase'],
      experience_required: 4,
      recruiter_name: 'Ryan O\'Brien',
      recruiter_email: 'ryan@mobilefirst.dev',
      recruiter_phone: '555-777-8888',
      source: 'excel',
      uploaded_by: jobUser._id,
    },
    {
      title: 'Backend Engineer — Platform Team',
      description: 'Join our platform team building core microservices that power the entire product suite. You will design APIs, optimize database performance, and ensure system reliability at scale. Strong distributed systems knowledge required.',
      company: 'ScaleUp Tech',
      location: 'Seattle, WA',
      job_type: 'full_time',
      job_subtype: 'w2',
      work_mode: 'hybrid',
      salary_min: 145000,
      salary_max: 180000,
      skills_required: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'gRPC', 'Docker', 'Kubernetes'],
      experience_required: 5,
      recruiter_name: 'Amanda Lee',
      recruiter_email: 'amanda@scaleuptech.io',
      recruiter_phone: '555-999-0000',
      source: 'manual',
      uploaded_by: jobUser._id,
    },
    {
      title: 'ML Engineer — NLP Team',
      description: 'Work on cutting-edge NLP models for our AI-powered search platform. Fine-tune large language models, build evaluation pipelines, and deploy models to production. PhD preferred but not required.',
      company: 'Cognify AI',
      location: 'Boston, MA',
      job_type: 'full_time',
      job_subtype: 'salary',
      work_mode: 'hybrid',
      salary_min: 160000,
      salary_max: 210000,
      skills_required: ['Python', 'PyTorch', 'Transformers', 'NLP', 'MLOps', 'CUDA', 'Docker'],
      experience_required: 4,
      recruiter_name: 'Dr. Sanjay Patel',
      recruiter_email: 'recruiting@cognify.ai',
      recruiter_phone: '555-121-3434',
      source: 'paste',
      uploaded_by: jobUser._id,
    },
    {
      title: 'DevOps / SRE Engineer',
      description: 'Ensure platform reliability and build CI/CD infrastructure for a fast-growing fintech startup. On-call rotation required. Experience with incident management and SLO-driven operations preferred.',
      company: 'PayStream',
      location: 'Chicago, IL',
      job_type: 'contract',
      job_subtype: '1099',
      work_mode: 'remote',
      pay_per_hour: 85,
      skills_required: ['AWS', 'Terraform', 'Kubernetes', 'Prometheus', 'Grafana', 'Python', 'Linux'],
      experience_required: 6,
      recruiter_name: 'Karen Wu',
      recruiter_email: 'karen@paystream.money',
      recruiter_phone: '555-565-7878',
      source: 'excel',
      uploaded_by: jobUser._id,
    },
    {
      title: 'Full Stack Developer',
      description: 'End-to-end development on our health-tech platform. Build patient-facing features with React and Node.js. HIPAA compliance knowledge is a strong plus. Agile team with 2-week sprints.',
      company: 'HealthBridge',
      location: 'Denver, CO',
      job_type: 'full_time',
      job_subtype: 'direct_hire',
      work_mode: 'onsite',
      salary_min: 110000,
      salary_max: 140000,
      skills_required: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'HIPAA'],
      experience_required: 3,
      recruiter_name: 'Dr. Olivia Green',
      recruiter_email: 'jobs@healthbridge.care',
      recruiter_phone: '555-234-5678',
      source: 'manual',
      uploaded_by: jobUser._id,
    },
  ];

  await JobData.insertMany(jobs);
  console.log(`✓ ${jobs.length} job records seeded`);

  console.log('\n✅ Seed complete!\n');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
