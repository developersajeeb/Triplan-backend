"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    booking: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
    },
    tour: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Tour",
        required: true,
    },
    tourTitle: {
        type: String,
        required: true,
        trim: true,
    },
    tourSlug: {
        type: String,
        required: true,
        trim: true,
    },
    guideRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    serviceRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    transportationRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    organizationRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    images: {
        type: [String],
        default: [],
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
reviewSchema.index({ tour: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ user: 1, tour: 1, isDeleted: 1 });
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
