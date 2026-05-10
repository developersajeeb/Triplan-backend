"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnquiryZodSchema = exports.createEnquiryZodSchema = void 0;
const zod_1 = require("zod");
exports.createEnquiryZodSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, { message: "Name is required" }).max(120),
    email: zod_1.z.string().trim().email({ message: "Enter a valid email address" }),
    phone: zod_1.z.string().trim().min(8, { message: "Phone number is required" }).max(20),
    message: zod_1.z.string().trim().min(1, { message: "Message is required" }).max(1500),
    tourTitle: zod_1.z.string().trim().optional(),
    tourSlug: zod_1.z.string().trim().optional(),
});
exports.updateEnquiryZodSchema = zod_1.z.object({
    status: zod_1.z.enum(["UNREAD", "READ", "REPLIED"]).optional(),
    replyMessage: zod_1.z.string().trim().max(1500).optional(),
});
