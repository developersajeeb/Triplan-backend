import { z } from "zod";

export const createReviewZodSchema = z.object({
  tour: z.string().min(1, { message: "Tour is required" }),
  guideRating: z.coerce.number().int().min(1).max(5),
  serviceRating: z.coerce.number().int().min(1).max(5),
  transportationRating: z.coerce.number().int().min(1).max(5),
  organizationRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1, { message: "Comment is required" }).max(1000),
});

export const updateReviewZodSchema = z.object({
  guideRating: z.coerce.number().int().min(1).max(5),
  serviceRating: z.coerce.number().int().min(1).max(5),
  transportationRating: z.coerce.number().int().min(1).max(5),
  organizationRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1, { message: "Comment is required" }).max(1000),
  tourSlug: z.string().min(1, { message: "Tour slug is required" }),
  tourTitle: z.string().min(1, { message: "Tour title is required" }),
  existingImages: z.union([z.string(), z.array(z.string())]).optional(),
});
