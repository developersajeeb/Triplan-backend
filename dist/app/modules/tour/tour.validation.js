"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTourTypeZodSchema = exports.updateTourZodSchema = exports.createTourZodSchema = void 0;
const zod_1 = require("zod");
const faqItemSchema = zod_1.z.object({
    question: zod_1.z.string(),
    answer: zod_1.z.string(),
});
const tourBatchSchema = zod_1.z.object({
    batchNo: zod_1.z.number(),
    costFrom: zod_1.z.number(),
    sellingPrice: zod_1.z.number(),
    startDate: zod_1.z.string(),
    startTime: zod_1.z.string(),
    endDate: zod_1.z.string(),
    endTime: zod_1.z.string(),
    regEndDate: zod_1.z.string(),
    maxSeat: zod_1.z.number(),
    minAge: zod_1.z.number().optional(),
});
exports.createTourZodSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    costFrom: zod_1.z.number().optional(),
    sellingPrice: zod_1.z.number().optional(),
    startDate: zod_1.z.string().optional().optional(),
    endDate: zod_1.z.string().optional().optional(),
    regEndDate: zod_1.z.string(),
    tourType: zod_1.z.string(), // <- changed here
    tourTypeName: zod_1.z.string(),
    included: zod_1.z.array(zod_1.z.string()).optional(),
    excluded: zod_1.z.array(zod_1.z.string()).optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    tourPlan: zod_1.z.array(zod_1.z.string()).optional(),
    faq: zod_1.z.array(faqItemSchema).optional(),
    batches: zod_1.z.array(tourBatchSchema).optional(),
    minAge: zod_1.z.number().optional(),
    division: zod_1.z.string(),
    divisionName: zod_1.z.string(),
    departureLocation: zod_1.z.string().optional(),
    arrivalLocation: zod_1.z.string().optional()
});
exports.updateTourZodSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    costFrom: zod_1.z.number().optional(),
    sellingPrice: zod_1.z.number().optional(),
    startDate: zod_1.z.string().optional().optional(),
    endDate: zod_1.z.string().optional().optional(),
    regEndDate: zod_1.z.string().optional(),
    tourType: zod_1.z.string().optional(), // <- changed here
    tourTypeName: zod_1.z.string().optional(),
    included: zod_1.z.array(zod_1.z.string()).optional(),
    excluded: zod_1.z.array(zod_1.z.string()).optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
    tourPlan: zod_1.z.array(zod_1.z.string()).optional(),
    faq: zod_1.z.array(faqItemSchema).optional(),
    batches: zod_1.z.array(tourBatchSchema).optional(),
    minAge: zod_1.z.number().optional(),
    division: zod_1.z.string().optional(),
    divisionName: zod_1.z.string().optional(),
    departureLocation: zod_1.z.string().optional(),
    arrivalLocation: zod_1.z.string().optional(),
    deleteImages: zod_1.z.array(zod_1.z.string()).optional()
});
exports.createTourTypeZodSchema = zod_1.z.object({
    name: zod_1.z.string(),
});
