const ApiError = require("../utils/ApiError");

function validate(schema) {
    return (req, res, next) => {
        // Default to {} when no body was sent at all — e.g. a multipart
        // request with a file but no text fields never gets a req.body
        // set by express.json(), leaving it `undefined`. Without this,
        // even an all-optional schema would reject `undefined` at the
        // top level before a controller's own more specific checks
        // (like "file is required") ever get a chance to run.
        const result = schema.safeParse(req.body || {});

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }));
            return next(new ApiError(400, "Validation failed", errors));
        }

        req.body = result.data;
        next();
    };
}

module.exports = validate;