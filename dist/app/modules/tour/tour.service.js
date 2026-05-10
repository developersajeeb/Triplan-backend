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
const booking_model_1 = require("../booking/booking.model");
const booking_interface_1 = require("../booking/booking.interface");
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
    const requestedStatus = query.status;
    const requestedSort = query.sort;
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
        "isDraft",
        "isTrending",
        "images",
        "costFrom",
        "sellingPrice",
        "arrivalLocation",
        "divisionName",
        "tourTypeName",
        "batches",
        "createdAt"
    ].join(" ");
    // Determine the display filter (what tours to show)
    if (requestedStatus === "draft") {
        filter.isDraft = true;
    }
    else if (requestedStatus === "active") {
        filter.isDraft = { $ne: true };
    }
    else if (requestedStatus === "all") {
        // Admin requesting all tours - no filter on isDraft
    }
    else if (!requestedStatus) {
        // When no status filter is specified, only show active tours to public
        filter.isDraft = { $ne: true };
    }
    delete query.status;
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
    const normalizedQuery = Object.assign({}, query);
    const bookingSortRequested = requestedSort === "bookingsHighToLow" || requestedSort === "bookingsLowToHigh";
    //Sort by price high/low/new
    if (normalizedQuery.sort) {
        if (normalizedQuery.sort === "priceHighToLow") {
            normalizedQuery.sort = "-costFrom";
        }
        else if (normalizedQuery.sort === "priceLowToHigh") {
            normalizedQuery.sort = "costFrom";
        }
        else if (normalizedQuery.sort === "newest") {
            normalizedQuery.sort = "-createdAt";
        }
    }
    if (bookingSortRequested) {
        const page = Number(normalizedQuery.page) || 1;
        const limit = Number(normalizedQuery.limit) || 10;
        const skip = (page - 1) * limit;
        const tours = (yield tour_model_1.Tour.find(filter).select(listProjection));
        const tourIds = tours.map((tour) => String(tour._id)).filter(Boolean);
        const bookingStats = tourIds.length > 0
            ? yield booking_model_1.Booking.aggregate([
                {
                    $match: {
                        tour: { $in: tourIds },
                        status: { $in: [booking_interface_1.BOOKING_STATUS.PENDING, booking_interface_1.BOOKING_STATUS.COMPLETE] }
                    },
                },
                {
                    $group: {
                        _id: "$tour",
                        totalBookings: { $sum: 1 },
                    },
                },
            ])
            : [];
        const bookingStatsMap = new Map(bookingStats.map((item) => [String(item._id), item.totalBookings]));
        const sortedTours = tours
            .map((tour) => {
            var _a;
            const plainTour = typeof tour.toObject === "function" ? tour.toObject() : tour;
            return {
                _id: String(tour._id),
                title: plainTour.title || "",
                slug: plainTour.slug || "",
                isDraft: Boolean(plainTour.isDraft),
                isTrending: Boolean(plainTour.isTrending),
                images: Array.isArray(plainTour.images) ? plainTour.images : [],
                costFrom: (_a = plainTour.costFrom) !== null && _a !== void 0 ? _a : 0,
                sellingPrice: plainTour.sellingPrice,
                arrivalLocation: plainTour.arrivalLocation || "",
                divisionName: plainTour.divisionName || "",
                tourTypeName: plainTour.tourTypeName || "",
                createdAt: plainTour.createdAt,
                totalBookings: bookingStatsMap.get(String(tour._id)) || 0,
                batches: plainTour.batches || [],
            };
        })
            .sort((a, b) => {
            if (a.totalBookings !== b.totalBookings) {
                return requestedSort === "bookingsLowToHigh"
                    ? a.totalBookings - b.totalBookings
                    : b.totalBookings - a.totalBookings;
            }
            return new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime();
        });
        const paginatedTours = sortedTours.slice(skip, skip + limit);
        const paginatedTourIds = paginatedTours.map((tour) => tour._id).filter(Boolean);
        const reviewStats = paginatedTourIds.length > 0
            ? yield review_model_1.Review.aggregate([
                {
                    $match: {
                        tour: { $in: paginatedTourIds },
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
        const data = paginatedTours.map((tour) => {
            const reviewSummary = reviewStatsMap.get(String(tour._id));
            return Object.assign(Object.assign({}, tour), { averageRating: (reviewSummary === null || reviewSummary === void 0 ? void 0 : reviewSummary.averageRating) || 0, reviewCount: (reviewSummary === null || reviewSummary === void 0 ? void 0 : reviewSummary.reviewCount) || 0 });
        });
        const totalDocuments = sortedTours.length;
        const totalPage = Math.ceil(totalDocuments / limit);
        return {
            data,
            meta: {
                page,
                limit,
                total: totalDocuments,
                totalPage,
                totalPages: totalPage,
                totalListing: totalDocuments,
            },
        };
    }
    const queryBuilder = new QueryBuilder_1.QueryBuilder(tour_model_1.Tour.find(filter).select(listProjection), normalizedQuery);
    const toursQuery = queryBuilder
        .search(["title", "description"])
        .sort()
        .paginate();
    const [tours, meta] = yield Promise.all([
        toursQuery.build(),
        queryBuilder.getMeta()
    ]);
    const tourIds = tours.map((tour) => tour._id).filter(Boolean);
    // Get booking counts for each tour
    const bookingStats = tourIds.length > 0
        ? yield booking_model_1.Booking.aggregate([
            {
                $match: {
                    tour: { $in: tourIds },
                    status: { $in: [booking_interface_1.BOOKING_STATUS.PENDING, booking_interface_1.BOOKING_STATUS.COMPLETE] }
                },
            },
            {
                $group: {
                    _id: "$tour",
                    totalBookings: { $sum: 1 },
                },
            },
        ])
        : [];
    const bookingStatsMap = new Map(bookingStats.map((item) => [String(item._id), item.totalBookings]));
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
        const bookingCount = bookingStatsMap.get(String(tour._id)) || 0;
        const plainTour = typeof tour.toObject === "function" ? tour.toObject() : tour;
        return {
            _id: String(tour._id),
            title: plainTour.title || "",
            slug: plainTour.slug || "",
            isDraft: Boolean(plainTour.isDraft),
            isTrending: Boolean(plainTour.isTrending),
            images: Array.isArray(plainTour.images) ? plainTour.images : [],
            costFrom: (_a = plainTour.costFrom) !== null && _a !== void 0 ? _a : 0,
            sellingPrice: plainTour.sellingPrice,
            arrivalLocation: plainTour.arrivalLocation || "",
            divisionName: plainTour.divisionName || "",
            tourTypeName: plainTour.tourTypeName || "",
            createdAt: plainTour.createdAt,
            totalBookings: bookingCount,
            batches: plainTour.batches || [],
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
        meta: Object.assign(Object.assign({}, meta), { totalPages: meta.totalPage })
    };
});
const updateTour = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const existingTour = yield tour_model_1.Tour.findById(id);
    if (!existingTour) {
        throw new Error("Tour not found.");
    }
    // Check if tour can be marked as draft - only if all batches have ended
    if (payload.isDraft === true && !existingTour.isDraft) {
        const now = new Date();
        // Check if any batch's end date is in the future
        const hasActiveBatch = (_a = existingTour.batches) === null || _a === void 0 ? void 0 : _a.some(batch => {
            return new Date(batch.endDate) > now;
        });
        if (hasActiveBatch) {
            throw new Error("Cannot mark as draft. This tour has active or upcoming batches. All batches must be completed first.");
        }
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
    // Update all tours that reference this tour type with the new name
    if (updatedTourType && payload.name && payload.name !== existingTourType.name) {
        yield tour_model_1.Tour.updateMany({ tourType: id }, { tourTypeName: updatedTourType.name });
    }
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
