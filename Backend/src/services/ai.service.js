const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const ApiError = require("../utils/ApiError");
const { normalizeSkill, skillAppearsInText } = require("./matching.service");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

async function withRetry(fn, { retries = 3, baseDelayMs = 1000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = Number(error.status || error?.error?.code);
      const message = error.message || "";
      const transient =
        status === 503 ||
        status === 429 ||
        message.includes("UNAVAILABLE") ||
        message.includes("RESOURCE_EXHAUSTED");
      if (!transient || attempt === retries) throw error;
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 300;
      console.warn(
        `Gemini request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${Math.round(delay)}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const rubricItem = z.object({
  score: z.number().int().min(0).max(25),
  rationale: z.string().trim().min(8).max(240),
});

const resumeAnalysisSchema = z.object({
  extractedSkills: z.array(z.string().trim().min(1).max(60)).max(40),
  targetRoleSkills: z.array(z.string().trim().min(1).max(60)).min(4).max(15),
  experienceAndProjects: rubricItem,
  roleKeywords: rubricItem,
  clarityAndEvidence: rubricItem,
  suggestions: z.array(z.string().trim().min(8).max(300)).min(2).max(5),
  summary: z.string().trim().min(10).max(500),
});

const uniqueSkills = (skills) => {
  const seen = new Set();
  return skills.filter((skill) => {
    const key = normalizeSkill(skill);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

async function analyzeResume({ resumeText, targetRole }) {
  const role = String(targetRole || "").trim();
  if (role.length < 2) {
    throw new ApiError(
      400,
      "Enter a target role before analyzing your resume.",
    );
  }

  const prompt = `You are reviewing a resume for the target role: "${role}".
Use only the resume text below as evidence about this candidate. Do not infer or invent skills, experience, projects, achievements, or qualifications.

Return a JSON object matching the response schema:
- extractedSkills: skills explicitly supported by the resume text. Use concise common skill names. Do not include a skill just because it is relevant to the target role.
- targetRoleSkills: 6 to 10 important, role-specific skills commonly expected for this exact target role. Choose requirements that fit the role rather than a generic software list. These are comparison criteria, not claims about the candidate.
- experienceAndProjects: score 0-25 and a concise evidence-based rationale about relevance and proof of work.
- roleKeywords: score 0-25 and a concise rationale about relevant terminology explicitly present in the resume.
- clarityAndEvidence: score 0-25 and a concise rationale about clarity, specificity, and evidence in the text.
- suggestions: 2 to 5 concise, actionable recommendations grounded in this resume and role. Explain what evidence to add or highlight. For missing requirements, recommend learning or building real evidence; never suggest claiming an unearned skill or experience.
- summary: brief, factual summary based only on the resume.
The final score is calculated by the application and must not be included.

Resume text:
${resumeText}`;

  let response;
  try {
    const schema = z.toJSONSchema(resumeAnalysisSchema, { reused: "inline" });
    response = await withRetry(() =>
      ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    );
  } catch (error) {
    const status = Number(error.status || error?.error?.code);
    if (
      status === 429 ||
      String(error.message).includes("RESOURCE_EXHAUSTED")
    ) {
      throw new ApiError(
        429,
        "Resume analysis is temporarily rate limited. Please try again shortly.",
      );
    }
    if (status === 503 || String(error.message).includes("UNAVAILABLE")) {
      throw new ApiError(
        503,
        "Resume analysis is temporarily unavailable. Please try again shortly.",
      );
    }
    throw new ApiError(
      502,
      "Resume analysis could not be completed. Please try again.",
    );
  }

  let candidate;
  try {
    candidate = resumeAnalysisSchema.parse(JSON.parse(response?.text || ""));
  } catch (error) {
    throw new ApiError(
      502,
      "Resume analysis returned an invalid response. Please try again.",
    );
  }

  const extractedSkills = uniqueSkills(candidate.extractedSkills).filter(
    (skill) => skillAppearsInText(skill, resumeText),
  );
  const targetRoleSkills = uniqueSkills(candidate.targetRoleSkills);
  if (!targetRoleSkills.length) {
    throw new ApiError(
      502,
      "Resume analysis could not identify role requirements. Please try again.",
    );
  }

  return {
    targetRole: role,
    scoreBreakdown: {
      experienceAndProjects: candidate.experienceAndProjects,
      roleKeywords: candidate.roleKeywords,
      clarityAndEvidence: candidate.clarityAndEvidence,
    },
    extractedSkills,
    targetRoleSkills,
    suggestions: candidate.suggestions,
    summary: candidate.summary,
  };
}

module.exports = { analyzeResume };
