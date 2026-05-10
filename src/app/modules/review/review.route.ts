import express from "express";
import multer from "multer";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { ReviewController } from "./review.controller";
import { createReviewZodSchema, updateReviewZodSchema } from "./review.validation";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// api/v1/review/tour/:tourId
router.get("/tour/:tourId", ReviewController.getTourReviews);

// api/v1/review/eligibility/:tourId
router.get("/eligibility/:tourId", checkAuth(Role.USER), ReviewController.getReviewEligibility);

// api/v1/review/my-reviews
router.get("/my-reviews", checkAuth(Role.USER), ReviewController.getMyReviews);

// api/v1/review/admin
router.get("/admin", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), ReviewController.getAdminReviews);

// api/v1/review
router.post(
  "/",
  checkAuth(Role.USER),
  upload.array("images", 3),
  validateRequest(createReviewZodSchema),
  ReviewController.createReview
);

// api/v1/review/:reviewId
router.delete("/:reviewId", checkAuth(Role.USER), ReviewController.deleteMyReview);

// api/v1/review/admin/:reviewId
router.delete("/admin/:reviewId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), ReviewController.deleteReviewByAdmin);

// api/v1/review/:reviewId
router.patch(
  "/:reviewId",
  checkAuth(Role.USER),
  upload.array("images", 3),
  validateRequest(updateReviewZodSchema),
  ReviewController.updateMyReview
);

// api/v1/review/admin/:reviewId
router.patch(
  "/admin/:reviewId",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  upload.array("images", 3),
  validateRequest(updateReviewZodSchema),
  ReviewController.updateReviewByAdmin
);

export const ReviewRoutes = router;
