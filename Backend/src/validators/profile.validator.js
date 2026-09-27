const { z } = require("zod");

const updateProfileSchema = z.object({
    skills: z.array(z.string().trim().min(1).toLowerCase()).max(50).optional(),
    resumeText: z.string().trim().max(20000).optional(),
    companyName: z.string().trim().max(100).optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update" }
);

module.exports = { updateProfileSchema };