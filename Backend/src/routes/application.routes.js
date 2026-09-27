const { Router } = require('express');
const applicationController = require('../controllers/application.controller');
const { authUser, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateStatusSchema } = require('../validators/application.validator');

const applicationRouter = Router();

applicationRouter.get('/mine', authUser, requireRole('student'), applicationController.getMyApplicationsController);
applicationRouter.patch(
    '/:applicationId/status',
    authUser,
    requireRole('recruiter'),
    validate(updateStatusSchema),
    applicationController.updateApplicationStatusController
);

module.exports = applicationRouter;