const { z } = require("zod");
const { TOPICS } = require("../models/dsa.model");

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const STATUSES = ['solved', 'attempted', 'todo'];

const createDsaEntrySchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    topic: z.enum(TOPICS),
    difficulty: z.enum(DIFFICULTIES),
    status: z.enum(STATUSES).default('solved'),
    platform: z.string().trim().max(50).optional(),
    url: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional()
});

const updateDsaEntrySchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    topic: z.enum(TOPICS).optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    status: z.enum(STATUSES).optional(),
    platform: z.string().trim().max(50).optional(),
    url: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(1000).optional()
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update" }
);

const listDsaQuerySchema = z.object({
    topic: z.enum(TOPICS).optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    status: z.enum(STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

module.exports = { createDsaEntrySchema, updateDsaEntrySchema, listDsaQuerySchema };