import { z } from 'zod';

export const addReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(300).optional(),
  }),
  params: z.object({ id: z.string() }),
});
