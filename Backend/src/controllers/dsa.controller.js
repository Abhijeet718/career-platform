const mongoose = require('mongoose');
const { dsaEntryModel, TOPICS } = require('../models/dsa.model');
const { listDsaQuerySchema } = require('../validators/dsa.validator');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createDsaEntryController = asyncHandler(async (req, res) => {
    const { title, topic, difficulty, status, platform, url, notes } = req.body;

    const entry = await dsaEntryModel.create({
        user: req.user.id,
        title, topic, difficulty, status, platform, url, notes
    });

    return res.status(201).json(
        new ApiResponse(201, { entry }, 'DSA entry logged successfully')
    );
});

const getMyDsaEntriesController = asyncHandler(async (req, res) => {
    const parsedQuery = listDsaQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        const errors = parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
        }));
        throw new ApiError(400, 'Invalid query parameters', errors);
    }

    const { topic, difficulty, status, page, limit } = parsedQuery.data;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;

    const [entries, total] = await Promise.all([
        dsaEntryModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        dsaEntryModel.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            entries,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, 'DSA entries fetched successfully')
    );
});

const updateDsaEntryController = asyncHandler(async (req, res) => {
    const { entryId } = req.params;

    const entry = await dsaEntryModel.findOne({ _id: entryId, user: req.user.id });
    if (!entry) {
        throw new ApiError(404, 'DSA entry not found');
    }

    Object.assign(entry, req.body);
    await entry.save();

    return res.status(200).json(
        new ApiResponse(200, { entry }, 'DSA entry updated successfully')
    );
});

const deleteDsaEntryController = asyncHandler(async (req, res) => {
    const { entryId } = req.params;

    const entry = await dsaEntryModel.findOneAndDelete({ _id: entryId, user: req.user.id });
    if (!entry) {
        throw new ApiError(404, 'DSA entry not found');
    }

    return res.status(200).json(
        new ApiResponse(200, null, 'DSA entry deleted successfully')
    );
});

const getDsaStatsController = asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const topicCounts = await dsaEntryModel.aggregate([
        { $match: { user: userId, status: 'solved' } },
        { $group: { _id: '$topic', count: { $sum: 1 } } }
    ]);
    const countsByTopic = Object.fromEntries(topicCounts.map((t) => [t._id, t.count]));
    const topicBreakdown = TOPICS
        .map((topic) => ({ topic, solved: countsByTopic[topic] || 0 }))
        .sort((a, b) => a.solved - b.solved);

    const difficultyCounts = await dsaEntryModel.aggregate([
        { $match: { user: userId, status: 'solved' } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);
    const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
    difficultyCounts.forEach((d) => { difficultyBreakdown[d._id] = d.count; });

    const totalSolved = await dsaEntryModel.countDocuments({ user: userId, status: 'solved' });

    const weakestTopics = topicBreakdown.slice(0, 3).map((t) => t.topic);

    const solvedDates = await dsaEntryModel.distinct('createdAt', { user: userId, status: 'solved' });
    const daySet = new Set(solvedDates.map((d) => new Date(d).toISOString().slice(0, 10)));

    let streak = 0;
    const cursor = new Date();
    const todayStr = cursor.toISOString().slice(0, 10);
    if (!daySet.has(todayStr)) {
        cursor.setDate(cursor.getDate() - 1);
    }
    while (daySet.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return res.status(200).json(
        new ApiResponse(200, {
            totalSolved,
            topicBreakdown,
            difficultyBreakdown,
            weakestTopics,
            currentStreak: streak
        }, 'DSA stats fetched successfully')
    );
});

module.exports = {
    createDsaEntryController,
    getMyDsaEntriesController,
    updateDsaEntryController,
    deleteDsaEntryController,
    getDsaStatsController
};