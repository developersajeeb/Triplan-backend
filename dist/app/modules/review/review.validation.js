"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewZodSchema = void 0;
const zod_1 = require("zod");
exports.createReviewZodSchema = zod_1.z.object({
    tour: zod_1.z.string().min(1, { message: "Tour is required" }),
    guideRating: zod_1.z.coerce.number().int().min(1).max(5),
    serviceRating: zod_1.z.coerce.number().int().min(1).max(5),
    transportationRating: zod_1.z.coerce.number().int().min(1).max(5),
    organizationRating: zod_1.z.coerce.number().int().min(1).max(5),
    comment: zod_1.z.string().trim().min(1, { message: "Comment is required" }).max(1000),
});
