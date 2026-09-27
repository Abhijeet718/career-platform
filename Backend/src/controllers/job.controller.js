const jobModel = require('../models/job.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createJobController = asyncHandler(async (req, res) => {
    const { title, description, requiredSkills, location } = req.body;

    const job = await jobModel.create({
        title,
        description,
        requiredSkills,
        location,
        postedBy: req.user.id
    });

    return res.status(201).json(
        new ApiResponse(201, { job }, 'Job posted successfully')
    );
});

const getAllJobsController = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { status: 'open' };

    const [jobs, total] = await Promise.all([
        jobModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('postedBy', 'username companyName'),
        jobModel.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'Jobs fetched successfully')
    );
});

const getJobByIdController = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const job = await jobModel.findById(jobId).populate('postedBy', 'username companyName');
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    return res.status(200).json(
        new ApiResponse(200, { job }, 'Job fetched successfully')
    );
});

const getMyJobsController = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { postedBy: req.user.id };

    const [jobs, total] = await Promise.all([
        jobModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        jobModel.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            jobs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, 'Your jobs fetched successfully')
    );
});

module.exports = { createJobController, getAllJobsController, getJobByIdController, getMyJobsController };