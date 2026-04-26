import { z } from "zod";

const faqItemSchema = z.object({
    question: z.string(),
    answer: z.string(),
});

const tourBatchSchema = z.object({
    batchNo: z.number(),
    costFrom: z.number(),
    sellingPrice: z.number(),
    startDate: z.string(),
    startTime: z.string(),
    endDate: z.string(),
    endTime: z.string(),
    regEndDate: z.string(),
    maxSeat: z.number(),
    minAge: z.number().optional(),
});


export const createTourZodSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    costFrom: z.number().optional(),
    sellingPrice: z.number().optional(),
    startDate: z.string().optional().optional(),
    endDate: z.string().optional().optional(),
    regEndDate: z.string(),
    tourType: z.string(),// <- changed here
    tourTypeName: z.string(),
    included: z.array(z.string()).optional(),
    excluded: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
    tourPlan: z.array(z.string()).optional(),
    faq: z.array(faqItemSchema).optional(),
    batches: z.array(tourBatchSchema).optional(),
    minAge: z.number().optional(),
    division: z.string(),
    divisionName: z.string(),
    departureLocation: z.string().optional(),
    arrivalLocation: z.string().optional()
});

export const updateTourZodSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    costFrom: z.number().optional(),
    sellingPrice: z.number().optional(),
    startDate: z.string().optional().optional(),
    endDate: z.string().optional().optional(),
    regEndDate: z.string().optional(),
    tourType: z.string().optional(),// <- changed here
    tourTypeName: z.string().optional(),
    included: z.array(z.string()).optional(),
    excluded: z.array(z.string()).optional(),
    amenities: z.array(z.string()).optional(),
    tourPlan: z.array(z.string()).optional(),
    faq: z.array(faqItemSchema).optional(),
    batches: z.array(tourBatchSchema).optional(),
    minAge: z.number().optional(),
    division: z.string().optional(),
    divisionName: z.string().optional(),
    departureLocation: z.string().optional(),
    arrivalLocation: z.string().optional(),
    deleteImages: z.array(z.string()).optional()
});

export const createTourTypeZodSchema = z.object({
    name: z.string(),
});