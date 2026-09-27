const { z } = require("zod");

const createJobSchema = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
    description: z.string().trim().min(20, "Description should be at least 20 characters").max(5000),
    requiredSkills: z.array(z.string().trim().min(1).toLowerCase())
        .min(1, "List at least one required skill"),
    location: z.string().trim().max(100).optional()
});

module.exports = { createJobSchema };