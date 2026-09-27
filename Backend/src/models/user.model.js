const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: [true, 'Username already exists'],
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: [true, 'Email already exists'],
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'recruiter'],
        required: true
    },

    // --- Student-specific fields (ignored for recruiters) ---
    skills: {
        type: [String],
        default: undefined
    },
    resumeText: {
        type: String,
        default: undefined
    },

    // --- Recruiter-specific fields (ignored for students) ---
    companyName: {
        type: String,
        trim: true,
        default: undefined
    }
}, {
    timestamps: true
});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;