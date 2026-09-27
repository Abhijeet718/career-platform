const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authUser = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        throw new ApiError(401, 'Unauthorized');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, role }
        next();
    } catch (error) {
        throw new ApiError(401, 'Invalid or expired token');
    }
});

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Unauthorized');
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw new ApiError(403, `This action requires one of these roles: ${allowedRoles.join(', ')}`);
        }
        next();
    };
}

module.exports = { authUser, requireRole };