
import { FilterQuery, type Query } from "mongoose";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Division } from "../division/division.model";
import { Review } from "../review/review.model";
import { tourTypeSearchableFields } from "./tour.constant";
import { ITour, ITourType } from "./tour.interface";
import { Tour, TourType } from "./tour.model";

type ITourListQueryItem = Partial<ITour> & {
    _id: string;
    title?: string;
    slug?: string;
    images?: string[];
    costFrom?: number;
    sellingPrice?: number;
    arrivalLocation?: string;
    divisionName?: string;
    tourTypeName?: string;
    createdAt?: Date | string;
    toObject?: () => Record<string, unknown>;
};

const createTour = async (payload: ITour) => {
    const existingTour = await Tour.findOne({ title: payload.title });
    if (existingTour) {
        throw new Error("A tour with this title already exists.");
    }
    const tour = await Tour.create(payload)

    return tour;
};

const getAllTours = async (query: Record<string, string>) => {
    const filter: FilterQuery<ITour> = {};
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
        const tourTypes = await TourType.find({ name: { $in: names } }).select("_id");
        filter.tourType = { $in: tourTypes.map(t => t._id) };
        delete query.tourType;
    }

    // Division filter
    if (query.division) {
        const names = query.division.split(",");
        const divisions = await Division.find({ name: { $in: names } }).select("_id");
        filter.division = { $in: divisions.map(d => d._id) };
        delete query.division;
    }

    // Price filter
    if (query.minPrice || query.maxPrice) {
        filter.costFrom = {};
        if (query.minPrice) filter.costFrom.$gte = Number(query.minPrice);
        if (query.maxPrice) filter.costFrom.$lte = Number(query.maxPrice);
        delete query.minPrice;
        delete query.maxPrice;
    }

    if (selectedRatingCeiling !== null) {
        const ratingMatchedTours = await Review.aggregate([
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

    const queryBuilder = new QueryBuilder<ITourListQueryItem>(Tour.find(filter).select(listProjection) as unknown as Query<ITourListQueryItem[], ITourListQueryItem>, query);
    const toursQuery = queryBuilder
        .search(["title", "description"])
        .sort()
        .paginate()

    const [tours, meta] = await Promise.all([
        toursQuery.build(),
        queryBuilder.getMeta()
    ]);

    const tourIds = tours.map((tour) => tour._id).filter(Boolean);
    const reviewStats = tourIds.length > 0
        ? await Review.aggregate([
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

    const reviewStatsMap = new Map(
        reviewStats.map((item) => {
            const averageRating = Number(
                (
                    [
                        item.averageGuideRating || 0,
                        item.averageServiceRating || 0,
                        item.averageTransportationRating || 0,
                        item.averageOrganizationRating || 0,
                    ].reduce((sum, value) => sum + value, 0) / 4 || 0
                ).toFixed(1)
            );

            return [String(item._id), {
                averageRating,
                reviewCount: item.totalReviews || 0,
            }];
        })
    );

    const data = tours.map((tour) => {
        const reviewSummary = reviewStatsMap.get(String(tour._id));
        const plainTour = typeof tour.toObject === "function" ? tour.toObject() : tour;

        return {
            _id: String(tour._id),
            title: plainTour.title || "",
            slug: plainTour.slug || "",
            images: Array.isArray(plainTour.images) ? plainTour.images : [],
            costFrom: plainTour.costFrom ?? 0,
            sellingPrice: plainTour.sellingPrice,
            arrivalLocation: plainTour.arrivalLocation || "",
            divisionName: plainTour.divisionName || "",
            tourTypeName: plainTour.tourTypeName || "",
            createdAt: plainTour.createdAt,
            averageRating: reviewSummary?.averageRating || 0,
            reviewCount: reviewSummary?.reviewCount || 0,
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
};

const updateTour = async (id: string, payload: Partial<ITour>) => {

    const existingTour = await Tour.findById(id);

    if (!existingTour) {
        throw new Error("Tour not found.");
    }

    if (payload.images && payload.images.length > 0 && existingTour.images && existingTour.images.length > 0) {
        payload.images = [...payload.images, ...existingTour.images]
    }

    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {

        const restDBImages = existingTour.images.filter(imageUrl => !payload.deleteImages?.includes(imageUrl))

        const updatedPayloadImages = (payload.images || [])
            .filter(imageUrl => !payload.deleteImages?.includes(imageUrl))
            .filter(imageUrl => !restDBImages.includes(imageUrl))

        payload.images = [...restDBImages, ...updatedPayloadImages]
    }

    const updatedTour = await Tour.findByIdAndUpdate(id, payload, { new: true });

    if (payload.deleteImages && payload.deleteImages.length > 0 && existingTour.images && existingTour.images.length > 0) {
        await Promise.all(payload.deleteImages.map(url => deleteImageFromCLoudinary(url)))
    }

    return updatedTour;
};

const deleteTour = async (id: string) => {
    return await Tour.findByIdAndDelete(id);
};

const createTourType = async (payload: ITourType) => {
    const existingTourType = await TourType.findOne({ name: payload });

    if (existingTourType) {
        throw new Error("Tour type already exists.");
    }

    return await TourType.create({ name: payload });
};

const getAllTourTypes = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(TourType.find(), query)

    const tourTypes = await queryBuilder
        .search(tourTypeSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate()

    const [data, meta] = await Promise.all([
        tourTypes.build(),
        queryBuilder.getMeta()
    ])

    return {
        data,
        meta
    }
};

const getSingleTour = async (slug: string) => {
    const tour = await Tour.findOne({ slug });

    if (!tour) {
        throw new Error("Tour not found");
    }

    return tour;
};

const updateTourType = async (id: string, payload: ITourType) => {
    const existingTourType = await TourType.findById(id);
    if (!existingTourType) {
        throw new Error("Tour type not found.");
    }

    const updatedTourType = await TourType.findByIdAndUpdate(id, payload, { new: true });
    return updatedTourType;
};

const deleteTourType = async (id: string) => {
    const existingTourType = await TourType.findById(id);
    if (!existingTourType) {
        throw new Error("Tour type not found.");
    }

    return await TourType.findByIdAndDelete(id);
};

export const TourService = {
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