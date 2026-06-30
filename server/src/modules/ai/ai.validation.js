import { z } from 'zod';

export const symptomCheckSchema = z.object({
  body: z.object({
    symptoms: z.string().min(10, 'Please describe your symptoms in more detail (at least 10 characters)').max(1000),
    age: z.coerce.number().int().min(1).max(120).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
  }),
});

export const analyzeReportSchema = z.object({
  body: z.object({
    reportText: z.string().min(20, 'Report content is too short to analyze').max(8000),
    reportType: z.string().max(100).optional(),
  }),
});
