"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAvailabilityZodSchema = exports.updateBookingStatusZodSchema = exports.createBookingZodSchema = void 0;
const zod_1 = require("zod");
const booking_interface_1 = require("./booking.interface");
exports.createBookingZodSchema = zod_1.z.object({
    tour: zod_1.z.string(),
    date: zod_1.z.string().min(1, { message: "Date is required" }),
    guestCount: zod_1.z.number().int().positive(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    city: zod_1.z.string().optional()
});
exports.updateBookingStatusZodSchema = zod_1.z.object({
    status: zod_1.z.enum(Object.values(booking_interface_1.BOOKING_STATUS)),
});
exports.checkAvailabilityZodSchema = zod_1.z.object({
    tour: zod_1.z.string().min(1, { message: "Tour is required" }),
    date: zod_1.z.string().min(1, { message: "Date is required" }),
    guestCount: zod_1.z
        .number()
        .int()
        .min(1, { message: "At least 1 guest is required" })
});
