import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { Tour } from "../tour/tour.model";
import { Review } from "./review.model";
import { IReviewEligibility, ITourReviewResponse } from "./review.interface";

const uploadReviewImages = async (files: Express.Multer.File[]) => {
  if (!files.length) {
    return [];
  }

  const uploadedImages = await Promise.all(
    files.map(async (file) => {
      const fileName = file.originalname.replace(/\.[^.]+$/, "");
      const result = await uploadBufferToCloudinary(file.buffer, fileName, "review-images", "image");
      return result?.secure_url || "";
    })
  );

  return uploadedImages.filter(Boolean);
};

const getTourReviews = async (tourId: string): Promise<ITourReviewResponse> => {
  const tour = await Tour.findById(tourId).select("_id");

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
  }

  const [summaryData, reviews] = await Promise.all([
    Review.aggregate([
      {
        $match: {
          tour: tour._id,
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageGuideRating: { $avg: "$guideRating" },
          averageServiceRating: { $avg: "$serviceRating" },
          averageTransportationRating: { $avg: "$transportationRating" },
          averageOrganizationRating: { $avg: "$organizationRating" },
        },
      },
    ]),
    Review.find({ tour: tour._id, isDeleted: { $ne: true } })
      .populate("user", "name picture")
      .sort({ createdAt: -1 }),
  ]);

  const summarySource = summaryData[0] || {
    totalReviews: 0,
    averageGuideRating: 0,
    averageServiceRating: 0,
    averageTransportationRating: 0,
    averageOrganizationRating: 0,
  };

  const summary = {
    totalReviews: summarySource.totalReviews || 0,
    averageGuideRating: Number((summarySource.averageGuideRating || 0).toFixed(1)),
    averageServiceRating: Number((summarySource.averageServiceRating || 0).toFixed(1)),
    averageTransportationRating: Number((summarySource.averageTransportationRating || 0).toFixed(1)),
    averageOrganizationRating: Number((summarySource.averageOrganizationRating || 0).toFixed(1)),
    overallRating: Number(
      (
        [
          summarySource.averageGuideRating || 0,
          summarySource.averageServiceRating || 0,
          summarySource.averageTransportationRating || 0,
          summarySource.averageOrganizationRating || 0,
        ].reduce((sum, value) => sum + value, 0) / 4 || 0
      ).toFixed(1)
    ),
  };

  const responseReviews = reviews.map((review) => {
    const user = review.user as unknown as { name?: string; picture?: string };
    const averageRating = Number(
      (
        (review.guideRating +
          review.serviceRating +
          review.transportationRating +
          review.organizationRating) /
        4
      ).toFixed(1)
    );

    return {
      _id: String(review._id),
      name: user?.name || "Guest User",
      picture: user?.picture,
      createdAt: review.createdAt ? review.createdAt.toISOString() : new Date().toISOString(),
      guideRating: review.guideRating,
      serviceRating: review.serviceRating,
      transportationRating: review.transportationRating,
      organizationRating: review.organizationRating,
      comment: review.comment,
      images: review.images || [],
      overallRating: averageRating,
    };
  });

  return {
    summary,
    reviews: responseReviews,
  };
};

const getReviewEligibility = async (tourId: string, userId: string): Promise<IReviewEligibility> => {
  const tour = await Tour.findById(tourId).select("_id");

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
  }

  const completedBookings = await Booking.find({
    tour: tour._id,
    user: userId,
    status: BOOKING_STATUS.COMPLETE,
  })
    .select("_id")
    .sort({ createdAt: -1 });

  if (!completedBookings.length) {
    return {
      canReview: false,
      hasBooked: false,
      alreadyReviewed: false,
      bookingId: null,
    };
  }

  return {
    canReview: true,
    hasBooked: true,
    alreadyReviewed: false,
    bookingId: String(completedBookings[0]._id),
  };
};

const createReview = async (
  payload: {
    tour: string;
    guideRating: number;
    serviceRating: number;
    transportationRating: number;
    organizationRating: number;
    comment: string;
  },
  userId: string,
  files: Express.Multer.File[]
) => {
  const tour = await Tour.findById(payload.tour).select("_id title slug");

  if (!tour) {
    throw new AppError(httpStatus.NOT_FOUND, "Tour not found.");
  }

  const eligibility = await getReviewEligibility(payload.tour, userId);

  if (!eligibility.canReview || !eligibility.bookingId) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not eligible to submit a review for this tour.");
  }

  const imageUrls = await uploadReviewImages(files);

  const review = await Review.create({
    user: userId,
    booking: eligibility.bookingId,
    tour: tour._id,
    tourTitle: tour.title,
    tourSlug: tour.slug,
    guideRating: payload.guideRating,
    serviceRating: payload.serviceRating,
    transportationRating: payload.transportationRating,
    organizationRating: payload.organizationRating,
    comment: payload.comment.trim(),
    images: imageUrls,
  });

  return review;
};

export const ReviewService = {
  getTourReviews,
  getReviewEligibility,
  createReview,
};
