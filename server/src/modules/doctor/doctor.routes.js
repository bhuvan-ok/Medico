import { Router } from 'express';
import * as doctorController from './doctor.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { documentUpload } from '../../middlewares/upload.js';
import {
  updateDoctorProfileSchema,
  setScheduleSchema,
  generateSlotsSchema,
} from './doctor.validation.js';

const router = Router();

// ─── Doctor-only /me/* routes ─── MUST be above /:id to avoid shadowing ───────
router.get('/me/profile', authenticate, authorize('doctor'), doctorController.getMyProfile);
router.put('/me/profile', authenticate, authorize('doctor'), validate(updateDoctorProfileSchema), doctorController.updateMyProfile);
router.patch('/me/profile/license', authenticate, authorize('doctor'), documentUpload.single('licenseDocument'), doctorController.updateLicenseDocument);
router.get('/me/schedule', authenticate, authorize('doctor'), doctorController.getMySchedule);
router.put('/me/schedule', authenticate, authorize('doctor'), validate(setScheduleSchema), doctorController.setSchedule);
router.get('/me/slots', authenticate, authorize('doctor'), doctorController.getMySlots);
router.post('/me/slots/generate', authenticate, authorize('doctor'), validate(generateSlotsSchema), doctorController.generateSlots);
router.patch('/me/slots/:slotId', authenticate, authorize('doctor'), doctorController.toggleBlockSlot);
router.get('/me/appointments', authenticate, authorize('doctor'), doctorController.getMyAppointments);
router.patch('/me/appointments/:id/accept', authenticate, authorize('doctor'), doctorController.acceptAppointment);
router.patch('/me/appointments/:id/reject', authenticate, authorize('doctor'), doctorController.rejectAppointment);
router.patch('/me/appointments/:id/complete', authenticate, authorize('doctor'), doctorController.completeAppointment);
router.get('/me/patients/:patientId/history', authenticate, authorize('doctor'), doctorController.getPatientHistory);

// ─── Public routes ─────────────────────────────────────────────────────────────
router.get('/', doctorController.searchDoctors);
router.get('/:id', doctorController.getDoctorPublicProfile);
router.get('/:id/slots', doctorController.getDoctorAvailableSlots);

export default router;
