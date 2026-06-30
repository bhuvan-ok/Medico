import { Router } from 'express';
import * as prescriptionController from './prescription.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { documentUpload } from '../../middlewares/upload.js';
import { createPrescriptionSchema, updatePrescriptionSchema } from './prescription.validation.js';

const router = Router();

router.use(authenticate);

router.get('/:appointmentId', prescriptionController.getPrescription);
router.post(
  '/:appointmentId',
  authorize('doctor'),
  validate(createPrescriptionSchema),
  prescriptionController.createPrescription
);
router.put(
  '/:appointmentId',
  authorize('doctor'),
  validate(updatePrescriptionSchema),
  prescriptionController.updatePrescription
);
router.patch(
  '/:appointmentId/document',
  authorize('doctor'),
  documentUpload.single('document'),
  prescriptionController.uploadPrescriptionDocument
);

// Generate (or return cached) PDF for a prescription
router.post('/:appointmentId/pdf', prescriptionController.getPrescriptionPdf);

export default router;
