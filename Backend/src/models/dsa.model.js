const mongoose = require('mongoose');

const TOPICS = [
    'array', 'string', 'linked-list', 'stack', 'queue', 'tree', 'graph',
    'dynamic-programming', 'greedy', 'backtracking', 'binary-search',
    'sliding-window', 'heap', 'other'
];

const dsaEntrySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    topic: {
        type: String,
        enum: TOPICS,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    status: {
        type: String,
        enum: ['solved', 'attempted', 'todo'],
        default: 'solved'
    },
    platform: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

dsaEntrySchema.index({ user: 1, createdAt: -1 });
dsaEntrySchema.index({ user: 1, topic: 1 });

const dsaEntryModel = mongoose.model('DsaEntry', dsaEntrySchema);

module.exports = { dsaEntryModel, TOPICS };