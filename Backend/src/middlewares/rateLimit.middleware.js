const rateLimit = require('express-rate-limit');

const skipInTest = () => process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: { message: 'Too many attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest
});

const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 15,
    message: { message: 'Too many AI requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest
});

module.exports = { authLimiter, aiLimiter };