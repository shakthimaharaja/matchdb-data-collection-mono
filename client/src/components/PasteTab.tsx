import React, { useState } from "react";
import api from "../services/api";
import CandidateForm from "./CandidateForm";
import JobForm from "./JobForm";

interface Props {
  type: "candidate" | "job";
  onSave: (data: any) => Promise<void>;
}

const CANDIDATE_TEMPLATE = `Name: John Doe
Email: john.doe@email.com
Phone: 555-123-4567
Location: New York, NY
Current Company: Tech Corp
Current Role: Senior Developer
Preferred Job Type: full_time
Experience Years: 5
Expected Hourly Rate: 75
Skills: React, Node.js, TypeScript, MongoDB, AWS
Bio: Experienced full-stack developer with a passion for building scalable applications.
Resume Summary: Full-stack developer with 5+ years of experience building enterprise-grade web apps.
Resume Experience: Senior Developer at Tech Corp (2020-present) — Led a team of 5 engineers.
Resume Education: BS Computer Science, MIT, 2018
Resume Achievements: Led migration to microservices, reducing deploy time by 60%`;

const JOB_TEMPLATE = `💥 Sr. Java Developer – Onsite
📍 Des Moines, IA (Local Only – DL Required)
⏳ 6 Months CTH | 🔗 LinkedIn Mandatory

Must Have:
Expert Java Backend, Spring Boot, RabbitMQ (or similar)
Financial Services experience, Maven → Gradle migration

Plus: Angular, Production Support

Interview: MS Teams (PV) + 1–2 Client Video Rounds
Resumes: 8–12 bullets max per job
Onsite role – relocation required if needed.`;

function parseCandidateText(text: string) {
  const get = (key: string): string => {
    const regex = new RegExp(`^${key}\\s*[:=]\\s*(.+)$`, "im");
    return regex.exec(text)?.[1]?.trim() || "";
  };
  return {
    name: get("Name"),
    email: get("Email"),
    phone: get("Phone"),
    location: get("Location"),
    current_company: get("Current Company") || get("Company"),
    current_role: get("Current Role") || get("Role"),
    preferred_job_type: (get("Preferred Job Type") || get("Job Type"))
      .toLowerCase()
      .replace(/\s+/g, "_"),
    expected_hourly_rate:
      parseFloat(get("Expected Hourly Rate") || get("Hourly Rate")) ||
      undefined,
    experience_years:
      parseFloat(get("Experience Years") || get("Experience")) || undefined,
    skills: (get("Skills") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    bio: get("Bio"),
    resume_summary: get("Resume Summary") || get("Summary"),
    resume_experience: get("Resume Experience") || get("Experience Details"),
    resume_education: get("Resume Education") || get("Education"),
    resume_achievements: get("Resume Achievements") || get("Achievements"),
  };
}

function parseJobText(text: string) {
  // ── Pre-processing: strip LinkedIn hashtags & noise ──────
  const cleaned = text
    .replace(/hashtag#\w+/gi, "")       // hashtag#acunor
    .replace(/#\w+/g, "")               // #hiring
    .replace(/\bhashtag\b/gi, "")
    .replace(/\r/g, "");

  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  const full = cleaned;

  // ── Helpers ──────────────────────────────────────────────
  const stripEmojis = (s: string) =>
    s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{2702}-\u{27B0}]/gu, "").trim();

  const matchAny = (pattern: RegExp): string =>
    pattern.exec(full)?.[1]?.trim() || "";

  // ── Title ──────────────────────────────────────────────────
  // Priority 1: "Role:" or "Role 1:" prefix
  // Priority 2: "is hiring for [TITLE]" pattern
  // Priority 3: first line (emoji-prefixed)
  let title = "";
  const roleMatch = full.match(/^\s*role(?:\s*\d)?\s*[:=]\s*(.+)$/im);
  const hiringMatch = full.match(/(?:is\s+)?hiring\s+for\s+(.+?)(?:\n|$)/i);
  if (roleMatch) {
    title = stripEmojis(roleMatch[1])
      .replace(/\s*[-–—]\s*(onsite|remote|hybrid|wfh)\s*$/i, "")
      .replace(/\s*\|.*$/, "")
      .trim();
  } else if (hiringMatch) {
    title = stripEmojis(hiringMatch[1])
      .replace(/\s*[-–—]\s*(onsite|remote|hybrid|wfh)\s*$/i, "")
      .replace(/\s*\|.*$/, "")
      .trim();
  } else if (lines.length > 0) {
    title = stripEmojis(lines[0])
      .replace(/^[-–—:]\s*/, "")
      .replace(/\s*[-–—]\s*(onsite|remote|hybrid|wfh)\s*$/i, "")
      .replace(/\s*\|.*$/, "")
      .replace(/^(?:hello|hi|hey)[,!.]?\s*(?:accepting\s+resumes?\s+(?:for\s+)?(?:below\s+)?role)?/i, "")
      .trim();
    // if first line was just greeting, try second line
    if (!title && lines.length > 1) {
      title = stripEmojis(lines[1]).replace(/^[-–—:]\s*/, "").trim();
    }
  }

  // ── Location ─ 📍 emoji, "Location:" prefix, or City, ST pattern ──
  let location =
    matchAny(/📍\s*(?:location\s*[:=]?\s*)?([^\n|]+)/i) ||
    matchAny(/(?:location|loc)\s*[:=]\s*([^\n|]+)/i);
  // strip parentheticals like "(Local Only – DL Required)" but preserve "(3 days Onsite)"
  location = location.replace(/\s*\([^)]*(?:local|only|required|dl|drivers?)\b[^)]*\)/gi, "").trim();
  // strip trailing work-mode hints from location
  location = location.replace(/\s*\(\d+\s*days?\s*(?:onsite|remote|hybrid|in[\s-]?office)\)/i, "").trim();

  // ── Work Mode ──────────────────────────────────────────────
  let work_mode = "";
  if (/\bhybrid\s*(?:role)?\b/i.test(full) || /\(\d+\s*days?\s*onsite\)/i.test(full)) work_mode = "hybrid";
  else if (/\b(onsite|on[\s-]?site|in[\s-]?office|in[\s-]?person|onsite\s+interview)\b/i.test(full)) work_mode = "onsite";
  else if (/\b(remote|wfh|work\s*from\s*home|telecommute)\b/i.test(full)) work_mode = "remote";

  // ── Job Type & Sub Type ────────────────────────────────────
  let job_type = "";
  let job_subtype = "";

  // sub-type detection (order matters — check before generic type)
  if (/\b(c2c|corp[\s-]?to[\s-]?corp)\b/i.test(full)) job_subtype = "c2c";
  else if (/\b(cth|c2h|contract[\s-]?to[\s-]?hire)\b/i.test(full)) job_subtype = "c2h";
  else if (/\bw2\b/i.test(full)) job_subtype = "w2";
  else if (/\b1099\b/i.test(full)) job_subtype = "1099";
  else if (/\b(direct[\s-]?(?:hire|client))\b/i.test(full)) job_subtype = "direct_hire";
  else if (/\bsalary\b/i.test(full)) job_subtype = "salary";

  // type detection
  if (/\b(full[\s-]?time|fte|permanent|perm)\b/i.test(full)) job_type = "full_time";
  else if (/\b(part[\s-]?time)\b/i.test(full)) job_type = "part_time";
  else if (/\b(contract|cth|c2c|c2h|w2|1099|consultant)\b/i.test(full)) job_type = "contract";

  // ── Duration (bonus context for description) ───────────────
  const durationMatch = full.match(/(\d+)\s*(?:\+\s*)?(?:months?|mos?)\b/i);
  const duration = durationMatch ? durationMatch[0].trim() : "";

  // ── Pay / Salary ───────────────────────────────────────────
  let salary_min: number | undefined;
  let salary_max: number | undefined;
  let pay_per_hour: number | undefined;

  // "$XX/hr" or "$XX per hour" or "$XX/hour"
  const hourlyMatch = full.match(/\$\s*([\d,.]+)\s*(?:\/|\s*per\s*)\s*h(?:ou)?r/i);
  if (hourlyMatch) pay_per_hour = parseFloat(hourlyMatch[1].replace(/,/g, ""));

  // "$XXk - $YYk" or "$XXX,XXX - $YYY,YYY"
  const rangeMatch = full.match(/\$\s*([\d,.]+)\s*k?\s*[-–—to]+\s*\$?\s*([\d,.]+)\s*k?/i);
  if (rangeMatch) {
    let lo = parseFloat(rangeMatch[1].replace(/,/g, ""));
    let hi = parseFloat(rangeMatch[2].replace(/,/g, ""));
    if (lo < 1000) lo *= 1000; // "120k" → 120000
    if (hi < 1000) hi *= 1000;
    salary_min = lo;
    salary_max = hi;
  }

  // ── Skills ─────────────────────────────────────────────────
  const NOISE = new Set([
    "must", "have", "required", "plus", "nice", "to", "good", "prefer",
    "preferred", "experience", "strong", "expert", "proficient", "knowledge",
    "and", "or", "with", "in", "of", "a", "an", "the", "for", "similar",
    "looking", "years", "year", "yrs", "yr", "mandatory", "local", "only",
    "onsite", "remote", "hybrid", "interview", "resumes", "resume",
    "relocation", "needed", "if", "not", "is", "are", "we", "will",
    "required", "minimum", "max", "min", "also", "ideally", "should",
  ]);

  const KNOWN_TECH: Record<string, string> = {
    "java": "Java", "spring boot": "Spring Boot", "spring": "Spring",
    "springboot": "Spring Boot", "react": "React", "reactjs": "React",
    "angular": "Angular", "vue": "Vue.js", "vuejs": "Vue.js",
    "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js",
    "typescript": "TypeScript", "javascript": "JavaScript", "js": "JavaScript",
    "ts": "TypeScript", "python": "Python", "django": "Django", "flask": "Flask",
    "go": "Go", "golang": "Go", "rust": "Rust", "c#": "C#", "c++": "C++",
    ".net": ".NET", "dotnet": ".NET", "asp.net": "ASP.NET",
    "sql": "SQL", "mysql": "MySQL", "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL", "mongodb": "MongoDB", "mongo": "MongoDB",
    "redis": "Redis", "elasticsearch": "Elasticsearch",
    "rabbitmq": "RabbitMQ", "kafka": "Kafka", "activemq": "ActiveMQ",
    "aws": "AWS", "azure": "Azure", "gcp": "GCP",
    "docker": "Docker", "kubernetes": "Kubernetes", "k8s": "Kubernetes",
    "terraform": "Terraform", "ansible": "Ansible", "jenkins": "Jenkins",
    "ci/cd": "CI/CD", "cicd": "CI/CD", "git": "Git",
    "maven": "Maven", "gradle": "Gradle", "npm": "npm",
    "graphql": "GraphQL", "rest": "REST", "restful": "REST",
    "microservices": "Microservices", "sass": "SASS", "css": "CSS",
    "html": "HTML", "tailwind": "Tailwind CSS",
    "redux": "Redux", "nextjs": "Next.js", "next.js": "Next.js",
    "express": "Express", "nestjs": "NestJS", "fastapi": "FastAPI",
    "hibernate": "Hibernate", "jpa": "JPA", "oracle": "Oracle",
    "dynamodb": "DynamoDB", "cassandra": "Cassandra",
    "snowflake": "Snowflake", "databricks": "Databricks",
    "spark": "Spark", "hadoop": "Hadoop", "airflow": "Airflow",
    "tableau": "Tableau", "power bi": "Power BI", "powerbi": "Power BI",
    "salesforce": "Salesforce", "sap": "SAP",
    "scala": "Scala", "kotlin": "Kotlin", "swift": "Swift",
    "flutter": "Flutter", "react native": "React Native",
    "cypress": "Cypress", "jest": "Jest", "junit": "JUnit", "selenium": "Selenium",
    "agile": "Agile", "scrum": "Scrum", "jira": "Jira",
    "production support": "Production Support",
    "financial services": "Financial Services",
  };

  const skills_required: string[] = [];
  const seen = new Set<string>();

  // Strategy 1: match known tech terms from the dictionary
  const lowerFull = full.toLowerCase();
  for (const [pattern, canonical] of Object.entries(KNOWN_TECH)) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?:^|[\\s,;|/()•\\-–+])${escaped}(?:[\\s,;|/()•\\-–+]|$)`, "i").test(lowerFull)) {
      if (!seen.has(canonical)) {
        seen.add(canonical);
        skills_required.push(canonical);
      }
    }
  }

  // Strategy 2: extract from structured skill blocks (multi-line, +/comma/bullet separated)
  const skillBlockPatterns = [
    /(?:must\s*have|required|mandatory\s*skills?|skills?\s*required|technologies|tech\s*stack|key\s*skills|knowledge\/skills|knowledge\s*skills)\s*[:]?\s*\n?([\s\S]*?)(?=\n\s*\n|\n(?:[A-Z][a-z]+\s*(?:[:.]|$))|$)/gim,
  ];
  for (const regex of skillBlockPatterns) {
    let m;
    while ((m = regex.exec(full)) !== null) {
      const content = m[1];
      // split on comma, semicolon, bullet, plus sign, newline, pipe
      const tokens = content.split(/[,;•|\n]+/).flatMap((t) =>
        t.split(/\s*\+\s*/).map((s) => s.trim())
      );
      for (const token of tokens) {
        const clean = token
          .replace(/^\s*[-–—*]\s*/, "")
          .replace(/\(.*?\)/g, "")
          .replace(/[→←]/g, "")
          .trim();
        if (clean.length < 2 || clean.length > 60) continue;
        const words = clean.toLowerCase().split(/\s+/);
        if (words.every((w) => NOISE.has(w))) continue;
        const lc = clean.toLowerCase();
        if (KNOWN_TECH[lc] && !seen.has(KNOWN_TECH[lc])) {
          seen.add(KNOWN_TECH[lc]);
          skills_required.push(KNOWN_TECH[lc]);
        }
      }
    }
  }

  // Strategy 3: "Plus:" / "Nice to Have:" / "Preferred/Recommended:" → also capture as skills
  const plusBlocks = full.match(
    /(?:plus|nice\s*to\s*have|good\s*to\s*have|preferred(?:\/\s*recommended)?|bonus)\s*[:]?\s*\n?([\s\S]*?)(?=\n\s*\n|\n(?:[A-Z][a-z]+\s*[:.])|$)/gim
  );
  if (plusBlocks) {
    for (const block of plusBlocks) {
      const content = block.replace(/^[^:\n]+[:]\s*/, "");
      const tokens = content.split(/[,;•|\n]+/).flatMap((t) =>
        t.split(/\s*\+\s*/).map((s) => s.trim())
      );
      for (const token of tokens) {
        const clean = token.replace(/^\s*[-–—*]\s*/, "").trim();
        const lc = clean.toLowerCase();
        if (KNOWN_TECH[lc] && !seen.has(KNOWN_TECH[lc])) {
          seen.add(KNOWN_TECH[lc]);
          skills_required.push(KNOWN_TECH[lc]);
        }
      }
    }
  }

  // ── Experience ─────────────────────────────────────────────
  let experience_required: number | undefined;
  // Match: "Exp:10+", "10+ Years", "Experience: 7+ Years", "💼 Experience: 7+ Years"
  const expMatch = full.match(
    /(?:exp(?:erience)?\s*[:=]?\s*)(\d+)\s*\+?\s*(?:years?|yrs?|yr)?/i
  ) || full.match(
    /(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:industry\s*)?(?:experience|exp)?/i
  );
  if (expMatch) experience_required = parseInt(expMatch[1], 10);

  // ── Company ─ also check "is hiring for" patterns ──────────
  let company =
    matchAny(/(?:company|client|employer)\s*[:=]\s*([^\n|]+)/i);
  if (!company) {
    // "Bhanu Sri is hiring for ..." → company = "Bhanu Sri"
    const hiringCoMatch = full.match(/^\s*([A-Z][\w\s]+?)\s+is\s+hiring/im);
    if (hiringCoMatch) company = hiringCoMatch[1].trim();
  }

  // ── Recruiter ──────────────────────────────────────────────
  const recruiter_name =
    matchAny(/(?:recruiter|contact|poc|submitted?\s*by)\s*[:=]\s*([^\n|,]+)/i);
  // standalone email on its own line
  const recruiter_email =
    matchAny(/(?:recruiter\s*email|email)\s*[:=]\s*([\w.+-]+@[\w.-]+)/i) ||
    matchAny(/^\s*([\w.+-]+@[\w.-]+)\s*$/m);
  const recruiter_phone =
    matchAny(/(?:recruiter\s*phone|phone|cell|mobile)\s*[:=]\s*([\d\s()+-]{7,})/i);

  // ── Description ─ compile the full post as-is ──────────────
  const descParts: string[] = [];
  if (duration) descParts.push(`Duration: ${duration}`);
  // collect all lines that aren't the title or location
  const descLines = lines.slice(1).filter(
    (l) => !l.startsWith("📍") && !/^(?:recruiter|contact|poc|email|phone)\s*[:=]/i.test(stripEmojis(l))
  );
  if (descLines.length > 0) descParts.push(descLines.join("\n"));
  const description = descParts.join("\n\n") || full;

  return {
    title,
    description,
    company,
    location,
    job_type,
    job_subtype,
    work_mode,
    salary_min,
    salary_max,
    pay_per_hour,
    skills_required,
    experience_required,
    recruiter_name,
    recruiter_email: recruiter_email && !recruiter_email.includes("@matchdb") ? recruiter_email : "",
    recruiter_phone,
  };
}

export default function PasteTab({ type, onSave }: Props) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const isCandidate = type === "candidate";

  const handleParse = () => {
    if (!text.trim()) return;
    const data = isCandidate ? parseCandidateText(text) : parseJobText(text);
    setParsed(data);
  };

  const handleAiParse = async () => {
    if (!text.trim()) return;
    setAiError("");
    setAiLoading(true);
    try {
      const { data } = await api.post("/api/ai-parse", {
        text,
        type: isCandidate ? "candidate" : "job",
      });
      setParsed(data);
    } catch (err: any) {
      const msg = err.response?.data?.error || "AI parsing failed";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    await onSave(data);
    setParsed(null);
    setText("");
  };

  if (parsed) {
    return (
      <div className="paste-preview">
        <div className="preview-header">
          <h3>Review Parsed Data</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setParsed(null)}
          >
            ← Back to Paste
          </button>
        </div>
        {isCandidate ? (
          <CandidateForm
            initialData={parsed}
            onSubmit={handleSave}
            submitLabel="Save Candidate"
          />
        ) : (
          <JobForm
            initialData={parsed}
            onSubmit={handleSave}
            submitLabel="Save Job"
          />
        )}
      </div>
    );
  }

  return (
    <div className="paste-tab">
      <p className="tab-description">
        Paste {isCandidate ? "candidate" : "job"} details below.{" "}
        {isCandidate ? (
          <>Uses <strong>Key: Value</strong> format.</>
        ) : (
          <>Supports <strong>real recruiter job posts</strong> with emojis, shorthand (CTH, C2C, W2), and bullet-style descriptions. Skills, location, work mode, and pay are auto-extracted.</>
        )}{" "}
        Fields will be shown for review before saving.
      </p>
      <textarea
        className="paste-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isCandidate ? CANDIDATE_TEMPLATE : JOB_TEMPLATE}
        rows={16}
      />
      <div className="paste-actions">
        <button
          className="btn btn-primary"
          onClick={handleParse}
          disabled={!text.trim()}
        >
          Parse & Preview
        </button>
        <button
          className="btn btn-ai"
          onClick={handleAiParse}
          disabled={!text.trim() || aiLoading}
          title="Use OpenAI to parse (requires OPENAI_API_KEY in server/.env)"
        >
          {aiLoading ? (
            <><span className="spinner-sm" /> Parsing…</>
          ) : (
            <>✨ AI Parse</>
          )}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() =>
            setText(isCandidate ? CANDIDATE_TEMPLATE : JOB_TEMPLATE)
          }
        >
          Load Example
        </button>
        {text && (
          <button className="btn btn-ghost" onClick={() => setText("")}>
            Clear
          </button>
        )}
      </div>
      {aiError && (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          {aiError}
        </div>
      )}
    </div>
  );
}
