import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { aiLimiter } from '../../middlewares/rateLimiter.js';
import { symptomCheckSchema, analyzeReportSchema } from './ai.validation.js';

const router = Router();

router.use(authenticate);
router.use(aiLimiter);

router.post('/symptom-check', validate(symptomCheckSchema), aiController.symptomCheck);

// SSE streaming — prescription analysis with progress events
router.post('/analyze-prescription/:prescriptionId/stream', aiController.analyzePrescriptionStream);

router.post('/analyze-report', validate(analyzeReportSchema), aiController.analyzeReport);

export default router;
