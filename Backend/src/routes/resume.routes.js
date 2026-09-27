const { Router } = require('express');
const resumeController = require('../controllers/resume.controller');
const { authUser, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { analyzeResumeSchema } = require('../validators/resume.validator');
const upload = require('../middlewares/file.middleware');
const { aiLimiter } = require('../middlewares/rateLimit.middleware');

const resumeRouter = Router();

resumeRouter.post(
    '/analyze',
    authUser,
    requireRole('student'),
    aiLimiter,
    upload.single('resume'),
    validate(analyzeResumeSchema),
    resumeController.analyzeResumeController
);

module.exports = resumeRouter;