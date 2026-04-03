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

const STRIP_EMOJI_RE = /\p{Extended_Pictographic}|\u200D|\uFE0F/gu;

const GREETING_WORDS = ["hello", "hi", "hey"];
const GREETING_PREFIX_RE = new RegExp(
  String.raw`^(?:${GREETING_WORDS.join("|")})[,!.]?\s*(?:accepting\s+resumes?\s+(?:for\s+)?(?:below\s+)?role)?`,
  "i",
);
const SKILL_BLOCK_LABELS = [
  String.raw`must\s*have`,
  String.raw`required`,
  String.raw`mandatory\s*skills?`,
  String.raw`skills?\s*required`,
  String.raw`technologies`,
  String.raw`tech\s*stack`,
  String.raw`key\s*skills`,
  String.raw`knowledge\/skills`,
  String.raw`knowledge\s*skills`,
];
const SKILL_BLOCK_RE = new RegExp(
  String.raw`(?:${SKILL_BLOCK_LABELS.join("|")})\s*:?\s*\n?([\s\S]*?)(?=\n\s*\n|\n(?:[A-Z][a-z]+\s*(?:[:.]|$))|$)`,
  "gim",
);
const PLUS_BLOCK_LABELS = [
  String.raw`plus`,
  String.raw`nice\s*to\s*have`,
  String.raw`good\s*to\s*have`,
  String.raw`preferred(?:\/\s*recommended)?`,
  String.raw`bonus`,
];
const PLUS_BLOCK_RE = new RegExp(
  String.raw`(?:${PLUS_BLOCK_LABELS.join("|")})\s*:?\s*\n?([\s\S]*?)(?=\n\s*\n|\n(?:[A-Z][a-z]+\s*[:.])|$)`,
  "gim",
);
const NOISE = new Set([
  "must",
  "have",
  "required",
  "plus",
  "nice",
  "to",
  "good",
  "prefer",
  "preferred",
  "experience",
  "strong",
  "expert",
  "proficient",
  "knowledge",
  "and",
  "or",
  "with",
  "in",
  "of",
  "a",
  "an",
  "the",
  "for",
  "similar",
  "looking",
  "years",
  "year",
  "yrs",
  "yr",
  "mandatory",
  "local",
  "only",
  "onsite",
  "remote",
  "hybrid",
  "interview",
  "resumes",
  "resume",
  "relocation",
  "needed",
  "if",
  "not",
  "is",
  "are",
  "we",
  "will",
  "minimum",
  "max",
  "min",
  "also",
  "ideally",
  "should",
]);

const KNOWN_TECH: Record<string, string> = {
  java: "Java",
  "spring boot": "Spring Boot",
  spring: "Spring",
  springboot: "Spring Boot",
  react: "React",
  reactjs: "React",
  angular: "Angular",
  vue: "Vue.js",
  vuejs: "Vue.js",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  typescript: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  ts: "TypeScript",
  python: "Python",
  django: "Django",
  flask: "Flask",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  "c#": "C#",
  "c++": "C++",
  ".net": ".NET",
  dotnet: ".NET",
  "asp.net": "ASP.NET",
  sql: "SQL",
  mysql: "MySQL",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mongodb: "MongoDB",
  mongo: "MongoDB",
  redis: "Redis",
  elasticsearch: "Elasticsearch",
  rabbitmq: "RabbitMQ",
  kafka: "Kafka",
  activemq: "ActiveMQ",
  aws: "AWS",
  azure: "Azure",
  gcp: "GCP",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  terraform: "Terraform",
  ansible: "Ansible",
  jenkins: "Jenkins",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  git: "Git",
  maven: "Maven",
  gradle: "Gradle",
  npm: "npm",
  graphql: "GraphQL",
  rest: "REST",
  restful: "REST",
  microservices: "Microservices",
  sass: "SASS",
  css: "CSS",
  html: "HTML",
  tailwind: "Tailwind CSS",
  redux: "Redux",
  nextjs: "Next.js",
  "next.js": "Next.js",
  express: "Express",
  nestjs: "NestJS",
  fastapi: "FastAPI",
  hibernate: "Hibernate",
  jpa: "JPA",
  oracle: "Oracle",
  dynamodb: "DynamoDB",
  cassandra: "Cassandra",
  snowflake: "Snowflake",
  databricks: "Databricks",
  spark: "Spark",
  hadoop: "Hadoop",
  airflow: "Airflow",
  tableau: "Tableau",
  "power bi": "Power BI",
  powerbi: "Power BI",
  salesforce: "Salesforce",
  sap: "SAP",
  scala: "Scala",
  kotlin: "Kotlin",
  swift: "Swift",
  flutter: "Flutter",
  "react native": "React Native",
  cypress: "Cypress",
  jest: "Jest",
  junit: "JUnit",
  selenium: "Selenium",
  agile: "Agile",
  scrum: "Scrum",
  jira: "Jira",
  "production support": "Production Support",
  "financial services": "Financial Services",
};

function stripEmojis(value: string) {
  return value.replaceAll(STRIP_EMOJI_RE, "").trim();
}

function cleanJobText(text: string) {
  return text
    .replaceAll(/hashtag#\w+/gi, "")
    .replaceAll(/#\w+/g, "")
    .replaceAll(/\bhashtag\b/gi, "")
    .replaceAll("\r", "");
}

function toNonEmptyLines(text: string) {
  return text
    .split("\n")
    .map((line: string) => line.trim())
    .filter(Boolean);
}

function matchFirst(fullText: string, pattern: RegExp): string {
  return pattern.exec(fullText)?.[1]?.trim() || "";
}

function trimRoleSuffix(value: string) {
  return value
    .replace(/\s*[-–—]\s*(onsite|remote|hybrid|wfh)\s*$/i, "")
    .replace(/\s*\|.*$/, "")
    .trim();
}

function extractTitle(fullText: string, lines: string[]) {
  const roleMatch = /^\s*role(?:\s*\d)?\s*[:=]\s*(.+)$/im.exec(fullText);
  if (roleMatch) return trimRoleSuffix(stripEmojis(roleMatch[1]));

  const hiringMatch = /(?:is\s+)?hiring\s+for\s+(.+?)(?:\n|$)/i.exec(fullText);
  if (hiringMatch) return trimRoleSuffix(stripEmojis(hiringMatch[1]));

  if (!lines.length) return "";

  const normalizedFirstLine = trimRoleSuffix(
    stripEmojis(lines[0])
      .replace(/^[-–—:]\s*/, "")
      .replace(GREETING_PREFIX_RE, ""),
  );
  if (normalizedFirstLine) return normalizedFirstLine;

  if (lines.length > 1) {
    return stripEmojis(lines[1]).replace(/^[-–—:]\s*/, "").trim();
  }

  return "";
}

function extractLocation(fullText: string) {
  let location =
    matchFirst(fullText, /📍\s*(?:location\s*[:=]?\s*)?([^\n|]+)/i) ||
    matchFirst(fullText, /(?:location|loc)\s*[:=]\s*([^\n|]+)/i);

  location = location
    .replaceAll(/\s*\([^)]*(?:local|only|required|dl|drivers?)\b[^)]*\)/gi, "")
    .trim();

  return location
    .replace(
      /\s*\(\d+\s*days?\s*(?:onsite|remote|hybrid|in[\s-]?office)\)/i,
      "",
    )
    .trim();
}

function detectWorkMode(fullText: string) {
  if (
    /\bhybrid\s*(?:role)?\b/i.test(fullText) ||
    /\(\d+\s*days?\s*onsite\)/i.test(fullText)
  ) {
    return "hybrid";
  }
  if (
    /\b(onsite|on[\s-]?site|in[\s-]?office|in[\s-]?person|onsite\s+interview)\b/i.test(
      fullText,
    )
  ) {
    return "onsite";
  }
  if (/\b(remote|wfh|work\s*from\s*home|telecommute)\b/i.test(fullText)) {
    return "remote";
  }
  return "";
}

function detectJobClassification(fullText: string) {
  let job_type = "";
  let job_subtype = "";

  if (/\b(c2c|corp[\s-]?to[\s-]?corp)\b/i.test(fullText)) {
    job_subtype = "c2c";
  } else if (/\b(cth|c2h|contract[\s-]?to[\s-]?hire)\b/i.test(fullText)) {
    job_subtype = "c2h";
  } else if (/\bw2\b/i.test(fullText)) {
    job_subtype = "w2";
  } else if (/\b1099\b/i.test(fullText)) {
    job_subtype = "1099";
  } else if (/\b(direct[\s-]?(?:hire|client))\b/i.test(fullText)) {
    job_subtype = "direct_hire";
  } else if (/\bsalary\b/i.test(fullText)) {
    job_subtype = "salary";
  }

  if (/\b(full[\s-]?time|fte|permanent|perm)\b/i.test(fullText)) {
    job_type = "full_time";
  } else if (/\b(part[\s-]?time)\b/i.test(fullText)) {
    job_type = "part_time";
  } else if (/\b(contract|cth|c2c|c2h|w2|1099|consultant)\b/i.test(fullText)) {
    job_type = "contract";
  }

  return { job_type, job_subtype };
}

function extractCompensation(fullText: string) {
  let salary_min: number | undefined;
  let salary_max: number | undefined;
  let pay_per_hour: number | undefined;

  const durationMatch = /(\d+)\s*(?:\+\s*)?(?:months?|mos?)\b/i.exec(fullText);
  const duration = durationMatch ? durationMatch[0].trim() : "";

  const hourlyMatch =
    /\$\s*([\d,.]+)\s*(?:\/|\s*per\s*)\s*h(?:ou)?r/i.exec(fullText);
  if (hourlyMatch) {
    pay_per_hour = Number.parseFloat(hourlyMatch[1].replaceAll(",", ""));
  }

  const rangeMatch =
    /\$\s*([\d,.]+)\s*k?\s*[-–—to]+\s*\$?\s*([\d,.]+)\s*k?/i.exec(fullText);
  if (rangeMatch) {
    let low = Number.parseFloat(rangeMatch[1].replaceAll(",", ""));
    let high = Number.parseFloat(rangeMatch[2].replaceAll(",", ""));
    if (low < 1000) low *= 1000;
    if (high < 1000) high *= 1000;
    salary_min = low;
    salary_max = high;
  }

  return { duration, salary_min, salary_max, pay_per_hour };
}

function addKnownSkill(
  value: string,
  seen: Set<string>,
  skillsRequired: string[],
) {
  const normalized = value.toLowerCase();
  const canonical = KNOWN_TECH[normalized];
  if (canonical && !seen.has(canonical)) {
    seen.add(canonical);
    skillsRequired.push(canonical);
  }
}

function collectDictionarySkills(
  lowerFull: string,
  seen: Set<string>,
  skillsRequired: string[],
) {
  for (const [pattern, canonical] of Object.entries(KNOWN_TECH)) {
    const escaped = pattern.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const boundaryRegex = new RegExp(
      String.raw`(?:^|[\s,;|/()•\-–+])${escaped}(?:[\s,;|/()•\-–+]|$)`,
      "i",
    );
    if (!boundaryRegex.test(lowerFull) || seen.has(canonical)) continue;
    seen.add(canonical);
    skillsRequired.push(canonical);
  }
}

function tokenizeSkillContent(content: string) {
  return content
    .split(/[,;•|\n]+/)
    .flatMap((token: string) =>
      token.split(/\s*\+\s*/).map((part: string) => part.trim()),
    );
}

function normalizeSkillToken(token: string) {
  return token
    .replace(/^\s*[-–—*]\s*/, "")
    .replaceAll(/\(.*?\)/g, "")
    .replaceAll(/[→←]/g, "")
    .trim();
}

function collectBlockSkills(
  fullText: string,
  pattern: RegExp,
  seen: Set<string>,
  skillsRequired: string[],
) {
  const regex = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(fullText)) !== null) {
    const rawContent = pattern === PLUS_BLOCK_RE
      ? match[0].replace(/^[^:\n]+:\s*/, "")
      : match[1];
    const tokens = tokenizeSkillContent(rawContent);
    for (const token of tokens) {
      const clean = normalizeSkillToken(token);
      if (clean.length < 2 || clean.length > 60) continue;
      const words = clean.toLowerCase().split(/\s+/);
      if (words.every((word: string) => NOISE.has(word))) continue;
      addKnownSkill(clean, seen, skillsRequired);
    }
  }
}

function collectSkillsFromText(fullText: string) {
  const skillsRequired: string[] = [];
  const seen = new Set<string>();
  collectDictionarySkills(fullText.toLowerCase(), seen, skillsRequired);
  collectBlockSkills(fullText, SKILL_BLOCK_RE, seen, skillsRequired);
  collectBlockSkills(fullText, PLUS_BLOCK_RE, seen, skillsRequired);

  return skillsRequired;
}

function extractExperience(fullText: string) {
  const expMatch =
    /(?:exp(?:erience)?\s*[:=]?\s*)(\d+)\s*\+?\s*(?:years?|yrs?|yr)?/i.exec(
      fullText,
    ) ||
    /(\d+)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:industry\s*)?(?:experience|exp)?/i.exec(
      fullText,
    );
  return expMatch ? Number.parseInt(expMatch[1], 10) : undefined;
}

function extractCompany(fullText: string) {
  const company = matchFirst(
    fullText,
    /(?:company|client|employer)\s*[:=]\s*([^\n|]+)/i,
  );
  if (company) return company;
  const hiringCompanyMatch = /^\s*([A-Z][\w\s]+?)\s+is\s+hiring/im.exec(fullText);
  return hiringCompanyMatch?.[1]?.trim() || "";
}

function buildDescription(fullText: string, lines: string[], duration: string) {
  const descriptionParts: string[] = [];
  if (duration) descriptionParts.push(`Duration: ${duration}`);
  const descriptionLines = lines.slice(1).filter(
    (line: string) =>
      !line.startsWith("📍") &&
      !/^(?:recruiter|contact|poc|email|phone)\s*[:=]/i.test(stripEmojis(line)),
  );
  if (descriptionLines.length) {
    descriptionParts.push(descriptionLines.join("\n"));
  }
  return descriptionParts.join("\n\n") || fullText;
}

function parseCandidateText(text: string) {
  const get = (key: string): string => {
    const regex = new RegExp(String.raw`^${key}\s*[:=]\s*(.+)$`, "im");
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
      .replaceAll(/\s+/g, "_"),
    expected_hourly_rate:
      Number.parseFloat(get("Expected Hourly Rate") || get("Hourly Rate")) ||
      undefined,
    experience_years:
      Number.parseFloat(get("Experience Years") || get("Experience")) ||
      undefined,
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
  const full = cleanJobText(text);
  const lines = toNonEmptyLines(full);
  const title = extractTitle(full, lines);
  const location = extractLocation(full);
  const work_mode = detectWorkMode(full);
  const { job_type, job_subtype } = detectJobClassification(full);
  const { duration, salary_min, salary_max, pay_per_hour } =
    extractCompensation(full);
  const skills_required = collectSkillsFromText(full);
  const experience_required = extractExperience(full);
  const company = extractCompany(full);
  const recruiter_name = matchFirst(
    full,
    /(?:recruiter|contact|poc|submitted?\s*by)\s*[:=]\s*([^\n|,]+)/i,
  );
  const recruiter_email =
    matchFirst(full, /(?:recruiter\s*email|email)\s*[:=]\s*([\w.+-]+@[\w.-]+)/i) ||
    matchFirst(full, /^\s*([\w.+-]+@[\w.-]+)\s*$/m);
  const recruiter_phone = matchFirst(
    full,
    /(?:recruiter\s*phone|phone|cell|mobile)\s*[:=]\s*([\d\s()+-]{7,})/i,
  );
  const description = buildDescription(full, lines, duration);

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
    recruiter_email:
      recruiter_email && !recruiter_email.includes("@matchdb")
        ? recruiter_email
        : "",
    recruiter_phone,
  };
}

export default function PasteTab({ type, onSave }: Readonly<Props>) {
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
          <>
            Uses <strong>Key: Value</strong> format.
          </>
        ) : (
          <>
            Supports <strong>real recruiter job posts</strong> with emojis,
            shorthand (CTH, C2C, W2), and bullet-style descriptions. Skills,
            location, work mode, and pay are auto-extracted.
          </>
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
            <>
              <span className="spinner-sm" /> Parsing…
            </>
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
