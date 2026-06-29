import { Router } from 'express';
import * as appointmentController from './appointment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from './appointment.validation.js';
import { addReview } from '../review/review.controller.js';
import { addReviewSchema } from '../review/review.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('patient'), validate(bookAppointmentSchema), appointmentController.bookAppointment);
router.get('/:id', appointmentController.getAppointment);
router.patch('/:id/cancel', validate(cancelAppointmentSchema), appointmentController.cancelAppointment);
router.patch('/:id/reschedule', authorize('patient'), validate(rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);
router.post('/:id/review', authorize('patient'), validate(addReviewSchema), addReview);

export default router;
