import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { Tour } from "../tour/tour.model";
import { Review } from "./review.model";
import { IAdminReviewItem, IAdminReviewQuery, IMyReview, IReviewEligibility, ITourReviewResponse } from "./review.interface";

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

const getMyReviews = async (userId: string): Promise<IMyReview[]> => {
  const reviews = await Review.find({
    user: userId,
    isDeleted: { $ne: true },
  })
    .select(
      "tourTitle tourSlug guideRating serviceRating transportationRating organizationRating comment images createdAt"
    )
    .sort({ createdAt: -1 });

  return reviews.map((review) => {
    const overallRating = Number(
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
      tourTitle: review.tourTitle,
      tourSlug: review.tourSlug,
      createdAt: review.createdAt ? review.createdAt.toISOString() : new Date().toISOString(),
      guideRating: review.guideRating,
      serviceRating: review.serviceRating,
      transportationRating: review.transportationRating,
      organizationRating: review.organizationRating,
      comment: review.comment,
      images: review.images || [],
      overallRating,
    };
  });
};

const deleteMyReview = async (reviewId: string, userId: string) => {
  const review = await Review.findOne({
    _id: reviewId,
    user: userId,
    isDeleted: { $ne: true },
  }).select("_id");

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  await Review.findByIdAndUpdate(review._id, { isDeleted: true }, { new: true });

  return {
    _id: String(review._id),
  };
};

const parseExistingImagesPayload = (existingImages?: string | string[]) => {
  if (!existingImages) {
    return [] as string[];
  }

  if (Array.isArray(existingImages)) {
    return existingImages.filter(Boolean);
  }

  try {
    const parsed = JSON.parse(existingImages);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string" && item) : [];
  } catch (_error) {
    return [];
  }
};

const normalizeSearch = (value?: string) => (value ?? "").trim().toLowerCase();

const getOverallRating = (review: {
  guideRating: number;
  serviceRating: number;
  transportationRating: number;
  organizationRating: number;
}) => {
  return Number(
    (
      (review.guideRating +
        review.serviceRating +
        review.transportationRating +
        review.organizationRating) /
      4
    ).toFixed(1)
  );
};

const getAdminReviews = async (query: IAdminReviewQuery = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const search = normalizeSearch(query.search);
  const sort = normalizeSearch(query.sort) || "newest";

  const reviews = await Review.find({ isDeleted: { $ne: true } })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  const mapped: IAdminReviewItem[] = reviews
    .map((review) => {
      const user = review.user as unknown as { name?: string; email?: string };

      return {
        _id: String(review._id),
        tourTitle: review.tourTitle,
        tourSlug: review.tourSlug,
        createdAt: review.createdAt ? review.createdAt.toISOString() : new Date().toISOString(),
        userName: user?.name || "Guest User",
        userEmail: user?.email || "N/A",
        guideRating: review.guideRating,
        serviceRating: review.serviceRating,
        transportationRating: review.transportationRating,
        organizationRating: review.organizationRating,
        comment: review.comment,
        images: review.images || [],
        overallRating: getOverallRating(review),
      };
    })
    .filter((review) => {
      if (!search) {
        return true;
      }

      return (
        normalizeSearch(review.userName).includes(search) ||
        normalizeSearch(review.userEmail).includes(search)
      );
    })
    .sort((a, b) => {
      const createdA = new Date(a.createdAt).getTime();
      const createdB = new Date(b.createdAt).getTime();

      if (sort === "oldest") {
        return createdA - createdB;
      }

      return createdB - createdA;
    });

  const total = mapped.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;

  return {
    data: mapped.slice(startIndex, startIndex + limit),
    meta: {
      page,
      limit,
      total,
      totalPage: totalPages,
      totalPages,
      totalListing: total,
    },
  };
};

const deleteReviewByAdmin = async (reviewId: string) => {
  const review = await Review.findOne({
    _id: reviewId,
    isDeleted: { $ne: true },
  }).select("_id");

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  await Review.findByIdAndUpdate(review._id, { isDeleted: true }, { new: true });

  return {
    _id: String(review._id),
  };
};

const updateMyReview = async (
  reviewId: string,
  userId: string,
  payload: {
    guideRating: number;
    serviceRating: number;
    transportationRating: number;
    organizationRating: number;
    comment: string;
    tourSlug: string;
    tourTitle: string;
    existingImages?: string | string[];
  },
  files: Express.Multer.File[]
) => {
  const review = await Review.findOne({
    _id: reviewId,
    user: userId,
    isDeleted: { $ne: true },
  });

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  review.guideRating = payload.guideRating;
  review.serviceRating = payload.serviceRating;
  review.transportationRating = payload.transportationRating;
  review.organizationRating = payload.organizationRating;
  review.comment = payload.comment.trim();
  review.tourSlug = payload.tourSlug;
  review.tourTitle = payload.tourTitle;

  const keptExistingImages = parseExistingImagesPayload(payload.existingImages).filter((image) =>
    (review.images || []).includes(image)
  );
  const uploadedImages = await uploadReviewImages(files);
  review.images = [...keptExistingImages, ...uploadedImages].slice(0, 3);

  await review.save();

  return review;
};

const updateReviewByAdmin = async (
  reviewId: string,
  payload: {
    guideRating: number;
    serviceRating: number;
    transportationRating: number;
    organizationRating: number;
    comment: string;
    tourSlug: string;
    tourTitle: string;
    existingImages?: string | string[];
  },
  files: Express.Multer.File[]
) => {
  const review = await Review.findOne({
    _id: reviewId,
    isDeleted: { $ne: true },
  });

  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  review.guideRating = payload.guideRating;
  review.serviceRating = payload.serviceRating;
  review.transportationRating = payload.transportationRating;
  review.organizationRating = payload.organizationRating;
  review.comment = payload.comment.trim();
  review.tourSlug = payload.tourSlug;
  review.tourTitle = payload.tourTitle;

  const keptExistingImages = parseExistingImagesPayload(payload.existingImages).filter((image) =>
    (review.images || []).includes(image)
  );
  const uploadedImages = await uploadReviewImages(files);
  review.images = [...keptExistingImages, ...uploadedImages].slice(0, 3);

  await review.save();

  return review;
};

export const ReviewService = {
  getTourReviews,
  getReviewEligibility,
  createReview,
  getMyReviews,
  deleteMyReview,
  updateMyReview,
  getAdminReviews,
  deleteReviewByAdmin,
  updateReviewByAdmin,
};
