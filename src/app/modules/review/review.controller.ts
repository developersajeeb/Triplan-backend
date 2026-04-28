import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";

const getTourReviews = catchAsync(async (req: Request, res: Response) => {
  const { tourId } = req.params;
  const result = await ReviewService.getTourReviews(tourId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Tour reviews retrieved successfully",
    data: result,
  });
});

const getReviewEligibility = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const { tourId } = req.params;
  const result = await ReviewService.getReviewEligibility(tourId, decodeToken.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review eligibility retrieved successfully",
    data: result,
  });
});

const createReview = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const files = (req.files as Express.Multer.File[]) || [];
  const result = await ReviewService.createReview(req.body, decodeToken.userId, files);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const result = await ReviewService.getMyReviews(decodeToken.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My reviews retrieved successfully",
    data: result,
  });
});

const deleteMyReview = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const { reviewId } = req.params;
  const result = await ReviewService.deleteMyReview(reviewId, decodeToken.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

const updateMyReview = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const { reviewId } = req.params;
  const files = (req.files as Express.Multer.File[]) || [];
  const result = await ReviewService.updateMyReview(reviewId, decodeToken.userId, req.body, files);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

export const ReviewController = {
  getTourReviews,
  getReviewEligibility,
  createReview,
  getMyReviews,
  deleteMyReview,
  updateMyReview,
};
