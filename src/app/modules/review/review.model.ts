import { model, Schema } from "mongoose";
import { IReview } from "./review.interface";

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    tour: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ tour: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ user: 1, tour: 1, isDeleted: 1 });

export const Review = model<IReview>("Review", reviewSchema);
