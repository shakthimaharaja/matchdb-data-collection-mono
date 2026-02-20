import { Request, Response } from "express";

const SYSTEM_PROMPT = `You are a job posting parser. Extract structured data from raw recruiter job postings.

Return a JSON object with EXACTLY these fields (use null for missing values, [] for missing arrays):
{
  "title": "job title string",
  "description": "full job description compiled from the posting",
  "company": "company/client name or null",
  "location": "city, state/country or null",
  "job_type": "full_time" | "part_time" | "contract" | null,
  "job_subtype": "c2c" | "c2h" | "w2" | "1099" | "direct_hire" | "salary" | null,
  "work_mode": "remote" | "onsite" | "hybrid" | null,
  "salary_min": number or null,
  "salary_max": number or null,
  "pay_per_hour": number or null,
  "skills_required": ["skill1", "skill2", ...],
  "experience_required": number or null,
  "recruiter_name": "name or null",
  "recruiter_email": "email or null",
  "recruiter_phone": "phone or null"
}

Rules:
- CTH/C2H = contract_to_hire → job_subtype: "c2h", job_type: "contract"
- C2C = corp-to-corp → job_subtype: "c2c", job_type: "contract"
- W2 → job_subtype: "w2"
- Direct Client → job_subtype: "direct_hire"
- FTE/Permanent → job_type: "full_time"
- Extract technical skills (programming languages, frameworks, tools, cloud platforms, databases)
- Also extract domain skills like "Financial Services", "Production Support"
- Salary values should be annual numbers (e.g. 130000 not 130k)
- Strip emojis, hashtags, and LinkedIn artifacts from extracted values
- For "X+ years" patterns, extract just the number
- If a standalone email appears, use it as recruiter_email
- Return ONLY the JSON object, no markdown, no explanation`;

export async function aiParseJob(req: Request, res: Response) {
  try {
    const { text, type } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(501).json({
        error: "AI parsing not configured. Set OPENAI_API_KEY in server/.env",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Parse this ${type || "job"} posting:\n\n${text}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI API error:", response.status, err);
      return res.status(502).json({ error: "AI service error" });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (handle ```json ... ``` wrappers)
    const jsonStr = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const parsed = JSON.parse(jsonStr);

    // Clean nulls → empty strings/undefined for frontend compatibility
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === null || value === undefined) {
        if (key === "skills_required") cleaned[key] = [];
        else if (
          typeof value === "number" ||
          [
            "salary_min",
            "salary_max",
            "pay_per_hour",
            "experience_required",
          ].includes(key)
        )
          cleaned[key] = undefined;
        else cleaned[key] = "";
      } else {
        cleaned[key] = value;
      }
    }

    return res.json(cleaned);
  } catch (err: any) {
    console.error("AI parse error:", err.message);
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: "AI returned invalid JSON" });
    }
    return res.status(500).json({ error: "AI parsing failed" });
  }
}
