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
exports.EnquiryService = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const enquiry_interface_1 = require("./enquiry.interface");
const enquiry_model_1 = require("./enquiry.model");
const normalizeText = (value) => (value !== null && value !== void 0 ? value : "").trim().toLowerCase();
const getEnquiries = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const search = normalizeText(query.search);
    const statusFilter = normalizeText(query.status);
    const sort = normalizeText(query.sort) || "newest";
    const enquiries = yield enquiry_model_1.Enquiry.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    const mapped = enquiries
        .map((enquiry) => ({
        _id: String(enquiry._id),
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        message: enquiry.message,
        tourTitle: enquiry.tourTitle,
        tourSlug: enquiry.tourSlug,
        status: enquiry.status,
        replyMessage: enquiry.replyMessage,
        repliedAt: enquiry.repliedAt ? enquiry.repliedAt.toISOString() : undefined,
        createdAt: enquiry.createdAt ? enquiry.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: enquiry.updatedAt ? enquiry.updatedAt.toISOString() : undefined,
    }))
        .filter((enquiry) => {
        const matchesSearch = search
            ? [enquiry.name, enquiry.email, enquiry.phone, enquiry.message, enquiry.tourTitle]
                .filter(Boolean)
                .some((field) => normalizeText(String(field)).includes(search))
            : true;
        const matchesStatus = statusFilter
            ? (statusFilter === "all"
                ? true
                : enquiry.status.toLowerCase() === statusFilter)
            : true;
        return matchesSearch && matchesStatus;
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
const createEnquiry = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const enquiry = yield enquiry_model_1.Enquiry.create({
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        message: payload.message.trim(),
        tourTitle: (_a = payload.tourTitle) === null || _a === void 0 ? void 0 : _a.trim(),
        tourSlug: (_b = payload.tourSlug) === null || _b === void 0 ? void 0 : _b.trim(),
        status: enquiry_interface_1.ENQUIRY_STATUS.UNREAD,
    });
    return enquiry;
});
const updateEnquiry = (enquiryId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const enquiry = yield enquiry_model_1.Enquiry.findOne({
        _id: enquiryId,
        isDeleted: { $ne: true },
    });
    if (!enquiry) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Enquiry not found.");
    }
    if (payload.status) {
        enquiry.status = payload.status;
    }
    if (typeof payload.replyMessage === "string") {
        const replyMessage = payload.replyMessage.trim();
        if (replyMessage) {
            enquiry.replyMessage = replyMessage;
            enquiry.repliedAt = new Date();
            enquiry.status = enquiry_interface_1.ENQUIRY_STATUS.REPLIED;
        }
    }
    if (!payload.replyMessage && payload.status === enquiry_interface_1.ENQUIRY_STATUS.READ) {
        enquiry.status = enquiry_interface_1.ENQUIRY_STATUS.READ;
    }
    yield enquiry.save();
    return enquiry;
});
const deleteEnquiry = (enquiryId) => __awaiter(void 0, void 0, void 0, function* () {
    const enquiry = yield enquiry_model_1.Enquiry.findOne({
        _id: enquiryId,
        isDeleted: { $ne: true },
    }).select("_id");
    if (!enquiry) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Enquiry not found.");
    }
    yield enquiry_model_1.Enquiry.findByIdAndUpdate(enquiry._id, { isDeleted: true }, { new: true });
    return {
        _id: String(enquiry._id),
    };
});
exports.EnquiryService = {
    createEnquiry,
    getEnquiries,
    updateEnquiry,
    deleteEnquiry,
};
