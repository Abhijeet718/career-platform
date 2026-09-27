const applicationModel = require('../models/application.model');
const jobModel = require('../models/job.model');
const userModel = require('../models/user.model');
const { computeSkillMatch } = require('../services/matching.service');
const { emitToUser } = require('../socket/socket');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');


const applyToJobController = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const job = await jobModel.findById(jobId);
    if (!job || job.status !== 'open') {
        throw new ApiError(404, 'Job not found or no longer accepting applications');
    }

    const student = await userModel.findById(req.user.id);
    const { matchScore, matchedSkills, missingSkills } = computeSkillMatch(student.skills, job.requiredSkills);

    let application;
    try {
        application = await applicationModel.create({
            job: jobId,
            applicant: req.user.id,
            matchScore,
            matchedSkills,
            missingSkills
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, 'You have already applied to this job');
        }
        throw error;
    }

    return res.status(201).json(
        new ApiResponse(201, { application }, 'Application submitted successfully')
    );
});

const getMyApplicationsController = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = { applicant: req.user.id };

    const [applications, total] = await Promise.all([
        applicationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('job', 'title location status'),
        applicationModel.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            applications,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, 'Applications fetched successfully')
    );
});

const getApplicantsForJobController = asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const job = await jobModel.findOne({ _id: jobId, postedBy: req.user.id });
    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
        applicationModel.find({ job: jobId })
            .sort({ matchScore: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('applicant', 'username email skills'),
        applicationModel.countDocuments({ job: jobId })
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            applications,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        }, 'Applicants fetched successfully')
    );
});

const updateApplicationStatusController = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await applicationModel.findById(applicationId).populate('job');
    if (!application) {
        throw new ApiError(404, 'Application not found');
    }

    if (application.job.postedBy.toString() !== req.user.id) {
        throw new ApiError(404, 'Application not found');
    }

       application.status = status;
    await application.save();

    emitToUser(application.applicant.toString(), 'applicationStatusUpdated', {
        applicationId: application._id.toString(),
        jobTitle: application.job.title,
        status: application.status
    });

    return res.status(200).json(
        new ApiResponse(200, { application }, 'Application status updated successfully')
    );
});

module.exports = {
    applyToJobController,
    getMyApplicationsController,
    getApplicantsForJobController,
    updateApplicationStatusController
};