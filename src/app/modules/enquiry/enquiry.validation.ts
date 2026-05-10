import { z } from "zod";

export const createEnquiryZodSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(120),
  email: z.string().trim().email({ message: "Enter a valid email address" }),
  phone: z.string().trim().min(8, { message: "Phone number is required" }).max(20),
  message: z.string().trim().min(1, { message: "Message is required" }).max(1500),
  tourTitle: z.string().trim().optional(),
  tourSlug: z.string().trim().optional(),
});

export const updateEnquiryZodSchema = z.object({
  status: z.enum(["UNREAD", "READ", "REPLIED"]).optional(),
  replyMessage: z.string().trim().max(1500).optional(),
});