import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { avatarUpload } from '../../middlewares/upload.js';
import { updateProfileSchema, changePasswordSchema } from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.patch('/me/avatar', avatarUpload.single('avatar'), userController.updateAvatar);
router.patch('/me/password', validate(changePasswordSchema), userController.changePassword);

export default router;
