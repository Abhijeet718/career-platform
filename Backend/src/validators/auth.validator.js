const { z } = require("zod");

const registerSchema = z.object({
    username: z.string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    email: z.string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters"),
    role: z.enum(["student", "recruiter"], {
        message: "Role must be either 'student' or 'recruiter'"
    }),
    companyName: z.string().trim().max(100).optional()
});

const loginSchema = z.object({
    email: z.string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address"),
    password: z.string()
        .min(1, "Password is required")
});

module.exports = { registerSchema, loginSchema };