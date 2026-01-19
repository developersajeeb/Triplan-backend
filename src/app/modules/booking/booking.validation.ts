import { z } from "zod";
import { BOOKING_STATUS } from "./booking.interface";

export const createBookingZodSchema = z.object({
  tour: z.string(),
  guestCount: z.number().int().positive()

});

export const updateBookingStatusZodSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS) as [string]),
});

export const checkAvailabilityZodSchema = z.object({
  tour: z.string().min(1, { message: "Tour is required" }),

  date: z.string().min(1, { message: "Date is required" }),

  guest: z
    .number()
    .min(1, { message: "At least 1 guest is required" })
    .max(20, { message: "Cannot book more than 20 guests" }),
});