import { Router } from 'express';
import * as patientController from './patient.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { reportUpload } from '../../middlewares/upload.js';
import { uploadReportSchema } from './patient.validation.js';

const router = Router();

router.use(authenticate, authorize('patient'));

router.get('/me/appointments', patientController.getMyAppointments);
router.get('/me/prescriptions', patientController.getMyPrescriptions);
router.get('/me/medical-reports', patientController.getMyReports);
router.post(
  '/me/medical-reports',
  reportUpload.single('report'),
  validate(uploadReportSchema),
  patientController.uploadReport
);
router.get('/me/medical-reports/:id', patientController.getReport);
router.delete('/me/medical-reports/:id', patientController.deleteReport);

export default router;
