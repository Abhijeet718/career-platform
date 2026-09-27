function asyncHandler(requestHandler) {
    return function (req, res, next) {
        Promise.resolve(requestHandler(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;