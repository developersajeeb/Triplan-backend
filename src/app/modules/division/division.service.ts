import { FilterQuery } from "mongoose";
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Tour } from "../tour/tour.model";
import { IDivision } from "./division.interface";
import { Division } from "./division.model";

const createDivision = async (payload: IDivision) => {

    const existingDivision = await Division.findOne({ name: payload.name });
    if (existingDivision) {
        throw new Error("A division with this name already exists.");
    }

    const division = await Division.create(payload);

    return division
};

const getAllDivisions = async (query: Record<string, string>) => {    
    const filter: FilterQuery<IDivision> = {};

    const queryBuilder = new QueryBuilder<Partial<IDivision>>(Division.find(filter).lean(), query);

    const divisionsQuery = queryBuilder
        // .filter()
        .search(["name", "description"])
        .sort()
        .paginate();

    const [divisions, meta] = await Promise.all([
        divisionsQuery.build(),
        queryBuilder.getMeta()
    ]);

    const divisionIds = divisions.map(d => d._id);

    const tourCounts = await Tour.aggregate([
        { $match: { division: { $in: divisionIds } } },
        { $group: { _id: "$division", count: { $sum: 1 } } }
    ]);

    const countMap = Object.fromEntries(tourCounts.map(c => [c._id, c.count]));

    const divisionsWithTourCount = divisions.map(division => ({
        ...division,
        totalTourListing: countMap[String(division._id)] || 0
    }));

    return {
        data: divisionsWithTourCount,
        meta
    };
};

const getSingleDivision = async (slug: string) => {
    const division = await Division.findOne({ slug });
    return {
        data: division,
    }
};

const updateDivision = async (id: string, payload: Partial<IDivision>) => {

    const existingDivision = await Division.findById(id);
    if (!existingDivision) {
        throw new Error("Division not found.");
    }

    const duplicateDivision = await Division.findOne({
        name: payload.name,
        _id: { $ne: id },
    });

    if (duplicateDivision) {
        throw new Error("A division with this name already exists.");
    }

    const updatedDivision = await Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true })

    if (payload.thumbnail && existingDivision.thumbnail) {
        await deleteImageFromCLoudinary(existingDivision.thumbnail)
    }

    return updatedDivision
};

const deleteDivision = async (id: string) => {
    await Division.findByIdAndDelete(id);
    return null;
};

export const DivisionService = {
    createDivision,
    getAllDivisions,
    getSingleDivision,
    updateDivision,
    deleteDivision,
};