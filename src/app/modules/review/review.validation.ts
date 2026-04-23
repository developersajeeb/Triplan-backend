import { z } from "zod";

export const createReviewZodSchema = z.object({
  tour: z.string().min(1, { message: "Tour is required" }),
  guideRating: z.coerce.number().int().min(1).max(5),
  serviceRating: z.coerce.number().int().min(1).max(5),
  transportationRating: z.coerce.number().int().min(1).max(5),
  organizationRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1, { message: "Comment is required" }).max(1000),
});
