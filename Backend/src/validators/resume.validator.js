const { z } = require("zod");

const analyzeResumeSchema = z.object({
    targetRole: z.string().trim().max(150).optional()
});

module.exports = { analyzeResumeSchema };