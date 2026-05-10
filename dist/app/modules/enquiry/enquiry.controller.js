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
exports.EnquiryController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const enquiry_service_1 = require("./enquiry.service");
const createEnquiry = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield enquiry_service_1.EnquiryService.createEnquiry(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 201,
        success: true,
        message: "Enquiry submitted successfully",
        data: result,
    });
}));
const getAdminEnquiries = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield enquiry_service_1.EnquiryService.getEnquiries(req.query);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Enquiries retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const updateAdminEnquiry = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decodeToken = req.user;
    const { enquiryId } = req.params;
    const result = yield enquiry_service_1.EnquiryService.updateEnquiry(enquiryId, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: result.status === "REPLIED" ? "Reply sent successfully" : "Enquiry updated successfully",
        data: Object.assign(Object.assign({}, result.toObject()), { updatedBy: decodeToken.userId }),
    });
}));
const deleteAdminEnquiry = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { enquiryId } = req.params;
    const result = yield enquiry_service_1.EnquiryService.deleteEnquiry(enquiryId);
    (0, sendResponse_1.sendResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Enquiry deleted successfully",
        data: result,
    });
}));
exports.EnquiryController = {
    createEnquiry,
    getAdminEnquiries,
    updateAdminEnquiry,
    deleteAdminEnquiry,
};
