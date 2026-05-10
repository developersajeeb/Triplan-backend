import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { EnquiryService } from "./enquiry.service";

const createEnquiry = catchAsync(async (req: Request, res: Response) => {
  const result = await EnquiryService.createEnquiry(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Enquiry submitted successfully",
    data: result,
  });
});

const getAdminEnquiries = catchAsync(async (req: Request, res: Response) => {
  const result = await EnquiryService.getEnquiries(req.query as Record<string, string>);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enquiries retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateAdminEnquiry = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const { enquiryId } = req.params;
  const result = await EnquiryService.updateEnquiry(enquiryId, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.status === "REPLIED" ? "Reply sent successfully" : "Enquiry updated successfully",
    data: {
      ...result.toObject(),
      updatedBy: decodeToken.userId,
    },
  });
});

const deleteAdminEnquiry = catchAsync(async (req: Request, res: Response) => {
  const { enquiryId } = req.params;
  const result = await EnquiryService.deleteEnquiry(enquiryId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enquiry deleted successfully",
    data: result,
  });
});

export const EnquiryController = {
  createEnquiry,
  getAdminEnquiries,
  updateAdminEnquiry,
  deleteAdminEnquiry,
};