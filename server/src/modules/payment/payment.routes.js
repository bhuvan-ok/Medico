import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { createOrderSchema, verifyPaymentSchema } from './payment.validation.js';

const router = Router();

router.use(authenticate, authorize('patient'));

router.post('/create-order', validate(createOrderSchema), paymentController.createOrder);
router.post('/verify', validate(verifyPaymentSchema), paymentController.verifyPayment);

export default router;
