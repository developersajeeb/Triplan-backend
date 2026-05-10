import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { EnquiryController } from "./enquiry.controller";
import { createEnquiryZodSchema, updateEnquiryZodSchema } from "./enquiry.validation";

const router = express.Router();

router.post("/", validateRequest(createEnquiryZodSchema), EnquiryController.createEnquiry);

router.get("/admin", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), EnquiryController.getAdminEnquiries);

router.patch("/admin/:enquiryId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), validateRequest(updateEnquiryZodSchema), EnquiryController.updateAdminEnquiry);

router.delete("/admin/:enquiryId", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), EnquiryController.deleteAdminEnquiry);

export const EnquiryRoutes = router;