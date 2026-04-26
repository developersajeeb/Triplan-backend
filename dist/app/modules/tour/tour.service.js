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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TourService = void 0;
const cloudinary_config_1 = require("../../config/cloudinary.config");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const division_model_1 = require("../division/division.model");
const review_model_1 = require("../review/review.model");
const tour_constant_1 = require("./tour.constant");
const tour_model_1 = require("./tour.model");
const createTour = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTour = yield tour_model_1.Tour.findOne({ title: payload.title });
    if (existingTour) {
        throw new Error("A tour with this title already exists.");
    }
    const tour = yield tour_model_1.Tour.create(payload);
    return tour;
});
const getAllTours = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    const selectedRatingValues = query.rating
        ? query.rating
            .split(",")
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5)
        : [];
    const selectedRatingCeiling = selectedRatingValues.length > 0 ? Math.max(...selectedRatingValues) : null;
    if (query.rating) {
        delete query.rating;
    }
    const listProjection = [
        "title",
        "slug",
        "images",
        "costFrom",
        "sellingPrice",
        "arrivalLocation",
        "divisionName",
        "tourTypeName",
        "createdAt"
    ].join(" ");
    // TourType filter
    if (query.tourType) {
        const names = query.tourType.split(",");
        const tourTypes = yield tour_model_1.TourType.find({ name: { $in: names } }).select("_id");
        filter.tourType = { $in: tourTypes.map(t => t._id) };
        delete query.tourType;
    }
    // Division filter
    if (query.division) {
        const names = query.division.split(",");
        const divisions = yield division_model_1.Division.find({ name: { $in: names } }).select("_id");
        filter.division = { $in: divisions.map(d => d._id) };
        delete query.division;
    }
    // Price filter
    if (query.minPrice || query.maxPrice) {
        filter.costFrom = {};
        if (query.minPrice)
            filter.costFrom.$gte = Number(query.minPrice);
        if (query.maxPrice)
            filter.costFrom.$lte = Number(query.maxPrice);
        delete query.minPrice;
        delete query.maxPrice;
    }
    if (selectedRatingCeiling !== null) {
        const ratingMatchedTours = yield review_model_1.Review.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true },
                },
            },
            {
                $group: {
                    _id: "$tour",
                    averageGuideRating: { $avg: "$guideRating" },
                    averageServiceRating: { $avg: "$serviceRating" },
                    averageTransportationRating: { $avg: "$transportationRating" },
                    averageOrganizationRating: { $avg: "$organizationRating" },
                },
            },
            {
                $project: {
                    roundedAverageRating: {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $add: [
                                            "$averageGuideRating",
                                            "$averageServiceRating",
                                            "$averageTransportationRating",
                                            "$averageOrganizationRating",
                                        ],
                                    },
                                    4,
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $match: {
                    roundedAverageRating: { $lte: selectedRatingCeiling, $gte: 1 },
                },
            },
        ]);
        const matchedTourIds = ratingMatchedTours.map((item) => item._id);
        filter._id = { $in: matchedTourIds };
    }
    //Sort by price high/low/new
    if (query.sort) {
        if (query.sort === "priceHighToLow") {
            query.sort = "-costFrom";
        }
        else if (query.sort === "priceLowToHigh") {
            query.sort = "costFrom";
        }
        else if (query.sort === "newest") {
            query.sort = "-createdAt";
        }
    }
    const queryBuilder = new QueryBuilder_1.QueryBuilder(tour_model_1.Tour.find(filter).select(listProjection), query);
    const toursQuery = queryBuilder
        .search(["title", "description"])
        .sort()
        .paginate();
    const [tours, meta] = yield Promise.all([
        toursQuery.build(),
        queryBuilder.getMeta()
    ]);
    const tourIds = tours.map((tour) => tour._id).filter(Boolean);
    const reviewStats = tourIds.length > 0
        ? yield review_model_1.Review.aggregate([
            {
                $match: {
                    tour: { $in: tourIds },
                    isDeleted: { $ne: true },
                },
            },
            {
                $group: {
                    _id: "$tour",
                    totalReviews: { $sum: 1 },
                    averageGuideRating: { $avg: "$guideRating" },
                    averageServiceRating: { $avg: "$serviceRating" },
                    averageTransportationRating: { $avg: "$transportationRating" },
                    averageOrganizationRating: { $avg: "$organizationRating" },
                },
            },
        ])
        : [];
    const reviewStatsMap = new Map(reviewStats.map((item) => {
        const averageRating = Number(([
            item.averageGuideRating || 0,
            item.averageServiceRating || 0,
            item.averageTransportationRating || 0,
            item.averageOrganizationRating || 0,
        ].reduce((sum, value) => sum + value, 0) / 4 || 0).toFixed(1));
        return [String(item._id), {
                averageRating,
                reviewCount: item.totalReviews || 0,
            }];
    }));
    const data = tours.map((tour) => {
        var _a;
        const reviewSummary = reviewStatsMap.get(String(tour._id));
        const plainTour = typeof tour.toObject === "function" ? tour.toObject() : tour;
        return {
            _id: String(tour._id),
            title: plainTour.title || "",
            slug: plainTour.slug || "",
            images: Array.isArray(plainTour.images) ? plainTour.images : [],
            costFrom: (_a = plainTour.costFrom) !== null && _a !== void 0 ? _a : 0,
            sellingPrice: plainTour.sellingPrice,
            arrivalLocation: plainTour.arrivalLocation || "",
            divisionName: plainTour.divisionName || "",
            tourTypeName: plainTour.tourTypeName || "",
            createdAt: plainTour.createdAt,
            averageRating: (reviewSummary === null || reviewSummary === void 0 ? void 0 : reviewSummary.averageRating) || 0,
            reviewCount: (reviewSummary === null || reviewSummary === void 0 ? void 0 : reviewSummary.reviewCount) || 0,
        };
    });
    if (selectedRatingCeiling !== null) {
        data.sort((a, b) => {
            if (b.averageRating !== a.averageRating) {
                return b.averageRating - a.averageRating;
            }
            return new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime();
        });
    }
    return {
        data,
        meta
    };
});
const updateTour = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTour = yield tour_model_1.Tour.findById(id);
    if (!existingTour) {
        throw new Error("Tour not found.");
    }
    if (payload.images && payload.images.length > 0 && existingTour.images && existingTour.images.length > 0) {
        payload.images = [...payload.images, ...existingTour.images];
    }
    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        const restDBImages = existingTour.images.filter(imageUrl => { var _a; return !((_a = payload.deleteImages) === null || _a === void 0 ? void 0 : _a.includes(imageUrl)); });
        const updatedPayloadImages = (payload.images || [])
            .filter(imageUrl => { var _a; return !((_a = payload.deleteImages) === null || _a === void 0 ? void 0 : _a.includes(imageUrl)); })
            .filter(imageUrl => !restDBImages.includes(imageUrl));
        payload.images = [...restDBImages, ...updatedPayloadImages];
    }
    const updatedTour = yield tour_model_1.Tour.findByIdAndUpdate(id, payload, { new: true });
    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        yield Promise.all(payload.deleteImages.map(url => (0, cloudinary_config_1.deleteImageFromCLoudinary)(url)));
    }
    return updatedTour;
});
const deleteTour = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield tour_model_1.Tour.findByIdAndDelete(id);
});
const createTourType = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTourType = yield tour_model_1.TourType.findOne({ name: payload });
    if (existingTourType) {
        throw new Error("Tour type already exists.");
    }
    return yield tour_model_1.TourType.create({ name: payload });
});
const getAllTourTypes = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.QueryBuilder(tour_model_1.TourType.find(), query);
    const tourTypes = yield queryBuilder
        .search(tour_constant_1.tourTypeSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();
    const [data, meta] = yield Promise.all([
        tourTypes.build(),
        queryBuilder.getMeta()
    ]);
    return {
        data,
        meta
    };
});
const getSingleTour = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const tour = yield tour_model_1.Tour.findOne({ slug });
    if (!tour) {
        throw new Error("Tour not found");
    }
    return tour;
});
const updateTourType = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTourType = yield tour_model_1.TourType.findById(id);
    if (!existingTourType) {
        throw new Error("Tour type not found.");
    }
    const updatedTourType = yield tour_model_1.TourType.findByIdAndUpdate(id, payload, { new: true });
    return updatedTourType;
});
const deleteTourType = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existingTourType = yield tour_model_1.TourType.findById(id);
    if (!existingTourType) {
        throw new Error("Tour type not found.");
    }
    return yield tour_model_1.TourType.findByIdAndDelete(id);
});
exports.TourService = {
    createTour,
    createTourType,
    deleteTourType,
    updateTourType,
    getAllTourTypes,
    getAllTours,
    updateTour,
    deleteTour,
    getSingleTour
};
