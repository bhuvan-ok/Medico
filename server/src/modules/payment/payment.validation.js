import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    slotId: z.string().min(1, 'Slot ID required'),
    doctorId: z.string().min(1, 'Doctor ID required'),
    type: z.enum(['in-person', 'video']),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
    slotId: z.string().min(1),
    doctorId: z.string().min(1),
    type: z.enum(['in-person', 'video']),
    notes: z.string().optional(),
  }),
});
