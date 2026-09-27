const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

async function withRetry(fn, { retries = 3, baseDelayMs = 1000 } = {}) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            const status = error.status || error?.error?.code;
            const message = error.message || "";
            const isTransient = status === 503 || status === 429 ||
                message.includes("UNAVAILABLE") || message.includes("RESOURCE_EXHAUSTED");

            if (!isTransient || attempt === retries) {
                throw error;
            }

            const delay = baseDelayMs * (2 ** attempt) + Math.random() * 300;
            console.warn(`Gemini request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${Math.round(delay)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

const resumeAnalysisSchema = z.object({
    atsScore: z.number().describe("A score between 0 and 100 estimating how well this resume would perform with an Applicant Tracking System"),
    extractedSkills: z.array(z.string()).describe("Technical and soft skills extracted from the resume text"),
    suggestions: z.array(z.string()).describe("2-5 concrete, actionable suggestions to improve this resume"),
    summary: z.string().describe("A brief 1-2 sentence professional summary of the candidate based on their resume")
});

async function analyzeResume({ resumeText, targetRole }) {
    const prompt = `
Analyze the following resume${targetRole ? ` for a candidate targeting the role of "${targetRole}"` : ""}.

Resume:
${resumeText}

Respond ONLY with a JSON object matching exactly this structure:
{
  "atsScore": number (0-100),
  "extractedSkills": [string],
  "suggestions": [string],
  "summary": string
}
`;

    const schema = z.toJSONSchema(resumeAnalysisSchema, { reused: "inline" });

    const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    }));

    return JSON.parse(response.text);
}

module.exports = { analyzeResume };