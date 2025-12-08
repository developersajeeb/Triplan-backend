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
exports.DivisionService = void 0;
const cloudinary_config_1 = require("../../config/cloudinary.config");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const tour_model_1 = require("../tour/tour.model");
const division_model_1 = require("./division.model");
const createDivision = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingDivision = yield division_model_1.Division.findOne({ name: payload.name });
    if (existingDivision) {
        throw new Error("A division with this name already exists.");
    }
    const division = yield division_model_1.Division.create(payload);
    return division;
});
const getAllDivisions = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {};
    const queryBuilder = new QueryBuilder_1.QueryBuilder(division_model_1.Division.find(filter).lean(), query);
    const divisionsQuery = queryBuilder
        // .filter()
        .search(["name", "description"])
        .sort()
        .paginate();
    const [divisions, meta] = yield Promise.all([
        divisionsQuery.build(),
        queryBuilder.getMeta()
    ]);
    const divisionIds = divisions.map(d => d._id);
    const tourCounts = yield tour_model_1.Tour.aggregate([
        { $match: { division: { $in: divisionIds } } },
        { $group: { _id: "$division", count: { $sum: 1 } } }
    ]);
    const countMap = Object.fromEntries(tourCounts.map(c => [c._id, c.count]));
    const divisionsWithTourCount = divisions.map(division => (Object.assign(Object.assign({}, division), { totalTourListing: countMap[String(division._id)] || 0 })));
    return {
        data: divisionsWithTourCount,
        meta
    };
});
const getSingleDivision = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const formattedSlug = slug.toLowerCase();
    const division = yield division_model_1.Division.findOne({
        name: { $regex: new RegExp(`^${formattedSlug}$`, "i") }
    });
    return { data: division };
});
const updateDivision = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingDivision = yield division_model_1.Division.findById(id);
    if (!existingDivision) {
        throw new Error("Division not found.");
    }
    const duplicateDivision = yield division_model_1.Division.findOne({
        name: payload.name,
        _id: { $ne: id },
    });
    if (duplicateDivision) {
        throw new Error("A division with this name already exists.");
    }
    const updatedDivision = yield division_model_1.Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (payload.thumbnail && existingDivision.thumbnail) {
        yield (0, cloudinary_config_1.deleteImageFromCLoudinary)(existingDivision.thumbnail);
    }
    return updatedDivision;
});
const deleteDivision = (id) => __awaiter(void 0, void 0, void 0, function* () {
    yield division_model_1.Division.findByIdAndDelete(id);
    return null;
});
exports.DivisionService = {
    createDivision,
    getAllDivisions,
    getSingleDivision,
    updateDivision,
    deleteDivision,
};
