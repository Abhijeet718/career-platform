const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'rejected', 'interviewing', 'offered'],
        default: 'applied'
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    matchedSkills: {
        type: [String],
        default: []
    },
    missingSkills: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ job: 1, createdAt: -1 });
applicationSchema.index({ applicant: 1, createdAt: -1 });

const applicationModel = mongoose.model('Application', applicationSchema);

module.exports = applicationModel;