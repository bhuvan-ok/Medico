import { z } from 'zod';

const medicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  body: z.object({
    diagnosis: z.string().min(1),
    medicines: z.array(medicineSchema).default([]),
    tests: z.array(z.string().min(1)).default([]),
    advice: z.string().optional(),
    followUpDate: z.string().optional(),
  }),
  params: z.object({ appointmentId: z.string() }),
});

export const updatePrescriptionSchema = z.object({
  body: z.object({
    diagnosis: z.string().min(1).optional(),
    medicines: z.array(medicineSchema).optional(),
    tests: z.array(z.string().min(1)).optional(),
    advice: z.string().optional(),
    followUpDate: z.string().optional(),
  }),
  params: z.object({ appointmentId: z.string() }),
});
