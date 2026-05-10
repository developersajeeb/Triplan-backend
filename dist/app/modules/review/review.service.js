"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const cloudinary_config_1 = require("../../config/cloudinary.config");
const booking_interface_1 = require("../booking/booking.interface");
const booking_model_1 = require("../booking/booking.model");
const tour_model_1 = require("../tour/tour.model");
const review_model_1 = require("./review.model");
const uploadReviewImages = (files) => __awaiter(void 0, void 0, void 0, function* () {
    if (!files.length) {
        return [];
    }
    const uploadedImages = yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
        const fileName = file.originalname.replace(/\.[^.]+$/, "");
        const result = yield (0, cloudinary_config_1.uploadBufferToCloudinary)(file.buffer, fileName, "review-images", "image");
        return (result === null || result === void 0 ? void 0 : result.secure_url) || "";
    })));
    return uploadedImages.filter(Boolean);
});
const getTourReviews = (tourId) => __awaiter(void 0, void 0, void 0, function* () {
    const tour = yield tour_model_1.Tour.findById(tourId).select("_id");
    if (!tour) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Tour not found.");
    }
    const [summaryData, reviews] = yield Promise.all([
        review_model_1.Review.aggregate([
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
        review_model_1.Review.find({ tour: tour._id, isDeleted: { $ne: true } })
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
        overallRating: Number(([
            summarySource.averageGuideRating || 0,
            summarySource.averageServiceRating || 0,
            summarySource.averageTransportationRating || 0,
            summarySource.averageOrganizationRating || 0,
        ].reduce((sum, value) => sum + value, 0) / 4 || 0).toFixed(1)),
    };
    const responseReviews = reviews.map((review) => {
        const user = review.user;
        const averageRating = Number(((review.guideRating +
            review.serviceRating +
            review.transportationRating +
            review.organizationRating) /
            4).toFixed(1));
        return {
            _id: String(review._id),
            name: (user === null || user === void 0 ? void 0 : user.name) || "Guest User",
            picture: user === null || user === void 0 ? void 0 : user.picture,
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
});
const getReviewEligibility = (tourId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const tour = yield tour_model_1.Tour.findById(tourId).select("_id");
    if (!tour) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Tour not found.");
    }
    const completedBookings = yield booking_model_1.Booking.find({
        tour: tour._id,
        user: userId,
        status: booking_interface_1.BOOKING_STATUS.COMPLETE,
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
});
const createReview = (payload, userId, files) => __awaiter(void 0, void 0, void 0, function* () {
    const tour = yield tour_model_1.Tour.findById(payload.tour).select("_id title slug");
    if (!tour) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Tour not found.");
    }
    const eligibility = yield getReviewEligibility(payload.tour, userId);
    if (!eligibility.canReview || !eligibility.bookingId) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not eligible to submit a review for this tour.");
    }
    const imageUrls = yield uploadReviewImages(files);
    const review = yield review_model_1.Review.create({
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
});
const getMyReviews = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield review_model_1.Review.find({
        user: userId,
        isDeleted: { $ne: true },
    })
        .select("tourTitle tourSlug guideRating serviceRating transportationRating organizationRating comment images createdAt")
        .sort({ createdAt: -1 });
    return reviews.map((review) => {
        const overallRating = Number(((review.guideRating +
            review.serviceRating +
            review.transportationRating +
            review.organizationRating) /
            4).toFixed(1));
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
});
const deleteMyReview = (reviewId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.Review.findOne({
        _id: reviewId,
        user: userId,
        isDeleted: { $ne: true },
    }).select("_id");
    if (!review) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Review not found.");
    }
    yield review_model_1.Review.findByIdAndUpdate(review._id, { isDeleted: true }, { new: true });
    return {
        _id: String(review._id),
    };
});
const parseExistingImagesPayload = (existingImages) => {
    if (!existingImages) {
        return [];
    }
    if (Array.isArray(existingImages)) {
        return existingImages.filter(Boolean);
    }
    try {
        const parsed = JSON.parse(existingImages);
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string" && item) : [];
    }
    catch (_error) {
        return [];
    }
};
const normalizeSearch = (value) => (value !== null && value !== void 0 ? value : "").trim().toLowerCase();
const getOverallRating = (review) => {
    return Number(((review.guideRating +
        review.serviceRating +
        review.transportationRating +
        review.organizationRating) /
        4).toFixed(1));
};
const getAdminReviews = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const search = normalizeSearch(query.search);
    const sort = normalizeSearch(query.sort) || "newest";
    const reviews = yield review_model_1.Review.find({ isDeleted: { $ne: true } })
        .populate("user", "name email")
        .sort({ createdAt: -1 });
    const mapped = reviews
        .map((review) => {
        const user = review.user;
        return {
            _id: String(review._id),
            tourTitle: review.tourTitle,
            tourSlug: review.tourSlug,
            createdAt: review.createdAt ? review.createdAt.toISOString() : new Date().toISOString(),
            userName: (user === null || user === void 0 ? void 0 : user.name) || "Guest User",
            userEmail: (user === null || user === void 0 ? void 0 : user.email) || "N/A",
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
        return (normalizeSearch(review.userName).includes(search) ||
            normalizeSearch(review.userEmail).includes(search));
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
});
const deleteReviewByAdmin = (reviewId) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.Review.findOne({
        _id: reviewId,
        isDeleted: { $ne: true },
    }).select("_id");
    if (!review) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Review not found.");
    }
    yield review_model_1.Review.findByIdAndUpdate(review._id, { isDeleted: true }, { new: true });
    return {
        _id: String(review._id),
    };
});
const updateMyReview = (reviewId, userId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.Review.findOne({
        _id: reviewId,
        user: userId,
        isDeleted: { $ne: true },
    });
    if (!review) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Review not found.");
    }
    review.guideRating = payload.guideRating;
    review.serviceRating = payload.serviceRating;
    review.transportationRating = payload.transportationRating;
    review.organizationRating = payload.organizationRating;
    review.comment = payload.comment.trim();
    review.tourSlug = payload.tourSlug;
    review.tourTitle = payload.tourTitle;
    const keptExistingImages = parseExistingImagesPayload(payload.existingImages).filter((image) => (review.images || []).includes(image));
    const uploadedImages = yield uploadReviewImages(files);
    review.images = [...keptExistingImages, ...uploadedImages].slice(0, 3);
    yield review.save();
    return review;
});
const updateReviewByAdmin = (reviewId, payload, files) => __awaiter(void 0, void 0, void 0, function* () {
    const review = yield review_model_1.Review.findOne({
        _id: reviewId,
        isDeleted: { $ne: true },
    });
    if (!review) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Review not found.");
    }
    review.guideRating = payload.guideRating;
    review.serviceRating = payload.serviceRating;
    review.transportationRating = payload.transportationRating;
    review.organizationRating = payload.organizationRating;
    review.comment = payload.comment.trim();
    review.tourSlug = payload.tourSlug;
    review.tourTitle = payload.tourTitle;
    const keptExistingImages = parseExistingImagesPayload(payload.existingImages).filter((image) => (review.images || []).includes(image));
    const uploadedImages = yield uploadReviewImages(files);
    review.images = [...keptExistingImages, ...uploadedImages].slice(0, 3);
    yield review.save();
    return review;
});
exports.ReviewService = {
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
