
import { FilterQuery } from "mongoose";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Division } from "../division/division.model";
import { tourTypeSearchableFields } from "./tour.constant";
import { ITour, ITourType } from "./tour.interface";
import { Tour, TourType } from "./tour.model";

const createTour = async (payload: ITour) => {
    const existingTour = await Tour.findOne({ title: payload.title });
    if (existingTour) {
        throw new Error("A tour with this title already exists.");
    }
    const tour = await Tour.create(payload)

    return tour;
};

// const getAllTours = async (query: Record<string, string>) => {

//     const queryBuilder = new QueryBuilder(Tour.find(), query)
//     const tours = await queryBuilder
//         .search(tourSearchableFields)
//         .filter()
//         .sort()
//         .fields()
//         .paginate()

//     const [data, meta] = await Promise.all([
//         tours.build(),
//         queryBuilder.getMeta()
//     ])

//     return {
//         data,
//         meta
//     }
// };

const getAllTours = async (query: Record<string, string>) => {
    const filter: FilterQuery<ITour> = {};

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
        filter.price = {};
        if (query.minPrice) filter.price.$gte = Number(query.minPrice);
        if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
        delete query.minPrice;
        delete query.maxPrice;
    }

    // Rating filter
    if (query.rating) {
        filter.rating = { $in: query.rating.split(",").map(Number) };
        delete query.rating;
    }

    const queryBuilder = new QueryBuilder<ITour>(Tour.find(filter), query);
    const toursQuery = queryBuilder
        .search(["title", "description"])
        .sort()
        .paginate()

    const [tours, meta] = await Promise.all([
        toursQuery.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data: tours,
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
};