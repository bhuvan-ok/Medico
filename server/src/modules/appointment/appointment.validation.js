import { z } from 'zod';

export const bookAppointmentSchema = z.object({
  body: z.object({
    slotId: z.string().min(1),
    doctorId: z.string().min(1),
    type: z.enum(['in-person', 'video']),
    notes: z.string().max(500).optional(),
  }),
});

export const cancelAppointmentSchema = z.object({
  body: z.object({
    reason: z.string().min(1).max(300),
  }),
  params: z.object({ id: z.string() }),
});

export const rescheduleAppointmentSchema = z.object({
  body: z.object({
    newSlotId: z.string().min(1),
  }),
  params: z.object({ id: z.string() }),
});
