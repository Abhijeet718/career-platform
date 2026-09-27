const { z } = require("zod");

const updateStatusSchema = z.object({
    status: z.enum(['applied', 'shortlisted', 'rejected', 'interviewing', 'offered'], {
        message: "Invalid status value"
    })
});

module.exports = { updateStatusSchema };