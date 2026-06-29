import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createDoctorSchema } from './admin.validation.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);

router.get('/doctors', adminController.getAllDoctors);
router.post('/doctors', validate(createDoctorSchema), adminController.createDoctor);
router.patch('/doctors/:id/verify', adminController.verifyDoctor);
router.patch('/doctors/:id/suspend', adminController.suspendDoctor);
router.patch('/doctors/:id/activate', adminController.activateUser);

router.get('/patients', adminController.getAllPatients);
router.patch('/patients/:id/suspend', adminController.suspendPatient);
router.patch('/patients/:id/activate', adminController.activateUser);

router.get('/appointments', adminController.getAllAppointments);
router.patch('/appointments/:id/cancel', adminController.cancelAppointment);

router.delete('/reviews/:reviewId', adminController.removeReview);
router.patch('/users/:id/activate', adminController.activateUser);

export default router;
