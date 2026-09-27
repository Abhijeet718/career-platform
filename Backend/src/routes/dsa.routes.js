const { Router } = require('express');
const dsaController = require('../controllers/dsa.controller');
const { authUser } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createDsaEntrySchema, updateDsaEntrySchema } = require('../validators/dsa.validator');

const dsaRouter = Router();

dsaRouter.post('/', authUser, validate(createDsaEntrySchema), dsaController.createDsaEntryController);
dsaRouter.get('/stats', authUser, dsaController.getDsaStatsController);
dsaRouter.get('/', authUser, dsaController.getMyDsaEntriesController);
dsaRouter.patch('/:entryId', authUser, validate(updateDsaEntrySchema), dsaController.updateDsaEntryController);
dsaRouter.delete('/:entryId', authUser, dsaController.deleteDsaEntryController);

module.exports = dsaRouter;