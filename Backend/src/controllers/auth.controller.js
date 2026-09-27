const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
};

function toSafeUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && {
            skills: user.skills || [],
        }),
        ...(user.role === 'recruiter' && {
            companyName: user.companyName || null
        })
    };
}

const registerUserController = asyncHandler(async (req, res) => {
    const { username, email, password, role, companyName } = req.body;

    const isUserExists = await userModel.findOne({
        $or: [{ username }, { email }]
    });
    if (isUserExists) {
        throw new ApiError(409, 'User already exists');
    }

    const hash = await bcrypt.hash(password, 10);

    const user = new userModel({
        username,
        email,
        password: hash,
        role,
        ...(role === 'recruiter' && companyName && { companyName })
    });

    await user.save();

    const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json(
        new ApiResponse(201, { user: toSafeUser(user) }, 'User registered successfully')
    );
});

const loginUserController = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
        throw new ApiError(400, 'User does not exist');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(400, 'Invalid password');
    }

    const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json(
        new ApiResponse(200, { user: toSafeUser(user) }, 'User logged in successfully')
    );
});

const logoutUserController = asyncHandler(async (req, res) => {
    res.clearCookie('token', {
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite
    });
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

const getMeController = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    return res.status(200).json(
        new ApiResponse(200, { user: toSafeUser(user) }, 'User fetched successfully')
    );
});

const updateProfileController = asyncHandler(async (req, res) => {
    const { skills, resumeText, companyName } = req.body;

    const user = await userModel.findById(req.user.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.role === 'student') {
        if (skills !== undefined) user.skills = skills;
        if (resumeText !== undefined) user.resumeText = resumeText;
    }

    if (user.role === 'recruiter') {
        if (companyName !== undefined) user.companyName = companyName;
    }

    await user.save();

    return res.status(200).json(
        new ApiResponse(200, { user: toSafeUser(user) }, 'Profile updated successfully')
    );
});

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController, updateProfileController };