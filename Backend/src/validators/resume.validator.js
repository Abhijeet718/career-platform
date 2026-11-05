const { z } = require("zod");

const analyzeResumeSchema = z.object({
  targetRole: z
    .string()
    .trim()
    .min(2, "Enter a target role to analyze your resume.")
    .max(150),
});

module.exports = { analyzeResumeSchema };
