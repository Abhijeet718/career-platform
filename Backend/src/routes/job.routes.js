const { Router } = require('express');
const jobController = require('../controllers/job.controller');
const applicationController = require('../controllers/application.controller');
const { authUser, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createJobSchema } = require('../validators/job.validator');

const jobRouter = Router();

jobRouter.post('/', authUser, requireRole('recruiter'), validate(createJobSchema), jobController.createJobController);
jobRouter.get('/mine', authUser, requireRole('recruiter'), jobController.getMyJobsController);
jobRouter.get('/', authUser, jobController.getAllJobsController);
jobRouter.get('/:jobId', authUser, jobController.getJobByIdController);
jobRouter.post('/:jobId/apply', authUser, requireRole('student'), applicationController.applyToJobController);
jobRouter.get('/:jobId/applicants', authUser, requireRole('recruiter'), applicationController.getApplicantsForJobController);

module.exports = jobRouter;