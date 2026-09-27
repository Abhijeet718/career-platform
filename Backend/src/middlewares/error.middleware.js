const ApiError = require("../utils/ApiError");

function errorHandler(err, req, res, next) {
    if (err instanceof ApiError) {
        if (process.env.NODE_ENV === "development") {
            console.error(err);
        }
        return res.status(err.statusCode).json({
            success: false,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors,
            ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
        });
    }

    console.error(err);

    if (err.name === "ValidationError") {
        return res.status(400).json({ success: false, statusCode: 400, message: err.message });
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || "field";
        return res.status(409).json({
            success: false,
            statusCode: 409,
            message: `${field} already in use`
        });
    }

    if (err.status === 503 || (err.message || "").includes("UNAVAILABLE")) {
        return res.status(503).json({
            success: false,
            statusCode: 503,
            message: "The AI service is currently overloaded. Please try again in a moment."
        });
    }

    if (err.status === 429 || (err.message || "").includes("RESOURCE_EXHAUSTED")) {
        return res.status(429).json({
            success: false,
            statusCode: 429,
            message: "The AI service's daily usage limit has been reached. Please try again later."
        });
    }

    if (err.name === "MulterError" || err.message === "Only PDF files are supported") {
        return res.status(400).json({ success: false, statusCode: 400, message: err.message });
    }

    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
    });
}

module.exports = errorHandler;