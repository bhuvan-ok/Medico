import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email').toLowerCase().trim(),
    specialization: z.string().min(2, 'Specialization required'),
    licenseNumber: z.string().min(2, 'License number required'),
    consultationFee: z.number({ invalid_type_error: 'Fee must be a number' }).positive('Fee must be positive'),
    appointmentType: z
      .array(z.enum(['in-person', 'video']))
      .min(1, 'At least one appointment type required')
      .optional(),
    experience: z.number().int().min(0).optional(),
    bio: z.string().max(1000).optional(),
  }),
});
