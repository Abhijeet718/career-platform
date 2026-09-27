const { z } = require("zod");

const updateStatusSchema = z.object({
    status: z.enum(['applied', 'shortlisted', 'rejected', 'interviewing', 'offered'], {
        message: "Invalid status value"
    })
});

const applicantFilterQuerySchema = z.object({
    status: z.enum(['applied', 'shortlisted', 'rejected', 'interviewing', 'offered']).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    minMatchScore: z.coerce.number().min(0).max(100).optional(),
    sortBy: z.enum(['matchScore', 'createdAt']).default('matchScore'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
});

module.exports = { updateStatusSchema, applicantFilterQuerySchema };