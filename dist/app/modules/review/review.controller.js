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
exports.ReviewController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const review_service_1 = require("./review.service");
const getTourReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tourId } = req.params;
    const result = yield review_service_1.ReviewService.getTourReviews(tourId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Tour reviews retrieved successfully",
        data: result,
    });
}));
const getReviewEligibility = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodeToken = req.user;
    const { tourId } = req.params;
    const result = yield review_service_1.ReviewService.getReviewEligibility(tourId, decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Review eligibility retrieved successfully",
        data: result,
    });
}));
const createReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodeToken = req.user;
    const files = req.files || [];
    const result = yield review_service_1.ReviewService.createReview(req.body, decodeToken.userId, files);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 201,
        success: true,
        message: "Review created successfully",
        data: result,
    });
}));
const getMyReviews = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodeToken = req.user;
    const result = yield review_service_1.ReviewService.getMyReviews(decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "My reviews retrieved successfully",
        data: result,
    });
}));
const deleteMyReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodeToken = req.user;
    const { reviewId } = req.params;
    const result = yield review_service_1.ReviewService.deleteMyReview(reviewId, decodeToken.userId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Review deleted successfully",
        data: result,
    });
}));
const updateMyReview = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodeToken = req.user;
    const { reviewId } = req.params;
    const files = req.files || [];
    const result = yield review_service_1.ReviewService.updateMyReview(reviewId, decodeToken.userId, req.body, files);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Review updated successfully",
        data: result,
    });
}));
exports.ReviewController = {
    getTourReviews,
    getReviewEligibility,
    createReview,
    getMyReviews,
    deleteMyReview,
    updateMyReview,
};
