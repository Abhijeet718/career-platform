const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authUser } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { updateProfileSchema } = require('../validators/profile.validator');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), authController.registerUserController);
authRouter.post('/login', authLimiter, validate(loginSchema), authController.loginUserController);
authRouter.get('/logout', authController.logoutUserController);
authRouter.get('/get-me', authUser, authController.getMeController);
authRouter.patch('/profile', authUser, validate(updateProfileSchema), authController.updateProfileController);

module.exports = authRouter;