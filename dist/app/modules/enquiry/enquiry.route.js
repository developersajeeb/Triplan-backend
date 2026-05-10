"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const checkAuth_1 = require("../../middlewares/checkAuth");
const validateRequest_1 = require("../../middlewares/validateRequest");
const user_interface_1 = require("../user/user.interface");
const enquiry_controller_1 = require("./enquiry.controller");
const enquiry_validation_1 = require("./enquiry.validation");
const router = express_1.default.Router();
router.post("/", (0, validateRequest_1.validateRequest)(enquiry_validation_1.createEnquiryZodSchema), enquiry_controller_1.EnquiryController.createEnquiry);
router.get("/admin", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), enquiry_controller_1.EnquiryController.getAdminEnquiries);
router.patch("/admin/:enquiryId", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(enquiry_validation_1.updateEnquiryZodSchema), enquiry_controller_1.EnquiryController.updateAdminEnquiry);
router.delete("/admin/:enquiryId", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), enquiry_controller_1.EnquiryController.deleteAdminEnquiry);
exports.EnquiryRoutes = router;
