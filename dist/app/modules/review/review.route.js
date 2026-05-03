"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoutes = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const checkAuth_1 = require("../../middlewares/checkAuth");
const validateRequest_1 = require("../../middlewares/validateRequest");
const user_interface_1 = require("../user/user.interface");
const review_controller_1 = require("./review.controller");
const review_validation_1 = require("./review.validation");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// api/v1/review/tour/:tourId
router.get("/tour/:tourId", review_controller_1.ReviewController.getTourReviews);
// api/v1/review/eligibility/:tourId
router.get("/eligibility/:tourId", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER), review_controller_1.ReviewController.getReviewEligibility);
// api/v1/review/my-reviews
router.get("/my-reviews", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER), review_controller_1.ReviewController.getMyReviews);
// api/v1/review
router.post("/", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER), upload.array("images", 3), (0, validateRequest_1.validateRequest)(review_validation_1.createReviewZodSchema), review_controller_1.ReviewController.createReview);
// api/v1/review/:reviewId
router.delete("/:reviewId", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER), review_controller_1.ReviewController.deleteMyReview);
// api/v1/review/:reviewId
router.patch("/:reviewId", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER), upload.array("images", 3), (0, validateRequest_1.validateRequest)(review_validation_1.updateReviewZodSchema), review_controller_1.ReviewController.updateMyReview);
exports.ReviewRoutes = router;
