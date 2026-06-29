import { z } from 'zod';

export const updateDoctorProfileSchema = z.object({
  body: z.object({
    bio: z.string().max(500).optional(),
    experience: z.number().min(0).optional(),
    consultationFee: z.number().min(0).optional(),
    appointmentType: z.array(z.enum(['in-person', 'video'])).optional(),
    languages: z.array(z.string()).optional(),
    hospital: z
      .object({ name: z.string().optional(), address: z.string().optional() })
      .optional(),
    qualifications: z
      .array(
        z.object({
          degree: z.string(),
          institution: z.string(),
          year: z.number(),
        })
      )
      .optional(),
  }),
});

export const setScheduleSchema = z.object({
  body: z.object({
    schedules: z.array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        slotDuration: z.number().int().min(10).max(120).default(30),
        isAvailable: z.boolean().default(true),
      })
    ),
  }),
});

export const generateSlotsSchema = z.object({
  body: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
});

export const doctorSearchSchema = z.object({
  query: z
    .object({
      search: z.string().optional(),
      specialization: z.string().optional(),
      city: z.string().optional(),
      appointmentType: z.enum(['in-person', 'video']).optional(),
      minFee: z.string().optional(),
      maxFee: z.string().optional(),
      minRating: z.string().optional(),
      language: z.string().optional(),
      sortBy: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});
