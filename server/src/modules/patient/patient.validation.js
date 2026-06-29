import { z } from 'zod';

export const uploadReportSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    reportType: z.enum(['blood-test', 'xray', 'mri', 'scan', 'other']).default('other'),
  }),
});
